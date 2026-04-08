import { useEffect, useState } from "react";
import type { Invoice } from "../types/invoice";
import {
  invoiceService,
  type ImportedInvoiceRow,
} from "../services/invoice.service";
import InvoiceTable from "../components/InvoiceTable";
import InvoiceForm from "../components/InvoiceForm";
import PdfImportForm from "../components/PdfImportForm";

type FormMode = "none" | "create" | "import" | "edit";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formMode, setFormMode] = useState<FormMode>("none");
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await invoiceService.getMine();
      setInvoices(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error cargando facturas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreateInvoice = async (values: {
    invoice_type: string;
    point_of_sale: string;
    invoice_number: string;
    invoice_date: string;
    issue_date?: string;
    total_amount: number;
    client_name?: string;
    client_cuit?: string;
  }) => {
    await invoiceService.create(values);
    await fetchInvoices();
    setFormMode("none");
  };

  const handleUpdateInvoice = async (values: {
    invoice_type: string;
    point_of_sale: string;
    invoice_number: string;
    invoice_date: string;
    issue_date?: string;
    total_amount: number;
    client_name?: string;
    client_cuit?: string;
  }) => {
    if (!editingInvoice) return;
    await invoiceService.update(editingInvoice.id, values);
    await fetchInvoices();
    setEditingInvoice(null);
    setFormMode("none");
  };

  const handleDeleteInvoice = async (invoice: Invoice) => {
    const confirmed = window.confirm(
      `¿Seguro que querés eliminar la factura ${invoice.point_of_sale}-${invoice.invoice_number}?`
    );

    if (!confirmed) return;

    await invoiceService.remove(invoice.id);
    await fetchInvoices();
  };

  const handleImportPdf = async (
    files: File[]
  ): Promise<ImportedInvoiceRow[]> => {
    const result = await invoiceService.importPdf(files);
    return result.invoices;
  };

  const handleConfirmImport = async (
    values: {
      invoice_type: string;
      point_of_sale: string;
      invoice_number: string;
      invoice_date: string;
      issue_date?: string;
      total_amount: number;
      client_name?: string;
      client_cuit?: string;
    }[]
  ) => {
    const result = await invoiceService.confirmImport(values);
    await fetchInvoices();
    return result;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Facturas</h1>
          <p className="mt-1 text-sm text-gray-600">
            Consultá, creá, importá, editá y eliminá facturas.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setEditingInvoice(null);
              setFormMode(formMode === "create" ? "none" : "create");
            }}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white"
          >
            {formMode === "create" ? "Cerrar manual" : "Agregar manual"}
          </button>

          <button
            onClick={() => {
              setEditingInvoice(null);
              setFormMode(formMode === "import" ? "none" : "import");
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          >
            {formMode === "import" ? "Cerrar importación" : "Importar PDF"}
          </button>
        </div>
      </div>

      {formMode === "create" && (
        <InvoiceForm onSubmit={handleCreateInvoice} />
      )}

      {formMode === "import" && (
        <PdfImportForm
          onImport={handleImportPdf}
          onConfirm={handleConfirmImport}
        />
      )}

      {formMode === "edit" && editingInvoice && (
        <InvoiceForm
          mode="edit"
          initialValues={{
            invoice_type: editingInvoice.invoice_type,
            point_of_sale: editingInvoice.point_of_sale,
            invoice_number: editingInvoice.invoice_number,
            invoice_date: editingInvoice.invoice_date.slice(0, 10),
            issue_date: editingInvoice.issue_date?.slice(0, 10) ?? "",
            total_amount: String(editingInvoice.total_amount),
            client_name: editingInvoice.client_name ?? "",
            client_cuit: editingInvoice.client_cuit ?? "",
          }}
          onSubmit={handleUpdateInvoice}
          onCancel={() => {
            setEditingInvoice(null);
            setFormMode("none");
          }}
        />
      )}

      {loading && <div className="text-sm text-gray-500">Cargando facturas...</div>}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && (
        <InvoiceTable
          invoices={invoices}
          onEdit={(invoice) => {
            setEditingInvoice(invoice);
            setFormMode("edit");
          }}
          onDelete={handleDeleteInvoice}
        />
      )}
    </div>
  );
}