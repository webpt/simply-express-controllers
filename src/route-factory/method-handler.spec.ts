import { Response, Request } from "express";
import HttpStatusCodes from "http-status-codes";

import { ControllerMethodMetadata } from "../metadata";
import { MethodHandler } from "./method-handler";

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

  describe("Request Validation", function() {
    it("permits any body when no validation is specified", async function() {
      const method = () => {
        return {};
      };
      const metadata = createMethodMetadata();
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({
        body: 42
      });
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).not.toBeCalled();
      expect(res.send).toBeCalled();
    });

    it("returns BAD_REQUEST if no body is specified when a body is required", async function() {
      const method = () => {
        return {};
      };
      const metadata = createMethodMetadata({
        request: {
          required: true
        }
      });
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({
        body: undefined
      });
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).toBeCalledWith(
        expect.objectContaining({
          statusCode: HttpStatusCodes.BAD_REQUEST
        })
      );
    });

    it("returns BAD_REQUEST when a body fails validation", async function() {
      const method = () => {
        return {};
      };
      const metadata = createMethodMetadata({
        request: {
          schema: {
            type: "object",
            properties: {
              foo: { type: "number" }
            }
          }
        }
      });
      const handler = new MethodHandler(method, metadata, dummyController);

      const req = createRequest({
        body: {
          foo: "This is not a number"
        }
      });
      const res = createResponse();
      const next = jest.fn();

      await handler.handleRequest(req, res, next);

      expect(next).toBeCalledWith(
        expect.objectContaining({
          statusCode: HttpStatusCodes.BAD_REQUEST
        })
      );
    });
  });
});

interface RequestOpts {
  body?: any;
}
function createRequest(opts?: RequestOpts): Request {
  if (!opts) opts = {};
  return {
    body: opts.body
  } as any;
}

function createResponse(): Response {
  const res: Response = {} as any;
  res.header = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
}

function createMethodMetadata(
  metadata?: Partial<ControllerMethodMetadata>
): ControllerMethodMetadata {
  return {
    method: "GET",
    handlerArgs: [],
    ...metadata
  };
}
