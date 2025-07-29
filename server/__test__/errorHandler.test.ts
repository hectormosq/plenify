import express from "express";
import request from "supertest";
import bodyParser from "body-parser";
import { globalErrorHandler, notFoundHandler, jsonErrorHandler } from "../src/middleware/errorHandler.ts";

const createTestApp = () => {
  const app = express();
  app.use(bodyParser.json());
  app.use(jsonErrorHandler);
  
  // Test route that throws an error
  app.get("/test-error", (req, res, next) => {
    const error = new Error("Test error message");
    (error as any).status = 500;
    next(error);
  });
  
  // Test route that throws an error with custom status
  app.get("/test-custom-error", (req, res, next) => {
    const error = new Error("Custom error message");
    (error as any).status = 422;
    next(error);
  });
  
  app.use(notFoundHandler);
  app.use(globalErrorHandler);
  
  return app;
};

describe("Error Handling Middleware", () => {
  let app: express.Application;
  
  beforeEach(() => {
    app = createTestApp();
  });

  describe("Global Error Handler", () => {
    it("should handle errors with default 500 status", async () => {
      const res = await request(app).get("/test-error");
      
      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: {
          message: "Test error message",
          status: 500,
          timestamp: expect.any(String),
        },
      });
    });

    it("should handle errors with custom status", async () => {
      const res = await request(app).get("/test-custom-error");
      
      expect(res.status).toBe(422);
      expect(res.body).toEqual({
        error: {
          message: "Custom error message",
          status: 422,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe("404 Handler", () => {
    it("should return 404 for non-existent routes", async () => {
      const res = await request(app).get("/non-existent-route");
      
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: {
          message: "Route GET /non-existent-route not found",
          status: 404,
          timestamp: expect.any(String),
        },
      });
    });
    
    it("should return 404 for POST requests to non-existent routes", async () => {
      const res = await request(app).post("/non-existent-route");
      
      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: {
          message: "Route POST /non-existent-route not found",
          status: 404,
          timestamp: expect.any(String),
        },
      });
    });
  });

  describe("JSON Error Handler", () => {
    it("should handle malformed JSON requests", async () => {
      const res = await request(app)
        .post("/test-error")
        .set("Content-Type", "application/json")
        .send("{ invalid json }");
      
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