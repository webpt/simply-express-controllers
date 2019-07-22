import {
  appendControllerMethodMetadata,
  ControllerMethodArgMetadata
} from "../metadata/controller-method";

export interface ControllerMethodSettings {
  path?: string;
}

export function get(settings: ControllerMethodSettings): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    appendControllerMethodMetadata(target[propertyKey], {
      method: "GET",
      ...settings
    });
  };
}

export function post(settings: any): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    appendControllerMethodMetadata(target[propertyKey], {
      method: "POST",
      ...settings
    });
  };
}

export function body(): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, methodIndex: number) => {
    const partialArgs: ControllerMethodArgMetadata[] = [];
    partialArgs[methodIndex] = {
      type: "body"
    };
    appendControllerMethodMetadata(target[propertyKey], {
      args: partialArgs
    });
  };
}

export function pathParam(paramName: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, methodIndex: number) => {
    const partialArgs: ControllerMethodArgMetadata[] = [];
    partialArgs[methodIndex] = {
      type: "pathParam",
      paramName: paramName
    };
    appendControllerMethodMetadata(target[propertyKey], {
      args: partialArgs
    });
  };
}

export function paramName(paramName: string): ParameterDecorator {
  return (target: any, propertyKey: string | symbol, methodIndex: number) => {
    const partialArgs: ControllerMethodArgMetadata[] = [];
    partialArgs[methodIndex] = {
      type: "queryParam",
      paramName
    };
    appendControllerMethodMetadata(target[propertyKey], {
      args: partialArgs
    });
  };
}
