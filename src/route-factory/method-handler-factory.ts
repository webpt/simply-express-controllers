import { Request, Response, NextFunction, RequestHandler } from "express";
import { mapValues, get } from "lodash";
import Ajv from "ajv";
import createError from "http-errors";
import HttpStatusCodes from "http-status-codes";

import { StatusCode, Headers, ControllerMethodResult } from "../method-result";
import { getValidatorError } from "../ajv-utils";
import { ControllerMethodMetadata, ParamMetadata } from "../metadata";

import { Controller } from "../types";

const ajv = new Ajv({ coerceTypes: true, useDefaults: true });

type ValidateFunction = (val: any) => any;
const NoOpAjvValidator: Ajv.ValidateFunction = () => true;

export function createControllerMethodHandler(
  controller: Controller,
  method: Function,
  methodMetadata: ControllerMethodMetadata
): RequestHandler {
  const queryValidators = mapValues(
    methodMetadata.queryParams,
    createQueryParamValidator
  );
  const pathValidators = mapValues(
    methodMetadata.pathParams,
    createPathParamValidator
  );

  const requestSchema = get(methodMetadata, ["request", "schema"]);
  const requestValidator = requestSchema
    ? ajv.compile(requestSchema)
    : NoOpAjvValidator;

  const responseValidators = mapValues(methodMetadata.responses, response => {
    if (response.schema) {
      return ajv.compile(response.schema);
    } else {
      return NoOpAjvValidator;
    }
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!requestValidator(req.body)) {
        const errorMessage = getValidatorError(
          requestValidator,
          "does not match required schema",
          "body"
        );
        throw createError(HttpStatusCodes.BAD_REQUEST, errorMessage);
      }

      const args = collectMethodArgs(
        req,
        methodMetadata,
        pathValidators,
        queryValidators
      );

      const methodResult = method.apply(controller, args);

      let result: ControllerMethodResult;
      if (methodResult instanceof Promise) {
        result = await methodResult;
      } else {
        result = methodResult;
      }

      const statusCode = result[StatusCode] || 200;
      const headers = result[Headers] || {};

      const responseValidator = responseValidators[statusCode];

      // Clean up the result in case the user specified
      //  { "additionalProperties": false }
      const validateTarget = {
        ...result
      };
      delete validateTarget[StatusCode];
      delete validateTarget[Headers];
      if (responseValidator && !responseValidator(validateTarget)) {
        const errorMessage = getValidatorError(
          responseValidator,
          "Response did not match responseSchema.",
          "response"
        );
        // Throw a real error so it can be logged.
        //  Express will return an Internal Server Error in response.
        throw new Error(errorMessage);
      }

      for (const key of Object.keys(headers)) {
        res.setHeader(key, headers[key]);
      }

      res.status(statusCode).send(result);
    } catch (e) {
      next(e);
    }
  };
}

function createQueryParamValidator(
  metadata: ParamMetadata,
  key: string
): ValidateFunction {
  // We need to pass the data by object, for type coersion and default values, and requiredness.
  const validate = ajv.compile({
    type: "object",
    properties: {
      value: {
        ...metadata.schema,
        // Remove our required: true/false value, as it is not standard json-schema.
        required: undefined
      }
    },
    required: metadata.required ? ["value"] : []
  });

  return (value: any) => {
    const data = { value };
    if (metadata.required && value === undefined) {
      throw createError(
        HttpStatusCodes.BAD_REQUEST,
        `Query parameter ${key} is required.`
      );
    }
    if (!validate(data)) {
      throw createError(
        HttpStatusCodes.UNPROCESSABLE_ENTITY,
        getValidatorError(validate, `Query parameter ${key} is invalid.`, key)
      );
    }
    // Data may have been coerced by ajv.
    return data.value;
  };
}

function createPathParamValidator(metadata: ParamMetadata): ValidateFunction {
  // We need to pass the data by object, for type coersion and default values, and requiredness.
  const validate = ajv.compile({
    type: "object",
    properties: {
      value: metadata.schema
    },
    required: metadata.required ? ["value"] : []
  });

  return (value: any) => {
    const data = { value };
    if (!validate(data)) {
      // We could pass the validation error here, but a malformed path is typically 404d.
      throw createError(HttpStatusCodes.NOT_FOUND);
    }
    // Data may have been coerced by ajv.
    return data.value;
  };
}

function collectMethodArgs(
  req: Request,
  methodMetadata: ControllerMethodMetadata,
  pathValidators: Record<string, ValidateFunction>,
  queryValidators: Record<string, ValidateFunction>
): any[] {
  return methodMetadata.handlerArgs.map(argMetadata => {
    switch (argMetadata.type) {
      case "body":
        return req.body;
      case "pathParam": {
        const { paramName } = argMetadata;
        const validator = pathValidators[paramName];
        let value = req.params[paramName];
        if (validator) {
          value = validator(value);
        }
        return value;
      }
      case "queryParam": {
        const { paramName } = argMetadata;
        const validator = queryValidators[paramName];
        let value = req.query[paramName];
        if (validator) {
          value = validator(value);
        }
        return value;
      }
      default:
        return undefined;
    }
  });
}
