import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { createInvoice, getInvoicesByUser } from "../services/invoice.service";
import { createInvoiceSchema } from "../schemas/invoice.schema";

export const create = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const parsed = createInvoiceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Datos inválidos",
        details: parsed.error.flatten(),
      });
    }

    const invoice = await createInvoice({
      userId,
      ...parsed.data,
    });

    return res.status(201).json(invoice);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error creando factura" });
  }
};

export const getMine = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const invoices = await getInvoicesByUser(userId);

    return res.status(200).json(invoices);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error obteniendo facturas" });
  }
};