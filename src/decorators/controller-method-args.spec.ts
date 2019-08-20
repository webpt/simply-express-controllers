import {
  body,
  pathParam,
  queryParam,
  expressRequest,
  expressResponse
} from "./controller-method-args";
import {
  getControllerMethodMetadata,
  PathParamControllerMethodArgMetadata,
  QueryParamControllerMethodArgMetadata
} from "../metadata";

describe("Controller Method Argument Decorators", function() {
  describe("@body", function() {
    const required = true;
    const schema = { type: "object" } as const;
    class TestClass {
      testMethod(
        dummyArg: number,
        @body({ required, schema })
        body: object
      ) {}
    }

    it("sets the argument to the body type", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.handlerArgs[1].type).toEqual("body");
    });

    it("sets the request required status", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.request!.required).toEqual(required);
    });

    it("sets the request schema", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.request!.schema).toEqual(schema);
    });
  });

  describe("@pathParam", function() {
    const paramName = "testParam";
    const schema = { type: "object" } as const;
    class TestClass {
      testMethod(
        dummyArg: number,
        @pathParam(paramName, { schema })
        body: object
      ) {}
    }

    it("sets the argument to the pathParam type", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      const argMetadata = metadata
        .handlerArgs[1] as PathParamControllerMethodArgMetadata;
      expect(argMetadata.type).toEqual("pathParam");
    });

    it("sets the paramName", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      const argMetadata = metadata
        .handlerArgs[1] as PathParamControllerMethodArgMetadata;
      expect(argMetadata.paramName).toEqual(paramName);
    });

    it("sets the path param schema", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.pathParams![paramName].schema).toEqual(schema);
    });
  });

  describe("@queryParam", function() {
    const paramName = "testParam";
    const required = true;
    const schema = { type: "object" } as const;
    class TestClass {
      testMethod(
        dummyArg: number,
        @queryParam(paramName, { required, schema })
        body: object
      ) {}
    }

    it("sets the argument to the queryParam type", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      const argMetadata = metadata
        .handlerArgs[1] as QueryParamControllerMethodArgMetadata;
      expect(argMetadata.type).toEqual("queryParam");
    });

    it("sets the paramName", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      const argMetadata = metadata
        .handlerArgs[1] as QueryParamControllerMethodArgMetadata;
      expect(argMetadata.paramName).toEqual(paramName);
    });

    it("sets the path param schema", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.queryParams![paramName].schema).toEqual(schema);
    });

    it("sets the path param required status", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.queryParams![paramName].required).toEqual(required);
    });
  });

  describe("@expressRequest", function() {
    class TestClass {
      testMethod(
        dummyArg: number,
        @expressRequest()
        request: object
      ) {}
    }

    it("sets the argument to the request type", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.handlerArgs[1].type).toEqual("request");
    });
  });

  describe("@expressResponse", function() {
    class TestClass {
      testMethod(
        dummyArg: number,
        @expressResponse()
        response: object
      ) {}
    }

    it("sets the argument to the response type", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.handlerArgs[1].type).toEqual("response");
    });
  });
});
