import express from "express";
import request from 'supertest';
import categoriesRouter from "../src/routes/categories.js";
import adminRouter from "../src/routes/admin.js";

const app = express();

app.use("/categories", categoriesRouter);

describe('server routes', () => {
  it('GET /categories should return a default category', async () => {
    const res = await request(app).get('/categories');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        "data": {
          "categories": {
            "f6f84c9f-f93d-4ab8-8ebd-3a759fc2d8dc": {
              "name": "default",
              "color": "#651fff"
            }
          },
          "defaultCategory": "f6f84c9f-f93d-4ab8-8ebd-3a759fc2d8dc"
        }
      }
    ]);
  });
  
});

app.use("/account-movements", categoriesRouter);

describe("server routes", () => {
  it("GET /account-movements should return an empty data array", async () => {
    const res = await request(app).get("/account-movements");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        "data": []
      }
    ]);
  });
});


