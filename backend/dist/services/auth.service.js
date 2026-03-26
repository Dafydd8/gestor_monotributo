"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const registerUser = async ({ cuit, full_name, password, current_category_id, }) => {
    if (!cuit || !full_name || !password) {
        throw new Error("MISSING_FIELDS");
    }
    const existingUser = await db_1.prisma.user.findUnique({
        where: { cuit },
    });
    if (existingUser) {
        throw new Error("USER_ALREADY_EXISTS");
    }
    if (current_category_id) {
        const category = await db_1.prisma.category.findUnique({
            where: { id: current_category_id },
        });
        if (!category) {
            throw new Error("INVALID_CATEGORY");
        }
    }
    const password_hash = await bcrypt_1.default.hash(password, 10);
    const user = await db_1.prisma.user.create({
        data: {
            cuit,
            full_name,
            password_hash,
            current_category_id: current_category_id ?? null,
        },
    });
    const token = jsonwebtoken_1.default.sign({ userId: user.id, cuit: user.cuit }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return {
        message: "Usuario creado correctamente",
        token,
        user: {
            id: user.id,
            cuit: user.cuit,
            full_name: user.full_name,
            current_category_id: user.current_category_id,
        },
    };
};
exports.registerUser = registerUser;
const loginUser = async ({ cuit, password, }) => {
    if (!cuit || !password) {
        throw new Error("MISSING_FIELDS");
    }
    const user = await db_1.prisma.user.findUnique({
        where: { cuit },
    });
    if (!user) {
        throw new Error("INVALID_CREDENTIALS");
    }
    const isPasswordValid = await bcrypt_1.default.compare(password, user.password_hash);
    if (!isPasswordValid) {
        throw new Error("INVALID_CREDENTIALS");
    }
    const token = jsonwebtoken_1.default.sign({ userId: user.id, cuit: user.cuit }, process.env.JWT_SECRET, { expiresIn: "7d" });
    return {
        message: "Login correcto",
        token,
        user: {
            id: user.id,
            cuit: user.cuit,
            full_name: user.full_name,
        },
    };
};
exports.loginUser = loginUser;
