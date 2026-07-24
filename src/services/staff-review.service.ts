import { api } from "@/services/api";

export type StaffReviewStatus = "pending" | "approved" | "hidden" | string;

export type StaffReview = {
  review_id?: number;
  id?: number;
  user_id?: number;
  location_id?: number;
  tour_id?: number;
  booking_id?: number;
  rating: number;
  comment?: string;
  status: StaffReviewStatus;
  user_name?: string;
  user_email?: string;
  location_name?: string;
  tour_name?: string;
  user?: { user_id?: number; id?: number; name?: string; email?: string };
  location?: { location_id?: number; id?: number; name?: string };
};

export type StaffReviewPayload = {
  user_id: number;
  location_id: number;
  rating: number;
  comment: string;
  status: string;
};

function unwrapData<T>(responseData: T | { data?: T }) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data?: T }).data as T;
  }
  return responseData as T;
}

type StaffReviewListResult = {
  data: StaffReview[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
};

function unwrapList(responseData: unknown): StaffReviewListResult {
  const body = responseData && typeof responseData === "object"
    ? responseData as { data?: unknown; pagination?: Partial<StaffReviewListResult["pagination"]> }
    : {};
  return {
    data: Array.isArray(body.data) ? body.data as StaffReview[] : [],
    pagination: {
      page: Number(body.pagination?.page || 1),
      limit: Number(body.pagination?.limit || 5),
      total: Number(body.pagination?.total || 0),
      totalPages: Math.max(1, Number(body.pagination?.totalPages || 1))
    }
  };
}

export function getStaffReviewId(review: StaffReview) {
  return review.review_id ?? review.id ?? 0;
}

export function getStaffReviewUserId(review: StaffReview) {
  return review.user_id ?? review.user?.user_id ?? review.user?.id ?? 0;
}

export function getStaffReviewLocationId(review: StaffReview) {
  return review.location_id ?? review.location?.location_id ?? review.location?.id ?? 0;
}

export function getStaffReviewUserName(review: StaffReview) {
  return review.user_name ?? review.user?.name ?? `#${getStaffReviewUserId(review)}`;
}

export function getStaffReviewLocationName(review: StaffReview) {
  return review.location_name ?? review.location?.name ?? `#${getStaffReviewLocationId(review)}`;
}

export function getStaffReviewTarget(review: StaffReview) {
  if (review.tour_id || review.tour_name) return { type: "Tour", name: review.tour_name ?? `Tour #${review.tour_id}`, id: review.tour_id ?? 0 };
  return { type: "Location", name: review.location_name ?? review.location?.name ?? `Location #${getStaffReviewLocationId(review)}`, id: getStaffReviewLocationId(review) };
}

export const staffReviewService = {
  async list(params: { page?: number; limit?: number; search?: string; status?: string; rating?: number } = {}) {
    const response = await api.get("/staff/reviews", { params });
    return unwrapList(response.data);
  },
  async detail(id: number) {
    const response = await api.get(`/staff/reviews/${id}`);
    return unwrapData<StaffReview>(response.data);
  },
  async create(payload: StaffReviewPayload) {
    const response = await api.post("/staff/reviews", payload);
    return unwrapData<StaffReview>(response.data);
  },
  async update(id: number, payload: StaffReviewPayload) {
    const response = await api.put(`/staff/reviews/${id}`, payload);
    return unwrapData<StaffReview>(response.data);
  },
  async remove(id: number) {
    const response = await api.delete(`/staff/reviews/${id}`);
    return unwrapData<unknown>(response.data);
  }
};
