import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  updateCurrentUser,
} from "../services/auth.service";

export const login = async (req: Request, res: Response) => {
  try {
    const { cuit, password } = req.body;

    const result = await loginUser({ cuit, password });

    return res.status(200).json(result);
  } catch (error: any) {
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

export const register = async (req: Request, res: Response) => {
  try {
    const { cuit, full_name, password, current_category_id } = req.body;

    const result = await registerUser({
      cuit,
      full_name,
      password,
      current_category_id,
    });

    return res.status(201).json(result);
  } catch (error: any) {
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

export const updateMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId ?? (req as any).user?.id;
    const { full_name, current_category_id } = req.body;

    const result = await updateCurrentUser({
      userId,
      full_name,
      current_category_id,
    });

    return res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return res.status(401).json({ error: "No autorizado" });
    }

    if (error.message === "USER_NOT_FOUND") {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (error.message === "INVALID_FULL_NAME") {
      return res.status(400).json({ error: "Nombre inválido" });
    }

    if (error.message === "INVALID_CATEGORY") {
      return res.status(400).json({ error: "Categoría inválida" });
    }

    if (error.message === "NOTHING_TO_UPDATE") {
      return res.status(400).json({ error: "No hay datos para actualizar" });
    }

    console.error(error);
    return res.status(500).json({ error: "Error actualizando usuario" });
  }
};