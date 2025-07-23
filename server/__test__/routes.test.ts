import express from "express";
import request from "supertest";
import bodyParser from "body-parser";
import { categories } from "../src/controllers/categories.ts";
import { accountMovements } from "../src/controllers/admin.ts";

const app = express();
app.use(bodyParser.json());
app.get("/categories", categories);
app.get("/", accountMovements);

describe("test categories routes", () => {
  it("should return a valid categories structure", async () => {
    const res = await request(app).get("/categories");

    expect(res.status).toBe(200);
    
    expect(res.body).toEqual({
      data: expect.objectContaining({
        categories: expect.any(Object),
        defaultCategory: expect.any(String), 
      }),
    });

    const categories = res.body.data.categories;
    expect(Object.keys(categories).length).toBeGreaterThan(0);

    for (const [id, category] of Object.entries(categories)) {
      expect(id).toEqual(expect.any(String));
      expect(category).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          color: expect.any(String),
        })
      );
    }
  });
});

describe("test Account Movementents routes", () => {
  it("should return an empty array for account movements", async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200)

    expect(res.body).toEqual({
      data: []
    })
  })
})