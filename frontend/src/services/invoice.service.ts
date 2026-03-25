import { api } from "./api";
import type { Invoice } from "../types/invoice";

type CreateInvoicePayload = {
  invoice_type: string;
  point_of_sale: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  client_name?: string;
  client_cuit?: string;
};

type UpdateInvoicePayload = CreateInvoicePayload;

export type ParsedInvoice = {
  invoice_type: string | null;
  point_of_sale: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  total_amount: number | null;
  client_name: string | null;
  client_cuit: string | null;
  raw_text: string;
};

export const invoiceService = {
  getMine: async () => {
    const response = await api.get<Invoice[]>("/invoices");
    return response.data;
  },

  create: async (payload: CreateInvoicePayload) => {
    const response = await api.post<Invoice>("/invoices", payload);
    return response.data;
  },

  update: async (id: number, payload: UpdateInvoicePayload) => {
    const response = await api.put<{ message: string; invoice: Invoice }>(
      `/invoices/${id}`,
      payload
    );
    return response.data;
  },

  remove: async (id: number) => {
    const response = await api.delete<{ message: string }>(`/invoices/${id}`);
    return response.data;
  },

  importPdf: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<{
      message: string;
      parsed: ParsedInvoice;
    }>("/invoices/import-pdf", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  confirmImport: async (payload: CreateInvoicePayload) => {
    const response = await api.post<{ message: string; invoice: Invoice }>(
      "/invoices/confirm-import",
      payload
    );
    return response.data;
  },
};