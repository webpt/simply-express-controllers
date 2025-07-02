import { createSwaggerPaths } from "./swagger-path-factory";
import { controller, get, post, pathParam, queryParam, body } from "../decorators";

describe("swagger-path-factory", () => {
  describe("createSwaggerPaths", () => {
    it("should create swagger paths for simple controller", () => {
      @controller("/api")
      class TestController {
        @get("/users")
        getUsers() {
          return [];
        }

        @post("/users")
        createUser() {
          return {};
        }
      }

      const instance = new TestController();
      const paths = createSwaggerPaths(instance);
      
      expect(paths).toBeDefined();
      expect(typeof paths).toBe("object");
      expect(paths["/api/users"]).toBeDefined();
    });

    it("should handle controller with path parameters", () => {
      @controller("/api")
      class TestController {
        @get("/users/:id")
        getUserById(@pathParam("id") id: string) {
          return { id };
        }
      }

      const instance = new TestController();
      const paths = createSwaggerPaths(instance);
      
      expect(paths).toBeDefined();
      expect(paths["/api/users/{id}"]).toBeDefined();
    });

    it("should handle controller with query parameters", () => {
      @controller("/api")
      class TestController {
        @get("/users")
        getUsers(@queryParam("limit") limit?: number) {
          return [];
        }
      }

      const instance = new TestController();
      const paths = createSwaggerPaths(instance);
      
      expect(paths).toBeDefined();
      expect(paths["/api/users"]).toBeDefined();
    });

    it("should handle controller with request body", () => {
      @controller("/api")
      class TestController {
        @post("/users")
        createUser(@body() userData: any) {
          return userData;
        }
      }

      const instance = new TestController();
      const paths = createSwaggerPaths(instance);
      
      expect(paths).toBeDefined();
      expect(paths["/api/users"]).toBeDefined();
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
        @get("/posts")
        getPosts() {
          return [];
        }
      }

      const instance1 = new Controller1();
      const instance2 = new Controller2();
      const paths = createSwaggerPaths(instance1, instance2);
      
      expect(paths).toBeDefined();
      expect(paths["/api/v1/users"]).toBeDefined();
      expect(paths["/api/v2/posts"]).toBeDefined();
    });

    it("should handle empty controller list", () => {
      const paths = createSwaggerPaths();
      
      expect(paths).toBeDefined();
      expect(typeof paths).toBe("object");
    });

    it("should handle controller with multiple HTTP methods on same path", () => {
      @controller("/api")
      class TestController {
        @get("/users")
        getUsers() {
          return [];
        }

        @post("/users")
        createUser() {
          return {};
        }
      }

      const instance = new TestController();
      const paths = createSwaggerPaths(instance);
      
      expect(paths).toBeDefined();
      expect(paths["/api/users"]).toBeDefined();
      expect((paths["/api/users"] as any).get).toBeDefined();
      expect((paths["/api/users"] as any).post).toBeDefined();
    });
  });
}); 