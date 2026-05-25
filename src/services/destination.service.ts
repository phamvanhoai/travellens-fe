import { api } from "@/services/api";

export const destinationService = {
  list: () => api.get("/travel-destinations"),
  detail: (id: string) => api.get(`/travel-destinations/${id}`)
};
