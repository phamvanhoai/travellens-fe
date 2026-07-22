import { api } from "@/services/api";

export type StaffCouponStatus = "active" | "inactive" | "expired" | "archived";
export type StaffCouponDiscountType = "percentage" | "fixed";

export type StaffCoupon = {
  coupon_id?: number;
  id?: number;
  code: string;
  name: string;
  description?: string;
  discount_type: StaffCouponDiscountType;
  discount_value: number | string;
  max_discount_amount?: number | string | null;
  min_order_amount?: number | string | null;
  usage_limit?: number | string | null;
  start_date?: string;
  end_date?: string;
  status: StaffCouponStatus;
  created_at?: string;
  updated_at?: string;
};

export type StaffCouponPayload = {
  code: string;
  name: string;
  description: string;
  discount_type: StaffCouponDiscountType;
  discount_value: string;
  max_discount_amount: string;
  min_order_amount: string;
  usage_limit: string;
  start_date: string;
  end_date: string;
  status: StaffCouponStatus;
};

type ListResponse = {
  data?: StaffCoupon[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
};

function unwrapList(responseData: unknown): ListResponse {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    const body = responseData as ListResponse;
    return {
      data: Array.isArray(body.data) ? body.data : [],
      pagination: body.pagination
    };
  }

  return {
    data: Array.isArray(responseData) ? responseData as StaffCoupon[] : []
  };
}

function toRequestPayload(payload: StaffCouponPayload, includeCode: boolean) {
  return {
    ...(includeCode ? { code: payload.code } : {}),
    name: payload.name,
    description: payload.description,
    discount_type: payload.discount_type,
    discount_value: Number(payload.discount_value),
    max_discount_amount: payload.max_discount_amount === "" ? null : Number(payload.max_discount_amount),
    min_order_amount: Number(payload.min_order_amount || 0),
    usage_limit: Number(payload.usage_limit),
    start_date: payload.start_date,
    end_date: payload.end_date,
    status: payload.status
  };
}

export function getStaffCouponId(coupon: StaffCoupon) {
  return coupon.coupon_id ?? coupon.id ?? 0;
}

export const staffCouponService = {
  async list(params: { page?: number; limit?: number; search?: string; status?: string; discount_type?: string } = {}) {
    const response = await api.get("/staff/coupons", { params });
    return unwrapList(response.data);
  },
  async create(payload: StaffCouponPayload) {
    const response = await api.post("/staff/coupons", toRequestPayload(payload, true));
    return response.data;
  },
  async update(id: number, payload: StaffCouponPayload) {
    const response = await api.put(`/staff/coupons/${id}`, toRequestPayload(payload, false));
    return response.data;
  },
  async remove(id: number) {
    const response = await api.delete(`/staff/coupons/${id}`);
    return response.data;
  },
  async archive(id: number) {
    const response = await api.patch(`/staff/coupons/${id}/archive`);
    return response.data;
  }
};
