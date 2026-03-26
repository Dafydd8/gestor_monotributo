import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { dashboardService } from "../services/dashboard.service";
import type { DashboardSummaryResponse, Last6MonthRow } from "../types/dashboard";
import ProgressBar from "../components/ProgressBar";

type SummaryCard = {
  label: string;
  accumulated: number | null;
  category_code: string | null;
  period_label?: string | null;
};

type ExtraProjectionDetails = {
  scenario_label?: string;
  without_update?: {
    current_category_code?: string | null;
    current_category_limit?: number | null;
    next_category_code?: string | null;
    next_category_limit?: number | null;
    margin_to_next?: number | null;
    months_remaining?: number | null;
  };
  with_update?: {
    current_category_code?: string | null;
    current_category_limit?: number | null;
    next_category_code?: string | null;
    next_category_limit?: number | null;
    margin_to_next?: number | null;
    months_remaining?: number | null;
    estimated_ipc?: number | null;
  };
};

type ExtendedDashboardResponse = DashboardSummaryResponse & {
  partial_cuts?: SummaryCard[];
  future_cut?: SummaryCard | null;
  progress?: {
    title?: string;
    category_code?: string | null;
    label?: string;
    used?: number | null;
    limit?: number | null;
    percent?: number | null;
  } | null;
  projection_details?: ExtraProjectionDetails | null;
  last_6_months?: Last6MonthRow[];
};

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  });
};

const formatCompactMoney = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toLocaleString("es-AR", {
    maximumFractionDigits: 0,
  });
};

const monthNameFromCutLabel = (label?: string | null) => {
  if (!label) return "";
  const [month] = label.split(" ");
  return month?.toUpperCase() ?? "";
};

const getNextCutLabel = (label?: string | null) => {
  if (!label) return null;

  const [month, yearRaw] = label.split(" ");
  const year = Number(yearRaw);

  if (!month || Number.isNaN(year)) return null;

  if (month.toLowerCase() === "enero") return `Julio ${year}`;
  if (month.toLowerCase() === "julio") return `Enero ${year + 1}`;

  return null;
};

const inferScenarioLabel = (nextCut?: DashboardSummaryResponse["next_cut"] | null) => {
  if (!nextCut) return "Próximo corte";
  return `${nextCut.label} · ${nextCut.period_label} · Topes: ${nextCut.threshold_period_label}`;
};

