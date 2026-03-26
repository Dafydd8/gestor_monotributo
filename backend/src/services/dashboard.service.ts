import { prisma } from "../db";

type CutMonth = 0 | 6; // 0 = Enero, 6 = Julio

type CategoryLite = {
  id: number;
  code: string;
  max_annual_income: number;
  effective_from: Date;
  effective_to: Date | null;
};

type CutSummary = {
  label: string;
  category_code: string;
  period_label: string;
  threshold_period_label: string;
  accumulated: number;
  category_limit: number;
  previous_category_code: string | null;
  next_category_code: string | null;
  above_previous_by: number | null;
  remaining_to_next: number | null;
  percentage_used: number;
};

type Last6MonthRow = {
  month_label: string;
  billed: number;
  accumulated_12m: number;
  category_code: string;
  category_label: string;
  category_limit: number;
  margin: number;
};

const MONTH_LABELS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const formatMoney = (value: number) => Math.round(value * 100) / 100;

const getCutDate = (year: number, month: CutMonth) =>
  new Date(Date.UTC(year, month, 1));

const getCurrentAndNextCuts = (now = new Date()) => {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();

  if (month < 6) {
    return {
      currentCut: getCutDate(year, 0),
      nextCut: getCutDate(year, 6),
    };
  }

  return {
    currentCut: getCutDate(year, 6),
    nextCut: getCutDate(year + 1, 0),
  };
};

const getFollowingCut = (cutDate: Date) => {
  const year = cutDate.getUTCFullYear();
  const month = cutDate.getUTCMonth();

  if (month === 0) {
    return getCutDate(year, 6);
  }

  return getCutDate(year + 1, 0);
};

const getWindowForCut = (cutDate: Date) => {
  const year = cutDate.getUTCFullYear();
  const month = cutDate.getUTCMonth();

  if (month === 0) {
    return {
      from: new Date(Date.UTC(year - 1, 0, 1)),
      to: new Date(Date.UTC(year - 1, 11, 31, 23, 59, 59, 999)),
    };
  }

  return {
    from: new Date(Date.UTC(year - 1, 6, 1)),
    to: new Date(Date.UTC(year, 5, 30, 23, 59, 59, 999)),
  };
};

const getThresholdPeriodLabel = (cutDate: Date) => {
  const year = cutDate.getUTCFullYear();
  const month = cutDate.getUTCMonth();

  if (month === 0) return `Ene ${year} – Jun ${year}`;
  return `Jul ${year} – Dic ${year}`;
};

const formatPeriodLabel = (from: Date, to: Date) => {
  const fromLabel = `${MONTH_LABELS[from.getUTCMonth()]} ${from.getUTCFullYear()}`;
  const toLabel = `${MONTH_LABELS[to.getUTCMonth()]} ${to.getUTCFullYear()}`;
  return `${fromLabel} – ${toLabel}`;
};

const formatCutLabel = (cutDate: Date) => {
  const month = cutDate.getUTCMonth() === 0 ? "Enero" : "Julio";
  return `${month} ${cutDate.getUTCFullYear()}`;
};

const getEstimatedCategory = (amount: number, categories: CategoryLite[]) => {
  const sorted = [...categories].sort(
    (a, b) => a.max_annual_income - b.max_annual_income
  );

  return (
    sorted.find((category) => amount <= category.max_annual_income) ??
    sorted[sorted.length - 1]
  );
};

const getAdjacentCategories = (
  categoryId: number,
  categories: CategoryLite[]
): {
  previousCategory: CategoryLite | null;
  nextCategory: CategoryLite | null;
} => {
  const sorted = [...categories].sort(
    (a, b) => a.max_annual_income - b.max_annual_income
  );

  const index = sorted.findIndex((c) => c.id === categoryId);

  return {
    previousCategory: index > 0 ? sorted[index - 1] : null,
    nextCategory: index < sorted.length - 1 ? sorted[index + 1] : null,
  };
};

const getCategoriesForCut = async (cutDate: Date) => {
  let categories = await prisma.category.findMany({
    where: {
      effective_from: {
        lte: cutDate,
      },
      OR: [{ effective_to: null }, { effective_to: { gte: cutDate } }],
      is_active: true,
    },
    orderBy: {
      max_annual_income: "asc",
    },
  });

  if (categories.length > 0) {
    return categories;
  }

  const latestAvailable = await prisma.category.findFirst({
    where: {
      effective_from: {
        lte: new Date(),
      },
      is_active: true,
    },
    orderBy: {
      effective_from: "desc",
    },
  });

  if (!latestAvailable) {
    return [];
  }

  categories = await prisma.category.findMany({
    where: {
      effective_from: latestAvailable.effective_from,
      is_active: true,
    },
    orderBy: {
      max_annual_income: "asc",
    },
  });

  return categories;
};

const getAccumulatedForWindow = async (
  userId: number,
  from: Date,
  to: Date
) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      user_id: userId,
      invoice_date: {
        gte: from,
        lte: to,
      },
    },
  });

  return invoices.reduce((acc, invoice) => acc + invoice.total_amount, 0);
};

