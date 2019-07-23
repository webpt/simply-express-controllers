import { setControllerMetadata } from "../metadata/controller";

/**
 * Settings describing a route controller.
 */
export interface ControllerSettings {
  /**
   * The request path of this controller.
   * All request methods will be relative to this path.
   */
  path?: string;
}

/**
 * Annotates this class as being a controller.
 * @param settings The controller settings.
 */
export function controller(settings: any): ClassDecorator {
  return (target: any) => {
    setControllerMetadata(target, settings);
  };
}
