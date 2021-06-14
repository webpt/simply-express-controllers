import { appendControllerMetadata } from "../metadata/controller";

/**
 * Annotates this class as being a controller.
 * @param settings The controller settings.
 */
export function controller(path: string): ClassDecorator {
  return (target: any) => {
    appendControllerMetadata(target, {
      path,
    });
  };
}
