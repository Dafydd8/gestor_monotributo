import { Router } from "express";
import { register, login, updateMe } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.put("/me", authMiddleware, updateMe);

export default router;