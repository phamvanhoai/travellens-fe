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
};

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
