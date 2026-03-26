export type CutSummary = {
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

export type ProjectionSummary = {
  months_remaining: number;
  remaining_to_next: number;
  estimated_ipc: number;
  allowed_per_month_without_update: number;
  allowed_per_month_with_update: number;
};

export type DashboardSummaryResponse = {
  current_cut: CutSummary;
  next_cut: CutSummary | null;

  // 🔹 NUEVO
  partial_cuts?: CutSummary[];
  future_cut?: CutSummary | null;

  // 🔹 NUEVO (para la barra tipo "app de tu viejo")
  progress?: {
    title: string;
    category_code: string;
    label: string;
    used: number;
    limit: number;
    percent: number;
  } | null;

  // 🔹 YA EXISTENTE
  projection: {
    months_remaining: number;
    remaining_to_next: number;
    estimated_ipc: number;
    allowed_per_month_without_update: number;
    allowed_per_month_with_update: number;
  } | null;

  // 🔹 NUEVO (para los bloques azul y verde completos)
  projection_details?: {
    scenario_label: string;
    without_update: {
      current_category_code: string | null;
      current_category_limit: number | null;
      next_category_code: string | null;
      next_category_limit: number | null;
      margin_to_next: number;
      months_remaining: number;
    };
    with_update: {
      current_category_code: string | null;
      current_category_limit: number | null;
      next_category_code: string | null;
      next_category_limit: number | null;
      margin_to_next: number;
      months_remaining: number;
      estimated_ipc: number;
    };
  } | null;
};

export type Last6MonthRow = {
  month_label: string;
  billed: number;
  accumulated_12m: number;
  category_code: string;
  category_label: string;
  category_limit: number;
  margin: number;
};