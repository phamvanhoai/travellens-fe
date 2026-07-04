import { api } from "@/services/api";

export type BlogCategory = {
  blog_category_id?: number;
  id?: number;
  name: string;
  description?: string | null;
  blog_count?: number;
};

export type BlogCategoryPayload = {
  name: string;
  description: string;
};

function unwrapData<T>(value: unknown): T {
  if (value && typeof value === "object" && "data" in value) {
    return (value as { data: T }).data;
  }
  return value as T;
}

function unwrapList(value: unknown): BlogCategory[] {
  const data = unwrapData<unknown>(value);
  if (Array.isArray(data)) return data as BlogCategory[];
  if (data && typeof data === "object") {
    const nested = (data as { categories?: unknown; rows?: unknown; items?: unknown; data?: unknown }).categories
      ?? (data as { rows?: unknown }).rows
      ?? (data as { items?: unknown }).items
      ?? (data as { data?: unknown }).data;
    return Array.isArray(nested) ? nested as BlogCategory[] : [];
  }
  return [];
}

export function getBlogCategoryId(category: BlogCategory) {
  return category.blog_category_id ?? category.id ?? 0;
}

export const blogCategoryService = {
  async list(params: { page?: number; limit?: number; search?: string } = {}) {
    const response = await api.get("/blog-categories", { params });
    return unwrapList(response.data);
  },
  async detail(id: number) {
    const response = await api.get(`/blog-categories/${id}`);
    return unwrapData<BlogCategory>(response.data);
  }
};

export const adminBlogCategoryService = {
  async list() {
    const response = await api.get("/admin/blog-categories");
    return unwrapList(response.data);
  },
  async detail(id: number) {
    const response = await api.get(`/admin/blog-categories/${id}`);
    return unwrapData<BlogCategory>(response.data);
  },
  async create(payload: BlogCategoryPayload) {
    const response = await api.post("/admin/blog-categories", payload);
    return unwrapData<BlogCategory>(response.data);
  },
  async update(id: number, payload: BlogCategoryPayload) {
    const response = await api.put(`/admin/blog-categories/${id}`, payload);
    return unwrapData<BlogCategory>(response.data);
  },
  async remove(id: number) {
    const response = await api.delete(`/admin/blog-categories/${id}`);
    return unwrapData<unknown>(response.data);
  }
};
