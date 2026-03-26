"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSummary = void 0;
const dashboard_service_1 = require("../services/dashboard.service");
const getSummary = async (req, res) => {
    try {
        const userId = req.user.userId;
        const estimatedIpc = Number(req.query.estimatedIpc ?? 15);
        const summary = await (0, dashboard_service_1.getDashboardSummary)(userId, estimatedIpc);
        return res.status(200).json(summary);
    }
    catch (error) {
        if (error.message === "NO_CATEGORIES_FOR_CURRENT_CUT") {
            return res
                .status(404)
                .json({ error: "No hay categorías vigentes para el corte actual" });
        }
        console.error(error);
        return res.status(500).json({ error: "Error obteniendo dashboard" });
    }
};
exports.getSummary = getSummary;
