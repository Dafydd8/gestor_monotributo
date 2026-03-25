import { prisma } from "../db";

type CreateInvoiceInput = {
  userId: number;
  invoice_type: string;
  point_of_sale: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
};

export const createInvoice = async ({
  userId,
  invoice_type,
  point_of_sale,
  invoice_number,
  invoice_date,
  total_amount,
}: CreateInvoiceInput) => {
  const invoice = await prisma.invoice.create({
    data: {
      user_id: userId,
      invoice_type,
      point_of_sale,
      invoice_number,
      invoice_date: new Date(invoice_date),
      total_amount,
    },
  });

  return invoice;
};

export const getInvoicesByUser = async (userId: number) => {
  return prisma.invoice.findMany({
    where: { user_id: userId },
    orderBy: { invoice_date: "desc" },
  });
};