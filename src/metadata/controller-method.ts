import { merge } from "lodash";
import { JSONSchema6 } from "json-schema";

import createSymbol from "../create-symbol";
import { Method } from "../types";

export interface ControllerMethodMetadata {
  method: Method;
  path?: string;

  queryParams?: Record<string, ParamMetadata>;
  pathParams?: Record<string, ParamMetadata>;

  request?: RequestMetadata;

  responses?: Record<number, ResponseMetadata>;

  handlerArgs: ControllerMethodArgMetadata[];
}

export interface RequestMetadata {
  required?: boolean;
  schema?: JSONSchema6;
}

export interface ResponseMetadata {
  description?: string;
  schema?: JSONSchema6;
}

export interface ParamMetadata {
  /**
   * Whether this parameter is required.
   */
  required?: boolean;

  schema?: JSONSchema6;
}

export type ControllerMethodArgMetadata =
  | QueryParamControllerMethodArgMetadata
  | PathParamControllerMethodArgMetadata
  | BodyControllerMethodArgMetadata
  | RequestControllerMethodArgMetadata
  | ResponseControllerMethodArgMetadata;

export interface RequestControllerMethodArgMetadata {
  type: "request";
}

export interface ResponseControllerMethodArgMetadata {
  type: "response";
}

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
