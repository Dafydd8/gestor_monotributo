import { useRef, useState } from "react";
import type { ImportedInvoiceRow } from "../services/invoice.service";

type ConfirmValues = {
  invoice_type: string;
  point_of_sale: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  client_name?: string;
  client_cuit?: string;
};

type EditableInvoiceRow = ImportedInvoiceRow & {
  selected: boolean;
};

type Props = {
  onImport: (files: File[]) => Promise<ImportedInvoiceRow[]>;
  onConfirm: (values: ConfirmValues) => Promise<void>;
};

export default function PdfImportForm({ onImport, onConfirm }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [rows, setRows] = useState<EditableInvoiceRow[]>([]);
  const [loadingImport, setLoadingImport] = useState(false);
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleImport = async () => {
    if (selectedFiles.length === 0) {
      setError("Seleccioná al menos un PDF.");
      return;
    }

    try {
      setError("");
      setSuccessMessage("");
      setLoadingImport(true);

      const importedRows = await onImport(selectedFiles);

      setRows(
        importedRows.map((row) => ({
          ...row,
          selected: row.success,
        }))
      );
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error procesando PDFs");
    } finally {
      setLoadingImport(false);
    }
  };

  const handleChange = (
    localId: string,
    field: keyof EditableInvoiceRow,
    value: string | boolean
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.local_id === localId ? { ...row, [field]: value } : row
      )
    );
  };

  const handleConfirmAll = async () => {
    setError("");
    setSuccessMessage("");

    const validRows = rows.filter((row) => row.selected && row.success);

    if (validRows.length === 0) {
      setError("No hay facturas seleccionadas para importar.");
      return;
    }

    for (const row of validRows) {
      if (
        !row.invoice_type ||
        !row.point_of_sale ||
        !row.invoice_number ||
        !row.invoice_date ||
        row.total_amount === null ||
        row.total_amount <= 0
      ) {
        setError(
          `La factura "${row.file_name}" tiene campos obligatorios incompletos.`
        );
        return;
      }
    }

    try {
      setLoadingConfirm(true);

      for (const row of validRows) {
        await onConfirm({
          invoice_type: row.invoice_type!,
          point_of_sale: row.point_of_sale!,
          invoice_number: row.invoice_number!,
          invoice_date: row.invoice_date!,
          total_amount: Number(row.total_amount),
          client_name: row.client_name || undefined,
          client_cuit: row.client_cuit || undefined,
        });
      }

      setSuccessMessage("Facturas importadas correctamente.");
      setRows([]);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
          Subí una o varias facturas en PDF, revisá los datos detectados y confirmá la importación.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">
              Archivos PDF
            </div>
            <div className="text-sm text-gray-500">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} archivo(s) seleccionado(s)`
                : "Todavía no seleccionaste ningún archivo."}
            </div>
            {selectedFiles.length > 0 && (
              <ul className="list-disc pl-5 text-xs text-gray-500">
                {selectedFiles.map((file) => (
                  <li key={file.name}>{file.name}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Elegir archivos
            </button>

            <button
              type="button"
              onClick={handleImport}
              disabled={loadingImport}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingImport ? "Procesando..." : "Procesar PDFs"}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="application/pdf"
          onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
          className="hidden"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            PDFs procesados. Revisá los datos antes de guardarlos.
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                  <th className="px-3 py-2">Importar</th>
                  <th className="px-3 py-2">Archivo</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">PV</th>
                  <th className="px-3 py-2">Número</th>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Monto</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">CUIT</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.local_id}
                    className={`border-b border-gray-100 align-top ${
                      !row.success ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        disabled={!row.success || loadingConfirm}
                        onChange={(e) =>
                          handleChange(row.local_id, "selected", e.target.checked)
                        }
                      />
                    </td>

                    <td className="px-3 py-3 text-sm text-gray-700">
                      {row.file_name}
                    </td>

                    <td className="px-3 py-3">
                      <input
                        value={row.invoice_type ?? ""}
                        onChange={(e) =>
                          handleChange(row.local_id, "invoice_type", e.target.value)
                        }
                        disabled={!row.success}
                        className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        value={row.point_of_sale ?? ""}
                        onChange={(e) =>
                          handleChange(row.local_id, "point_of_sale", e.target.value)
                        }
                        disabled={!row.success}
                        className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        value={row.invoice_number ?? ""}
                        onChange={(e) =>
                          handleChange(row.local_id, "invoice_number", e.target.value)
                        }
                        disabled={!row.success}
                        className="w-28 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="date"
                        value={row.invoice_date ?? ""}
                        onChange={(e) =>
                          handleChange(row.local_id, "invoice_date", e.target.value)
                        }
                        disabled={!row.success}
                        className="w-40 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        type="number"
                        value={row.total_amount ?? ""}
                        onChange={(e) =>
                          handleChange(
                            row.local_id,
                            "total_amount",
                            e.target.value === "" ? "" : Number(e.target.value).toString()
                          )
                        }
                        disabled={!row.success}
                        className="w-32 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        value={row.client_name ?? ""}
                        onChange={(e) =>
                          handleChange(row.local_id, "client_name", e.target.value)
                        }
                        disabled={!row.success}
                        className="w-64 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>

                    <td className="px-3 py-3">
                      <input
                        value={row.client_cuit ?? ""}
                        onChange={(e) =>
                          handleChange(row.local_id, "client_cuit", e.target.value)
                        }
                        disabled={!row.success}
                        className="w-36 rounded-lg border border-gray-300 px-2 py-1 text-sm"
                      />
                    </td>

                    <td className="px-3 py-3 text-sm">
                      {row.success ? (
                        <span className="text-green-700">OK</span>
                      ) : (
                        <span className="text-red-600">{row.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleConfirmAll}
              disabled={loadingConfirm}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingConfirm ? "Guardando..." : "Confirmar importación"}
            </button>

            <button
              type="button"
              onClick={() => {
                setRows([]);
                setSelectedFiles([]);
                setError("");
                setSuccessMessage("");
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}