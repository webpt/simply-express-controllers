import { JSONSchema6 } from "json-schema";
import { appendControllerMetadata, getControllerMetadata } from "../metadata";

import { appendControllerMethodMetadata } from "../metadata/controller-method";
import { Method } from "../types";

/**
 * Settings for controller methods.
 */
export interface ControllerMethodSettings {
  summary?: string;
  description?: string;
  tags?: string[];
}

/**
 * Annotates this method to be a GET request method.
 */
export function get(): MethodDecorator;
/**
 * Annotates this method to be a GET request method.
 * @param path Path of this request handler relative to the controller.
 */
export function get(path: string): MethodDecorator;
/**
 * Annotates this method to be a GET request method.
 * @param settings Settings for this request method.
 */
export function get(settings: ControllerMethodSettings): MethodDecorator;
/**
 * Annotates this method to be a GET request method.
 * @param path Path of this request handler relative to the controller.
 * @param settings Settings for this request method.
 */
export function get(
  path: string,
  settings: ControllerMethodSettings
): MethodDecorator;
export function get(
  pathOrSettings?: string | ControllerMethodSettings,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return (method as any)("GET", pathOrSettings, settings);
}

/**
 * Annotates this method to be a HEAD request method.
 */
export function head(): MethodDecorator;
/**
 * Annotates this method to be a HEAD request method.
 * @param path Path of this request handler relative to the controller.
 */
export function head(path: string): MethodDecorator;
/**
 * Annotates this method to be a HEAD request method.
 * @param settings Settings for this request method.
 */
export function head(settings: ControllerMethodSettings): MethodDecorator;
/**
 * Annotates this method to be a HEAD request method.
 * @param path Path of this request handler relative to the controller.
 * @param settings Settings for this request method.
 */
export function head(
  path: string,
  settings: ControllerMethodSettings
): MethodDecorator;
export function head(
  pathOrSettings?: string | ControllerMethodSettings,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return (method as any)("HEAD", pathOrSettings, settings);
}

/**
 * Annotates this method to be a POST request method.
 */
export function post(): MethodDecorator;
/**
 * Annotates this method to be a POST request method.
 * @param path Path of this request handler relative to the controller.
 */
export function post(path: string): MethodDecorator;
/**
 * Annotates this method to be a POST request method.
 * @param settings Settings for this request method.
 */
export function post(settings: ControllerMethodSettings): MethodDecorator;
/**
 * Annotates this method to be a POST request method.
 * @param path Path of this request handler relative to the controller.
 * @param settings Settings for this request method.
 */
export function post(
  path: string,
  settings: ControllerMethodSettings
): MethodDecorator;
export function post(
  pathOrSettings?: string | ControllerMethodSettings,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return (method as any)("POST", pathOrSettings, settings);
}

/**
 * Annotates this method to be a PUT request method.
 */
export function put(): MethodDecorator;
/**
 * Annotates this method to be a PUT request method.
 * @param path Path of this request handler relative to the controller.
 */
export function put(path: string): MethodDecorator;
/**
 * Annotates this method to be a PUT request method.
 * @param settings Settings for this request method.
 */
export function put(settings: ControllerMethodSettings): MethodDecorator;
/**
 * Annotates this method to be a PUT request method.
 * @param path Path of this request handler relative to the controller.
 * @param settings Settings for this request method.
 */
export function put(
  path: string,
  settings: ControllerMethodSettings
): MethodDecorator;
export function put(
  pathOrSettings?: string | ControllerMethodSettings,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return (method as any)("PUT", pathOrSettings, settings);
}

/**
 * Annotates this method to be a DELETE request method.
 */
export function del(): MethodDecorator;
/**
 * Annotates this method to be a DELETE request method.
 * @param path Path of this request handler relative to the controller.
 */
export function del(path: string): MethodDecorator;
/**
 * Annotates this method to be a DELETE request method.
 * @param settings Settings for this request method.
 */
