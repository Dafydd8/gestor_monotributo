"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteInvoice = exports.updateInvoice = exports.getInvoicesByUser = exports.createInvoice = void 0;
const db_1 = require("../db");
const createInvoice = async ({ userId, invoice_type, point_of_sale, invoice_number, invoice_date, total_amount, client_name, client_cuit, }) => {
    return db_1.prisma.invoice.create({
        data: {
            user_id: userId,
            invoice_type,
            point_of_sale,
            invoice_number,
            invoice_date: new Date(invoice_date),
            total_amount,
            client_name,
            client_cuit,
        },
    });
};
exports.createInvoice = createInvoice;
const getInvoicesByUser = async (userId) => {
    return db_1.prisma.invoice.findMany({
        where: { user_id: userId },
        orderBy: { invoice_date: "desc" },
    });
};
exports.getInvoicesByUser = getInvoicesByUser;
const updateInvoice = async ({ invoiceId, userId, invoice_type, point_of_sale, invoice_number, invoice_date, total_amount, client_name, client_cuit, }) => {
    const existingInvoice = await db_1.prisma.invoice.findFirst({
        where: {
            id: invoiceId,
            user_id: userId,
        },
    });
    if (!existingInvoice) {
        throw new Error("INVOICE_NOT_FOUND");
    }
    return db_1.prisma.invoice.update({
        where: { id: invoiceId },
        data: {
            invoice_type,
            point_of_sale,
            invoice_number,
            invoice_date: new Date(invoice_date),
            total_amount,
            client_name,
            client_cuit,
        },
    });
};
exports.updateInvoice = updateInvoice;
const deleteInvoice = async ({ invoiceId, userId, }) => {
    const existingInvoice = await db_1.prisma.invoice.findFirst({
        where: {
            id: invoiceId,
            user_id: userId,
        },
    });
    if (!existingInvoice) {
        throw new Error("INVOICE_NOT_FOUND");
    }
    return db_1.prisma.invoice.delete({
        where: { id: invoiceId },
    });
};
exports.deleteInvoice = deleteInvoice;
