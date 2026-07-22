import { api } from "@/services/api";

export type BookingPassengerPayload = {
  passenger_name: string;
  age_category: "adult" | "child" | "infant";
  seat_number?: string;
  special_request?: string;
};

export type CreateBookingPayload = {
  tour_id: number;
  contact_phone: string;
  travel_date: string;
  coupon_code?: string | null;
  request_id: string;
  policy_accepted: true;
  passengers: BookingPassengerPayload[];
};

export type CustomerBookingPassenger = BookingPassengerPayload & {
  booking_detail_id?: number;
  id?: number;
  price?: number | string;
};

export type CustomerTourReview = {
  review_id?: number;
  id?: number;
  booking_id?: number;
  tour_id?: number;
  user_id?: number;
  rating?: number;
  comment?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
};

export type CustomerBooking = {
  booking_id?: number;
  id?: number;
  booking_code?: string;
  code?: string;
  tour_id?: number;
  tour_name?: string;
  status?: string;
  cancel_status?: string;
  cancellation_status?: string;
  refund_status?: string;
  refund_request_status?: string;
  payment_status?: string;
  total_amount?: number | string;
  total_price?: number | string;
  final_amount?: number | string;
  paid_amount?: number | string;
  amount?: number | string;
  created_at?: string;
  booking_date?: string;
  booked_at?: string;
  departure_at?: string;
  arrival_time?: string;
  preferred_arrival_time?: string;
  travel_date?: string;
  contact_phone?: string;
  currency?: string;
  updated_at?: string;
  destination_names?: string[];
  tour?: { tour_id?: number; id?: number; name?: string; title?: string };
  Tour?: { tour_id?: number; id?: number; name?: string; title?: string };
  tour_summary?: { tour_id?: number; id?: number; name?: string; title?: string };
  passengers?: CustomerBookingPassenger[];
  booking_details?: CustomerBookingPassenger[];
  bookingDetails?: CustomerBookingPassenger[];
  BookingDetail?: CustomerBookingPassenger[];
  details?: CustomerBookingPassenger[];
  BookingDetails?: CustomerBookingPassenger[];
  payment?: { amount?: number | string; status?: string; payment_status?: string };
  payments?: Array<{ amount?: number | string; status?: string; payment_status?: string }>;
  Payment?: { amount?: number | string; status?: string; payment_status?: string };
  Payments?: Array<{ amount?: number | string; status?: string; payment_status?: string }>;
  latest_payment?: { payment_id?: number; amount?: number | string; currency?: string; status?: string; payment_status?: string } | null;
  latestPayment?: { payment_id?: number; amount?: number | string; currency?: string; status?: string; payment_status?: string } | null;
  refund_request?: { status?: string };
  refundRequest?: { status?: string };
  refund_requests?: Array<{ status?: string }>;
  refundRequests?: Array<{ status?: string }>;
  review?: CustomerTourReview | null;
  Review?: CustomerTourReview | null;
  tour_review?: CustomerTourReview | null;
  tourReview?: CustomerTourReview | null;
  reviews?: CustomerTourReview[];
  Reviews?: CustomerTourReview[];
};

function unwrapData<T>(value: T | { data?: T }) {
  if (value && typeof value === "object" && "data" in value) return (value as { data?: T }).data as T;
  return value as T;
}

function unwrapList(value: unknown) {
  const data = unwrapData<unknown>(value as { data?: unknown });
  if (Array.isArray(data)) return data as CustomerBooking[];
  if (data && typeof data === "object") {
    const nested = (data as { bookings?: unknown; data?: unknown }).bookings ?? (data as { data?: unknown }).data;
    return Array.isArray(nested) ? nested as CustomerBooking[] : [];
  }
  return [];
}

function unwrapListMeta(value: unknown) {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = body.data && typeof body.data === "object" && !Array.isArray(body.data) ? body.data as Record<string, unknown> : {};
  const raw = body.meta ?? body.pagination ?? data.meta ?? data.pagination;
  if (!raw || typeof raw !== "object") return undefined;
  const meta = raw as Record<string, unknown>;
  return {
    page: Number(meta.page ?? 1),
    limit: Number(meta.limit ?? 10),
    total: Number(meta.total ?? 0),
    total_pages: Math.max(1, Number(meta.total_pages ?? meta.totalPages ?? 1))
  };
}

function unwrapBooking(value: unknown) {
  const data = unwrapData<unknown>(value as { data?: unknown });
  if (!data || typeof data !== "object") return data as CustomerBooking;
  const wrapper = data as {
    booking?: CustomerBooking;
    passengers?: CustomerBookingPassenger[];
    booking_details?: CustomerBookingPassenger[];
    bookingDetails?: CustomerBookingPassenger[];
    BookingDetail?: CustomerBookingPassenger[];
    BookingDetails?: CustomerBookingPassenger[];
    details?: CustomerBookingPassenger[];
  };
  if (!wrapper.booking) return data as CustomerBooking;
  const passengers = wrapper.passengers ?? wrapper.booking_details ?? wrapper.bookingDetails ?? wrapper.BookingDetail ?? wrapper.BookingDetails ?? wrapper.details;
  return { ...wrapper.booking, ...(passengers ? { passengers } : {}) };
}

