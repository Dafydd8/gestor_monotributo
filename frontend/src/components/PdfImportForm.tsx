import { useRef, useState } from "react";
import type { ParsedInvoice } from "../services/invoice.service";

type ConfirmValues = {
  invoice_type: string;
  point_of_sale: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  client_name?: string;
  client_cuit?: string;
};

type Props = {
  onImport: (file: File) => Promise<ParsedInvoice>;
  onConfirm: (values: ConfirmValues) => Promise<void>;
};

export default function PdfImportForm({ onImport, onConfirm }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedInvoice | null>(null);
  const [loadingImport, setLoadingImport] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [error, setError] = useState("");

  const [formValues, setFormValues] = useState({
    invoice_type: "",
    point_of_sale: "",
    invoice_number: "",
    invoice_date: "",
    total_amount: "",
    client_name: "",
    client_cuit: "",
  });

  const handleImport = async () => {
    if (!selectedFile) {
      setError("Seleccioná un PDF.");
      return;
    }

    try {
      setError("");
      setLoadingImport(true);

      const result = await onImport(selectedFile);
      setParsed(result);

      setFormValues({
        invoice_type: result.invoice_type ?? "",
        point_of_sale: result.point_of_sale ?? "",
        invoice_number: result.invoice_number ?? "",
        invoice_date: result.invoice_date ?? "",
        total_amount: result.total_amount ? String(result.total_amount) : "",
        client_name: result.client_name ?? "",
        client_cuit: result.client_cuit ?? "",
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error procesando PDF");
    } finally {
      setLoadingImport(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formValues.invoice_type ||
      !formValues.point_of_sale ||
      !formValues.invoice_number ||
      !formValues.invoice_date ||
      !formValues.total_amount
    ) {
      setError("Completá los campos obligatorios.");
      return;
    }

    const amount = Number(formValues.total_amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }

    try {
      setLoadingConfirm(true);

      await onConfirm({
        invoice_type: formValues.invoice_type,
        point_of_sale: formValues.point_of_sale,
        invoice_number: formValues.invoice_number,
        invoice_date: formValues.invoice_date,
        total_amount: amount,
        client_name: formValues.client_name || undefined,
        client_cuit: formValues.client_cuit || undefined,
      });

      setSelectedFile(null);
      setParsed(null);
      setFormValues({
        invoice_type: "",
        point_of_sale: "",
        invoice_number: "",
        invoice_date: "",
        total_amount: "",
        client_name: "",
        client_cuit: "",
      });
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error confirmando importación");
    } finally {
      setLoadingConfirm(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-900">Importar PDF</h2>
        <p className="mt-1 text-sm text-gray-500">
          Subí una factura en PDF, revisá los datos detectados y confirmá la importación.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">
              Archivo PDF
            </div>
            <div className="text-sm text-gray-500">
              {selectedFile ? selectedFile.name : "Todavía no seleccionaste ningún archivo."}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Elegir archivo
            </button>

            <button
              type="button"
              onClick={handleImport}
              disabled={loadingImport}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingImport ? "Procesando..." : "Procesar PDF"}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {parsed && (
        <form onSubmit={handleConfirm} className="mt-6 space-y-4">
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            PDF procesado. Revisá los datos antes de guardarlos.
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
              <input
                value={formValues.invoice_type}
                onChange={(e) => handleChange("invoice_type", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Tipo"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Punto de venta</label>
              <input
                value={formValues.point_of_sale}
                onChange={(e) => handleChange("point_of_sale", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Punto de venta"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Número</label>
              <input
                value={formValues.invoice_number}
                onChange={(e) => handleChange("invoice_number", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Número"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Fecha</label>
              <input
                type="date"
                value={formValues.invoice_date}
                onChange={(e) => handleChange("invoice_date", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Monto</label>
              <input
                type="number"
                value={formValues.total_amount}
                onChange={(e) => handleChange("total_amount", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Monto"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Cliente</label>
              <input
                value={formValues.client_name}
                onChange={(e) => handleChange("client_name", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="Cliente"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">CUIT cliente</label>
              <input
                value={formValues.client_cuit}
                onChange={(e) => handleChange("client_cuit", e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2"
                placeholder="CUIT cliente"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={loadingConfirm}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingConfirm ? "Guardando..." : "Confirmar importación"}
            </button>

            <button
              type="button"
              onClick={() => {
                setParsed(null);
                setSelectedFile(null);
                setError("");
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}