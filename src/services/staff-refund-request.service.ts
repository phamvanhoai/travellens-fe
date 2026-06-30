import { api } from "@/services/api";

export type StaffRefundRequestStatus = "pending" | "approved" | "rejected" | "completed" | string;

export type StaffRefundRequest = {
  refund_request_id?: number;
  id?: number;
  booking_id?: number;
  payment_id?: number;
  user_id?: number;
  customer_name?: string;
  amount?: number | string;
  refund_amount?: number | string;
  currency?: string;
  status?: StaffRefundRequestStatus;
  reason?: string | null;
  customer_note?: string | null;
  staff_note?: string | null;
  transaction_code?: string | null;
  created_at?: string;
  updated_at?: string;
  completed_at?: string | null;
  booking?: {
    booking_id?: number;
    id?: number;
    booking_code?: string;
    code?: string;
    total_amount?: number | string;
    user?: { name?: string; email?: string };
  };
  payment?: {
    payment_id?: number;
    id?: number;
    payment_code?: string;
    code?: string;
    amount?: number | string;
    status?: string;
  };
  user?: { user_id?: number; id?: number; name?: string; email?: string };
};

export type StaffRefundRequestFilters = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  booking_id?: string;
  payment_id?: string;
};

export type StaffRefundActionPayload = {
  staff_note?: string;
  transaction_code?: string;
};

function unwrapData<T>(responseData: T | { data?: T }) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data?: T }).data as T;
  }
  return responseData as T;
}

type StaffRefundRequestListResponse = {
  data: StaffRefundRequest[];
  pagination?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    total_pages?: number;
  };
};

function unwrapList(responseData: unknown): StaffRefundRequestListResponse {
  const data = unwrapData<unknown>(responseData as { data?: unknown });

  if (Array.isArray(data)) return { data };

  if (data && typeof data === "object") {
    const record = data as {
      refundRequests?: unknown;
      refund_requests?: unknown;
      requests?: unknown;
      data?: unknown;
      rows?: unknown;
      items?: unknown;
      pagination?: StaffRefundRequestListResponse["pagination"];
      meta?: StaffRefundRequestListResponse["pagination"];
      page?: number;
      limit?: number;
      total?: number;
      totalPages?: number;
      total_pages?: number;
    };
    const nested = record.refundRequests ?? record.refund_requests ?? record.requests ?? record.data ?? record.rows ?? record.items;
    return {
      data: Array.isArray(nested) ? nested as StaffRefundRequest[] : [],
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

export function getStaffRefundRequestId(item: StaffRefundRequest) {
  return item.refund_request_id ?? item.id ?? 0;
}

export function getStaffRefundBookingId(item: StaffRefundRequest) {
  return item.booking_id ?? item.booking?.booking_id ?? item.booking?.id ?? 0;
}

export function getStaffRefundPaymentId(item: StaffRefundRequest) {
  return item.payment_id ?? item.payment?.payment_id ?? item.payment?.id ?? 0;
}

export function getStaffRefundPaymentCode(item: StaffRefundRequest) {
  return item.payment?.payment_code ?? item.payment?.code ?? (getStaffRefundPaymentId(item) ? `#${getStaffRefundPaymentId(item)}` : "-");
}

export function getStaffRefundCustomer(item: StaffRefundRequest) {
  return item.customer_name ?? item.user?.name ?? item.booking?.user?.name ?? item.user?.email ?? item.booking?.user?.email ?? `#${item.user_id ?? "-"}`;
}

export function getStaffRefundAmount(item: StaffRefundRequest) {
  return item.refund_amount ?? item.amount ?? item.payment?.amount ?? item.booking?.total_amount ?? 0;
}

export const staffRefundRequestService = {
  async list(filters: StaffRefundRequestFilters = {}) {
    const params = {
      ...(filters.page ? { page: filters.page } : {}),
      ...(filters.limit ? { limit: filters.limit } : {}),
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.booking_id ? { booking_id: Number(filters.booking_id) } : {}),
      ...(filters.payment_id ? { payment_id: Number(filters.payment_id) } : {})
    };
    const response = await api.get("/staff/refund-requests", { params });
    return unwrapList(response.data);
  },
  async approve(id: number, payload: StaffRefundActionPayload) {
    const response = await api.patch(`/staff/refund-requests/${id}/approve`, { staff_note: payload.staff_note || null });
    return unwrapData<StaffRefundRequest>(response.data);
  },
  async reject(id: number, payload: StaffRefundActionPayload) {
    const response = await api.patch(`/staff/refund-requests/${id}/reject`, { staff_note: payload.staff_note || null });
    return unwrapData<StaffRefundRequest>(response.data);
  },
  async complete(id: number, payload: StaffRefundActionPayload) {
    const response = await api.patch(`/staff/refund-requests/${id}/complete`, {
      transaction_code: payload.transaction_code || null,
      staff_note: payload.staff_note || null
    });
    return unwrapData<StaffRefundRequest>(response.data);
  }
};
