import { api } from "@/services/api";

export const statisticsService = {
  overview: () => api.get("/statistics/overview")
};
