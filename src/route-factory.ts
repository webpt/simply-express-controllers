import {
  Router,
  RequestHandler,
  Request,
  Response,
  NextFunction
} from "express";
import { URL } from "url";

import {
  getControllerMetadata,
  getControllerMethodMetadata,
  ControllerMetadata,
  ControllerMethodMetadata
} from "./metadata";
import { ControllerMethodResult, StatusCode, Headers } from "./method-result";

export interface Controller {
  constructor: Function;
  prototype: Function;
}

export function createControllerRoute(...controllers: Controller[]): Router {
  const router = Router();
  for (const controller of controllers) {
    linkControllerToRoute(controller, router);
  }
  return router;
}

function linkControllerToRoute(controller: Controller, route: Router) {
  const controllerMetadata = getControllerMetadata(controller);
  if (!controllerMetadata) {
    throw new Error(
      `Controller "${
        controller.constructor.name
      }" does not have a @controller annotation.`
    );
  }

  for (const key in controller.prototype) {
    const method = (controller.prototype as any)[key];
    if (typeof method !== "function") {
      continue;
    }

    const methodMetadata = getControllerMethodMetadata(method);
    if (!methodMetadata) {
      continue;
    }

    linkControllerMethodToRoute(
      controller,
      controllerMetadata,
      method,
      methodMetadata,
      route
    );
  }
}

function linkControllerMethodToRoute(
  controller: Controller,
  controllerMetadata: ControllerMetadata,
  method: Function,
  methodMetadata: ControllerMethodMetadata,
  route: Router
) {
  const handler = createControllerMethodHandler(
    controller,
    method,
    methodMetadata
  );
  const path = joinURL(
    controllerMetadata.path || "/",
    methodMetadata.path || "/"
  );
  switch (methodMetadata.method) {
    case "GET":
      route.get(path, handler);
      break;
    case "POST":
      route.post(path, handler);
      break;
    case "PUT":
      route.put(path, handler);
      break;
    case "PATCH":
      route.patch(path, handler);
      break;
    case "DELETE":
      route.delete(path, handler);
      break;
  }
}

function createControllerMethodHandler(
  controller: Controller,
  method: Function,
  methodMetadata: ControllerMethodMetadata
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const args = collectMethodArgs(req, methodMetadata);
      const result = method.apply(controller, args) as ControllerMethodResult;
      const statusCode = result[StatusCode] || 200;
      const headers = result[Headers] || {};
      for (const key of Object.keys(headers)) {
        res.setHeader(key, headers[key]);
      }
      res.status(statusCode).send(result);
    } catch (e) {
      next(e);
    }
  };
}

function collectMethodArgs(
  req: Request,
  methodMetadata: ControllerMethodMetadata
): any[] {
  return methodMetadata.args.map(argMetadata => {
    switch (argMetadata.type) {
      case "body":
        return req.body;
      case "pathParam":
        return req.params[argMetadata.paramName];
      case "queryParam":
        return req.query[argMetadata.paramName];
      default:
        return undefined;
    }
  });
}

function joinURL(root: string, ...path: string[]) {
  var url = new URL(root);
  url.pathname = [...stripTrailingSlash(url.pathname).split("/"), ...path].join(
    "/"
  );
  return url.toString();
}

function stripTrailingSlash(str: string): string {
  if (str[str.length - 1] === "/") {
    return str.substr(0, str.length - 1);
  }
  return str;
}
