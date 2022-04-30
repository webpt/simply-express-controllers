import { Response, Request } from "express";
import HttpStatusCodes from "http-status-codes";

import {
  ControllerMethodMetadata,
  BodyControllerMethodArgMetadata,
  PathParamControllerMethodArgMetadata,
  QueryParamControllerMethodArgMetadata,
  RequestControllerMethodArgMetadata,
  ResponseControllerMethodArgMetadata,
  CustomValueFactoryControllerMethodArgMetadata,
} from "../metadata";
import { MethodHandler } from "./method-handler";
import { result, CookieSettings } from "../method-result";

describe("Method Handler", function() {
  class DummyController {}
  const dummyController = new DummyController() as any;

  it("forwards thrown errors to express", async function() {
    const err = new Error("This is a test error");
    const method = () => {
      throw err;
    };
    const metadata = createMethodMetadata();
    const handler = new MethodHandler(method, metadata, dummyController);

    const req = createRequest();
    const res = createResponse();
    const next = jest.fn();

    await handler.handleRequest(req, res, next);

    expect(next).toBeCalledWith(err);
  });

  it("forwards thrown async errors to express", async function() {
    const err = new Error("This is a test error");
    const method = async () => {
      await Promise.resolve(1);
      throw err;
    };
    const metadata = createMethodMetadata();
    const handler = new MethodHandler(method, metadata, dummyController);

    const req = createRequest();
    const res = createResponse();
    const next = jest.fn();

    await handler.handleRequest(req, res, next);

    expect(next).toBeCalledWith(err);
  });

  describe("Request Validation", function() {
    it("permits any body when no validation is specified", async function() {
      const method = jest.fn().mockReturnValue({});
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({
        body: 42,
      });
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
    });

    it("returns BAD_REQUEST if no body is specified when a body is required", async function() {
      const method = jest.fn().mockReturnValue({});
      const metadata = createMethodMetadata({
        request: {
          required: true,
        },
      });
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({
        body: undefined,
      });
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).toBeCalledWith(
        expect.objectContaining({
          statusCode: HttpStatusCodes.BAD_REQUEST,
        })
      );
    });

    it("returns BAD_REQUEST when a body fails validation", async function() {
      const method = jest.fn().mockReturnValue({});
      const metadata = createMethodMetadata({
        request: {
          schema: {
            type: "object",
            properties: {
              foo: { type: "number" },
            },
          },
        },
      });
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({
        body: {
          foo: "This is not a number",
        },
      });
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).toBeCalledWith(
        expect.objectContaining({
          statusCode: HttpStatusCodes.BAD_REQUEST,
        })
      );
    });
  });

  describe("Arguments", function() {
    it("handles zero argument methods", async function() {
      const method = jest.fn().mockReturnValue({});
      const metadata = createMethodMetadata({});
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({});
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(method).toBeCalled();
    });

    describe("body", function() {
      it("provides the request body", async function() {
        const body = { foo: 42 };

        const method = jest.fn().mockReturnValue({});
        const firstArg: BodyControllerMethodArgMetadata = {
          type: "body",
        };
        const metadata = createMethodMetadata({
          handlerArgs: [firstArg],
        });
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest({
          body,
        });
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).not.toBeCalled();
        expect(method).toBeCalledWith(body);
      });
    });

    describe("pathParam", function() {
      it("provides the requested path param", async function() {
        const method = jest.fn().mockReturnValue({});
        const paramName = "testParam";
        const paramValue = "This is the test param value";
        const firstArg: PathParamControllerMethodArgMetadata = {
          type: "pathParam",
          paramName,
        };
        const metadata = createMethodMetadata({
          pathParams: {
            [paramName]: {},
          },
          handlerArgs: [firstArg],
        });
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest({
          params: {
            [paramName]: paramValue,
          },
        });
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).not.toBeCalled();
        expect(method).toBeCalledWith(paramValue);
      });

      it("returns NOT_FOUND when a required path param is not supplied", async function() {
        const method = jest.fn().mockReturnValue({});
        const paramName = "testParam";
        const firstArg: PathParamControllerMethodArgMetadata = {
          type: "pathParam",
          paramName,
        };
        const metadata = createMethodMetadata({
          pathParams: {
            [paramName]: {
              required: true,
            },
          },
          handlerArgs: [firstArg],
        });
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest({
          params: {},
        });
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).toBeCalledWith(
          expect.objectContaining({
            statusCode: HttpStatusCodes.NOT_FOUND,
          })
        );
      });

      it("returns NOT_FOUND when the path param is invalid", async function() {
        const method = jest.fn().mockReturnValue({});
        const paramName = "testParam";
        const paramValue = "This is the test param value";
        const firstArg: PathParamControllerMethodArgMetadata = {
          type: "pathParam",
          paramName,
        };
        const metadata = createMethodMetadata({
          pathParams: {
            [paramName]: {
              schema: { type: "integer" },
            },
          },
          handlerArgs: [firstArg],
        });
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest({
          params: {
            [paramName]: paramValue,
          },
        });
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).toBeCalledWith(
          expect.objectContaining({
            statusCode: HttpStatusCodes.NOT_FOUND,
          })
        );
      });

      it.only("coerces the path param value where appropriate", async function() {
        const method = jest.fn().mockReturnValue({});
        const paramName = "testParam";
        const paramValue = "42";
        const expectedParamValue = 42;
        const firstArg: PathParamControllerMethodArgMetadata = {
          type: "pathParam",
          paramName,
        };
        const metadata = createMethodMetadata({
          pathParams: {
            [paramName]: {
              schema: { type: "integer" },
            },
          },
          handlerArgs: [firstArg],
        });
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest({
          params: {
            [paramName]: paramValue,
          },
        });
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).not.toBeCalled();
        expect(method).toBeCalledWith(expectedParamValue);
      });
    });

    describe("queryParam", function() {
      it("provides the requested query param", async function() {
        const method = jest.fn().mockReturnValue({});
        const paramName = "testParam";
        const paramValue = "This is the test param value";
        const firstArg: QueryParamControllerMethodArgMetadata = {
          type: "queryParam",
          paramName,
        };
        const metadata = createMethodMetadata({
          queryParams: {
            [paramName]: {},
          },
          handlerArgs: [firstArg],
        });
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest({
          query: {
            [paramName]: paramValue,
          },
        });
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).not.toBeCalled();
        expect(method).toBeCalledWith(paramValue);
      });

      it("returns BAD_REQUEST when a required query param is not supplied", async function() {
        const method = jest.fn().mockReturnValue({});
        const paramName = "testParam";
        const firstArg: QueryParamControllerMethodArgMetadata = {
          type: "queryParam",
          paramName,
        };
        const metadata = createMethodMetadata({
          queryParams: {
            [paramName]: {
              required: true,
            },
          },
          handlerArgs: [firstArg],
        });
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest({
          query: {},
        });
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).toBeCalledWith(
          expect.objectContaining({
            statusCode: HttpStatusCodes.BAD_REQUEST,
          })
        );
      });

      it("returns UNPROCESSABLE_ENTITY when the query param is invalid", async function() {
        const method = jest.fn().mockReturnValue({});
        const paramName = "testParam";
        const paramValue = "This is the test param value";
        const firstArg: QueryParamControllerMethodArgMetadata = {
          type: "queryParam",
          paramName,
        };
        const metadata = createMethodMetadata({
          queryParams: {
            [paramName]: {
              schema: { type: "integer" },
            },
          },
          handlerArgs: [firstArg],
        });
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest({
          query: {
            [paramName]: paramValue,
          },
        });
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).toBeCalledWith(
          expect.objectContaining({
            statusCode: HttpStatusCodes.UNPROCESSABLE_ENTITY,
          })
        );
      });

      it("coerces the query param value where appropriate", async function() {
        const method = jest.fn().mockReturnValue({});
        const paramName = "testParam";
        const paramValue = "42";
        const expectedParamValue = 42;
        const firstArg: QueryParamControllerMethodArgMetadata = {
          type: "queryParam",
          paramName,
        };
        const metadata = createMethodMetadata({
          queryParams: {
            [paramName]: {
              schema: { type: "integer" },
            },
          },
          handlerArgs: [firstArg],
        });
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest({
          query: {
            [paramName]: paramValue,
          },
        });
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).not.toBeCalled();
        expect(method).toBeCalledWith(expectedParamValue);
      });
    });

    describe("createRequestDecorator", function() {
      it("invokes the value factory and returns the value", async function() {
        const method = jest.fn().mockReturnValue({});
        const options = "hello world";
        const returnValue = 42;
        const valueFactory = jest.fn().mockReturnValue(returnValue);
        const firstArg: CustomValueFactoryControllerMethodArgMetadata = {
          type: "custom-value-factory",
          options,
          valueFactory,
        };
        const metadata = createMethodMetadata({
          handlerArgs: [firstArg],
        });
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest();
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).not.toBeCalled();
        expect(valueFactory).toBeCalledWith(req, options);
        expect(method).toBeCalledWith(returnValue);
      });
    });

    describe("expressRequest", function() {
      it("provides the request", async function() {
        const method = jest.fn().mockReturnValue({});
        const firstArg: RequestControllerMethodArgMetadata = {
          type: "request",
        };
        const metadata = createMethodMetadata({
          handlerArgs: [firstArg],
        });
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest();
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).not.toBeCalled();
        expect(method).toBeCalledWith(req);
      });
    });

    describe("expressResponse", function() {
      it("provides the response", async function() {
        const method = jest.fn().mockReturnValue({});
        const firstArg: ResponseControllerMethodArgMetadata = {
          type: "response",
        };
        const metadata = createMethodMetadata({
          handlerArgs: [firstArg],
        });
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest();
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).not.toBeCalled();
        expect(method).toBeCalledWith(res);
      });
    });
  });

  it("calls the method with the controller context", async function() {
    let capturedInstance: any = undefined;
    const method = function(this: any) {
      capturedInstance = this;
      return {};
    };
    const metadata = createMethodMetadata();
    const handler = new MethodHandler(method, metadata, dummyController);

    const req = createRequest({});
    const res = createResponse();
    const next = jest.fn();

    await handler.handleRequest(req, res, next);

    expect(next).not.toBeCalled();
    expect(capturedInstance).toEqual(dummyController);
  });

  it("supports promise-returning methods", async function() {
    const result = { foo: 42 };

    const method = jest.fn().mockReturnValue(Promise.resolve(result));
    const metadata = createMethodMetadata();
    const handler = new MethodHandler(method, metadata, dummyController);

    const req = createRequest({});
    const res = createResponse();
    const next = jest.fn();

    await handler.handleRequest(req, res, next);

    expect(next).not.toBeCalled();
    expect(res.json).toBeCalledWith(result);
  });

  it("supports non-promise-returning methods", async function() {
    const result = { foo: 42 };

    const method = jest.fn().mockReturnValue(result);
    const metadata = createMethodMetadata();
    const handler = new MethodHandler(method, metadata, dummyController);

    const req = createRequest({});
    const res = createResponse();
    const next = jest.fn();

    await handler.handleRequest(req, res, next);

    expect(next).not.toBeCalled();
    expect(res.json).toBeCalledWith(result);
  });

  describe("Response Validation", function() {
    it("Allows a falsey result", async function() {
      const methodResult = result(0);

      const method = jest.fn().mockReturnValue(methodResult);
      const metadata = createMethodMetadata({});
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({});
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.json).toBeCalled();
    });

    it("Allows a non-validated response", async function() {
      const statusCode = 123;
      const methodResult = result({ foo: 42 }).status(statusCode);

      const method = jest.fn().mockReturnValue(methodResult);
      const metadata = createMethodMetadata({
        responses: {
          [statusCode + 1]: {
            schema: { type: "null" },
          },
        },
      });
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({});
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.json).toBeCalled();
    });

    it("passes a validated response", async function() {
      const statusCode = 123;
      const methodResult = result({ foo: 42 }).status(statusCode);

      const method = jest.fn().mockReturnValue(methodResult);
      const metadata = createMethodMetadata({
        responses: {
          [statusCode]: {
            schema: {
              type: "object",
              properties: { foo: { type: "integer" } },
            },
          },
        },
      });
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({});
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.json).toBeCalled();
    });

    it("responds to an invalid response with INTERNAL_SERVER_ERROR", async function() {
      const statusCode = 123;
      const methodResult = result({ foo: "This is not an integer" }).status(
        statusCode
      );

      const method = jest.fn().mockReturnValue(methodResult);
      const metadata = createMethodMetadata({
        responses: {
          [statusCode]: {
            schema: {
              type: "object",
              properties: { foo: { type: "integer" } },
            },
          },
        },
      });
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({});
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      // We throw a regular (private) error for response schema violations.
      expect(next).toBeCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });

  describe("Response Transmission", function() {
    it("supports string responses", async function() {
      const response = "This is the response";
      const method = jest.fn().mockReturnValue(response);
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest();
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.json).toBeCalledWith(response);
    });

    it("supports array responses", async function() {
      const response = [1, 2, 3];
      const method = jest.fn().mockReturnValue(response);
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest();
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.json).toBeCalledWith(response);
    });

    it("supports object responses", async function() {
      const response = { foo: true };
      const method = jest.fn().mockReturnValue(response);
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest();
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.json).toBeCalledWith(response);
    });

    it("supports string responses through result()", async function() {
      const response = "This is the response";
      const method = jest.fn().mockReturnValue(result(response));
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest();
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.json).toBeCalledWith(response);
    });

    it("supports array responses through result()", async function() {
      const response = [1, 2, 3];
      const method = jest.fn().mockReturnValue(result(response));
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest();
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.json).toBeCalledWith(response);
    });

    it("supports object responses through result()", async function() {
      const response = { foo: true };
      const method = jest.fn().mockReturnValue(result(response));
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest();
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.json).toBeCalledWith(response);
    });

    it("sets headers according to the response", async function() {
      const headerName1 = "Header1";
      const headerValue1 = "Foo";
      const headerName2 = "Header2";
      const headerValue2 = "Bar";
      const methodResult = result({ foo: 42 })
        .header(headerName1, headerValue1)
        .header(headerName2, headerValue2);

      const method = jest.fn().mockReturnValue(Promise.resolve(methodResult));
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({});
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.setHeader).toBeCalledWith(headerName1, headerValue1);
      expect(res.setHeader).toBeCalledWith(headerName2, headerValue2);
    });

    it("sets status code according to the response", async function() {
      const statusCode = HttpStatusCodes.IM_A_TEAPOT;
      const methodResult = result({ foo: 42 }).status(statusCode);

      const method = jest.fn().mockReturnValue(Promise.resolve(methodResult));
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({});
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.status).toBeCalledWith(statusCode);
    });

    it("sets cookies according to the response", async function() {
      const cookieName1 = "Cookie1";
      const cookieValue1 = "Foo";
      const cookieName2 = "Header2";
      const cookieValue2 = "Bar";
      const cookieSettings2: CookieSettings = {
        domain: "www.foobar.com",
        path: "/foo",
        expires: new Date("1-1-2022"),
      };
      const methodResult = result({ foo: 42 })
        .cookie(cookieName1, cookieValue1)
        .cookie(cookieName2, cookieValue2, cookieSettings2);

      const method = jest.fn().mockReturnValue(Promise.resolve(methodResult));
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({});
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.cookie).toBeCalledWith(cookieName1, cookieValue1, {});
      expect(res.cookie).toBeCalledWith(
        cookieName2,
        cookieValue2,
        cookieSettings2
      );
    });

    it("transmits data as json if no content type is specified", async function() {
      const response = result("hello world");
      const method = jest.fn().mockReturnValue(response);
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest();
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.json).toBeCalledWith("hello world");
    });

    it("transmits data as text if the raw option is used", async function() {
      const response = result({ raw: true }, "hello world");
      const method = jest.fn().mockReturnValue(response);
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest();
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.send).toBeCalledWith("hello world");
    });

    it("transmits data raw if the content type is not application/json", async function() {
      const response = result("text/plain", "hello world");
      const method = jest.fn().mockReturnValue(response);
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest();
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.send).toBeCalledWith("hello world");
    });

    it("sends the result when result() is used", async function() {
      const rawResult = { foo: 42 };
      const methodResult = result(rawResult).status(
        HttpStatusCodes.IM_A_TEAPOT
      );

      const method = jest.fn().mockReturnValue(Promise.resolve(methodResult));
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({});
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.json).toBeCalledWith(rawResult);
    });

    it("sends no response when result.handled() is used", async function() {
      const response = result.handled();
      const method = jest.fn().mockReturnValue(response);
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest();
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.status).not.toBeCalled();
    });

    describe("Content Types", function() {
      it("specifies the application/json content type if none is given", async function() {
        const response = result({ foo: true });
        const method = jest.fn().mockReturnValue(response);
        const metadata = createMethodMetadata();
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest();
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).not.toBeCalled();
        expect(res.setHeader).toBeCalledWith(
          "Content-Type",
          "application/json"
        );
      });

      it("specifies a content type if one is provided.", async function() {
        const response = result("foo/bar", { foo: true });
        const method = jest.fn().mockReturnValue(response);
        const metadata = createMethodMetadata();
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest();
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).not.toBeCalled();
        expect(res.setHeader).toBeCalledWith("Content-Type", "foo/bar");
      });

      it("yields to the header-provided content type if specified", async function() {
        const response = result("foo/bar", { foo: true }).header(
          "Content-Type",
          "foo/baz"
        );
        const method = jest.fn().mockReturnValue(response);
        const metadata = createMethodMetadata();
        const handler = new MethodHandler(method, metadata, dummyController);

        const req = createRequest();
        const res = createResponse();
        const next = jest.fn();

        await handler.handleRequest(req, res, next);

        expect(next).not.toBeCalled();
        expect(res.setHeader).toBeCalledWith("Content-Type", "foo/baz");
      });
    });
  });
});

interface RequestOpts {
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
}
function createRequest(opts?: RequestOpts): Request {
  if (!opts) opts = {};
  return {
    body: opts.body,
    params: opts.params || {},
    query: opts.query || {},
  } as any;
}

function createResponse(): Response {
  const res: Response = {} as any;
  res.setHeader = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function createMethodMetadata(
  metadata?: Partial<ControllerMethodMetadata>
): ControllerMethodMetadata {
  return {
    method: "GET",
    ...metadata,
  };
}
