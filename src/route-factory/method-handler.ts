import { Request, Response, NextFunction } from "express";
import { mapValues, get } from "lodash";
import Ajv, { ValidateFunction } from "ajv";
import createError from "http-errors";
import HttpStatusCodes from "http-status-codes";

import { getValidatorError, NoOpAjvValidator } from "../ajv-utils";
import {
  ControllerMethodMetadata,
  ParamMetadata,
  PathParamControllerMethodArgMetadata,
  QueryParamControllerMethodArgMetadata,
  ControllerMethodArgMetadata
} from "../metadata";
import { Controller } from "../types";
import { ControllerMethodResult, StatusCode, Headers } from "../method-result";
import { maybeAwaitPromise } from "../promise-utils";

const ajv = new Ajv({ coerceTypes: true, useDefaults: true });

export class MethodHandler {
  private _requestValidator: ValidateFunction;
  private _responseValidators: Record<number, ValidateFunction>;

  private _pathValidators: Record<string, ValidateFunction>;
  private _queryValidators: Record<string, ValidateFunction>;

  constructor(
    private _method: Function,
    private _methodMetadata: ControllerMethodMetadata,
    private _controller: Controller
  ) {
    this.handleRequest = this.handleRequest.bind(this);

    const requestSchema = get(_methodMetadata, ["request", "schema"]);
    this._requestValidator = requestSchema
      ? ajv.compile(requestSchema)
      : NoOpAjvValidator;

    this._responseValidators = mapValues(
      _methodMetadata.responses,
      response => {
        if (response.schema) {
          return ajv.compile(response.schema);
        } else {
          return NoOpAjvValidator;
        }
      }
    );

    this._queryValidators = mapValues(
      _methodMetadata.queryParams,
      createQueryParamValidator
    );
    this._pathValidators = mapValues(
      _methodMetadata.pathParams,
      createPathParamValidator
    );
  }

  /**
   * Handle an express request.
   *
   * This method is pre-bound.  Usage of `this` is safe when
   * this method is passed to the router.
   */
  handleRequest(req: Request, res: Response, next: NextFunction) {
    // Catch any errors and pass them to express.
    this._executeRequest(req, res).catch(next);
  }

  private async _executeRequest(req: Request, res: Response) {
    // Ensure the request is valid.
    this._validateRequest(req);

    // Collect the arguments for the method based on method arg decorators.
    const args = this._collectMethodArgs(req);

    // Execute the method to handle the request.
    const methodResult = this._method.apply(this._controller, args);

    // The method may or may not have returned a promise.  Await it if so.
    let result = await maybeAwaitPromise<ControllerMethodResult>(methodResult);

    // Yank the status code and headers out of the symbol properties used by result().
    const statusCode = result[StatusCode] || 200;
    const headers = result[Headers] || {};

    // Ensure the response matches the documented response.
    this._validateResponse(statusCode, result);

    // Set any headers that were requested.
    for (const key of Object.keys(headers)) {
      res.setHeader(key, headers[key]);
    }

    // Send the status code and the result.
    res.status(statusCode).send(result);
  }

  private _validateRequest(req: Request) {
    if (!this._requestValidator(req.body)) {
      const errorMessage = getValidatorError(
        this._requestValidator,
        "does not match required schema",
        "body"
      );
      throw createError(HttpStatusCodes.BAD_REQUEST, errorMessage);
    }
  }

  private _validateResponse(statusCode: number, result: any) {
    const responseValidator = this._responseValidators[statusCode];

    if (!responseValidator) {
      return;
    }

    /*
      Clean up the result in case the user specified { "additionalProperties": false }
      in the schema.

      In theory this isn't needed, as typically symbols are not enumerated
      when enumerating object keys.
    */
    const validateTarget = {
      ...result
    };
    delete validateTarget[StatusCode];
    delete validateTarget[Headers];
    if (!responseValidator(validateTarget)) {
      const errorMessage = getValidatorError(
        responseValidator,
        "Response did not match responseSchema.",
        "response"
      );
      // Throw a real error so it can be logged.
      //  Express will return an Internal Server Error in response.
      throw new Error(errorMessage);
    }
  }

  private _collectMethodArgs(req: Request): any[] {
    const { handlerArgs } = this._methodMetadata;
    return handlerArgs.map(argMetadata => this._collectArg(req, argMetadata));
  }

  private _collectArg(req: Request, argMetadata: ControllerMethodArgMetadata) {
    switch (argMetadata.type) {
      case "body":
        return req.body;
      case "pathParam": {
        return this._collectPathParam(req, argMetadata);
      }
      case "queryParam": {
        return this._collectQueryParam(req, argMetadata);
      }
      default:
        return undefined;
    }
  }

  private _collectPathParam(
    req: Request,
    argMetadata: PathParamControllerMethodArgMetadata
  ) {
    const { paramName } = argMetadata;
    const validator = this._pathValidators[paramName];
    let value = req.params[paramName];
    if (validator) {
      value = validator(value);
    }
    return value;
  }

  private _collectQueryParam(
    req: Request,
    argMetadata: QueryParamControllerMethodArgMetadata
  ) {
    const { paramName } = argMetadata;
    const validator = this._queryValidators[paramName];
    let value = req.query[paramName];
    if (validator) {
      value = validator(value);
    }
    return value;
  }
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