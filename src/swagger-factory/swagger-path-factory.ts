import { getControllerMetadata, ControllerMethodMetadata } from "../metadata";
import { Controller } from "../types";
import { getControllerMethods } from "../controller-utils";

export function createSwaggerPaths(
  ...controllers: Controller[]
): Record<string, object> {
  const result: Record<string, object> = {};
  for (const controller of controllers) {
    const controllerPaths = createSwaggerControllerPaths(controller);
    Object.assign(result, controllerPaths);
  }
  return result;
}

function createSwaggerControllerPaths(
  controller: Controller
): Record<string, object> {
  const controllerMetadata = getControllerMetadata(controller.constructor);
  if (!controllerMetadata) {
    throw new Error(
      `Controller "${
        controller.constructor.name
      }" does not have a @controller annotation.`
    );
  }

  const methods = getControllerMethods(controller);

  const result: Record<string, object> = {};
  for (const { path, metadata } of methods) {
    const key = expressPathToSwaggerPath(path);
    result[key] = createSwaggerMethodConfig(metadata);
  }
  return result;
}

function createSwaggerMethodConfig(
  methodMetadata: ControllerMethodMetadata
): object {
  return {
    parameters: [
      ...createSwaggerMethodPathParameters(methodMetadata),
      ...createSwaggerMethodQueryParameters(methodMetadata)
    ],
    requestBody: createSwaggerRequestBody(methodMetadata),
    responses: createSwaggerResponses(methodMetadata)
  };
}

function createSwaggerRequestBody(
  methodMetadata: ControllerMethodMetadata
): object | undefined {
  if (!methodMetadata.requestSchema) {
    return undefined;
  }

  return {
    required: true,
    content: {
      "application/json": methodMetadata.requestSchema
    }
  };
}

function createSwaggerResponses(
  methodMetadata: ControllerMethodMetadata
): object | undefined {
  if (!methodMetadata.responseSchema) {
    return undefined;
  }

  return {
    200: {
      content: {
        "application/json": methodMetadata.responseSchema
      }
    }
  };
}

function createSwaggerMethodPathParameters(
  methodMetadata: ControllerMethodMetadata
): object[] {
  const params: object[] = [];

  for (const key of Object.keys(methodMetadata.pathParams || {})) {
    const param = (methodMetadata.pathParams as any)[key];
    params.push({
      name: key,
      in: "path",
      required: true,
      description: param.description,
      schema: param
    });
  }

  return params;
}

function createSwaggerMethodQueryParameters(
  methodMetadata: ControllerMethodMetadata
): object[] {
  const params: object[] = [];

  for (const key of Object.keys(methodMetadata.queryParams || {})) {
    const param = (methodMetadata.queryParams as any)[key];
    params.push({
      name: key,
      in: "query",
      required: param.required,
      description: param.description,
      schema: omit(param, "required")
    });
  }

  return params;
}

function expressPathToSwaggerPath(path: string): string {
  function expressToSwagger(fragment: string): string {
    if (fragment.startsWith(":")) {
      return "{" + fragment.substr(1) + "}";
    }
    return fragment;
  }
  return path
    .split("/")
    .map(expressToSwagger)
    .join("/");
}

function omit<T, K extends string>(obj: T, ...props: K[]): Omit<T, K> {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    if (props.includes(key)) {
      continue;
    }
    result[key] = (obj as any)[key];
  }
  return result;
}
