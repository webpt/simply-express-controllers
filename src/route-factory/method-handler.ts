import { Request, Response, NextFunction } from "express";
import { mapValues, get } from "lodash";
import Ajv, { ValidateFunction } from "ajv";
import { BadRequest, UnprocessableEntity, NotFound } from "http-errors";

import { getValidatorError, NoOpAjvValidator } from "../ajv-utils";
import {
  ControllerMethodMetadata,
  ParamMetadata,
  PathParamControllerMethodArgMetadata,
  QueryParamControllerMethodArgMetadata,
  ControllerMethodArgMetadata,
  CustomValueFactoryControllerMethodArgMetadata,
} from "../metadata";
import { Controller } from "../types";
import { ResultBuilderCookie, ResultBuilder } from "../method-result";
import { maybeAwaitPromise, isPromise } from "../promise-utils";

const ajv = new Ajv({ coerceTypes: true, useDefaults: true });

type ParamValidator = (value: any) => any;

export class MethodHandler {
  /**
   * Validator for the request body.
   */
  private _requestValidator: ValidateFunction;

  /**
   * Validators for responses indexed by status code.
   */
  private _responseValidators: Record<number, ValidateFunction>;

  /**
   * Validators for path params indexed by param name.
   */
  private _pathValidators: Record<string, ParamValidator>;

  /**
   * Validators for query params indexed by param name.
   */
  private _queryValidators: Record<string, ParamValidator>;

