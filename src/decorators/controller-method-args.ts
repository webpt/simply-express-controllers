import { JSONSchema6 } from "json-schema";

import {
  appendControllerMethodMetadata,
  ControllerMethodArgMetadata
} from "../metadata";

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
