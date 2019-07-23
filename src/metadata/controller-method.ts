import { merge } from "lodash";

import { ControllerMethodSettings } from "../decorators/controller-method";
import createSymbol from "../create-symbol";

export interface ControllerMethodMetadata extends ControllerMethodSettings {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  args: ControllerMethodArgMetadata[];
}

export type ControllerMethodArgMetadata =
  | QueryParamControllerMethodArgMetadata
  | PathParamControllerMethodArgMetadata
  | BodyControllerMethodArgMetadata;

export interface QueryParamControllerMethodArgMetadata {
  type: "queryParam";
  paramName: string;
}

export interface PathParamControllerMethodArgMetadata {
  type: "pathParam";
  paramName: string;
}

export interface BodyControllerMethodArgMetadata {
  type: "body";
}

const ControllerMethodMetadataSymbol = createSymbol(
  "controller-method-metadata"
);

export function getControllerMethodMetadata(
  method: any
): ControllerMethodMetadata | undefined {
  return method[ControllerMethodMetadataSymbol] || undefined;
}

export function setControllerMethodMetadata(
  method: any,
  metadata: ControllerMethodMetadata
) {
  method[ControllerMethodMetadataSymbol] = metadata;
}

export function appendControllerMethodMetadata(
  method: any,
  metadata: Partial<ControllerMethodMetadata>
) {
  if (!method[ControllerMethodMetadataSymbol]) {
    method[ControllerMethodMetadataSymbol] = {};
  }
  merge(method[ControllerMethodMetadataSymbol], metadata);
}
