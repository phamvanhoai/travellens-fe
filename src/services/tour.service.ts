import { api } from "@/services/api";

export const tourService = {
  list: () => api.get("/tours"),
  detail: (id: string) => api.get(`/tours/${id}`)
};
