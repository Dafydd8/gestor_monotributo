import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { createInvoice, getInvoicesByUser } from "../services/invoice.service";
import { createInvoiceSchema } from "../schemas/invoice.schema";
import { parseInvoicePdf } from "../services/pdf-import.service";

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

export const importPdf = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Falta el archivo PDF" });
    }

    const parsed = await parseInvoicePdf(req.file.buffer);

    return res.status(200).json({
      message: "PDF procesado",
      parsed,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error procesando PDF" });
  }
};

export const confirmImport = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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

    return res.status(201).json({
      message: "Factura importada correctamente",
      invoice,
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "La factura ya existe" });
    }

    console.error(error);
    return res.status(500).json({ error: "Error confirmando importación" });
  }
};