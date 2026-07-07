import { api } from "@/services/api";

export type StaffBookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "canceled" | "expired" | string;
export type StaffBookingAgeCategory = "adult" | "child" | "infant" | string;

export type StaffBookingPassenger = {
  booking_detail_id?: number;
  id?: number;
  passenger_name?: string;
  name?: string;
  age_category?: StaffBookingAgeCategory;
  ageCategory?: StaffBookingAgeCategory;
  price?: number | string;
  seat_number?: string | null;
  special_request?: string | null;
};

export type StaffBooking = {
  booking_id?: number;
  id?: number;
  booking_code?: string;
  code?: string;
  user_id?: number;
  customer_name?: string;
  user_name?: string;
  customer?: string | { user_id?: number; id?: number; name?: string; full_name?: string; fullName?: string; email?: string; phone?: string; avatar_url?: string };
  customerName?: string;
  tour_id?: number;
  tour_name?: string;
  tourName?: string;
  title?: string;
  status?: StaffBookingStatus;
  total_amount?: number | string;
  totalAmount?: number | string;
  total_price?: number | string;
  totalPrice?: number | string;
  final_amount?: number | string;
  finalAmount?: number | string;
  paid_amount?: number | string;
  paidAmount?: number | string;
  amount?: number | string;
  price?: number | string;
  travel_date?: string;
  travelDate?: string;
  departure_at?: string;
  departureAt?: string;
  arrival_time?: string;
  arrivalTime?: string;
  preferred_arrival_time?: string;
  preferredArrivalTime?: string;
  booking_date?: string;
  bookingDate?: string;
  created_at?: string;
  updated_at?: string;
  adult_count?: number | string;
  adultCount?: number | string;
  adults?: number | string;
  child_count?: number | string;
  childCount?: number | string;
  children?: number | string;
  infant_count?: number | string;
  infantCount?: number | string;
  infants?: number | string;
  passenger_count?: number | string;
  passengerCount?: number | string;
  total_passengers?: number | string;
  totalPassengers?: number | string;
  remaining_seats?: number | string;
  available_seats?: number | string;
  user?: { user_id?: number; id?: number; name?: string; full_name?: string; fullName?: string; email?: string };
  User?: { user_id?: number; id?: number; name?: string; full_name?: string; fullName?: string; email?: string };
  tour?: {
    tour_id?: number;
    id?: number;
    name?: string;
    title?: string;
    tour_name?: string;
    adult_price?: number | string;
    child_price?: number | string;
    infant_price?: number | string;
    price_adult?: number | string;
    price_child?: number | string;
    price_infant?: number | string;
    price?: number | string;
    remaining_seats?: number | string;
    available_seats?: number | string;
  };
  Tour?: StaffBooking["tour"];
  passengers?: StaffBookingPassenger[];
  Passengers?: StaffBookingPassenger[];
  booking_details?: StaffBookingPassenger[];
  bookingDetails?: StaffBookingPassenger[];
  BookingDetail?: StaffBookingPassenger[];
  BookingDetails?: StaffBookingPassenger[];
  details?: StaffBookingPassenger[];
  payment?: { status?: string; payment_status?: string; amount?: number | string };
  Payment?: { status?: string; payment_status?: string; amount?: number | string };
  payments?: Array<{ status?: string; payment_status?: string; amount?: number | string }>;
  Payments?: Array<{ status?: string; payment_status?: string; amount?: number | string }>;
};

export type StaffBookingUpdatePayload = {
  customer_name?: string;
  phone?: string;
  travel_date?: string;
  departure_at?: string | null;
  status?: string;
  adult_count?: number;
  child_count?: number;
  infant_count?: number;
  adults?: number;
  children?: number;
  infants?: number;
};

export type StaffBookingCreatePassengerPayload = {
  passenger_name: string;
  age_category: "adult" | "child" | "infant";
  seat_number?: string;
  special_request?: string;
};

