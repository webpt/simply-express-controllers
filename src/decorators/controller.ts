import { setControllerMetadata } from "../metadata/controller";

export interface ControllerSettings {
  path?: string;
}
export function controller(settings: any): ClassDecorator {
  return (target: any) => {
    setControllerMetadata(target, settings);
  };
}
