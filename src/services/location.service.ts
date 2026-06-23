import { api } from "@/services/api";

export type PublicLocation = {
  location_id?: number;
  id?: number;
  name: string;
  description?: string;
  travel_destination_id?: number;
  travel_destination_name?: string;
};

function unwrapData<T>(responseData: T | { data?: T }) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data?: T }).data as T;
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
  async list() {
    const response = await api.get("/locations");
    return unwrapList(response.data);
  },
  async detail(id: string) {
    const response = await api.get(`/locations/${id}`);
    return unwrapData<PublicLocation>(response.data);
  }
};
