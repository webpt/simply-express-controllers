import { NextFunction, Request, Response } from "express";

import { use } from "./use";
import {
  getControllerMetadata,
  getControllerMethodMetadata,
} from "../metadata";

describe("Middleware Decorators", function() {
  describe("@use on class", function() {
    it("sets the controller metadata", function() {
      @use((req, res, next) => next())
      class TestClass {}

      expect(getControllerMetadata(TestClass)).toBeDefined();
    });

    it("adds the middleware to the metadata", function() {
      const middleware1 = (req: Request, res: Response, next: NextFunction) =>
        next();
      const middleware2 = (req: Request, res: Response, next: NextFunction) =>
        next();
      @use(middleware1, middleware2)
      class TestClass {}

      expect(getControllerMetadata(TestClass)!.middleware).toEqual([
        middleware1,
        middleware2,
      ]);
    });

    it("appends the middleware to existing metadata", function() {
      const middleware1 = (req: Request, res: Response, next: NextFunction) =>
        next();
      const middleware2 = (req: Request, res: Response, next: NextFunction) =>
        next();
      @use(middleware1)
      @use(middleware2)
      class TestClass {}

      expect(getControllerMetadata(TestClass)!.middleware).toEqual([
        middleware2,
        middleware1,
      ]);
    });
  });

  describe("@use on method", function() {
    it("sets the method metadata", function() {
      class TestClass {
        @use((req, res, next) => next())
        testMethod() {}
      }

      const instance = new TestClass();

      expect(getControllerMethodMetadata(instance.testMethod)).toBeDefined();
    });

    it("adds the middleware to the metadata", function() {
      const middleware = (req: Request, res: Response, next: NextFunction) =>
        next();
      class TestClass {
        @use(middleware)
        testMethod() {}
      }

      const instance = new TestClass();

      const metadata = getControllerMethodMetadata(instance.testMethod);

      expect(metadata?.middleware).toEqual([middleware]);
    });

    it("appends the middleware to the existing metadata", function() {
      const middleware1 = (req: Request, res: Response, next: NextFunction) =>
        next();
      const middleware2 = (req: Request, res: Response, next: NextFunction) =>
        next();
      class TestClass {
        @use(middleware1)
        @use(middleware2)
        testMethod() {}
      }

      const instance = new TestClass();

      const metadata = getControllerMethodMetadata(instance.testMethod);

      expect(metadata?.middleware).toEqual([middleware2, middleware1]);
    });
  });
});
