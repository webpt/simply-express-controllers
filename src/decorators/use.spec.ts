import { NextFunction, Request, Response } from "express";

import { use } from "./use";
import { getControllerMetadata } from "../metadata";

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
});
