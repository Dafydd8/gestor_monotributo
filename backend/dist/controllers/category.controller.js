"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrent = exports.getOverview = void 0;
const category_service_1 = require("../services/category.service");
const getOverview = async (req, res) => {
    try {
        const userId = req.user.userId;
        const projectedIpc = Number(req.query.projectedIpc ?? 15);
        const data = await (0, category_service_1.getCategoriesOverview)(userId, projectedIpc);
        return res.status(200).json(data);
    }
    catch (error) {
        if (error.message === "NO_CATEGORIES") {
            return res.status(404).json({ error: "No hay categorías cargadas" });
        }
        console.error(error);
        return res.status(500).json({ error: "Error obteniendo categorías" });
    }
};
exports.getOverview = getOverview;
const getCurrent = async (_req, res) => {
    try {
        const categories = await (0, category_service_1.getCurrentCategories)();
        return res.status(200).json(categories);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error obteniendo categorías vigentes" });
    }
};
exports.getCurrent = getCurrent;
