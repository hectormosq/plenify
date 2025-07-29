import express from "express";
import request from "supertest";
import bodyParser from "body-parser";
import { categories } from "../src/controllers/categories.ts";
import { accountMovements } from "../src/controllers/admin.ts";
import { globalErrorHandler, notFoundHandler, jsonErrorHandler } from "../src/middleware/errorHandler.ts";

const createAppWithErrorHandling = () => {
  const app = express();
  app.use(bodyParser.json());
  app.use(jsonErrorHandler);
  
  app.get("/categories", categories);
  app.get("/", accountMovements);
  
  // Test route that simulates controller error
  app.get("/test-controller-error", (req, res, next) => {
    try {
      throw new Error("Controller error");
    } catch (error) {
      next(error);
    }
  });
  
  app.use(notFoundHandler);
  app.use(globalErrorHandler);
  
  return app;
};

describe("Integration tests with error handling", () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = createAppWithErrorHandling();
  });

  describe("Categories endpoint with error handling", () => {
    it("should return categories data successfully", async () => {
      const res = await request(app).get("/categories");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        data: expect.objectContaining({
          categories: expect.any(Object),
          defaultCategory: expect.any(String), 
        }),
      });
    });
  });

  describe("Account movements endpoint with error handling", () => {
    it("should return empty array successfully", async () => {
      const res = await request(app).get("/");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        data: []
      });
    });
  });

  describe("Error scenarios", () => {
    it("should handle controller errors properly", async () => {
      const res = await request(app).get("/test-controller-error");

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: {
          message: "Controller error",
          status: 500,
          timestamp: expect.any(String),
        },
      });
    });

    it("should handle malformed JSON in POST requests", async () => {
      const res = await request(app)
        .post("/categories")
        .set("Content-Type", "application/json")
        .send("{ malformed json");

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        error: {
          message: "Invalid JSON in request body",
          status: 400,
          timestamp: expect.any(String),
        },
      });
    });
  });
});