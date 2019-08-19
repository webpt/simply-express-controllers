import { controller } from "./controller";
import { getControllerMetadata } from "../metadata";

describe("Controller Decorators", function() {
  describe("@controller", function() {
    it("sets the controller metadata", function() {
      @controller("/")
      class TestClass {}

      expect(getControllerMetadata(TestClass)).toBeDefined();
    });

    it("sets the controller root path", function() {
      const path = "/foo/bar";

      @controller(path)
      class TestClass {}

      expect(getControllerMetadata(TestClass)!.path).toEqual(path);
    });
  });
});
