import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getOverview, getCurrent } from "../controllers/category.controller";

const router = Router();

router.get("/current", getCurrent);
router.get("/overview", authMiddleware, getOverview);

export default router;