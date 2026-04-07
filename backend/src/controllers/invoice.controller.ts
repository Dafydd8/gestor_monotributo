import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  createInvoice,
  getInvoicesByUser,
  updateInvoice,
  deleteInvoice,
} from "../services/invoice.service";
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
    const files = req.files as Express.Multer.File[] | undefined;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "Falta al menos un archivo PDF" });
    }

    const results = await Promise.all(
      files.map(async (file, index) => {
        try {
          const parsed = await parseInvoicePdf(file.buffer);

          return {
            local_id: String(index + 1),
            file_name: file.originalname,
            success: true,
            error: null,
            ...parsed,
          };
        } catch (error: any) {
          return {
            local_id: String(index + 1),
            file_name: file.originalname,
            success: false,
            error: error?.message || "No se pudo procesar el PDF",
            invoice_type: null,
            point_of_sale: null,
            invoice_number: null,
            invoice_date: null,
            total_amount: null,
            client_name: null,
            client_cuit: null,
            raw_text: null,
          };
        }
      })
    );

    return res.status(200).json({
      message: "PDFs procesados",
      invoices: results,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error procesando PDFs" });
  }
};

export const confirmImport = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user!.userId;

    type InvoiceInput = {
      invoice_type: string;
      point_of_sale: string;
      invoice_number: string;
      invoice_date: string;
      total_amount: number;
      client_name?: string;
      client_cuit?: string;
    };

const invoicesInput: InvoiceInput[] = Array.isArray(req.body?.invoices)
  ? req.body.invoices
  : [req.body];

    if (!invoicesInput.length) {
      return res.status(400).json({ error: "No hay facturas para importar" });
    }

    const validationResults = invoicesInput.map((invoice, index) => {
      const parsed = createInvoiceSchema.safeParse(invoice);

      return {
        index,
        success: parsed.success,
        data: parsed.success ? parsed.data : null,
        error: parsed.success ? null : parsed.error.flatten(),
      };
    });

    const invalidRows = validationResults.filter((row) => !row.success);

    if (invalidRows.length > 0) {
      return res.status(400).json({
        error: "Hay facturas con datos inválidos",
        details: invalidRows.map((row) => ({
          index: row.index,
          error: row.error,
        })),
      });
    }

    const createdInvoices = [];
    const rowErrors = [];

    for (let i = 0; i < validationResults.length; i++) {
      const row = validationResults[i];

      try {
        const invoice = await createInvoice({
          userId,
          ...row.data!,
        });

        createdInvoices.push({
          index: i,
          success: true,
          invoice,
        });
      } catch (error: any) {
        if (error.code === "P2002") {
          rowErrors.push({
            index: i,
            success: false,
            error: "La factura ya existe",
          });
          continue;
        }

        throw error;
      }
    }

    return res.status(201).json({
      message:
        rowErrors.length > 0
          ? "Importación parcial completada"
          : "Facturas importadas correctamente",
      imported_count: createdInvoices.length,
      error_count: rowErrors.length,
      invoices: createdInvoices,
      errors: rowErrors,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Error confirmando importación" });
  }
};

export const update = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const invoiceId = Number(req.params.id);

    const parsed = createInvoiceSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        error: "Datos inválidos",
        details: parsed.error.flatten(),
      });
    }

    const invoice = await updateInvoice({
      invoiceId,
      userId,
      ...parsed.data,
    });

    return res.status(200).json({
      message: "Factura actualizada correctamente",
      invoice,
    });
  } catch (error: any) {
    if (error.message === "INVOICE_NOT_FOUND") {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    if (error.code === "P2002") {
      return res.status(409).json({ error: "Ya existe una factura con esos datos" });
    }

    console.error(error);
    return res.status(500).json({ error: "Error actualizando factura" });
  }
};

export const remove = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const invoiceId = Number(req.params.id);

    await deleteInvoice({ invoiceId, userId });

    return res.status(200).json({
      message: "Factura eliminada correctamente",
    });
  } catch (error: any) {
    if (error.message === "INVOICE_NOT_FOUND") {
      return res.status(404).json({ error: "Factura no encontrada" });
    }

    console.error(error);
    return res.status(500).json({ error: "Error eliminando factura" });
  }
};