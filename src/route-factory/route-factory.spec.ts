import { createControllerRoute } from "./route-factory";
import { controller, get, post } from "../decorators";

describe("route-factory", () => {
  describe("createControllerRoute", () => {
    it("should create an Express router for controllers", () => {
      @controller("/api")
      class TestController {
        @get("/test")
        testMethod() {
          return "test";
        }
      }

      const instance = new TestController();
      const router = createControllerRoute(instance);
      
      expect(router).toBeDefined();
      expect(typeof router.use).toBe("function");
      expect(typeof router.get).toBe("function");
      expect(typeof router.post).toBe("function");
    });

    it("should handle multiple controllers", () => {
      @controller("/api/v1")
      class Controller1 {
        @get("/users")
        getUsers() {
          return [];
        }
      }

      @controller("/api/v2")
      class Controller2 {
        @post("/users")
        createUser() {
          return {};
        }
      }

      const router = createControllerRoute(new Controller1(), new Controller2());
      
      expect(router).toBeDefined();
      expect(typeof router.use).toBe("function");
    });

    it("should handle empty controller list", () => {
      const router = createControllerRoute();
      
      expect(router).toBeDefined();
      expect(typeof router.use).toBe("function");
    });

    it("should throw error for controller without @controller decorator", () => {
      class InvalidController {
        @get("/test")
        testMethod() {
          return "test";
        }
      }

      const instance = new InvalidController();
      
      expect(() => {
        createControllerRoute(instance);
      }).toThrow('Controller "InvalidController" does not have a @controller annotation.');
    });
  });
}); 