import { api } from "@/services/api";

export type CustomerBlog = {
  blog_id?: number;
  id?: number;
  user_id?: number;
  title: string;
  content?: string;
  excerpt?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  image?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
  status?: string;
  user_name?: string;
  author_name?: string;
  user?: { user_id?: number; id?: number; name?: string };
  User?: { user_id?: number; id?: number; name?: string };
  locations?: Array<{ location_id?: number; id?: number; name?: string }>;
  Locations?: Array<{ location_id?: number; id?: number; name?: string }>;
  location_ids?: Array<number | string>;
};

export type CustomerBlogPayload = {
  user_id: number;
  title: string;
  content: string;
  location_ids: number[];
};

function unwrapData<T>(value: T | { data?: T }) {
  if (value && typeof value === "object" && "data" in value) {
    const data = (value as { data?: T }).data as T;
    if (data && typeof data === "object" && "blog" in data) return (data as { blog?: T }).blog as T;
    return data;
  }
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
export function getCustomerBlogUserId(blog: CustomerBlog) { return blog.user_id ?? blog.user?.user_id ?? blog.user?.id ?? blog.User?.user_id ?? blog.User?.id ?? 0; }
export function getCustomerBlogAuthor(blog: CustomerBlog) { return blog.user_name ?? blog.author_name ?? blog.user?.name ?? blog.User?.name ?? "Travel360 traveler"; }
export function getCustomerBlogLocationIds(blog: CustomerBlog) { if (Array.isArray(blog.location_ids)) return blog.location_ids.map(Number).filter(Boolean); return [...(blog.locations ?? []), ...(blog.Locations ?? [])].map((location) => location.location_id ?? location.id ?? 0).filter(Boolean); }
export function getCustomerBlogLocations(blog: CustomerBlog) { return [...(blog.locations ?? []), ...(blog.Locations ?? [])]; }
export function getCustomerBlogImage(blog: CustomerBlog, fallback: string) {
  return blog.thumbnail_url ?? blog.thumbnail ?? blog.image_url ?? blog.image ?? extractFirstImage(blog.content) ?? fallback;
}
export function getCustomerBlogExcerpt(blog: CustomerBlog, maxLength = 180) {
  const text = plainText(blog.excerpt ?? blog.description ?? blog.content ?? "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

function extractFirstImage(value?: string | null) {
  return value?.match(/\bsrc=["']([^"']+)["']/i)?.[1];
}

function plainText(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export const blogService = {
  async list() { const response = await api.get("/blogs"); return unwrapList(response.data); },
  async detail(id: string | number) { const response = await api.get(`/blogs/${id}`); return unwrapData<CustomerBlog>(response.data); },
  async create(payload: CustomerBlogPayload) { const response = await api.post("/blogs", payload); return unwrapData<CustomerBlog>(response.data); },
  async update(id: number, payload: CustomerBlogPayload) { const response = await api.put(`/blogs/${id}`, payload); return unwrapData<CustomerBlog>(response.data); },
  async remove(id: number) { const response = await api.delete(`/blogs/${id}`); return unwrapData<unknown>(response.data); }
};
