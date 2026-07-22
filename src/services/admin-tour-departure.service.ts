import { api } from "@/services/api";

export type AdminTourDeparture = {
  tour_departure_id: number; tour_id: number; departure_at: string; capacity: number; booked_slots: number; available_slots: number;
  price: number | string; child_price: number | string; infant_price: number | string; currency: string;
  booking_open_at?: string | null; booking_close_at?: string | null; status: string;
};
export type AdminTourDeparturePayload = {
  departure_at: string; capacity: number; price?: number; child_price?: number; infant_price?: number; currency?: string;
  booking_open_at?: string | null; booking_close_at?: string | null; status: string;
};
export type BulkTourDeparturePayload = {
  start_date: string; end_date: string; weekdays: number[]; departure_time: string;
  capacity?: number; price?: number; child_price?: number; infant_price?: number; currency?: string;
  booking_open_at?: string | null; booking_close_hours_before?: number | null; status: "draft" | "open" | "closed";
};
export type BulkTourDepartureResult = { created_count: number; skipped_count: number; requested_count: number; departures: AdminTourDeparture[] };
export type AdminTourDepartureList = { data: AdminTourDeparture[]; pagination: { page: number; limit: number; total: number; totalPages: number } };
function unwrap<T>(value: unknown): T { return (value && typeof value === "object" && "data" in value ? (value as { data: T }).data : value) as T; }
export const adminTourDepartureService = {
  async list(tourId: number, params: { page?: number; limit?: number; search?: string; status?: string; date_from?: string; date_to?: string } = {}) { const body = (await api.get(`/admin/tours/${tourId}/departures`, { params })).data as { data?: AdminTourDeparture[]; pagination?: AdminTourDepartureList["pagination"] }; return { data: body.data ?? [], pagination: body.pagination ?? { page: 1, limit: params.limit ?? 10, total: body.data?.length ?? 0, totalPages: 1 } }; },
  async create(tourId: number, payload: AdminTourDeparturePayload) { return unwrap<AdminTourDeparture>((await api.post(`/admin/tours/${tourId}/departures`, payload)).data); },
  async bulkCreate(tourId: number, payload: BulkTourDeparturePayload) { return unwrap<BulkTourDepartureResult>((await api.post(`/admin/tours/${tourId}/departures/bulk`, payload)).data); },
  async update(tourId: number, id: number, payload: Partial<AdminTourDeparturePayload>) { return unwrap<AdminTourDeparture>((await api.put(`/admin/tours/${tourId}/departures/${id}`, payload)).data); },
  async remove(tourId: number, id: number) { await api.delete(`/admin/tours/${tourId}/departures/${id}`); }
};