export type StaffBookingCreatePayload = {
  user_id: number;
  tour_id: number;
  contact_phone: string;
  travel_date: string;
  departure_at?: string | null;
  coupon_code?: string | null;
  passengers: StaffBookingCreatePassengerPayload[];
};

export type StaffCustomer = {
  user_id?: number;
  id?: number;
  name?: string;
  full_name?: string;
  fullName?: string;
  email?: string;
  phone?: string | null;
  role?: string;
  status?: string;
};

export type StaffCustomerLookupResult = {
  exists?: boolean;
  reason?: "not_found" | "not_customer" | "inactive" | string | null;
  message?: string | null;
  customer?: StaffCustomer | null;
};

type ListResponse = {
  data: StaffBooking[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  };
};

export type StaffBookingListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
};

function unwrapData<T>(responseData: T | { data?: T }) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data?: T }).data as T;
  }
  return responseData as T;
}

function unwrapList(responseData: unknown): ListResponse {
  const data = unwrapData<unknown>(responseData as { data?: unknown });

  if (Array.isArray(data)) return { data };

  if (data && typeof data === "object") {
    const record = data as {
      bookings?: unknown;
      bookingTours?: unknown;
      booking_tours?: unknown;
      data?: unknown;
      rows?: unknown;
      items?: unknown;
      pagination?: ListResponse["pagination"];
      meta?: ListResponse["pagination"];
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
      total_pages?: number;
    };
    const nested = record.bookings ?? record.bookingTours ?? record.booking_tours ?? record.data ?? record.rows ?? record.items;
    return {
      data: Array.isArray(nested) ? nested as StaffBooking[] : [],
      pagination: record.pagination ?? record.meta ?? {
        page: record.page,
        limit: record.limit,
        total: record.total,
        totalPages: record.totalPages,
        total_pages: record.total_pages
      }
    };
  }

  return { data: [] };
}

function unwrapBooking(responseData: unknown) {
  const data = unwrapData<unknown>(responseData as { data?: unknown });
  if (!data || typeof data !== "object") return data as StaffBooking;

  const wrapper = data as {
    booking?: StaffBooking;
    passengers?: StaffBookingPassenger[];
    Passengers?: StaffBookingPassenger[];
    booking_details?: StaffBookingPassenger[];
    bookingDetails?: StaffBookingPassenger[];
    BookingDetail?: StaffBookingPassenger[];
    BookingDetails?: StaffBookingPassenger[];
    details?: StaffBookingPassenger[];
  };

  if (!wrapper.booking) return data as StaffBooking;

  const passengers = wrapper.passengers ?? wrapper.Passengers ?? wrapper.booking_details ?? wrapper.bookingDetails ?? wrapper.BookingDetail ?? wrapper.BookingDetails ?? wrapper.details;
  return { ...wrapper.booking, ...(passengers ? { passengers } : {}) };
}

function unwrapCustomer(responseData: unknown) {
  const data = unwrapData<unknown>(responseData as { data?: unknown });
  if (!data || typeof data !== "object") return { exists: false, message: "Customer lookup returned an invalid response.", customer: null };

  const wrapper = data as {
    exists?: boolean;
    reason?: string | null;
    message?: string | null;
    customer?: StaffCustomer | null;
    user?: StaffCustomer | null;
    data?: StaffCustomerLookupResult | StaffCustomer;
  };

  if ("exists" in wrapper || "customer" in wrapper) return data as StaffCustomerLookupResult;

  const customer = wrapper.user ?? wrapper.data as StaffCustomer | undefined ?? data as StaffCustomer;
  return { exists: Boolean(customer?.user_id ?? customer?.id), customer };
}

export function getStaffBookingId(booking: StaffBooking) {
  return booking.booking_id ?? booking.id ?? 0;
}

export function getStaffBookingCode(booking: StaffBooking) {
  return booking.booking_code ?? booking.code ?? `BK-${getStaffBookingId(booking)}`;
}

