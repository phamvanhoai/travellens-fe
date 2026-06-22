import { api } from "@/services/api";

export type AdminBlogUser = {
  user_id?: number;
  id?: number;
  name?: string;
  email?: string;
};

export type AdminBlogLocation = {
  location_id?: number;
  id?: number;
  name?: string;
};

export type AdminBlog = {
  blog_id?: number;
  id?: number;
  user_id?: number;
  title: string;
  content?: string;
  author_name?: string;
  user_name?: string;
  author?: AdminBlogUser;
  user?: AdminBlogUser;
  locations?: AdminBlogLocation[];
  blog_locations?: AdminBlogLocation[];
  location_ids?: number[];
  created_at?: string;
  updated_at?: string;
};

export type AdminBlogPayload = {
  user_id: number;
  title: string;
  content: string;
  location_ids: number[];
};

function unwrapData<T>(responseData: T | { data?: T }) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data?: T }).data as T;
  }
  return responseData as T;
}

function unwrapList(responseData: unknown): AdminBlog[] {
  const data = unwrapData<unknown>(responseData as { data?: unknown });
  if (Array.isArray(data)) return data as AdminBlog[];
  if (data && typeof data === "object" && "data" in data) {
    const nested = (data as { data?: unknown }).data;
    return Array.isArray(nested) ? nested as AdminBlog[] : [];
  }
  return [];
}

export function getAdminBlogId(blog: AdminBlog) {
  return blog.blog_id ?? blog.id ?? 0;
}

export function getAdminBlogUserId(blog: AdminBlog) {
  return blog.user_id ?? blog.author?.user_id ?? blog.author?.id ?? blog.user?.user_id ?? blog.user?.id ?? 0;
}

export function getAdminBlogAuthorName(blog: AdminBlog) {
  return blog.author_name ?? blog.user_name ?? blog.author?.name ?? blog.user?.name ?? `User #${getAdminBlogUserId(blog)}`;
}

export function getAdminBlogLocations(blog: AdminBlog) {
  return blog.locations ?? blog.blog_locations ?? [];
}

export function getAdminBlogLocationIds(blog: AdminBlog) {
  if (Array.isArray(blog.location_ids)) return blog.location_ids.map(Number).filter(Boolean);
  return getAdminBlogLocations(blog)
    .map((location) => location.location_id ?? location.id ?? 0)
    .filter(Boolean);
}

export const adminBlogService = {
  async list() {
    const response = await api.get("/admin/blogs");
    return unwrapList(response.data);
  },
  async detail(id: number) {
    const response = await api.get(`/admin/blogs/${id}`);
    return unwrapData<AdminBlog>(response.data);
  },
  async create(payload: AdminBlogPayload) {
    const response = await api.post("/admin/blogs", payload);
    return unwrapData<AdminBlog>(response.data);
  },
  async update(id: number, payload: AdminBlogPayload) {
    const response = await api.put(`/admin/blogs/${id}`, payload);
    return unwrapData<AdminBlog>(response.data);
  },
  async remove(id: number) {
    const response = await api.delete(`/admin/blogs/${id}`);
    return unwrapData<unknown>(response.data);
  }
};
