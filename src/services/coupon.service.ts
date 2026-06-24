import { api } from "@/services/api";

export type CouponValidationResult = {
  valid?: boolean;
  code?: string;
  message?: string;
  discount_amount?: number | string;
  discountAmount?: number | string;
  final_amount?: number | string;
  finalAmount?: number | string;
  booking_amount?: number | string;
  bookingAmount?: number | string;
  coupon?: {
    code?: string;
    discount_type?: string;
    discount_value?: number | string;
    max_discount_amount?: number | string | null;
  };
};

function unwrapData<T>(value: T | { data?: T }) {
  if (value && typeof value === "object" && "data" in value) return (value as { data?: T }).data as T;
  return value as T;
}

export const couponService = {
  async validate(payload: { code: string; booking_amount: number }) {
    const response = await api.post("/coupons/validate", payload);
    return unwrapData<CouponValidationResult>(response.data);
  }
};
