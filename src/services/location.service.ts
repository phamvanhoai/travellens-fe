import { api } from "@/services/api";

export const locationService = {
  detail: (id: string) => api.get(`/locations/${id}`)
};
