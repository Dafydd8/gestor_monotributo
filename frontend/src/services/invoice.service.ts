import { api } from "./api";
import type { Invoice } from "../types/invoice";

type CreateInvoicePayload = {
  invoice_type: string;
  point_of_sale: string;
  invoice_number: string;
  invoice_date: string;
  issue_date?: string;
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
  issue_date: string | null;
  total_amount: number | null;
  client_name: string | null;
  client_cuit: string | null;
  raw_text: string | null;
};

export type ImportedInvoiceRow = ParsedInvoice & {
  local_id: string;
  file_name: string;
  success: boolean;
  error: string | null;
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

  importPdf: async (files: File[]) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await api.post<{
      message: string;
      invoices: ImportedInvoiceRow[];
    }>("/invoices/import-pdf", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  confirmImport: async (payload: CreateInvoicePayload[]) => {
    const response = await api.post<{
      message: string;
      imported_count: number;
      error_count: number;
      invoices: Array<{
        index: number;
        success: boolean;
        invoice: Invoice;
      }>;
      errors: Array<{
        index: number;
        success: false;
        error: string;
      }>;
    }>("/invoices/confirm-import", {
      invoices: payload,
    });

    return response.data;
  },
};