export function getCustomerBookingId(booking: CustomerBooking) { return booking.booking_id ?? booking.id ?? 0; }
export function getCustomerBookingCode(booking: CustomerBooking) { return booking.booking_code ?? booking.code ?? `BK-${getCustomerBookingId(booking)}`; }
export function getCustomerBookingTourName(booking: CustomerBooking) { return booking.tour_name ?? booking.tour_summary?.name ?? booking.tour_summary?.title ?? booking.tour?.name ?? booking.tour?.title ?? booking.Tour?.name ?? booking.Tour?.title ?? `Tour #${booking.tour_id ?? ""}`; }
export function getCustomerBookingPassengers(booking: CustomerBooking) { return booking.passengers ?? booking.booking_details ?? booking.bookingDetails ?? booking.BookingDetail ?? booking.details ?? booking.BookingDetails ?? []; }
export function getCustomerBookingPaymentStatus(booking: CustomerBooking) {
  return booking.latest_payment?.status ??
    booking.latest_payment?.payment_status ??
    booking.latestPayment?.status ??
    booking.latestPayment?.payment_status ??
    booking.payment?.status ??
    booking.Payment?.status ??
    booking.payments?.[0]?.status ??
    booking.Payments?.[0]?.status ??
    booking.payment?.payment_status ??
    booking.Payment?.payment_status ??
    booking.payments?.[0]?.payment_status ??
    booking.Payments?.[0]?.payment_status ??
    booking.payment_status;
}
export function getCustomerBookingCancelStatus(booking: CustomerBooking) {
  const explicitStatus = booking.cancel_status ?? booking.cancellation_status ?? booking.refund_request_status ?? booking.refund_status ?? booking.refund_request?.status ?? booking.refundRequest?.status ?? booking.refund_requests?.[0]?.status ?? booking.refundRequests?.[0]?.status;
  if (explicitStatus) return explicitStatus;

  const bookingStatus = (booking.status ?? "").toLowerCase();
  if (!["cancelled", "canceled"].includes(bookingStatus)) return "";

  const paymentStatus = (getCustomerBookingPaymentStatus(booking) ?? "").toLowerCase();
  if (paymentStatus === "refunded") return "completed";
  if (paymentStatus === "paid") return "pending";
  return "completed";
}
export function getCustomerBookingAmount(booking: CustomerBooking) {
  return Number(
    booking.total_amount ??
    booking.final_amount ??
    booking.paid_amount ??
    booking.amount ??
    booking.total_price ??
    booking.latest_payment?.amount ??
    booking.latestPayment?.amount ??
    booking.payment?.amount ??
    booking.Payment?.amount ??
    booking.payments?.[0]?.amount ??
    booking.Payments?.[0]?.amount ??
    getCustomerBookingPassengers(booking).reduce((sum, passenger) => sum + Number(passenger.price || 0), 0)
  );
}
export function getCustomerBookingReview(booking: CustomerBooking) {
  return booking.review ?? booking.Review ?? booking.tour_review ?? booking.tourReview ?? booking.reviews?.[0] ?? booking.Reviews?.[0] ?? null;
}

export const bookingService = {
  async create(payload: CreateBookingPayload) {
    const response = await api.post("/bookings", payload);
    return unwrapData<Record<string, unknown>>(response.data);
  },
  async listMine(params: { page?: number; limit?: number; search?: string } = {}) {
    const response = await api.get("/bookings", { params });
    return unwrapList(response.data);
  },
  async listMinePage(params: { page?: number; limit?: number; search?: string } = {}) {
    const response = await api.get("/bookings", { params });
    return { data: unwrapList(response.data), meta: unwrapListMeta(response.data) };
  },
  async detail(id: number) {
    const response = await api.get(`/bookings/${id}`);
    return unwrapBooking(response.data);
  },
  async createTourReview(bookingId: number, payload: { rating: number; comment: string }) {
    const response = await api.post(`/bookings/${bookingId}/review`, payload);
    return unwrapData<CustomerTourReview>(response.data);
  },
  async updateTourReview(bookingId: number, payload: { rating: number; comment: string }) {
    const response = await api.put(`/bookings/${bookingId}/review`, payload);
    return unwrapData<CustomerTourReview>(response.data);
  },
  async deleteTourReview(bookingId: number) {
    const response = await api.delete(`/bookings/${bookingId}/review`);
    return unwrapData<unknown>(response.data);
  },
  cancel: (id: number, reason?: string) => api.patch(`/bookings/${id}/cancel`, { reason: reason || null })
};
