import { api } from "@/services/api";

export type PublicLocation = {
  location_id?: number;
  id?: number;
  name: string;
  title?: string;
  description?: string | null;
  address?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  rating?: number | string | null;
  average_rating?: number | string | null;
  reviews_count?: number | string | null;
  review_count?: number | string | null;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  image?: string | null;
  image_url?: string | null;
  map_url?: string | null;
  map_file?: string | null;
  travel_destination_id?: number;
  travel_destination_name?: string;
  travel_destination?: {
    travel_destination_id?: number;
    destination_id?: number;
    id?: number;
    name?: string | null;
    country?: string | null;
    city?: string | null;
    thumbnail?: string | null;
    thumbnail_url?: string | null;
    image?: string | null;
    image_url?: string | null;
  } | null;
  TravelDestination?: PublicLocation["travel_destination"];
  maps?: Record<string, unknown>[];
  Maps?: Record<string, unknown>[];
  view360?: Record<string, unknown>[];
  view360s?: Record<string, unknown>[];
  View360s?: Record<string, unknown>[];
  reviews?: Record<string, unknown>[];
  Reviews?: Record<string, unknown>[];
};

function unwrapData<T>(responseData: T | { data?: T }) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    const data = (responseData as { data?: T }).data as T;
    if (data && typeof data === "object" && "location" in data) {
      return (data as { location?: T }).location as T;
    }
    return data;
  }
  return responseData as T;
}

function unwrapList(responseData: unknown) {
  const data = unwrapData<unknown>(responseData as { data?: unknown });
  if (Array.isArray(data)) return data as PublicLocation[];
  if (data && typeof data === "object") {
    const nested = (data as { locations?: unknown; data?: unknown }).locations ?? (data as { data?: unknown }).data;
    return Array.isArray(nested) ? nested as PublicLocation[] : [];
  }
  return [];
}

export function getPublicLocationId(location: PublicLocation) {
  return location.location_id ?? location.id ?? 0;
}

export const locationService = {
  async list(params: { page?: number; limit?: number; search?: string; destination_id?: number; sortBy?: "location_id" | "name" | "created_at" | "updated_at"; sortOrder?: "ASC" | "DESC" } = {}) {
    const response = await api.get("/locations", { params });
    return unwrapList(response.data);
  },
  async detail(id: string) {
    const response = await api.get(`/locations/${id}`);
    return unwrapData<PublicLocation>(response.data);
  }
};
