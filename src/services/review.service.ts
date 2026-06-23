import { api } from "@/services/api";

export type CustomerReview = {
  review_id?: number;
  id?: number;
  user_id?: number;
  location_id?: number;
  rating: number;
  comment?: string;
  status?: string;
  created_at?: string;
  user_name?: string;
  location_name?: string;
  user?: { user_id?: number; id?: number; name?: string };
  location?: { location_id?: number; id?: number; name?: string };
};

function unwrapData<T>(responseData: T | { data?: T }) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data?: T }).data as T;
  }
  return responseData as T;
}

function unwrapList(responseData: unknown) {
  const data = unwrapData<unknown>(responseData as { data?: unknown });
  if (Array.isArray(data)) return data as CustomerReview[];
  if (data && typeof data === "object") {
    const nested = (data as { reviews?: unknown; data?: unknown }).reviews ?? (data as { data?: unknown }).data;
    return Array.isArray(nested) ? nested as CustomerReview[] : [];
  }
  return [];
}

export function getCustomerReviewId(review: CustomerReview) {
  return review.review_id ?? review.id ?? 0;
}

export function getCustomerReviewUserId(review: CustomerReview) {
  return review.user_id ?? review.user?.user_id ?? review.user?.id ?? 0;
}

export function getCustomerReviewLocationId(review: CustomerReview) {
  return review.location_id ?? review.location?.location_id ?? review.location?.id ?? 0;
}

export function getCustomerReviewLocationName(review: CustomerReview) {
  return review.location_name ?? review.location?.name ?? `Location #${getCustomerReviewLocationId(review)}`;
}

export const reviewService = {
  async list() {
    const response = await api.get("/reviews");
    return unwrapList(response.data);
  },
  async detail(id: number) {
    const response = await api.get(`/reviews/${id}`);
    return unwrapData<CustomerReview>(response.data);
  },
  async createForLocation(locationId: number, payload: { rating: number; comment: string }) {
    const response = await api.post(`/locations/${locationId}/reviews`, payload);
    return unwrapData<CustomerReview>(response.data);
  },
  async uploadPhotos(reviewId: number, photos: File[]) {
    const formData = new FormData();
    photos.forEach((photo) => formData.append("photos", photo));
    const response = await api.post(`/reviews/${reviewId}/photos`, formData);
    return response.data;
  }
};
