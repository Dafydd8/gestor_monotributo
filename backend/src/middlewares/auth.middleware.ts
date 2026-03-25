import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export type JwtPayload = {
  userId: number;
  cuit: string;
};

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Token faltante" });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: "No autorizado" });
  }
};