function TopSummaryCard({
  eyebrow,
  title,
  subtitle,
  badge,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: string | null;
}) {
  return (
    <div className="rounded-[28px] border border-stone-300 bg-white px-7 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="flex items-center gap-5">
        {badge ? (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#CC6B3F] text-2xl font-bold text-white">
            {badge}
          </div>
        ) : null}

        <div className="min-w-0">
          <div className="text-[15px] uppercase tracking-[0.04em] text-stone-500">
            {eyebrow}
          </div>
          <div className="mt-2 text-[28px] font-semibold leading-none text-stone-900">
            {title}
          </div>
          <div className="mt-3 text-[16px] text-stone-500">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [estimatedIpc, setEstimatedIpc] = useState(15);
  const [data, setData] = useState<ExtendedDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSummary = async (ipc: number) => {
    try {
      setLoading(true);
      setError("");
      const response = (await dashboardService.getSummary(ipc)) as ExtendedDashboardResponse;
      setData(response);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Error cargando dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary(estimatedIpc);
  }, [estimatedIpc]);

  const ui = useMemo(() => {
    if (!data) return null;

    const current = data.current_cut;
    const next = data.next_cut;

    const topLeft = {
      eyebrow: `CATEGORÍA ACTUAL (corte ${current.label})`,
      title: `Categoría ${current.category_code}`,
      subtitle: `Acum. $${formatCompactMoney(current.accumulated)} · Tope $${formatCompactMoney(
        current.category_limit
      )}`,
      badge: current.category_code,
    };

    const providedPartials = data.partial_cuts ?? [];
    const firstPartial = providedPartials[0]
      ? {
          eyebrow: `ACUM. PARCIAL – ${monthNameFromCutLabel(providedPartials[0].label)} ${providedPartials[0].label.split(" ")[1] ?? ""}`.trim(),
          title: `$${formatCompactMoney(providedPartials[0].accumulated)}`,
          subtitle: `Categoría ${providedPartials[0].category_code ?? "-"} · ${
            providedPartials[0].period_label ?? "-"
          }`,
        }
      : next
      ? {
          eyebrow: `ACUM. PARCIAL – ${monthNameFromCutLabel(next.label)} ${next.label.split(" ")[1] ?? ""}`.trim(),
          title: `$${formatCompactMoney(next.accumulated)}`,
          subtitle: `Categoría ${next.category_code} · ${next.period_label}`,
        }
      : null;

    const future = data.future_cut;
    const inferredFutureLabel = getNextCutLabel(next?.label);
    const secondPartial = providedPartials[1]
      ? {
          eyebrow: `ACUM. PARCIAL – ${monthNameFromCutLabel(providedPartials[1].label)} ${providedPartials[1].label.split(" ")[1] ?? ""}`.trim(),
          title: `$${formatCompactMoney(providedPartials[1].accumulated)}`,
          subtitle: `Categoría ${providedPartials[1].category_code ?? "-"} · ${
            providedPartials[1].period_label ?? "-"
          }`,
        }
      : future
      ? {
          eyebrow: `ACUM. PARCIAL – ${monthNameFromCutLabel(future.label)} ${future.label.split(" ")[1] ?? ""}`.trim(),
          title: `$${formatCompactMoney(future.accumulated)}`,
          subtitle: `Categoría ${future.category_code ?? "-"} · ${future.period_label ?? "-"}`,
        }
      : inferredFutureLabel
      ? {
          eyebrow: `ACUM. PARCIAL – ${monthNameFromCutLabel(inferredFutureLabel)} ${
            inferredFutureLabel.split(" ")[1] ?? ""
          }`,
          title: "-",
          subtitle: "Sin datos todavía",
        }
      : null;

    const progress = data.progress ?? {
      title: `Progreso en Categoría ${current.category_code} — corte ${current.label}`,
      category_code: current.category_code,
      label: current.label,
      used: current.accumulated,
      limit: current.category_limit,
      percent: current.percentage_used,
    };

    const projection = data.projection;
    const projectionDetails = data.projection_details;

    return {
      topLeft,
      firstPartial,
      secondPartial,
      progress: {
        title:
          progress?.title ??
          `Progreso en Categoría ${progress?.category_code ?? current.category_code} — corte ${
            progress?.label ?? current.label
          }`,
        used: progress?.used ?? current.accumulated,
        limit: progress?.limit ?? current.category_limit,
        percent: progress?.percent ?? current.percentage_used,
      },
      scenarioLabel:
        projectionDetails?.scenario_label ?? inferScenarioLabel(next),
      projection,
      projectionDetails,
      next,
    };
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-6xl font-normal tracking-[-0.03em] text-stone-950">
            Dashboard
          </h1>
          <p className="mt-6 text-[18px] text-stone-600">Hola, {user?.full_name}</p>
        </div>

        <div className="w-fit rounded-[24px] border border-stone-300 bg-white px-6 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-5">
            <span className="text-[18px] text-stone-600">IPC estimado</span>
            <input
              type="number"
              min={0}
              value={estimatedIpc}
              onChange={(e) => setEstimatedIpc(Number(e.target.value))}
              className="h-16 w-32 rounded-2xl border border-stone-300 bg-white px-4 text-center text-[22px] text-stone-900 outline-none"
            />
            <span className="text-[18px] text-stone-500">%</span>
          </div>
        </div>
      </div>

      {loading && <div className="text-sm text-stone-500">Cargando dashboard...</div>}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {data && ui && !loading && !error && (
        <>
          <div className="grid gap-5 xl:grid-cols-3">
            <TopSummaryCard
              eyebrow={ui.topLeft.eyebrow}
              title={ui.topLeft.title}
              subtitle={ui.topLeft.subtitle}
              badge={ui.topLeft.badge}
            />

            {ui.firstPartial ? (
              <TopSummaryCard
                eyebrow={ui.firstPartial.eyebrow}
                title={ui.firstPartial.title}
                subtitle={ui.firstPartial.subtitle}
              />
            ) : (
              <TopSummaryCard
                eyebrow="ACUM. PARCIAL"
                title="-"
                subtitle="Sin datos todavía"
              />
            )}

            {ui.secondPartial ? (
              <TopSummaryCard
                eyebrow={ui.secondPartial.eyebrow}
                title={ui.secondPartial.title}
                subtitle={ui.secondPartial.subtitle}
              />
            ) : (
              <TopSummaryCard
                eyebrow="ACUM. PARCIAL"
                title="-"
                subtitle="Sin datos todavía"
              />
            )}
          </div>

          <section className="rounded-[28px] border border-stone-300 bg-white px-7 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[22px] font-semibold text-stone-900">
              {ui.progress.title}
            </h2>

            <div className="mt-7">
              <ProgressBar value={ui.progress.percent ?? 0} />
            </div>

            <div className="mt-4 grid grid-cols-3 items-center text-[18px] text-stone-500">
              <div className="text-left">{formatCurrency(ui.progress.used)}</div>
              <div className="text-center font-semibold text-stone-500">
                {Math.round(ui.progress.percent ?? 0)}%
              </div>
              <div className="text-right">
                {formatCurrency(ui.progress.limit)} (límite)
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-stone-300 bg-white px-7 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[22px] font-semibold text-stone-900">
              ¿Cuánto puedo facturar por mes para no subirme de categoría?
            </h2>
            <p className="mt-4 text-[16px] text-stone-500">
              Dos escenarios para el próximo corte: sin actualización de topes, y
              con actualización estimada por IPC.
            </p>

            <div className="mt-5 rounded-2xl bg-stone-100 px-5 py-4 text-[18px] font-semibold text-stone-700">
              <span className="mr-2">🗓️</span>
              {ui.scenarioLabel}
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-2">
              <div className="rounded-3xl border border-blue-200 bg-blue-50/70 px-6 py-7">
                <div className="text-[18px] font-bold uppercase tracking-[0.04em] text-blue-800">
                  Sin actualización de topes
                </div>

                <div className="mt-5 flex items-end gap-1 text-blue-700">
                  <span className="text-6xl font-bold leading-none">
                    {formatCurrency(ui.projection?.allowed_per_month_without_update)}
                  </span>
                  <span className="mb-1 text-[18px]">/mes</span>
                </div>

                <div className="mt-6 space-y-2 text-[18px] text-blue-700">
                  {ui.projectionDetails?.without_update ? (
                    <>
                      <p>
                        Cat. vigente: {ui.projectionDetails.without_update.current_category_code ?? "-"} ·
                        {" "}Tope cat. {ui.projectionDetails.without_update.current_category_code ?? "-"}:{" "}
                        {formatCurrency(ui.projectionDetails.without_update.current_category_limit)} ·
                        {" "}Tope cat. sig. ({ui.projectionDetails.without_update.next_category_code ?? "-"}):{" "}
                        {formatCurrency(ui.projectionDetails.without_update.next_category_limit)}
                      </p>
                      <p>
                        Margen hasta cat. {ui.projectionDetails.without_update.next_category_code ?? "-"}:{" "}
                        {formatCurrency(ui.projectionDetails.without_update.margin_to_next)} ·{" "}
                        {ui.projectionDetails.without_update.months_remaining ??
                          ui.projection?.months_remaining ??
                          "-"}{" "}
                        meses restantes
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Margen disponible hasta la siguiente categoría:{" "}
                        {formatCurrency(ui.projection?.remaining_to_next)}
                      </p>
                      <p>
                        {ui.projection?.months_remaining ?? "-"} meses restantes
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-green-200 bg-green-50/70 px-6 py-7">
                <div className="text-[18px] font-bold uppercase tracking-[0.04em] text-green-800">
                  Con actualización IPC (+{ui.projection?.estimated_ipc ?? estimatedIpc}%)
                </div>

                <div className="mt-5 flex items-end gap-1 text-green-700">
                  <span className="text-6xl font-bold leading-none">
                    {formatCurrency(ui.projection?.allowed_per_month_with_update)}
                  </span>
                  <span className="mb-1 text-[18px]">/mes</span>
                </div>

                <div className="mt-6 space-y-2 text-[18px] text-green-700">
                  {ui.projectionDetails?.with_update ? (
                    <>
                      <p>
                        Cat. vigente: {ui.projectionDetails.with_update.current_category_code ?? "-"} ·
                        {" "}Tope est. cat. {ui.projectionDetails.with_update.current_category_code ?? "-"}:{" "}
                        {formatCurrency(ui.projectionDetails.with_update.current_category_limit)} ·
                        {" "}Tope est. cat. sig. ({ui.projectionDetails.with_update.next_category_code ?? "-"}):{" "}
                        {formatCurrency(ui.projectionDetails.with_update.next_category_limit)}
                      </p>
                      <p>
                        Margen hasta cat. {ui.projectionDetails.with_update.next_category_code ?? "-"}:{" "}
                        {formatCurrency(ui.projectionDetails.with_update.margin_to_next)} ·{" "}
                        {ui.projectionDetails.with_update.months_remaining ??
                          ui.projection?.months_remaining ??
                          "-"}{" "}
                        meses restantes
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        Proyección con actualización estimada de topes por IPC del{" "}
                        {ui.projection?.estimated_ipc ?? estimatedIpc}%
                      </p>
                      <p>
                        {ui.projection?.months_remaining ?? "-"} meses restantes
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
          {data.last_6_months && data.last_6_months.length > 0 && (
            <section className="rounded-[28px] border border-stone-300 bg-white px-7 py-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <h2 className="text-[22px] font-semibold text-stone-900">
                Últimos 6 meses
              </h2>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 text-left text-[16px] text-stone-500">
                      <th className="px-4 py-4 font-medium">Mes</th>
                      <th className="px-4 py-4 font-medium">Facturado</th>
                      <th className="px-4 py-4 font-medium">Acum. 12m (ventana)</th>
                      <th className="px-4 py-4 font-medium">Categoría</th>
                      <th className="px-4 py-4 font-medium">Tope vigente ese mes</th>
                      <th className="px-4 py-4 text-right font-medium">Margen</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.last_6_months.map((row) => (
                      <tr key={row.month_label} className="border-b border-stone-200 last:border-b-0">
                        <td className="px-4 py-4 text-[18px]">{row.month_label}</td>

                        <td className="px-4 py-4 text-[18px]">
                          {formatCurrency(row.billed)}
                        </td>

                        <td className="px-4 py-4 text-[18px]">
                          {formatCurrency(row.accumulated_12m)}
                        </td>

                        <td className="px-4 py-4 text-[18px]">
                          <span className="font-semibold text-[#C96C43]">
                            {row.category_code}
                          </span>
                          <span className="ml-2 text-stone-500">
                            {row.category_label}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-[18px]">
                          {formatCurrency(row.category_limit)}
                        </td>

                        <td className="px-4 py-4 text-right text-[18px] font-medium text-[#C98A2E]">
                          {formatCurrency(row.margin)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          
        </>
      )}
    </div>
  );
}