import { z } from "zod";

export const createInvoiceSchema = z.object({
  invoice_type: z.string().trim().min(1, "invoice_type es obligatorio"),
  point_of_sale: z.string().trim().min(1, "point_of_sale es obligatorio"),
  invoice_number: z.string().trim().min(1, "invoice_number es obligatorio"),
  invoice_date: z.string().date("invoice_date debe ser una fecha válida (YYYY-MM-DD)"),
  total_amount: z.number().positive("total_amount debe ser mayor a 0"),
});