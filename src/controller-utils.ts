import pathUtils from "path";

import { Controller } from "./types";
import {
  ControllerMethodMetadata,
  getControllerMetadata,
  getControllerMethodMetadata
} from "./metadata";

export interface ControllerMethodInfo {
  path: string;
  metadata: ControllerMethodMetadata;
  method: Function;
}
export function getControllerMethods(
  controller: Controller
): ControllerMethodInfo[] {
  const controllerMetadata = getControllerMetadata(controller.constructor);
  if (!controllerMetadata) {
    return [];
  }

  // Get all keys that exist on the controller.
  const keys: string[] = [];
  let scanTarget = controller;
  do {
    keys.push(...Object.getOwnPropertyNames(scanTarget));
  } while ((scanTarget = Object.getPrototypeOf(scanTarget)));

  const results: ControllerMethodInfo[] = [];

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

    results.push({
      method,
      metadata: methodMetadata,
      path: pathUtils.posix.join(
        controllerMetadata.path || "/",
        methodMetadata.path || "/"
      )
    });
  }

  return results;
}
