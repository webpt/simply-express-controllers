import { merge } from "lodash";

import { ControllerSettings } from "../decorators/controller";
import createSymbol from "../create-symbol";

export interface ControllerMetadata extends ControllerSettings {}

const ControllerMetadataSymbol = createSymbol("controller-metadata");

export function getControllerMetadata(
  controller: any
): ControllerMetadata | undefined {
  return controller[ControllerMetadataSymbol] || undefined;
}

export function setControllerMetadata(
  controller: any,
  metadata: ControllerMetadata
) {
  controller[ControllerMetadataSymbol] = metadata;
}

export function appendControllerMetadata(
  controller: any,
  metadata: Partial<ControllerMetadata>
) {
  if (!controller[ControllerMetadataSymbol]) {
    controller[ControllerMetadataSymbol] = {};
  }
  merge(controller[ControllerMetadataSymbol], metadata);
}
