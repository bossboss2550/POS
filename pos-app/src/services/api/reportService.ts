import type { IReportService } from "../types";
import { apiGet } from "@/lib/axios";
import type { DashboardSummary } from "@/types";

export const reportService: IReportService = {
  async getDashboard(range) {
    return apiGet<DashboardSummary>("/reports/dashboard", { range });
  },
};
