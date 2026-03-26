"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const invoice_controller_1 = require("../controllers/invoice.controller");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
router.post("/", auth_middleware_1.authMiddleware, invoice_controller_1.create);
router.get("/", auth_middleware_1.authMiddleware, invoice_controller_1.getMine);
router.post("/import-pdf", auth_middleware_1.authMiddleware, upload.single("file"), invoice_controller_1.importPdf);
router.post("/confirm-import", auth_middleware_1.authMiddleware, invoice_controller_1.confirmImport);
router.put("/:id", auth_middleware_1.authMiddleware, invoice_controller_1.update);
router.delete("/:id", auth_middleware_1.authMiddleware, invoice_controller_1.remove);
exports.default = router;