export function getStaffBookingCustomer(booking: StaffBooking) {
  const customer = typeof booking.customer === "object" && booking.customer ? booking.customer : null;

  return booking.customer_name ??
    booking.customerName ??
    (typeof booking.customer === "string" ? booking.customer : undefined) ??
    customer?.name ??
    customer?.full_name ??
    customer?.fullName ??
    customer?.email ??
    customer?.phone ??
    booking.user_name ??
    booking.user?.name ??
    booking.user?.full_name ??
    booking.user?.fullName ??
    booking.User?.name ??
    booking.User?.full_name ??
    booking.User?.fullName ??
    booking.user?.email ??
    booking.User?.email ??
    `User #${booking.user_id ?? "-"}`;
}

export function getStaffBookingTourName(booking: StaffBooking) {
  return booking.tour_name ??
    booking.tourName ??
    booking.title ??
    booking.tour?.tour_name ??
    booking.tour?.name ??
    booking.tour?.title ??
    booking.Tour?.tour_name ??
    booking.Tour?.name ??
    booking.Tour?.title ??
    `Tour #${booking.tour_id ?? ""}`;
}

export function getStaffBookingPassengers(booking: StaffBooking) {
  return booking.passengers ?? booking.Passengers ?? booking.booking_details ?? booking.bookingDetails ?? booking.BookingDetail ?? booking.BookingDetails ?? booking.details ?? [];
}

export function getStaffBookingPaymentStatus(booking: StaffBooking) {
  return booking.payment?.status ??
    booking.Payment?.status ??
    booking.payments?.[0]?.status ??
    booking.Payments?.[0]?.status ??
    booking.payment?.payment_status ??
    booking.Payment?.payment_status ??
    booking.payments?.[0]?.payment_status ??
    booking.Payments?.[0]?.payment_status;
}

export function getStaffBookingAmount(booking: StaffBooking) {
  return Number(
    booking.total_amount ??
    booking.totalAmount ??
    booking.final_amount ??
    booking.finalAmount ??
    booking.paid_amount ??
    booking.paidAmount ??
    booking.amount ??
    booking.total_price ??
    booking.totalPrice ??
    booking.price ??
    booking.payment?.amount ??
    booking.Payment?.amount ??
    booking.payments?.[0]?.amount ??
    booking.Payments?.[0]?.amount ??
    getStaffBookingPassengers(booking).reduce((sum, passenger) => sum + Number(passenger.price || 0), 0)
  );
}

export function getStaffBookingTravelDate(booking: StaffBooking) {
  return booking.travel_date ??
    booking.travelDate ??
    booking.departure_at ??
    booking.departureAt ??
    booking.preferred_arrival_time ??
    booking.preferredArrivalTime ??
    booking.arrival_time ??
    booking.arrivalTime ??
    booking.booking_date ??
    booking.bookingDate ??
    "";
}

export const staffBookingService = {
  async lookupCustomer(email: string) {
    const response = await api.get("/staff/customers/lookup", { params: { email } });
    return unwrapCustomer(response.data);
  },
  async create(payload: StaffBookingCreatePayload) {
    const response = await api.post("/staff/bookings", payload);
    return unwrapBooking(response.data);
  },
  async list(params: StaffBookingListParams = {}) {
    const response = await api.get("/staff/bookings", { params });
    return unwrapList(response.data);
  },
  async detail(id: number) {
    const response = await api.get(`/staff/bookings/${id}`);
    return unwrapBooking(response.data);
  },
  async update(id: number, payload: StaffBookingUpdatePayload) {
    const response = await api.put(`/staff/bookings/${id}`, payload);
    return unwrapBooking(response.data);
  },
  async cancel(id: number, reason?: string) {
    const response = await api.patch(`/staff/bookings/${id}/cancel`, { reason: reason || null });
    return unwrapBooking(response.data);
  },
  async confirmManualPayment(id: number, payload: { transaction_code?: string; note?: string } = {}) {
    const response = await api.patch(`/staff/bookings/${id}/confirm-manual-payment`, payload);
    return unwrapBooking(response.data);
  },
  async history(id: number) {
    const response = await api.get(`/staff/bookings/${id}/history`);
    return unwrapData<unknown>(response.data);
  }
};
