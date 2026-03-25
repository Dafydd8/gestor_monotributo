import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../middlewares/auth.middleware";
import { create, getMine, importPdf, confirmImport } from "../controllers/invoice.controller";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", authMiddleware, create);
router.get("/", authMiddleware, getMine);
router.post("/import-pdf", authMiddleware, upload.single("file"), importPdf);
router.post("/confirm-import", authMiddleware, confirmImport);

export default router;