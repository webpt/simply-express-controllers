import { Router } from "express";
import pathUtils from "path";
import bodyParser from "body-parser";

import {
  getControllerMetadata,
  getControllerMethodMetadata,
  ControllerMetadata,
  ControllerMethodMetadata
} from "../metadata";

import { createControllerMethodHandler } from "./method-handler-factory";

export interface Controller {
  constructor: Function;
  prototype: Function;
}

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

  // Get all keys that exist on the controller.
  const keys: string[] = [];
  let scanTarget = controller;
  do {
    keys.push(...Object.getOwnPropertyNames(scanTarget));
  } while ((scanTarget = Object.getPrototypeOf(scanTarget)));

  // Scan the keys for controller methods, and make routes for them.
  for (const key of keys) {
    const method = (controller as any)[key];
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
