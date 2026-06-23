import { api } from "@/services/api";

export type BookingPassengerPayload = {
  passenger_name: string;
  age_category: "adult" | "child" | "infant";
  price: number;
  seat_number?: string;
  special_request?: string;
};

export type CreateBookingPayload = {
  tour_id: number;
  coupon_code?: string;
  passengers: BookingPassengerPayload[];
};

function unwrapData<T>(value: T | { data?: T }) {
  if (value && typeof value === "object" && "data" in value) return (value as { data?: T }).data as T;
  return value as T;
}

export const bookingService = {
  async create(payload: CreateBookingPayload) {
    const response = await api.post("/bookings", payload);
    return unwrapData<Record<string, unknown>>(response.data);
  },
  listMine: () => api.get("/bookings"),
  detail: (id: number) => api.get(`/bookings/${id}`),
  cancel: (id: number) => api.patch(`/bookings/${id}/cancel`)
};
