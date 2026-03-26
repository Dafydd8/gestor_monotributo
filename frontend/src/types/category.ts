export type CategoryOverviewRow = {
  id: number;
  code: string;
  max_annual_income: number;
  projected_annual_income: number;
  is_current: boolean;
};

export type HistoricalCategoryRow = {
  id: number;
  code: string;
  max_annual_income: number;
};

export type HistoricalPeriod = {
  label: string;
  effective_from: string;
  effective_to: string | null;
  categories: HistoricalCategoryRow[];
};

export type CategoriesOverviewResponse = {
  projected_ipc: number;
  current_period_label: string;
  current_category_code: string | null;
  categories: CategoryOverviewRow[];
  historical_periods: HistoricalPeriod[];
};