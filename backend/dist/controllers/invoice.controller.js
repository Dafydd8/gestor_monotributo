"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.confirmImport = exports.importPdf = exports.getMine = exports.create = void 0;
const invoice_service_1 = require("../services/invoice.service");
const invoice_schema_1 = require("../schemas/invoice.schema");
const pdf_import_service_1 = require("../services/pdf-import.service");
const create = async (req, res) => {
    try {
        const userId = req.user.userId;
        const parsed = invoice_schema_1.createInvoiceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Datos inválidos",
                details: parsed.error.flatten(),
            });
        }
        const invoice = await (0, invoice_service_1.createInvoice)({
            userId,
            ...parsed.data,
        });
        return res.status(201).json(invoice);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error creando factura" });
    }
};
exports.create = create;
const getMine = async (req, res) => {
    try {
        const userId = req.user.userId;
        const invoices = await (0, invoice_service_1.getInvoicesByUser)(userId);
        return res.status(200).json(invoices);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error obteniendo facturas" });
    }
};
exports.getMine = getMine;
const importPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "Falta el archivo PDF" });
        }
        const parsed = await (0, pdf_import_service_1.parseInvoicePdf)(req.file.buffer);
        return res.status(200).json({
            message: "PDF procesado",
            parsed,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Error procesando PDF" });
    }
};
exports.importPdf = importPdf;
const confirmImport = async (req, res) => {
    try {
        const userId = req.user.userId;
        const parsed = invoice_schema_1.createInvoiceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Datos inválidos",
                details: parsed.error.flatten(),
            });
        }
        const invoice = await (0, invoice_service_1.createInvoice)({
            userId,
            ...parsed.data,
        });
        return res.status(201).json({
            message: "Factura importada correctamente",
            invoice,
        });
    }
    catch (error) {
        if (error.code === "P2002") {
            return res.status(409).json({ error: "La factura ya existe" });
        }
        console.error(error);
        return res.status(500).json({ error: "Error confirmando importación" });
    }
};
exports.confirmImport = confirmImport;
const update = async (req, res) => {
    try {
        const userId = req.user.userId;
        const invoiceId = Number(req.params.id);
        const parsed = invoice_schema_1.createInvoiceSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                error: "Datos inválidos",
                details: parsed.error.flatten(),
            });
        }
        const invoice = await (0, invoice_service_1.updateInvoice)({
            invoiceId,
            userId,
            ...parsed.data,
        });
        return res.status(200).json({
            message: "Factura actualizada correctamente",
            invoice,
        });
    }
    catch (error) {
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
exports.update = update;
const remove = async (req, res) => {
    try {
        const userId = req.user.userId;
        const invoiceId = Number(req.params.id);
        await (0, invoice_service_1.deleteInvoice)({ invoiceId, userId });
        return res.status(200).json({
            message: "Factura eliminada correctamente",
        });
    }
    catch (error) {
        if (error.message === "INVOICE_NOT_FOUND") {
            return res.status(404).json({ error: "Factura no encontrada" });
        }
        console.error(error);
        return res.status(500).json({ error: "Error eliminando factura" });
    }
};
exports.remove = remove;
