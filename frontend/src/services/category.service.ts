import { api } from "./api";
import type { CategoriesOverviewResponse } from "../types/category";

type CurrentCategoryOption = {
  id: number;
  code: string;
};

export const categoryService = {
  getOverview: async (projectedIpc: number) => {
    const response = await api.get<CategoriesOverviewResponse>(
      `/categories/overview?projectedIpc=${projectedIpc}`
    );
    return response.data;
  },

  getCurrent: async () => {
    const response = await api.get<CurrentCategoryOption[]>("/categories/current");
    return response.data;
  },
};