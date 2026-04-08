import { prisma } from "../db";

const parseLocalDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

type CreateInvoiceInput = {
  userId: number;
  invoice_type: string;
  point_of_sale: string;
  invoice_number: string;
  invoice_date: string;
  issue_date?: string | null;
  total_amount: number;
  client_name?: string | null;
  client_cuit?: string | null;
};

export const createInvoice = async ({
  userId,
  invoice_type,
  point_of_sale,
  invoice_number,
  invoice_date,
  issue_date,
  total_amount,
  client_name,
  client_cuit,
}: CreateInvoiceInput) => {
  return prisma.invoice.create({
    data: {
      user_id: userId,
      invoice_type,
      point_of_sale,
      invoice_number,
      invoice_date: parseLocalDate(invoice_date),
      issue_date: issue_date ? parseLocalDate(issue_date) : null,
      total_amount,
      client_name,
      client_cuit,
    },
  });
};

export const getInvoicesByUser = async (userId: number) => {
  return prisma.invoice.findMany({
    where: { user_id: userId },
    orderBy: [
      { issue_date: "desc" },
      { invoice_date: "desc" },
    ],
  });
};

export const updateInvoice = async ({
  invoiceId,
  userId,
  invoice_type,
  point_of_sale,
  invoice_number,
  invoice_date,
  issue_date,
  total_amount,
  client_name,
  client_cuit,
}: {
  invoiceId: number;
  userId: number;
  invoice_type: string;
  point_of_sale: string;
  invoice_number: string;
  invoice_date: string;
  issue_date?: string | null;
  total_amount: number;
  client_name?: string | null;
  client_cuit?: string | null;
}) => {
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      user_id: userId,
    },
  });

  if (!existingInvoice) {
    throw new Error("INVOICE_NOT_FOUND");
  }

  return prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      invoice_type,
      point_of_sale,
      invoice_number,
      invoice_date: parseLocalDate(invoice_date),
      issue_date: issue_date ? parseLocalDate(issue_date) : null,
      total_amount,
      client_name,
      client_cuit,
    },
  });
};

export const deleteInvoice = async ({
  invoiceId,
  userId,
}: {
  invoiceId: number;
  userId: number;
}) => {
  const existingInvoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      user_id: userId,
    },
  });

  if (!existingInvoice) {
    throw new Error("INVOICE_NOT_FOUND");
  }

  return prisma.invoice.delete({
    where: { id: invoiceId },
  });
};