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

function unwrapList(responseData: unknown) {
  const data = unwrapData<unknown>(responseData as { data?: unknown });
  if (Array.isArray(data)) return data as StaffReview[];
  if (data && typeof data === "object") {
    const nested = (data as { reviews?: unknown; data?: unknown }).reviews ?? (data as { data?: unknown }).data;
    return Array.isArray(nested) ? nested as StaffReview[] : [];
  }
  return [];
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
  async list() {
    const response = await api.get("/staff/reviews", { params: { page: 1, limit: 100 } });
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
