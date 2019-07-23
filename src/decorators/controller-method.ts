import { JSONSchema6 } from "json-schema";

import {
  appendControllerMethodMetadata,
  ControllerMethodArgMetadata
} from "../metadata/controller-method";

/**
 * Describes common settings for controller methods.
 */
export interface ControllerMethodSettings {
  /**
   * The path of this method, relative to the controller path.
   */
  path?: string;
  /**
   * Query parameter definitions.
   */
  queryParams?: Record<string, QueryParamSettings>;
  /**
   * Path parameter definitions.
   */
  pathParams?: Record<string, PathParamSettings>;

  /**
   * Schema for the request.
   *
   * If the request does not match the schema, a Bad Request status code is returned.
   */
  requestSchema?: JSONSchema6;

  /**
   * Schema for the response.
   *
   * If the response does not match the schema, an Internal Server Error status code is returned.
   */
  responseSchema?: JSONSchema6;
}

/**
 * Describes a query parameter.
 */
export interface QueryParamSettings extends Omit<JSONSchema6, "required"> {
  /**
   * The type of this parameter.
   */
  type: "string" | "number" | "boolean";
  /**
   * Whether this parameter is required.
   */
  required?: boolean;
}

export interface PathParamSettings extends JSONSchema6 {
  /**
   * The type of this parameter.
   */
  type: "string" | "number" | "boolean";
}

/**
 * Annotates this method to be a GET request method.
 * @param settings Settings for this request method.
 */
export function get(settings: ControllerMethodSettings): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    appendControllerMethodMetadata(target[propertyKey], {
      method: "GET",
      ...settings
    });
  };
}

/**
 * Annotates this method to be a POST request method.
 * @param settings Settings for this request method.
 */
export function post(settings: ControllerMethodSettings): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    appendControllerMethodMetadata(target[propertyKey], {
      method: "POST",
      ...settings
    });
  };
}

/**
 * Annotates this parameter to receive the request body.
 */
export function body(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, methodIndex: number) => {
    const partialArgs: ControllerMethodArgMetadata[] = [];
    partialArgs[methodIndex] = {
      type: "body"
    };
    appendControllerMethodMetadata(target[propertyKey], {
      args: partialArgs
    });
  };
}

/**
 * Annotates this parameter to receive the given path parameter.
 *
 * If the path parameter has a definition in the method decorator,
 * it will be cocerced to the type supplied in that definition.
 * Otherwise, it will be a string.
 */
export function pathParam(paramName: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, methodIndex: number) => {
    const partialArgs: ControllerMethodArgMetadata[] = [];
    partialArgs[methodIndex] = {
      type: "pathParam",
      paramName: paramName
    };
    appendControllerMethodMetadata(target[propertyKey], {
      args: partialArgs
    });
  };
}

/**
 * Annotates this parameter to receive the given query parameter.
 *
 * If the path parameter has a definition in the method decorator,
 * it will be cocerced to the type supplied in that definition.
 * Otherwise, it will be a string.
 */
export function queryParam(paramName: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, methodIndex: number) => {
    const partialArgs: ControllerMethodArgMetadata[] = [];
    partialArgs[methodIndex] = {
      type: "queryParam",
      paramName: paramName
    };
    appendControllerMethodMetadata(target[propertyKey], {
      args: partialArgs
    });
  };
}
