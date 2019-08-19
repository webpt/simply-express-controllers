import { JSONSchema6 } from "json-schema";

import { appendControllerMethodMetadata } from "../metadata/controller-method";
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
