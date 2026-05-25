import { api } from "@/services/api";

export const paymentService = {
  checkout: (bookingId: string) => api.post("/payments/checkout", { booking_id: bookingId }),
  detail: (id: string) => api.get(`/payments/${id}`)
};
