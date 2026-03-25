import { useEffect, useState } from "react";

type InvoiceFormValues = {
  invoice_type: string;
  point_of_sale: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: string;
  client_name: string;
  client_cuit: string;
};

type SubmitValues = {
  invoice_type: string;
  point_of_sale: string;
  invoice_number: string;
  invoice_date: string;
  total_amount: number;
  client_name?: string;
  client_cuit?: string;
};

type Props = {
  mode?: "create" | "edit";
  initialValues?: Partial<InvoiceFormValues>;
  onSubmit: (values: SubmitValues) => Promise<void>;
  onCancel?: () => void;
};

const emptyValues: InvoiceFormValues = {
  invoice_type: "",
  point_of_sale: "",
  invoice_number: "",
  invoice_date: "",
  total_amount: "",
  client_name: "",
  client_cuit: "",
};

export default function InvoiceForm({
  mode = "create",
  initialValues,
  onSubmit,
  onCancel,
}: Props) {
  const [values, setValues] = useState<InvoiceFormValues>(emptyValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setValues({
      invoice_type: initialValues?.invoice_type ?? "",
      point_of_sale: initialValues?.point_of_sale ?? "",
      invoice_number: initialValues?.invoice_number ?? "",
      invoice_date: initialValues?.invoice_date ?? "",
      total_amount: initialValues?.total_amount ?? "",
      client_name: initialValues?.client_name ?? "",
      client_cuit: initialValues?.client_cuit ?? "",
    });
  }, [initialValues]);

  const handleChange = (field: keyof InvoiceFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !values.invoice_type ||
      !values.point_of_sale ||
      !values.invoice_number ||
      !values.invoice_date ||
      !values.total_amount
    ) {
      setError("Completá los campos obligatorios.");
      return;
    }

    const parsedAmount = Number(values.total_amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("El monto debe ser mayor a 0.");
      return;
    }

    try {
      setLoading(true);

      await onSubmit({
        invoice_type: values.invoice_type,
        point_of_sale: values.point_of_sale,
        invoice_number: values.invoice_number,
        invoice_date: values.invoice_date,
        total_amount: parsedAmount,
        client_name: values.client_name || undefined,
        client_cuit: values.client_cuit || undefined,
      });

      if (mode === "create") {
        setValues(emptyValues);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error guardando factura");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-6"
    >
      <h2 className="text-lg font-medium">
        {mode === "edit" ? "Editar factura" : "Crear factura manual"}
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <input value={values.invoice_type} onChange={(e) => handleChange("invoice_type", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Tipo" />
        <input value={values.point_of_sale} onChange={(e) => handleChange("point_of_sale", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Punto de venta" />
        <input value={values.invoice_number} onChange={(e) => handleChange("invoice_number", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Número" />
        <input type="date" value={values.invoice_date} onChange={(e) => handleChange("invoice_date", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" />
        <input type="number" value={values.total_amount} onChange={(e) => handleChange("total_amount", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Monto" />
        <input value={values.client_name} onChange={(e) => handleChange("client_name", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="Cliente" />
        <input value={values.client_cuit} onChange={(e) => handleChange("client_cuit", e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2" placeholder="CUIT cliente" />
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-60"
        >
          {loading
            ? mode === "edit"
              ? "Guardando..."
              : "Creando..."
            : mode === "edit"
            ? "Guardar cambios"
            : "Guardar factura"}
        </button>

        {mode === "edit" && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}