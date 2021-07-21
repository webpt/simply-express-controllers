import {
  body,
  pathParam,
  queryParam,
  expressRequest,
  expressResponse,
  createRequestDecorator,
} from "./controller-method-args";
import {
  CustomValueFactoryControllerMethodArgMetadata,
  getControllerMethodMetadata,
  PathParamControllerMethodArgMetadata,
  QueryParamControllerMethodArgMetadata,
} from "../metadata";
import { Request } from "express";

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
      expect(metadata.handlerArgs![1].type).toEqual("body");
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
      const argMetadata = metadata.handlerArgs![1] as PathParamControllerMethodArgMetadata;
      expect(argMetadata.type).toEqual("pathParam");
    });

    it("sets the paramName", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      const argMetadata = metadata.handlerArgs![1] as PathParamControllerMethodArgMetadata;
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
      const argMetadata = metadata.handlerArgs![1] as QueryParamControllerMethodArgMetadata;
      expect(argMetadata.type).toEqual("queryParam");
    });

    it("sets the paramName", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      const argMetadata = metadata.handlerArgs![1] as QueryParamControllerMethodArgMetadata;
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

  describe("createRequestDecorator", function() {
    describe("no options", function() {
      const valueFactory = () => 42;
      const customDecorator = createRequestDecorator(valueFactory);

      class TestClass {
        testMethod(
          @customDecorator()
          dummyArg: number
        ) {}
      }

      it("sets the parameter to a custom request value", function() {
        const metadata = getControllerMethodMetadata(
          TestClass.prototype["testMethod"]
        )!;
        expect(metadata.handlerArgs![0].type).toEqual("custom-value-factory");
      });

      it("sets the value factory", function() {
        const metadata = getControllerMethodMetadata(
          TestClass.prototype["testMethod"]
        )!;
        expect(
          (metadata.handlerArgs![0] as CustomValueFactoryControllerMethodArgMetadata)
            .valueFactory
        ).toEqual(valueFactory);
      });
    });

    describe("with options", function() {
      it("sets the options", function() {
        const valueFactory = (req: Request, option: string) => 42;
        const customDecorator = createRequestDecorator(valueFactory);

        const optionValue = "hello world";

        class TestClass {
          testMethod(
            @customDecorator(optionValue)
            dummyArg: number
          ) {}
        }

        const metadata = getControllerMethodMetadata(
          TestClass.prototype["testMethod"]
        )!;
        expect(
          (metadata.handlerArgs![0] as CustomValueFactoryControllerMethodArgMetadata)
            .options
        ).toEqual(optionValue);
      });
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
      expect(metadata.handlerArgs![1].type).toEqual("request");
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
      expect(metadata.handlerArgs![1].type).toEqual("response");
    });
  });
});
