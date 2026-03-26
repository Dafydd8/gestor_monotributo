"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const category_controller_1 = require("../controllers/category.controller");
const router = (0, express_1.Router)();
router.get("/current", category_controller_1.getCurrent);
router.get("/overview", auth_middleware_1.authMiddleware, category_controller_1.getOverview);
exports.default = router;