export function del(settings: ControllerMethodSettings): MethodDecorator;
/**
 * Annotates this method to be a DELETE request method.
 * @param path Path of this request handler relative to the controller.
 * @param settings Settings for this request method.
 */
export function del(
  path: string,
  settings: ControllerMethodSettings
): MethodDecorator;
export function del(
  pathOrSettings?: string | ControllerMethodSettings,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return (method as any)("DELETE", pathOrSettings, settings);
}

/**
 * Annotates this method to be a PATCH request method.
 */
export function patch(): MethodDecorator;
/**
 * Annotates this method to be a PATCH request method.
 * @param path Path of this request handler relative to the controller.
 */
export function patch(path: string): MethodDecorator;
/**
 * Annotates this method to be a PATCH request method.
 * @param settings Settings for this request method.
 */
export function patch(settings: ControllerMethodSettings): MethodDecorator;
/**
 * Annotates this method to be a PATCH request method.
 * @param path Path of this request handler relative to the controller.
 * @param settings Settings for this request method.
 */
export function patch(
  path: string,
  settings: ControllerMethodSettings
): MethodDecorator;
export function patch(
  pathOrSettings?: string | ControllerMethodSettings,
  settings?: ControllerMethodSettings
): MethodDecorator {
  return (method as any)("PATCH", pathOrSettings, settings);
}

/**
 * Annotates this method to be a controller method responding
 * to a path.
 * @param method The HTTP Method to respond to.
 */
export function method(method: Method): MethodDecorator;
/**
 * Annotates this method to be a controller method responding
 * to a path.
 * @param method The HTTP Method to respond to.
 * @param path The path to respond at, relative to the controller path.
 */
export function method(method: Method, path: string): MethodDecorator;
/**
 * Annotates this method to be a controller method responding
 * to a path.
 * @param method The HTTP Method to respond to.
 * @param settings Additional settings for this method.
 */
export function method(
  method: Method,
  settings: ControllerMethodSettings
): MethodDecorator;
/**
 * Annotates this method to be a controller method responding
 * to a path.
 * @param method The HTTP Method to respond to.
 * @param path The path to respond at, relative to the controller path.
 * @param settings Additional settings for this method.
 */
export function method(
  method: Method,
  path: string,
  settings: ControllerMethodSettings
): MethodDecorator;
export function method(
  method: Method,
  pathOrSettings?: string | ControllerMethodSettings,
  settings?: ControllerMethodSettings
): MethodDecorator {
  let path = "/";
  if (typeof pathOrSettings === "string") {
    path = pathOrSettings;
  } else if (pathOrSettings && typeof pathOrSettings === "object") {
    settings = pathOrSettings;
  }

  if (!settings) {
    settings = {};
  }

  return (target: any, propertyKey: string | symbol) => {
    appendControllerMethodMetadata(target[propertyKey], {
      method,
      path,
      summary: settings!.summary,
      description: settings!.description,
      tags: settings!.tags,
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
          schema: settings.schema,
        },
      },
    });
  };
}

/**
 * Specify the swagger documentation for the method.
 *
 * Using this decorator suppresses the auto-generation of swagger documentation for this method.
 *
 * @param swaggerPathDocs Additional swagger documentation to apply to the path.
 */
export function swaggerMethod(swaggerPathDocs: any): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    appendControllerMethodMetadata(target[propertyKey], {
      swaggerOverride: swaggerPathDocs,
    });
  };
}

/**
 * Specifies that the given method should be treated as middleware
 * The middleware will be positioned after controller-level middleware, but before
 * request handler method middleware.
 */
export function middleware() {
  return (target: any, propertyKey: string | symbol) => {
    const metadata = getControllerMetadata(target.constructor) ?? {
      middlewareMethods: [],
    };
    appendControllerMetadata(target.constructor, {
      middlewareMethods: [...(metadata.middlewareMethods ?? []), propertyKey],
    });
  };
}
