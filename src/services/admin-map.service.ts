import { api } from "@/services/api";

export type AdminMap = {
  map_id?: number;
  id?: number;
  location_id?: number | string;
  location_name?: string;
  title: string;
  description?: string | null;
  map_file?: string;
  map_url?: string;
  display_order?: number | string | null;
  created_at?: string;
  updated_at?: string;
};

export type AdminMapPayload = {
  location_id: string;
  title: string;
  description: string;
  display_order: string;
  map_file?: File | null;
};

type ListResponse = {
  data?: AdminMap[];
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
    data: Array.isArray(responseData) ? responseData as AdminMap[] : []
  };
}

function toFormData(payload: AdminMapPayload, includeLocation: boolean) {
  const formData = new FormData();
  if (includeLocation) formData.append("location_id", payload.location_id);
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  if (payload.display_order) formData.append("display_order", payload.display_order);
  if (payload.map_file) formData.append("map_file", payload.map_file);
  return formData;
}

export function getAdminMapId(map: AdminMap) {
  return map.map_id ?? map.id ?? 0;
}

export function getAdminMapFile(map: AdminMap) {
  return map.map_url ?? map.map_file ?? "";
}

export const adminMapService = {
  async list(params: { page?: number; limit?: number; search?: string; location_id?: string } = {}) {
    const response = await api.get("/admin/maps", { params });
    return unwrapList(response.data);
  },
  async create(payload: AdminMapPayload) {
    const response = await api.post("/admin/maps", toFormData(payload, true));
    return response.data;
  },
  async update(id: number, payload: AdminMapPayload) {
    const response = await api.put(`/admin/maps/${id}`, toFormData(payload, false));
    return response.data;
  },
  async remove(id: number) {
    const response = await api.delete(`/admin/maps/${id}`);
    return response.data;
  }
};
