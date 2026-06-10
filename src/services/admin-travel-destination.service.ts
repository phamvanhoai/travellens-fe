import { api } from "@/services/api";

export type AdminTravelDestination = {
  travel_destination_id?: number;
  destination_id?: number;
  id?: number;
  name: string;
  description?: string;
  thumbnail_url?: string;
  thumbnail?: string;
  thumbnail_file?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  destination_category_id?: number | string | null;
  destination_category_name?: string;
  category_name?: string;
};

export type AdminTravelDestinationPayload = {
  name: string;
  description: string;
  latitude: string;
  longitude: string;
  destination_category_id: string;
  thumbnail_file?: File | null;
};

type ListResponse = {
  data?: AdminTravelDestination[];
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
    data: Array.isArray(responseData) ? responseData as AdminTravelDestination[] : []
  };
}

function toFormData(payload: AdminTravelDestinationPayload) {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  if (payload.latitude) formData.append("latitude", payload.latitude);
  if (payload.longitude) formData.append("longitude", payload.longitude);
  if (payload.destination_category_id) formData.append("destination_category_id", payload.destination_category_id);
  if (payload.thumbnail_file) formData.append("thumbnail_file", payload.thumbnail_file);
  return formData;
}

export function getTravelDestinationId(destination: AdminTravelDestination) {
  return destination.travel_destination_id ?? destination.destination_id ?? destination.id ?? 0;
}

export function getTravelDestinationThumbnail(destination: AdminTravelDestination) {
  return destination.thumbnail_url ?? destination.thumbnail ?? destination.thumbnail_file ?? "";
}

export const adminTravelDestinationService = {
  async list(params: { page?: number; limit?: number; search?: string; destination_category_id?: string } = {}) {
    const response = await api.get("/admin/travel-destinations", { params });
    return unwrapList(response.data);
  },
  async create(payload: AdminTravelDestinationPayload) {
    const response = await api.post("/admin/travel-destinations", toFormData(payload));
    return response.data;
  },
  async update(id: number, payload: AdminTravelDestinationPayload) {
    const response = await api.put(`/admin/travel-destinations/${id}`, toFormData(payload));
    return response.data;
  },
  async remove(id: number) {
    const response = await api.delete(`/admin/travel-destinations/${id}`);
    return response.data;
  }
};