  constructor(
    private _method: Function,
    private _methodMetadata: ControllerMethodMetadata,
    private _controller: Controller
  ) {
    // Pre-bind the handleRequest function so we can send it to express routes.
    this.handleRequest = this.handleRequest.bind(this);

    // Build the request validator.
    const requestSchema = get(_methodMetadata, ["request", "schema"]);
    this._requestValidator = requestSchema
      ? ajv.compile(requestSchema)
      : NoOpAjvValidator;

    // Build the response validators.
    //  These are mapped based on status codes.
    this._responseValidators = mapValues(
      _methodMetadata.responses,
      (response) => {
        if (response.schema) {
          return ajv.compile(response.schema);
        } else {
          return NoOpAjvValidator;
        }
      }
    );

    // Build validators for query params.
    this._queryValidators = mapValues(
      _methodMetadata.queryParams,
      createQueryParamValidator
    );

    // Build validators for path params.
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
   *
   * This method is async to assist with testing.  Its promise does
   * not need to be consumed, and errors will be passed to the
   * express `next` function.
   */
  async handleRequest(req: Request, res: Response, next: NextFunction) {
    // Catch any errors and pass them to express.
    await this._executeRequest(req, res).catch(next);
  }

  private async _executeRequest(req: Request, res: Response) {
    // Ensure the request is valid.
    this._validateRequest(req);

    // Collect the arguments for the method based on method arg decorators.
    const args = await this._collectMethodArgs(req, res);

    // Execute the method to handle the request.
    const methodResult = this._method.apply(this._controller, args);

    // The method may or may not have returned a promise.  Await it if so.
    let result: any = await maybeAwaitPromise(methodResult);

    if (result === undefined) {
      // Throw an error to the user.  Express will return this into a 500.
      throw new Error("Controller methods must return a result.");
    }

    let statusCode = 200;
    let headers: Record<string, string> = {};
    let cookies: Record<string, ResultBuilderCookie> = {};
    let body: any = result;
    let contentType: string | undefined = undefined;
    let sendRaw = false;

    if (result instanceof ResultBuilder) {
      if (result.handled) {
        return;
      }

      statusCode = result.statusCode;
      headers = result.headers;
      cookies = result.cookies;
      contentType = result.contentType;
      sendRaw = result.raw;

      body = result.body;
    }

    const hasBody = result !== undefined;
    const headerContentType =
      headers["Content-Type"] ?? headers["content-type"];

    if (hasBody) {
      // Ensure the response matches the documented response.
      this._validateResponse(statusCode, body);

      if (contentType === undefined) {
        // Assume body is json by default.
        // text/plain might make more sense for strings, but this preserves backwards compatibility.
        contentType = headerContentType ?? "application/json";
      }
    }

    if (contentType != null && headerContentType == null) {
      headers["Content-Type"] = contentType;
    }

    // Set any headers that were requested.
    for (const key of Object.keys(headers)) {
      res.setHeader(key, headers[key]);
    }

    // Set requested cookies.
    for (const key of Object.keys(cookies)) {
      const { value, ...cookieSettings } = cookies[key];
      res.cookie(key, value, cookieSettings);
    }

    // Set the status code.
    res.status(statusCode);

    if (hasBody) {
      if (sendRaw) {
        res.send(body);
      } else if (
        contentType === "application/json" ||
        typeof body === "object"
      ) {
        res.json(body);
      } else {
        res.send(body);
      }
    } else {
      res.end();
    }
  }

  private _validateRequest(req: Request) {
    if (
      this._methodMetadata.request &&
      this._methodMetadata.request.required &&
      req.body == null
    ) {
      throw new BadRequest("A body is required.");
    }

    if (!this._requestValidator(req.body)) {
      const errorMessage = getValidatorError(
        this._requestValidator,
        "does not match required schema",
        "body"
      );
      throw new BadRequest(errorMessage);
    }
  }

  private _validateResponse(statusCode: number, result: any) {
    const responseValidator = this._responseValidators[statusCode];

    if (!responseValidator) {
      return;
    }

    if (!responseValidator(result)) {
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

  private async _collectMethodArgs(
    req: Request,
    res: Response
  ): Promise<any[]> {
    const { handlerArgs } = this._methodMetadata;
    if (!handlerArgs) {
      return [];
    }

    return Promise.all(
      handlerArgs.map((argMetadata) => this._collectArg(req, res, argMetadata))
    );
  }

  private async _collectArg(
    req: Request,
    res: Response,
    argMetadata: ControllerMethodArgMetadata
  ): Promise<any> {
    switch (argMetadata.type) {
      case "body":
        return req.body;
      case "pathParam": {
        return this._collectPathParam(req, argMetadata);
      }
      case "queryParam": {
        return this._collectQueryParam(req, argMetadata);
      }
      case "custom-value-factory": {
        return this._collectCustomValueFactory(req, argMetadata);
      }
      case "request": {
        return req;
      }
      case "response": {
        return res;
      }
      default:
        return undefined;
    }
  }

  private async _collectCustomValueFactory(
    req: Request,
    argMetadata: CustomValueFactoryControllerMethodArgMetadata
  ) {
    let result = argMetadata.valueFactory(req, argMetadata.options);
    if (isPromise(result)) {
      result = await result;
    }
    return result;
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
): ParamValidator {
  // We need to pass the data by object, for type coersion and default values, and requiredness.
  const validate = ajv.compile({
    type: "object",
    properties: {
      value: {
        ...metadata.schema,
        // Remove our required: true/false value, as it is not standard json-schema.
        required: undefined,
      },
    },
    required: metadata.required ? ["value"] : [],
  });

  return (value: any) => {
    const data = { value };
    if (metadata.required && value === undefined) {
      throw new BadRequest(`Query parameter ${key} is required.`);
    }
    if (!validate(data)) {
      throw new UnprocessableEntity(
        getValidatorError(validate, `Query parameter ${key} is invalid.`, key)
      );
    }
    // Data may have been coerced by ajv.
    return data.value;
  };
}

function createPathParamValidator(metadata: ParamMetadata): ParamValidator {
  // We need to pass the data by object, for type coersion and default values, and requiredness.
  const validate = ajv.compile({
    type: "object",
    properties: {
      value: metadata.schema || {},
    },
    required: metadata.required ? ["value"] : [],
  });

  return (value: any) => {
    const data = { value };
    if (!validate(data)) {
      // We could pass the validation error here, but a malformed path is typically 404d.
      throw new NotFound();
    }
    // Data may have been coerced by ajv.
    return data.value;
  };
}
