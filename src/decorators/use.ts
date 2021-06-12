import { RequestHandler } from "express";
import {
  appendControllerMetadata,
  getControllerMetadata,
} from "../metadata/controller";

/**
 * Applies middleware to the entire controller.
 * @param middleware The middleware to apply to the controller.
 */
export function use(...middleware: RequestHandler[]): ClassDecorator {
  return (target: any) => {
    const metadata = getControllerMetadata(target) ?? { middleware: [] };
    appendControllerMetadata(target, {
      middleware: [...(metadata.middleware ?? []), ...middleware],
    });
  };
}
