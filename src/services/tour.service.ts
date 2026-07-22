import { api } from "@/services/api";

export type PublicTour = {
  tour_id?: number;
  id?: number;
  name?: string;
  title?: string;
  destination?: string;
  destination_name?: string;
  description?: string;
  short_description?: string;
  thumbnail_url?: string;
  thumbnail?: string;
  price?: number | string;
  child_price?: number | string;
  infant_price?: number | string;
  currency?: string;
  minimum_booking?: number | string;
  maximum_booking?: number | string | null;
  start_time?: string;
  end_time?: string;
  duration_days?: number | string;
  duration_nights?: number | string;
  tour_type?: string;
  languages?: string[];
  meeting_point?: string | null;
  pickup_available?: boolean;
  pickup_description?: string | null;
  booking_policy?: string | null;
  cancellation_policy?: string | null;
  schedule?: string;
  capacity?: number | string;
  available_slots?: number | string;
  remaining_slots?: number | string;
  available_capacity?: number | string;
  destinations?: PublicTourDestination[];
  travel_destinations?: PublicTourDestination[];
  tour_destinations?: PublicTourDestination[];
  TourDestinations?: PublicTourDestination[];
  status?: string;
  average_rating?: number | string;
  review_count?: number | string;
  tour_category?: string | PublicTourCategory;
};

export type PublicTourCategory = {
  tour_category_id?: number;
  id?: number;
  name: string;
};

export type PublicTourListParams = {
  page?: number;
  limit?: number;
  search?: string;
  tour_category_id?: number;
  min_price?: number;
  max_price?: number;
  tour_type?: "group" | "private" | "self_guided";
  min_duration?: number;
  max_duration?: number;
  min_rating?: number;
  language?: string;
};

export type PublicTourListResult = { items: PublicTour[]; total: number; totalPages: number };
export type TourAvailability = { tour_id: number; travel_date: string; departure_at: string; capacity: number; booked_slots: number; available_slots: number };

export type PublicTourDestination = {
  name?: string;
  destination_name?: string;
  travel_destination_name?: string;
  travel_destination?: { name?: string; country?: string; city?: string };
  TravelDestination?: { name?: string; country?: string; city?: string };
  destination?: { name?: string; country?: string; city?: string };
  travelDestination?: { name?: string; country?: string; city?: string };
  country?: string;
  city?: string;
};

function unwrapData<T>(value: T | { data?: T }) {
  if (value && typeof value === "object" && "data" in value) return (value as { data?: T }).data as T;
  return value as T;
}

function unwrapList(value: unknown) {
  const data = unwrapData<unknown>(value as { data?: unknown });
  if (Array.isArray(data)) return data as PublicTour[];
  if (data && typeof data === "object") {
    const nested = (data as { tours?: unknown; data?: unknown }).tours ?? (data as { data?: unknown }).data;
    return Array.isArray(nested) ? nested as PublicTour[] : [];
  }
  return [];
}

function unwrapPaginatedList(value: unknown): PublicTourListResult {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const items = unwrapList(value);
  const pagination = body.pagination as { total?: number; totalPages?: number } | undefined;
  return {
    items,
    total: Number(pagination?.total ?? items.length),
    totalPages: Number(pagination?.totalPages ?? 1) || 1
  };
}

export function getPublicTourId(tour: PublicTour) { return tour.tour_id ?? tour.id ?? 0; }
export function getPublicTourName(tour: PublicTour) { return tour.name ?? tour.title ?? `Tour #${getPublicTourId(tour)}`; }

export const tourService = {
  async list(params: PublicTourListParams = {}) {
    const response = await api.get("/tours", { params });
    return unwrapList(response.data);
  },
  async listPaginated(params: PublicTourListParams = {}) {
    const response = await api.get("/tours", { params });
    return unwrapPaginatedList(response.data);
  },
  async categories() {
    const response = await api.get("/tour-categories");
    const data = unwrapData<unknown>(response.data);
    if (Array.isArray(data)) return data as PublicTourCategory[];
    if (data && typeof data === "object") {
      const nested = (data as { items?: unknown; categories?: unknown; data?: unknown }).items
        ?? (data as { categories?: unknown }).categories
        ?? (data as { data?: unknown }).data;
      return Array.isArray(nested) ? nested as PublicTourCategory[] : [];
    }
    return [];
  },
  async detail(id: string) {
    const response = await api.get(`/tours/${id}`);
    return unwrapData<PublicTour>(response.data);
  },
  async availability(id: string, travelDate: string) {
    const response = await api.get(`/tours/${id}/availability`, { params: { travel_date: travelDate } });
    return unwrapData<TourAvailability>(response.data);
  }
};
