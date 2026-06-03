import { api } from "@/services/api";

export type AdminDestinationCategory = {
  destination_category_id?: number;
  id?: number;
  name: string;
  description?: string;
};

export type AdminDestinationCategoryPayload = {
  name: string;
  description: string;
};

function unwrapData<T>(response: { data: T | { data?: T } }) {
  const body = response.data;
  if (body && typeof body === "object" && "data" in body) {
    return body.data as T;
  }
  return body as T;
}

export const adminDestinationCategoryService = {
  async list() {
    const response = await api.get("/admin/destination-categories");
    return unwrapData<AdminDestinationCategory[]>(response);
  },
  async create(payload: AdminDestinationCategoryPayload) {
    const response = await api.post("/admin/destination-categories", payload);
    return unwrapData<AdminDestinationCategory>(response);
  },
  async update(id: number, payload: AdminDestinationCategoryPayload) {
    const response = await api.put(`/admin/destination-categories/${id}`, payload);
    return unwrapData<AdminDestinationCategory>(response);
  },
  async remove(id: number) {
    const response = await api.delete(`/admin/destination-categories/${id}`);
    return unwrapData<unknown>(response);
  }
};
