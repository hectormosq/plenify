import { Router } from "express";
import { accountMovements } from "../controllers/admin.js";

const router = Router();

router.get("/", accountMovements);

export default router