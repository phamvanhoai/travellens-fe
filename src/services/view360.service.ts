import { api } from "@/services/api";

export const view360Service = {
  byLocation: (locationId: string) => api.get(`/locations/${locationId}/view360`)
};
