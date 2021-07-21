import { RequestHandler } from "express";
import {
  appendControllerMethodMetadata,
  getControllerMethodMetadata,
} from "../metadata";
import {
  appendControllerMetadata,
  getControllerMetadata,
} from "../metadata/controller";

/**
 * Applies middleware to the entire controller.
 * @param middleware The middleware to apply to the controller.
 */
export function use(...middleware: RequestHandler[]) {
  return (target: any, propertyKey?: string) => {
    if (propertyKey) {
      const metadata = getControllerMethodMetadata(target[propertyKey]);
      const extantMiddleware = (metadata ? metadata.middleware : null) ?? [];
      appendControllerMethodMetadata(target[propertyKey], {
        middleware: [...extantMiddleware, ...middleware],
      });
    } else {
      const metadata = getControllerMetadata(target) ?? { middleware: [] };
      appendControllerMetadata(target, {
        middleware: [...(metadata.middleware ?? []), ...middleware],
      });
    }
  };
}
