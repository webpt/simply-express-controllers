import { Router } from "express";
import pathUtils from "path";
import bodyParser from "body-parser";

import {
  getControllerMetadata,
  ControllerMetadata,
  ControllerMethodMetadata,
} from "../metadata";
import { Controller } from "../types";

import { getControllerMethods } from "../controller-utils";

import { MethodHandler } from "./method-handler";

export function createControllerRoute(...controllers: object[]): Router {
  const router = Router();
  router.use(bodyParser.json({ strict: false }));

  for (const controller of controllers) {
    linkControllerToRoute(controller as any, router);
  }
  return router;
}

function linkControllerToRoute(controller: Controller, route: Router) {
  const controllerMetadata = getControllerMetadata(controller.constructor);
  if (!controllerMetadata) {
    throw new Error(
      `Controller "${controller.constructor.name}" does not have a @controller annotation.`
    );
  }

  const controllerRouter = Router();
  for (const middleware of controllerMetadata.middleware ?? []) {
    controllerRouter.use(middleware);
  }

  const methods = getControllerMethods(controller);
  for (const { metadata: methodMetadata, method } of methods) {
    linkControllerMethodToRoute(
      controller,
      method,
      methodMetadata,
      controllerRouter
    );
  }

  route.use(controllerMetadata.path || "/", controllerRouter);
}

function linkControllerMethodToRoute(
  controller: Controller,
  method: Function,
  methodMetadata: ControllerMethodMetadata,
  route: Router
) {
  const methodHandler = new MethodHandler(method, methodMetadata, controller);
  // handleRequest is pre-bound by MethodHandler
  const handler = methodHandler.handleRequest;
  const path = methodMetadata.path ?? "/";
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
    case "TRACE":
      route.trace(path, handler);
      break;
    case "CONNECT":
      route.connect(path, handler);
      break;
    default:
      throw new Error(
        `Unknown method ${methodMetadata.method} for controller function ${method.name}.`
      );
  }
}
