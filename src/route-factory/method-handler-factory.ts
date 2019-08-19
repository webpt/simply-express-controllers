import { Request, Response, NextFunction, RequestHandler } from "express";
import { mapValues, get } from "lodash";
import Ajv from "ajv";
import createError from "http-errors";
import HttpStatusCodes from "http-status-codes";

import { StatusCode, Headers, ControllerMethodResult } from "../method-result";
import { getValidatorError } from "../ajv-utils";
import { ControllerMethodMetadata } from "../metadata";

import { Controller } from "../types";

import { MethodArgProcessor } from "./method-arg-processor";

const ajv = new Ajv({ coerceTypes: true, useDefaults: true });

type ValidateFunction = (val: any) => any;
const NoOpAjvValidator: Ajv.ValidateFunction = () => true;

export function createControllerMethodHandler(
  controller: Controller,
  method: Function,
  methodMetadata: ControllerMethodMetadata
): RequestHandler {
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

  const argProcessor = new MethodArgProcessor(methodMetadata);

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

      const args = argProcessor.collectMethodArgs(req);

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
