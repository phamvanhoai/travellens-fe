import { api } from "@/services/api";

export const statisticsService = {
  overview: () => api.get("/admin/statistics/system"),
  userStats: () => api.get("/admin/statistics/users"),
  locationStats: () => api.get("/admin/statistics/locations"),
  contentStats: () => api.get("/admin/statistics/content"),
};