const buildCutSummary = async (
  userId: number,
  cutDate: Date
): Promise<CutSummary | null> => {
  const categories = await getCategoriesForCut(cutDate);
  if (!categories.length) {
    return null;
  }

  const { from, to } = getWindowForCut(cutDate);
  const accumulated = await getAccumulatedForWindow(userId, from, to);
  const estimatedCategory = getEstimatedCategory(accumulated, categories);
  const { previousCategory, nextCategory } = getAdjacentCategories(
    estimatedCategory.id,
    categories
  );

  return {
    label: formatCutLabel(cutDate),
    category_code: estimatedCategory.code,
    period_label: formatPeriodLabel(from, to),
    threshold_period_label: getThresholdPeriodLabel(cutDate),
    accumulated: formatMoney(accumulated),
    category_limit: formatMoney(estimatedCategory.max_annual_income),
    previous_category_code: previousCategory?.code ?? null,
    next_category_code: nextCategory?.code ?? null,
    above_previous_by: previousCategory
      ? formatMoney(accumulated - previousCategory.max_annual_income)
      : null,
    remaining_to_next: nextCategory
      ? formatMoney(Math.max(nextCategory.max_annual_income - accumulated, 0))
      : null,
    percentage_used: formatMoney(
      estimatedCategory.max_annual_income > 0
        ? (accumulated / estimatedCategory.max_annual_income) * 100
        : 0
    ),
  };
};

const buildProjectedCategories = (
  categories: CategoryLite[],
  estimatedIpc: number
): CategoryLite[] => {
  return categories.map((category) => ({
    ...category,
    max_annual_income: formatMoney(
      category.max_annual_income * (1 + estimatedIpc / 100)
    ),
  }));
};

const getMonthsRemainingForCut = (cutDate: Date, now = new Date()) => {
  const nowMonth = now.getUTCMonth();
  const cutMonth = cutDate.getUTCMonth();

  let monthsRemaining = 0;

  if (cutMonth === 6) {
    monthsRemaining = 6 - nowMonth;
  } else {
    monthsRemaining = 12 - nowMonth;
  }

  if (monthsRemaining < 1) monthsRemaining = 1;
  return monthsRemaining;
};

const getMonthStart = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 1));

const getMonthEnd = (year: number, month: number) =>
  new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

