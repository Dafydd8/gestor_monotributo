import { useEffect, useState } from "react";
import { categoryService } from "../services/category.service";
import type { CategoriesOverviewResponse } from "../types/category";

const formatCurrency = (value: number) =>
  value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });

export default function CategoriesPage() {
  const [projectedIpc, setProjectedIpc] = useState(15);
  const [data, setData] = useState<CategoriesOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openPeriod, setOpenPeriod] = useState<string | null>(null);

  const fetchData = async (ipc: number) => {
    try {
      setLoading(true);
      setError("");
      const response = await categoryService.getOverview(ipc);
      setData(response);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error cargando categorías");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(projectedIpc);
  }, [projectedIpc]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Categorías</h1>
        <p className="mt-1 text-sm text-gray-600">
          Topes vigentes y proyección para la próxima actualización.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium">Estimación de topes para la próxima actualización</h2>

        <div className="mt-4 flex max-w-md items-center gap-3 rounded-xl bg-gray-50 p-4">
          <span className="text-sm font-medium text-gray-700">
            IPC estimado próx. semestre
          </span>

          <input
            type="number"
            min={0}
            value={projectedIpc}
            onChange={(e) => setProjectedIpc(Number(e.target.value))}
            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center"
          />

          <span className="text-sm text-gray-500">%</span>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Los topes se actualizan en Enero y Julio aplicando el IPC del semestre anterior.
          La columna estimada multiplica los topes actuales por ese factor.
        </p>
      </div>

      {loading && <div className="text-sm text-gray-500">Cargando categorías...</div>}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {data && !loading && !error && (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-medium">Topes vigentes y proyección</h2>
              <p className="mt-1 text-sm text-gray-500">
                Topes vigentes: {data.current_period_label}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-left text-gray-600">
                  <tr>
                    <th className="px-6 py-3">Cat.</th>
                    <th className="px-6 py-3">Tope vigente</th>
                    <th className="px-6 py-3 text-right">
                      Estimado (+{data.projected_ipc}% IPC)
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {data.categories.map((category) => (
                    <tr
                      key={category.id}
                      className={`border-t border-gray-100 ${
                        category.is_current ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-semibold text-orange-600">
                            {category.code}
                          </span>

                          {category.is_current && (
                            <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                              Actual
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {formatCurrency(category.max_annual_income)}
                      </td>

                      <td className="px-6 py-4 text-right font-medium text-green-700">
                        {formatCurrency(category.projected_annual_income)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-semibold">Períodos anteriores</h2>

            {data.historical_periods.map((period) => {
              const isOpen = openPeriod === period.effective_from;

              return (
                <div
                  key={period.effective_from}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenPeriod(isOpen ? null : period.effective_from)
                    }
                    className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left"
                  >
                    <div className="font-semibold">{period.label}</div>
                    <div className="text-sm text-gray-500">
                      {period.effective_from}
                      {period.effective_to ? ` → ${period.effective_to}` : ""}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 text-left text-gray-600">
                            <tr>
                              <th className="px-6 py-3">Cat.</th>
                              <th className="px-6 py-3 text-right">Tope servicios</th>
                            </tr>
                          </thead>
                          <tbody>
                            {period.categories.map((category) => (
                              <tr
                                key={category.id}
                                className="border-t border-gray-100"
                              >
                                <td className="px-6 py-4">
                                  <span className="text-2xl font-semibold text-orange-600">
                                    {category.code}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  {formatCurrency(category.max_annual_income)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-4 text-sm text-gray-600 shadow-sm">
            <span className="font-semibold text-gray-900">Importante:</span> esta app calcula
            la categoría únicamente por facturación anual. El monotributo también considera
            superficie, energía eléctrica, alquileres y precio unitario máximo.
          </div>
        </>
      )}
    </div>
  );
}