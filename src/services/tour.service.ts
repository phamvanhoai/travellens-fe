import { api } from "@/services/api";

export type PublicTour = {
  tour_id?: number;
  id?: number;
  name?: string;
  title?: string;
  description?: string;
  price?: number | string;
  capacity?: number | string;
  status?: string;
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

export function getPublicTourId(tour: PublicTour) { return tour.tour_id ?? tour.id ?? 0; }
export function getPublicTourName(tour: PublicTour) { return tour.name ?? tour.title ?? `Tour #${getPublicTourId(tour)}`; }

export const tourService = {
  async list() {
    const response = await api.get("/tours");
    return unwrapList(response.data);
  },
  async detail(id: string) {
    const response = await api.get(`/tours/${id}`);
    return unwrapData<PublicTour>(response.data);
  }
};
