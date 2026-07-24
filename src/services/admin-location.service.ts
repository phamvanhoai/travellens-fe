import { api } from "@/services/api";

export type AdminLocation = {
  location_id?: number;
  id?: number;
  name: string;
  description?: string;
  travel_destination_id?: number | string | null;
  destination_id?: number | string | null;
  travel_destination_name?: string;
  destination_name?: string;
  thumbnail_url?: string;
  thumbnail?: string;
  thumbnail_file?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  map_count?: number;
  maps_count?: number;
  view360_count?: number;
  view360s_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type AdminLocationPayload = {
  travel_destination_id: string;
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  thumbnail_file?: File | null;
};

type ListResponse = {
  data?: AdminLocation[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
};

function unwrapList(responseData: unknown): ListResponse {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    const body = responseData as ListResponse;
    return {
      data: Array.isArray(body.data) ? body.data : [],
      pagination: body.pagination
    };
  }

  return {
    data: Array.isArray(responseData) ? responseData as AdminLocation[] : []
  };
}

function toFormData(payload: AdminLocationPayload, includeDestination: boolean) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  if (includeDestination) formData.append("travel_destination_id", payload.travel_destination_id);
  formData.append("latitude", payload.latitude);
  formData.append("longitude", payload.longitude);
  if (payload.thumbnail_file) formData.append("thumbnail_file", payload.thumbnail_file);
  return formData;
}

export function getLocationId(location: AdminLocation) {
  return location.location_id ?? location.id ?? 0;
}

export function getLocationDestinationId(location: AdminLocation) {
  return location.travel_destination_id ?? location.destination_id ?? "";
}

export function getLocationThumbnail(location: AdminLocation) {
  return location.thumbnail_url ?? location.thumbnail ?? location.thumbnail_file ?? "";
}

export function getLocationDestinationName(location: AdminLocation) {
  return location.travel_destination_name ?? location.destination_name ?? getLocationDestinationId(location) ?? "-";
}

export const adminLocationService = {
  async list(params: { page?: number; limit?: number; search?: string; travel_destination_id?: string } = {}) {
    const response = await api.get("/admin/locations", { params });
    return unwrapList(response.data);
  },
  async create(payload: AdminLocationPayload) {
    const response = await api.post("/admin/locations", toFormData(payload, true));
    return response.data;
  },
  async update(id: number, payload: AdminLocationPayload) {
    const response = await api.put(`/admin/locations/${id}`, toFormData(payload, true));
    return response.data;
  },
  async remove(id: number) {
    const response = await api.delete(`/admin/locations/${id}`);
    return response.data;
  }
};
