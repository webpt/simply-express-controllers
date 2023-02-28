import { getControllerMetadata, ControllerMethodMetadata } from "../metadata";
import { Controller } from "../types";
import { getControllerMethods } from "../controller-utils";

export function createSwaggerPaths(
  ...controllers: object[]
): Record<string, object> {
  const result: Record<string, object> = {};
  for (const controller of controllers) {
    const controllerPaths = createSwaggerControllerPaths(controller as any);
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
      `Controller "${controller.constructor.name}" does not have a @controller annotation.`
    );
  }

  const methods = getControllerMethods(controller);

  const result: Record<string, Record<string, object>> = {};
  for (const { path, metadata } of methods) {
    const key = expressPathToSwaggerPath(path);
    if (!result[key]) {
      result[key] = {};
    }
    result[key][metadata.method.toLowerCase()] = createSwaggerMethodConfig(
      metadata
    );
  }
  return result;
}

function createSwaggerMethodConfig(
  methodMetadata: ControllerMethodMetadata
): object {
  if (methodMetadata.swaggerOverride) {
    return methodMetadata.swaggerOverride;
  }

  return {
    summary: methodMetadata.summary,
    description: methodMetadata.description,
    tags: methodMetadata.tags,
    parameters: [
      ...createSwaggerMethodPathParameters(methodMetadata),
      ...createSwaggerMethodQueryParameters(methodMetadata),
    ],
    requestBody: createSwaggerRequestBody(methodMetadata),
    responses: createSwaggerResponses(methodMetadata),
  };
}

function createSwaggerRequestBody(
  methodMetadata: ControllerMethodMetadata
): object | undefined {
  if (!methodMetadata.request) {
    return undefined;
  }

  return {
    required: true,
    content: {
      "application/json": {
        required: methodMetadata.request.required,
        schema: methodMetadata.request.schema,
      },
    },
  };
}

function createSwaggerResponses(
  methodMetadata: ControllerMethodMetadata
): object | undefined {
  const responses: Record<number, object> = {};

  const keys = Object.keys(methodMetadata.responses || {})
    .map(Number)
    .filter((x) => !isNaN(x));

  if (keys.length === 0) {
    return undefined;
  }

  for (const statusCode of keys) {
    const data = methodMetadata.responses![statusCode];
    responses[statusCode] = {
      description: data.description,
      content: {
        "application/json": {
          schema: data.schema,
        },
      },
    };
  }

  return responses;
}

function createSwaggerMethodPathParameters(
  methodMetadata: ControllerMethodMetadata
): object[] {
  const params: object[] = [];

  const pathParams = methodMetadata.pathParams || {};
  for (const key of typedKeys(pathParams)) {
    const param = pathParams[key];
    params.push({
      name: key,
      in: "path",
      required: true,
      description: param.description,
      schema: param.schema,
    });
  }

  return params;
}

function createSwaggerMethodQueryParameters(
  methodMetadata: ControllerMethodMetadata
): object[] {
  const params: object[] = [];

  const queryParams = methodMetadata.queryParams || {};
  for (const key of typedKeys(queryParams)) {
    const param = queryParams[key];
    params.push({
      name: key,
      in: "query",
      required: param.required,
      description: param.description,
      schema: param.schema,
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

function typedKeys<T extends {}>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}
