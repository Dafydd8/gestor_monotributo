import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { getDashboardSummary } from "../services/dashboard.service";

export const getSummary = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.userId;
    const estimatedIpc = Number(req.query.estimatedIpc ?? 15);

    const summary = await getDashboardSummary(userId, estimatedIpc);

    return res.status(200).json(summary);
  } catch (error: any) {
    if (error.message === "NO_CATEGORIES_FOR_CURRENT_CUT") {
        return res
            .status(404)
            .json({ error: "No hay categorías vigentes para el corte actual" });
    }

    console.error(error);
    return res.status(500).json({ error: "Error obteniendo dashboard" });
  }
};