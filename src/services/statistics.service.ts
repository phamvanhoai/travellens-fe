import { api } from "@/services/api";

export const statisticsService = {
  overview: () => api.get("/statistics/dashboard/summary"),
  userStats: () => api.get("/statistics/users/summary"),
  locationStats: () => api.get("/statistics/locations/summary"),
  contentStats: () => api.get("/statistics/content/summary"),
};
