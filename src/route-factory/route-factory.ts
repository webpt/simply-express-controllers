import { Router } from "express";
import pathUtils from "path";
import bodyParser from "body-parser";

import {
  getControllerMetadata,
  ControllerMetadata,
  ControllerMethodMetadata
} from "../metadata";
import { Controller } from "../types";

import { createControllerMethodHandler } from "./method-handler-factory";
import { getControllerMethods } from "../controller-utils";

export function createControllerRoute(...controllers: Controller[]): Router {
  const router = Router();
  router.use(bodyParser.json());

  for (const controller of controllers) {
    linkControllerToRoute(controller, router);
  }
  return router;
}

function linkControllerToRoute(controller: Controller, route: Router) {
  const controllerMetadata = getControllerMetadata(controller.constructor);
  if (!controllerMetadata) {
    throw new Error(
      `Controller "${
        controller.constructor.name
      }" does not have a @controller annotation.`
    );
  }

  const methods = getControllerMethods(controller);
  for (const { metadata: methodMetadata, method } of methods) {
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
  const path = pathUtils.posix.join(
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
