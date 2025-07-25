import { Router } from "express";
import { categories } from "../controllers/categories.ts";

const router = Router();

router.get("/categories/", categories);

export default router