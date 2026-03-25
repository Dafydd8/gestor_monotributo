import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { create, getMine } from "../controllers/invoice.controller";

const router = Router();

router.post("/", authMiddleware, create);
router.get("/", authMiddleware, getMine);

export default router;