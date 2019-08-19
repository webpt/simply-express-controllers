import { JSONSchema6 } from "json-schema";

import {
  appendControllerMethodMetadata,
  ControllerMethodArgMetadata
} from "../metadata/controller-method";
import { Method } from "../types";

/**
 * Settings for controller methods.
 */
export interface ControllerMethodSettings {}

/**
 * Annotates this method to be a GET request method.
 * @param settings Settings for this request method.
 */
export function get(
  path?: string,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return method("GET", path, settings);
}

/**
 * Annotates this method to be a HEAD request method.
 * @param settings Settings for this request method.
 */
export function head(
  path?: string,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return method("HEAD", path, settings);
}

/**
 * Annotates this method to be a POST request method.
 * @param settings Settings for this request method.
 */
export function post(
  path?: string,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return method("POST", path, settings);
}

/**
 * Annotates this method to be a PUT request method.
 * @param settings Settings for this request method.
 */
export function put(
  path?: string,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return method("PUT", path, settings);
}

/**
 * Annotates this method to be a DELETE request method.
 * @param settings Settings for this request method.
 */
export function del(
  path?: string,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return method("DELETE", path, settings);
}

/**
 * Annotates this method to be a PATCH request method.
 * @param settings Settings for this request method.
 */
export function patch(
  path?: string,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return method("PATCH", path, settings);
}

/**
 * Annotates this method to be a controller method responding
 * to a path.
 * @param method The HTTP Method to respond to.
 * @param path The path to respond at, relative to the controller path.
 * @param settings Additional settings for this method.
 */
export function method(
  method: Method,
  path?: string,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    appendControllerMethodMetadata(target[propertyKey], {
      method,
      path
    });
  };
}

export interface ResponseSettings {
  /** A description of the meaning of this response */
  description?: string;
  /**
   * JSONSchema describing the shape of this response.
   */
  schema?: JSONSchema6;
}
export function response(
  statusCode: number,
  settings: ResponseSettings = {}
): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    appendControllerMethodMetadata(target[propertyKey], {
      responses: {
        [statusCode]: {
          description: settings.description,
          schema: settings.schema
        }
      }
    });
  };
}

export interface BodySettings {
  /**
   * Whether a request body is required on this method.
   */
  required?: boolean;
  /**
   * JSONSchema describing the request.
   */
  schema?: JSONSchema6;
}
/**
 * Annotates this parameter to receive the request body.
 */
export function body(settings: BodySettings = {}): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, methodIndex: number) => {
    const partialArgs: ControllerMethodArgMetadata[] = [];
    partialArgs[methodIndex] = {
      type: "body"
    };
    appendControllerMethodMetadata(target[propertyKey], {
      request: {
        required: settings.required,
        schema: settings.schema
      },
      handlerArgs: partialArgs
    });
  };
}

/**
 * Settings for path parameters.
 */
export interface PathParamSettings {
  /**
   * JSONSchema describing this parameter.
   */
  schema?: JSONSchema6;
}

/**
 * Annotates this parameter to receive the given path parameter.
 *
 * If the path parameter has a definition in the method decorator,
 * it will be cocerced to the type supplied in that definition.
 * Otherwise, it will be a string.
 */
export function pathParam(
  paramName: string,
  settings: PathParamSettings = {}
): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, methodIndex: number) => {
    const partialArgs: ControllerMethodArgMetadata[] = [];
    partialArgs[methodIndex] = {
      type: "pathParam",
      paramName: paramName
    };
    appendControllerMethodMetadata(target[propertyKey], {
      pathParams: {
        [paramName]: {
          schema: settings.schema
        }
      },
      handlerArgs: partialArgs
    });
  };
}

/**
 * Settings for query parameters.
 */
export interface QueryParamSettings {
  /**
   * Whether this query parameter is required.
   */
  required?: boolean;

  /**
   * JSONSchema describing this query parameter.
   */
  schema?: JSONSchema6;
}

/**
 * Annotates this parameter to receive the given query parameter.
 *
 * If the path parameter has a definition in the method decorator,
 * it will be cocerced to the type supplied in that definition.
 * Otherwise, it will be a string.
 */
export function queryParam(
  paramName: string,
  settings: QueryParamSettings = {}
): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, methodIndex: number) => {
    const partialArgs: ControllerMethodArgMetadata[] = [];
    partialArgs[methodIndex] = {
      type: "queryParam",
      paramName: paramName
    };
    appendControllerMethodMetadata(target[propertyKey], {
      queryParams: {
        [paramName]: {
          schema: settings.schema
        }
      },
      handlerArgs: partialArgs
    });
  };
}
