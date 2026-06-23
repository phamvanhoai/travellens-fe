import { api } from "@/services/api";
import { getPlainTextFromHtml } from "@/utils/html";

export type TravelMapParams = {
  lat?: number;
  lng?: number;
  radius?: number;
  category?: string;
  keyword?: string;
};

export type TravelMapMarker = {
  id: string;
  sourceId?: number | string;
  type: "destination" | "location" | "marker";
  name: string;
  description?: string;
  category?: string;
  latitude: number;
  longitude: number;
  rating?: number;
  hasView360?: boolean;
  imageUrl?: string;
  distanceKm?: number;
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

function readBoolean(record: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value > 0;
    if (typeof value === "string") return ["true", "1", "yes"].includes(value.toLowerCase());
  }

  return undefined;
}

function inferType(record: RawRecord): TravelMapMarker["type"] {
  const type = readString(record, ["type", "marker_type", "entity_type"]);
  if (type === "destination" || type === "travel_destination") return "destination";
  if (type === "location") return "location";
  if ("travel_destination_id" in record || "destination_id" in record) return "destination";
  if ("location_id" in record) return "location";
  return "marker";
}

function normalizeMarker(record: RawRecord, index: number): TravelMapMarker | null {
  const latitude = readNumber(record, ["latitude", "lat"]);
  const longitude = readNumber(record, ["longitude", "lng", "lon"]);
  if (latitude === undefined || longitude === undefined) return null;

  const type = inferType(record);
  const sourceId = type === "location"
    ? readString(record, ["location_id", "id", "marker_id", "map_id"])
    : type === "destination"
      ? readString(record, ["travel_destination_id", "destination_id", "id", "marker_id"])
      : readString(record, ["marker_id", "id", "location_id", "travel_destination_id", "destination_id", "map_id"]);

  return {
    id: `${type}-${sourceId ?? index}`,
    sourceId,
    type,
    name: readString(record, ["name", "title", "location_name", "destination_name"]) ?? "Untitled place",
    description: getPlainTextFromHtml(readString(record, ["description", "summary", "address"])),
    category: readString(record, ["category", "category_name", "destination_category_name"]),
    latitude,
    longitude,
    rating: readNumber(record, ["rating", "average_rating", "avg_rating"]),
    hasView360: readBoolean(record, ["has_view360", "hasView360", "view360_available", "view360_count"]),
    imageUrl: readString(record, ["thumbnail_url", "thumbnail", "image_url", "image", "map_url", "map_file"]),
    distanceKm: readNumber(record, ["distance_km", "distanceKm", "distance"])
  };
}

function collectRecords(data: unknown): RawRecord[] {
  if (Array.isArray(data)) {
    return data.filter((item): item is RawRecord => Boolean(item) && typeof item === "object" && !Array.isArray(item));
  }

  if (!data || typeof data !== "object") return [];

  const record = data as RawRecord;
  const preferredKeys = ["markers", "locations", "destinations", "travel_destinations", "items", "results"];
  const records = preferredKeys.flatMap((key) => collectRecords(record[key]));

  if (records.length > 0) return records;

  return [record];
}

function normalizeMarkers(data: unknown) {
  const seen = new Set<string>();
  return collectRecords(unwrapResponse(data))
    .map(normalizeMarker)
    .filter((marker): marker is TravelMapMarker => Boolean(marker))
    .filter((marker) => {
      const key = `${marker.type}-${marker.sourceId ?? marker.latitude}-${marker.longitude}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((marker, index) => ({
      ...marker,
      id: `${marker.id}-${index}`
    }));
}

export const mapService = {
  async travel(params: TravelMapParams = {}) {
    const response = await api.get("/maps/travel", { params });
    return normalizeMarkers(response.data);
  },
  async nearby(params: Required<Pick<TravelMapParams, "lat" | "lng">> & Pick<TravelMapParams, "radius">) {
    const response = await api.get("/maps/nearby", { params });
    return normalizeMarkers(response.data);
  },
  async filter(params: Record<string, string | number | boolean | undefined>) {
    const response = await api.get("/maps/filter", { params });
    return normalizeMarkers(response.data);
  }
};
