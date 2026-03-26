"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = void 0;
const auth_service_1 = require("../services/auth.service");
const login = async (req, res) => {
    try {
        const { cuit, password } = req.body;
        const result = await (0, auth_service_1.loginUser)({ cuit, password });
        return res.status(200).json(result);
    }
    catch (error) {
        if (error.message === "MISSING_FIELDS") {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }
        if (error.message === "INVALID_CREDENTIALS") {
            return res.status(401).json({ error: "Credenciales inválidas" });
        }
        console.error(error);
        return res.status(500).json({ error: "Error iniciando sesión" });
    }
};
exports.login = login;
const register = async (req, res) => {
    try {
        const { cuit, full_name, password, current_category_id } = req.body;
        const result = await (0, auth_service_1.registerUser)({
            cuit,
            full_name,
            password,
            current_category_id,
        });
        return res.status(201).json(result);
    }
    catch (error) {
        if (error.message === "MISSING_FIELDS") {
            return res.status(400).json({ error: "Faltan campos obligatorios" });
        }
        if (error.message === "USER_ALREADY_EXISTS") {
            return res.status(409).json({ error: "Ya existe un usuario con ese CUIT" });
        }
        if (error.message === "INVALID_CATEGORY") {
            return res.status(400).json({ error: "Categoría inválida" });
        }
        console.error(error);
        return res.status(500).json({ error: "Error registrando usuario" });
    }
};
exports.register = register;
