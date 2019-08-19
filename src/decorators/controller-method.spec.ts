import {
  get,
  head,
  post,
  put,
  del,
  patch,
  method,
  response
} from "./controller-method";
import { getControllerMethodMetadata } from "../metadata";

describe("Controller Method Decorators", function() {
  describe("@get", function() {
    const path = "/foo/bar";
    class TestClass {
      @get(path)
      testMethod() {}
    }

    it("sets the http method", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.method).toEqual("GET");
    });

    it("sets the path", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.path).toEqual(path);
    });
  });

  describe("@head", function() {
    const path = "/foo/bar";
    class TestClass {
      @head(path)
      testMethod() {}
    }

    it("sets the http method", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.method).toEqual("HEAD");
    });

    it("sets the path", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.path).toEqual(path);
    });
  });

  describe("@post", function() {
    const path = "/foo/bar";
    class TestClass {
      @post(path)
      testMethod() {}
    }

    it("sets the http method", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.method).toEqual("POST");
    });

    it("sets the path", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.path).toEqual(path);
    });
  });

  describe("@put", function() {
    const path = "/foo/bar";
    class TestClass {
      @put(path)
      testMethod() {}
    }

    it("sets the http method", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.method).toEqual("PUT");
    });

    it("sets the path", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.path).toEqual(path);
    });
  });

  describe("@del", function() {
    const path = "/foo/bar";
    class TestClass {
      @del(path)
      testMethod() {}
    }

    it("sets the http method", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.method).toEqual("DELETE");
    });

    it("sets the path", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.path).toEqual(path);
    });
  });

  describe("@patch", function() {
    const path = "/foo/bar";
    class TestClass {
      @patch(path)
      testMethod() {}
    }

    it("sets the http method", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.method).toEqual("PATCH");
    });

    it("sets the path", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.path).toEqual(path);
    });
  });

  describe("@method", function() {
    const httpMethod = "TRACE";
    const path = "/foo/bar";
    class TestClass {
      @method(httpMethod, path)
      testMethod() {}
    }

    it("sets the http method", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.method).toEqual(httpMethod);
    });

    it("sets the path", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.path).toEqual(path);
    });
  });

  describe("@response", function() {
    const code = 201;
    const description = "Widget Created";
    const schema = {
      type: "object"
    } as const;

    class TestClass {
      @response(code, { description, schema })
      testMethod() {}
    }

    it("sets the response to the appropriate code", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.responses![code]).toBeDefined();
    });

    it("sets the result description", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.responses![code].description).toEqual(description);
    });

    it("sets the result schema", function() {
      const metadata = getControllerMethodMetadata(
        TestClass.prototype["testMethod"]
      )!;
      expect(metadata.responses![code].schema).toEqual(schema);
    });
  });
});
