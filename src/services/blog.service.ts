import { api } from "@/services/api";

export type CustomerBlog = {
  blog_id?: number;
  id?: number;
  user_id?: number;
  title: string;
  content?: string;
  created_at?: string;
  status?: string;
  user?: { user_id?: number; id?: number; name?: string };
  locations?: Array<{ location_id?: number; id?: number; name?: string }>;
  location_ids?: Array<number | string>;
};

export type CustomerBlogPayload = {
  user_id: number;
  title: string;
  content: string;
  location_ids: number[];
};

function unwrapData<T>(value: T | { data?: T }) {
  if (value && typeof value === "object" && "data" in value) return (value as { data?: T }).data as T;
  return value as T;
}

function unwrapList(value: unknown) {
  const data = unwrapData<unknown>(value as { data?: unknown });
  if (Array.isArray(data)) return data as CustomerBlog[];
  if (data && typeof data === "object") {
    const nested = (data as { blogs?: unknown; data?: unknown }).blogs ?? (data as { data?: unknown }).data;
    return Array.isArray(nested) ? nested as CustomerBlog[] : [];
  }
  return [];
}

export function getCustomerBlogId(blog: CustomerBlog) { return blog.blog_id ?? blog.id ?? 0; }
export function getCustomerBlogUserId(blog: CustomerBlog) { return blog.user_id ?? blog.user?.user_id ?? blog.user?.id ?? 0; }
export function getCustomerBlogLocationIds(blog: CustomerBlog) { if (Array.isArray(blog.location_ids)) return blog.location_ids.map(Number).filter(Boolean); return (blog.locations ?? []).map((location) => location.location_id ?? location.id ?? 0).filter(Boolean); }

export const blogService = {
  async list() { const response = await api.get("/blogs"); return unwrapList(response.data); },
  async detail(id: string | number) { const response = await api.get(`/blogs/${id}`); return unwrapData<CustomerBlog>(response.data); },
  async create(payload: CustomerBlogPayload) { const response = await api.post("/blogs", payload); return unwrapData<CustomerBlog>(response.data); },
  async update(id: number, payload: CustomerBlogPayload) { const response = await api.put(`/blogs/${id}`, payload); return unwrapData<CustomerBlog>(response.data); },
  async remove(id: number) { const response = await api.delete(`/blogs/${id}`); return unwrapData<unknown>(response.data); }
};
