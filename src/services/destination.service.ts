import { api } from "@/services/api";
import type { Destination } from "@/types";
import { getPlainTextFromHtml } from "@/utils/html";

export type PublicTravelDestination = {
  travel_destination_id?: number;
  destination_id?: number;
  id?: number;
  name?: string;
  title?: string;
  description?: string | null;
  thumbnail_url?: string | null;
  thumbnail?: string | null;
  image_url?: string | null;
  image?: string | null;
  country?: string | null;
  city?: string | null;
  region?: string | null;
  address?: string | null;
  rating?: number | string | null;
  average_rating?: number | string | null;
  reviews_count?: number | string | null;
  review_count?: number | string | null;
  price_from?: number | string | null;
  min_price?: number | string | null;
  currency?: string | null;
  best_time?: string | null;
  destination_category?: string | { name?: string | null } | null;
  destination_category_name?: string | null;
  category_name?: string | null;
  category?: string | { name?: string | null } | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  locations?: DestinationRelatedItem[];
  tours?: DestinationRelatedItem[];
  view360?: DestinationRelatedItem[];
  maps?: DestinationRelatedItem[];
  reviews?: DestinationRelatedItem[];
  blogs?: DestinationRelatedItem[];
};

export type DestinationRelatedItem = Record<string, unknown>;

export type DestinationListResult = {
  items: PublicTravelDestination[];
  total: number;
  totalPages: number;
};

export type PublicDestinationCategory = {
  destination_category_id?: number;
  id?: number;
  name: string;
  description?: string | null;
};

function unwrapData<T>(value: T | { data?: T }) {
  if (value && typeof value === "object" && "data" in value) return (value as { data?: T }).data as T;
  return value as T;
}

function unwrapList(value: unknown): DestinationListResult {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = body.data ?? value;
  const listSource = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (data as { items?: unknown; destinations?: unknown; rows?: unknown; results?: unknown; data?: unknown }).items ??
        (data as { destinations?: unknown }).destinations ??
        (data as { rows?: unknown }).rows ??
        (data as { results?: unknown }).results ??
        (data as { data?: unknown }).data
      : data;
  const items = Array.isArray(listSource) ? listSource as PublicTravelDestination[] : [];
  const paginationSource = (body.pagination ?? (data && typeof data === "object" ? (data as { pagination?: unknown }).pagination : undefined)) as
    | { total?: number; totalPages?: number; limit?: number }
    | undefined;
  const total = Number(paginationSource?.total ?? items.length);
  const totalPages = Number(paginationSource?.totalPages ?? Math.max(1, Math.ceil(total / Number(paginationSource?.limit ?? Math.max(items.length, 1)))));
  return { items, total, totalPages };
}

function unwrapDetail(value: unknown) {
  const data = unwrapData<unknown>(value as { data?: unknown });
  if (data && typeof data === "object" && "destination" in data) {
    return (data as { destination?: PublicTravelDestination }).destination as PublicTravelDestination;
  }
  if (data && typeof data === "object" && "travel_destination" in data) {
    return (data as { travel_destination?: PublicTravelDestination }).travel_destination as PublicTravelDestination;
  }
  return data as PublicTravelDestination;
}

export function getPublicDestinationId(destination: PublicTravelDestination) {
  return destination.travel_destination_id ?? destination.destination_id ?? destination.id ?? 0;
}

export function getPublicDestinationImage(destination: PublicTravelDestination, fallback: string) {
  return destination.thumbnail_url ?? destination.thumbnail ?? destination.image_url ?? destination.image ?? fallback;
}

export function getPublicDestinationCategory(destination: PublicTravelDestination) {
  const category = destination.destination_category ?? destination.category;
  if (typeof category === "string") return category;
  return category?.name ?? destination.destination_category_name ?? destination.category_name ?? "Destination";
}

export function toDestinationCardModel(destination: PublicTravelDestination, fallbackImage: string): Destination {
  const id = getPublicDestinationId(destination);
  const description = clampText(getPlainTextFromHtml(destination.description ?? ""), 220);
  return {
    id: String(id),
    name: destination.name ?? destination.title ?? `Destination #${id}`,
    country: destination.country ?? destination.city ?? "Vietnam",
    category: getPublicDestinationCategory(destination),
    region: destination.region ?? destination.address ?? "Vietnam",
    image: getPublicDestinationImage(destination, fallbackImage),
    rating: Number(destination.average_rating ?? destination.rating ?? 4.8),
    reviews: String(destination.reviews_count ?? destination.review_count ?? 0),
    priceFrom: Number(destination.price_from ?? destination.min_price ?? 0),
    currency: destination.currency ?? "VND",
    description,
    bestTime: destination.best_time ?? "All year"
  };
}

export function toDestinationDetailModel(destination: PublicTravelDestination, fallbackImage: string): Destination {
  return {
    ...toDestinationCardModel(destination, fallbackImage),
    description: getPlainTextFromHtml(destination.description ?? "")
  };
}

function clampText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  const trimmed = value.slice(0, maxLength).trim();
  const lastSpace = trimmed.lastIndexOf(" ");
  return `${trimmed.slice(0, lastSpace > 80 ? lastSpace : trimmed.length)}...`;
}

export const destinationService = {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    destination_category_id?: string;
    sortBy?: "created_at" | "updated_at" | "name";
    sortOrder?: "ASC" | "DESC";
  } = {}) {
    const response = await api.get("/travel-destinations", { params });
    return unwrapList(response.data);
  },
  async detail(id: string) {
    const response = await api.get(`/travel-destinations/${id}`);
    return unwrapDetail(response.data);
  },
  async categories() {
    const response = await api.get("/destination-categories");
    const data = unwrapData<unknown>(response.data as { data?: unknown });
    if (Array.isArray(data)) return data as PublicDestinationCategory[];
    if (data && typeof data === "object") {
      const nested = (data as { categories?: unknown; destination_categories?: unknown; data?: unknown }).categories ??
        (data as { destination_categories?: unknown }).destination_categories ??
        (data as { data?: unknown }).data;
      return Array.isArray(nested) ? nested as PublicDestinationCategory[] : [];
    }
    return [];
  }
};
