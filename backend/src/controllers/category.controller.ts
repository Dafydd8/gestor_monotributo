import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { getCategoriesOverview, getCurrentCategories } from "../services/category.service";

export const getOverview = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.userId;
    const projectedIpc = Number(req.query.projectedIpc ?? 15);

    const data = await getCategoriesOverview(userId, projectedIpc);

    return res.status(200).json(data);
  } catch (error: any) {
    if (error.message === "NO_CATEGORIES") {
      return res.status(404).json({ error: "No hay categorías cargadas" });
    }

    console.error(error);
    return res.status(500).json({ error: "Error obteniendo categorías" });
  }
};

export const getCurrent = async (_req: Request, res: Response) => {
  try {
    const categories = await getCurrentCategories();
    return res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error obteniendo categorías vigentes" });
  }
};