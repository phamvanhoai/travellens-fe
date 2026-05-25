import { api } from "@/services/api";

export const bookingService = {
  create: (payload: unknown) => api.post("/bookings", payload),
  listMine: () => api.get("/bookings/me"),
  cancel: (id: string) => api.patch(`/bookings/${id}/cancel`)
};
