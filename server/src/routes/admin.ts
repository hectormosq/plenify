import { Router } from "express";
import { accountMovements } from "../controllers/admin.ts";

const router = Router();

router.get("/", accountMovements);

export default router