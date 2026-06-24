import { api } from "@/services/api";
import { getPlainTextFromHtml } from "@/utils/html";

export type RoutePoint = {
  latitude: number;
  longitude: number;
};

export type RouteStop = RoutePoint & {
  id: string;
  sourceId?: number | string;
  name: string;
  description?: string;
  order: number;
};

export type TourNavigationRoute = {
  tourId: string;
  title?: string;
  distanceKm?: number;
  durationMinutes?: number;
  points: RoutePoint[];
  stops: RouteStop[];
};

type RawRecord = Record<string, unknown>;

function unwrapResponse(responseData: unknown) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data: unknown }).data;
  }

  return responseData;
}

function readString(record: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }

  return undefined;
}

function readNumber(record: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return undefined;
}

function normalizePoint(value: unknown): RoutePoint | null {
  if (Array.isArray(value) && value.length >= 2) {
    const latitude = Number(value[0]);
    const longitude = Number(value[1]);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
  }

  if (!value || typeof value !== "object") return null;

  const record = value as RawRecord;
  const latitude = readNumber(record, ["latitude", "lat"]);
  const longitude = readNumber(record, ["longitude", "lng", "lon"]);
  if (latitude === undefined || longitude === undefined) return null;

  return { latitude, longitude };
}

function collectArray(data: unknown, keys: string[]): unknown[] {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const record = data as RawRecord;
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value;
  }

  for (const value of Object.values(record)) {
    if (value && typeof value === "object") {
      const nested = collectArray(value, keys);
      if (nested.length > 0) return nested;
    }
  }

  return [];
}

function normalizeStop(value: unknown, index: number): RouteStop | null {
  const point = normalizePoint(value);
  if (!point || !value || typeof value !== "object") return null;

  const record = value as RawRecord;
  const sourceId = readString(record, ["tour_destination_id", "travel_destination_id", "destination_id", "location_id", "id"]);

  return {
    ...point,
    id: `stop-${sourceId ?? index}-${index}`,
    sourceId,
    name: readString(record, ["name", "title", "destination_name", "location_name"]) ?? `Stop ${index + 1}`,
    description: getPlainTextFromHtml(readString(record, ["description", "summary", "note", "address"])),
    order: readNumber(record, ["order_index", "display_order", "sequence", "order"]) ?? index + 1
  };
}

function normalizeRoute(responseData: unknown, tourId: string): TourNavigationRoute {
  const data = unwrapResponse(responseData);
  const root = data && typeof data === "object" ? data as RawRecord : {};
  const stops = collectArray(data, ["stops", "destinations", "tour_destinations", "itinerary", "locations"])
    .map(normalizeStop)
    .filter((stop): stop is RouteStop => Boolean(stop))
    .sort((a, b) => a.order - b.order);

  const explicitPoints = collectArray(data, ["polyline", "polyline_points", "route_points", "points", "coordinates"])
    .map(normalizePoint)
    .filter((point): point is RoutePoint => Boolean(point));

  return {
    tourId,
    title: readString(root, ["title", "tour_name", "name"]),
    distanceKm: readNumber(root, ["distance_km", "total_distance_km", "distance"]),
    durationMinutes: readNumber(root, ["duration_minutes", "total_duration_minutes", "duration"]),
    points: explicitPoints.length > 0 ? explicitPoints : stops.map(({ latitude, longitude }) => ({ latitude, longitude })),
    stops
  };
}

export const navigationService = {
  async getTourRoute(tourId: string | number) {
    const response = await api.get(`/navigation/routes/${tourId}`);
    return normalizeRoute(response.data, String(tourId));
  }
};
