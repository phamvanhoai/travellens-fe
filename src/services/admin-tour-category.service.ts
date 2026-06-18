import { api } from "@/services/api";

export type AdminTourCategory = {
  tour_category_id?: number;
  id?: number;
  name: string;
  description?: string;
};

export type AdminTourCategoryPayload = {
  name: string;
  description: string;
};

function unwrapData<T>(responseData: T | { data?: T }) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data?: T }).data as T;
  }
  return responseData as T;
}

export function getTourCategoryId(category: AdminTourCategory) {
  return category.tour_category_id ?? category.id ?? 0;
}

export const adminTourCategoryService = {
  async list() {
    const response = await api.get("/admin/tour-categories");
    return unwrapData<AdminTourCategory[]>(response.data);
  },
  async create(payload: AdminTourCategoryPayload) {
    const response = await api.post("/admin/tour-categories", payload);
    return unwrapData<AdminTourCategory>(response.data);
  },
  async update(id: number, payload: AdminTourCategoryPayload) {
    const response = await api.put(`/admin/tour-categories/${id}`, payload);
    return unwrapData<AdminTourCategory>(response.data);
  },
  async remove(id: number) {
    const response = await api.delete(`/admin/tour-categories/${id}`);
    return unwrapData<unknown>(response.data);
  }
};