const formatMonthLabel = (date: Date) =>
  `${MONTH_LABELS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;

const getPreviousMonths = (count: number, now = new Date()) => {
  const months: Date[] = [];
  const baseYear = now.getUTCFullYear();
  const baseMonth = now.getUTCMonth();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(baseYear, baseMonth - i, 1));
    months.push(d);
  }

  return months;
};

const getRolling12WindowForMonth = (monthDate: Date) => {
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();

  return {
    from: new Date(Date.UTC(year - 1, month + 1, 1)),
    to: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
  };
};

const getMonthlyBilled = async (userId: number, monthDate: Date) => {
  const year = monthDate.getUTCFullYear();
  const month = monthDate.getUTCMonth();

  const from = getMonthStart(year, month);
  const to = getMonthEnd(year, month);

  return getAccumulatedForWindow(userId, from, to);
};

const buildLast6Months = async (
  userId: number,
  now = new Date()
): Promise<Last6MonthRow[]> => {
  const months = getPreviousMonths(6, now);
  const rows: Last6MonthRow[] = [];

  for (const monthDate of months) {
    const billed = await getMonthlyBilled(userId, monthDate);

    const rollingWindow = getRolling12WindowForMonth(monthDate);
    const accumulated12m = await getAccumulatedForWindow(
      userId,
      rollingWindow.from,
      rollingWindow.to
    );

    const categories = await getCategoriesForCut(monthDate);
    if (!categories.length) continue;

    const estimatedCategory = getEstimatedCategory(accumulated12m, categories);

    rows.push({
      month_label: formatMonthLabel(monthDate),
      billed: formatMoney(billed),
      accumulated_12m: formatMoney(accumulated12m),
      category_code: estimatedCategory.code,
      category_label: `Categoría ${estimatedCategory.code}`,
      category_limit: formatMoney(estimatedCategory.max_annual_income),
      margin: formatMoney(
        Math.max(estimatedCategory.max_annual_income - accumulated12m, 0)
      ),
    });
  }

  return rows;
};

export const getDashboardSummary = async (
  userId: number,
  estimatedIpc = 15
) => {
  const { currentCut, nextCut } = getCurrentAndNextCuts();
  const futureCut = getFollowingCut(nextCut);

  const currentCutSummary = await buildCutSummary(userId, currentCut);
  const nextCutSummary = await buildCutSummary(userId, nextCut);
  const futureCutSummary = await buildCutSummary(userId, futureCut);

  if (!currentCutSummary) {
    throw new Error("NO_CATEGORIES_FOR_CURRENT_CUT");
  }

  const partialCuts = [nextCutSummary, futureCutSummary].filter(
    Boolean
  ) as CutSummary[];

  let projection = null;
  let projection_details = null;
  let progress = null;

  if (nextCutSummary) {
    const nextCutCategories = await getCategoriesForCut(nextCut);

    const nextEstimatedCategory = nextCutCategories.find(
      (c) => c.code === nextCutSummary.category_code
    );

    const nextAdjacent = nextEstimatedCategory
      ? getAdjacentCategories(nextEstimatedCategory.id, nextCutCategories)
      : { nextCategory: null, previousCategory: null };

    const remainingToNext =
      nextAdjacent.nextCategory &&
      nextCutSummary.accumulated <= nextAdjacent.nextCategory.max_annual_income
        ? nextAdjacent.nextCategory.max_annual_income - nextCutSummary.accumulated
        : 0;

    const monthsRemaining = getMonthsRemainingForCut(nextCut);

    const projectedCategories = buildProjectedCategories(
      nextCutCategories,
      estimatedIpc
    );

    const projectedEstimatedCategory = getEstimatedCategory(
      nextCutSummary.accumulated,
      projectedCategories
    );

    const projectedAdjacent = getAdjacentCategories(
      projectedEstimatedCategory.id,
      projectedCategories
    );

    const projectedRemainingToNext =
      projectedAdjacent.nextCategory &&
      nextCutSummary.accumulated <= projectedAdjacent.nextCategory.max_annual_income
        ? projectedAdjacent.nextCategory.max_annual_income - nextCutSummary.accumulated
        : 0;

    const allowedPerMonthWithoutUpdate =
      monthsRemaining > 0 ? remainingToNext / monthsRemaining : 0;

    const allowedPerMonthWithUpdate =
      monthsRemaining > 0 ? projectedRemainingToNext / monthsRemaining : 0;

    projection = {
      months_remaining: monthsRemaining,
      remaining_to_next: formatMoney(remainingToNext),
      estimated_ipc: estimatedIpc,
      allowed_per_month_without_update: formatMoney(
        Math.max(allowedPerMonthWithoutUpdate, 0)
      ),
      allowed_per_month_with_update: formatMoney(
        Math.max(allowedPerMonthWithUpdate, 0)
      ),
    };

    projection_details = {
      scenario_label: `${nextCutSummary.label} · ${nextCutSummary.period_label} · Topes: ${nextCutSummary.threshold_period_label}`,
      without_update: {
        current_category_code: nextEstimatedCategory?.code ?? null,
        current_category_limit: nextEstimatedCategory
          ? formatMoney(nextEstimatedCategory.max_annual_income)
          : null,
        next_category_code: nextAdjacent.nextCategory?.code ?? null,
        next_category_limit: nextAdjacent.nextCategory
          ? formatMoney(nextAdjacent.nextCategory.max_annual_income)
          : null,
        margin_to_next: formatMoney(Math.max(remainingToNext, 0)),
        months_remaining: monthsRemaining,
      },
      with_update: {
        current_category_code: projectedEstimatedCategory?.code ?? null,
        current_category_limit: projectedEstimatedCategory
          ? formatMoney(projectedEstimatedCategory.max_annual_income)
          : null,
        next_category_code: projectedAdjacent.nextCategory?.code ?? null,
        next_category_limit: projectedAdjacent.nextCategory
          ? formatMoney(projectedAdjacent.nextCategory.max_annual_income)
          : null,
        margin_to_next: formatMoney(Math.max(projectedRemainingToNext, 0)),
        months_remaining: monthsRemaining,
        estimated_ipc: estimatedIpc,
      },
    };

    // Para que el dashboard se vea como el de tu viejo:
    // la barra usa la categoría actual, pero con el acumulado parcial del próximo corte.
    const progressUsed = nextCutSummary.accumulated;
    const progressLimit = currentCutSummary.category_limit;
    const progressPercent =
      progressLimit > 0 ? (progressUsed / progressLimit) * 100 : 0;

    progress = {
      title: `Progreso en Categoría ${currentCutSummary.category_code} — corte ${currentCutSummary.label}`,
      category_code: currentCutSummary.category_code,
      label: currentCutSummary.label,
      used: formatMoney(progressUsed),
      limit: formatMoney(progressLimit),
      percent: formatMoney(progressPercent),
    };
  } else {
    progress = {
      title: `Progreso en Categoría ${currentCutSummary.category_code} — corte ${currentCutSummary.label}`,
      category_code: currentCutSummary.category_code,
      label: currentCutSummary.label,
      used: currentCutSummary.accumulated,
      limit: currentCutSummary.category_limit,
      percent: currentCutSummary.percentage_used,
    };
  }

  const last6Months = await buildLast6Months(userId);
  return {
    current_cut: currentCutSummary,
    next_cut: nextCutSummary,
    partial_cuts: partialCuts,
    future_cut: futureCutSummary,
    progress,
    projection,
    projection_details,
    last_6_months: last6Months,
  };
};