import type { Invoice } from "../types/invoice";

type Props = {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoice: Invoice) => void;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const raw = value.slice(0, 10);
  return new Date(`${raw}T12:00:00`).toLocaleDateString("es-AR");
};

export default function InvoiceTable({ invoices, onEdit, onDelete }: Props) {
  if (invoices.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
        No hay facturas cargadas todavía.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Tipo</th>
              <th className="px-4 py-3 font-medium">Pto. venta</th>
              <th className="px-4 py-3 font-medium">Número</th>
              <th className="px-4 py-3 font-medium">Fecha desde</th>
              <th className="px-4 py-3 font-medium">Fecha emisión</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Monto</th>
              <th className="px-4 py-3 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-gray-100">
                <td className="px-4 py-3">{invoice.invoice_type}</td>
                <td className="px-4 py-3">{invoice.point_of_sale}</td>
                <td className="px-4 py-3">{invoice.invoice_number}</td>
                <td className="px-4 py-3">{formatDate(invoice.invoice_date)}</td>
                <td className="px-4 py-3">{formatDate(invoice.issue_date)}</td>
                <td className="px-4 py-3">{invoice.client_name || "-"}</td>
                <td className="px-4 py-3">
                  {invoice.total_amount.toLocaleString("es-AR", {
                    style: "currency",
                    currency: "ARS",
                  })}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEdit(invoice)}
                      className="rounded border border-gray-300 px-3 py-1 text-xs"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(invoice)}
                      className="rounded border border-red-300 px-3 py-1 text-xs text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}