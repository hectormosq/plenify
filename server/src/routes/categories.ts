import { Router } from "express";
import { categories } from "../controllers/categories.js";

const router = Router();

router.get("/categories/", categories);

export default router