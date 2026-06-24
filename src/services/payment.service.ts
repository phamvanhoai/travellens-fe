import { api } from "@/services/api";

export type CustomerPaymentStatus = "pending" | "paid" | "failed" | "expired" | "refunded" | string;

export type CustomerPayment = {
  payment_id?: number;
  id?: number;
  booking_id?: number;
  payment_code?: string;
  code?: string;
  amount?: number | string;
  currency?: string;
  status?: CustomerPaymentStatus;
  bank_account?: string | null;
  bank_name?: string | null;
  transfer_content?: string;
  qr_url?: string | null;
  expired_at?: string;
  created_at?: string;
  updated_at?: string;
};

function unwrapData<T>(value: T | { data?: T }) {
  if (value && typeof value === "object" && "data" in value) return (value as { data?: T }).data as T;
  return value as T;
}

function unwrapPayment(value: unknown) {
  const data = unwrapData<unknown>(value as { data?: unknown });
  if (data && typeof data === "object" && "payment" in data && "status" in data) {
    return {
      ...((data as { payment?: CustomerPayment }).payment ?? {}),
      status: (data as { status?: CustomerPaymentStatus }).status
    } as CustomerPayment;
  }
  if (data && typeof data === "object" && "payment" in data) {
    return (data as { payment?: CustomerPayment }).payment ?? data as CustomerPayment;
  }
  return data as CustomerPayment;
}

function unwrapPaymentStatus(value: unknown) {
  const data = unwrapData<unknown>(value as { data?: unknown });

  if (typeof data === "string") return { status: data };
  if (!data || typeof data !== "object") return {};

  const record = data as {
    status?: CustomerPaymentStatus;
    payment_status?: CustomerPaymentStatus;
    payment?: CustomerPayment;
  };

  return {
    ...(record.payment ?? {}),
    status: record.status ?? record.payment_status ?? record.payment?.status
  } as CustomerPayment;
}

export function getCustomerPaymentId(payment: CustomerPayment) {
  return payment.payment_id ?? payment.id ?? 0;
}

export function getCustomerPaymentCode(payment: CustomerPayment) {
  return payment.payment_code ?? payment.code ?? "";
}

export const paymentService = {
  async create(bookingId: number | string) {
    const response = await api.post("/payments", { booking_id: Number(bookingId) });
    return unwrapPayment(response.data);
  },
  async detail(id: number | string) {
    const response = await api.get(`/payments/${id}`);
    return unwrapPayment(response.data);
  },
  async status(id: number | string) {
    const response = await api.get(`/payments/${id}/status`);
    return unwrapPaymentStatus(response.data);
  }
};
