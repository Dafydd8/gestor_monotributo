"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInvoiceSchema = void 0;
const zod_1 = require("zod");
exports.createInvoiceSchema = zod_1.z.object({
    invoice_type: zod_1.z.string().trim().min(1, "invoice_type es obligatorio"),
    point_of_sale: zod_1.z.string().trim().min(1, "point_of_sale es obligatorio"),
    invoice_number: zod_1.z.string().trim().min(1, "invoice_number es obligatorio"),
    invoice_date: zod_1.z.string().date("invoice_date debe ser una fecha válida (YYYY-MM-DD)"),
    total_amount: zod_1.z.number().positive("total_amount debe ser mayor a 0"),
    client_name: zod_1.z.string().trim().min(1).nullable().optional(),
    client_cuit: zod_1.z.string().trim().min(1).nullable().optional(),
});
