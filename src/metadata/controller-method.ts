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
  controller: any
): ControllerMethodMetadata | undefined {
  return controller[ControllerMethodMetadataSymbol] || undefined;
}

export function setControllerMethodMetadata(
  controller: any,
  metadata: ControllerMethodMetadata
) {
  controller[ControllerMethodMetadataSymbol] = metadata;
}

export function appendControllerMethodMetadata(
  controller: any,
  metadata: Partial<ControllerMethodMetadata>
) {
  merge(controller[ControllerMethodMetadataSymbol], metadata);
}
