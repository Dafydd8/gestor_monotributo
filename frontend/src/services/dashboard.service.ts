import { api } from "./api";
import type { DashboardSummaryResponse } from "../types/dashboard";

export const dashboardService = {
  getSummary: async (estimatedIpc = 15) => {
    const response = await api.get<DashboardSummaryResponse>(
      `/dashboard/summary?estimatedIpc=${estimatedIpc}`
    );
    return response.data;
  },
};