import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getSummary } from "../controllers/dashboard.controller";

const router = Router();

router.get("/summary", authMiddleware, getSummary);

export default router;  