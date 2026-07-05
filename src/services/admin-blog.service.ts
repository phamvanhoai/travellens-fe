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
  location?: AdminBlogLocation;
  Location?: AdminBlogLocation;
};

export type AdminBlog = {
  blog_id?: number;
  id?: number;
  user_id?: number;
  category_ids?: Array<number | string>;
  categories?: Array<{ blog_category_id?: number; id?: number; name?: string }>;
  title: string;
  slug?: string;
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  status?: "draft" | "published" | "archived";
  published_at?: string | null;
  content?: string;
  author_name?: string;
  user_name?: string;
  author?: AdminBlogUser;
  user?: AdminBlogUser;
  locations?: AdminBlogLocation[];
  blog_locations?: AdminBlogLocation[];
  Locations?: AdminBlogLocation[];
  BlogLocations?: AdminBlogLocation[];
  Blog_Locations?: AdminBlogLocation[];
  location_ids?: Array<number | string>;
  locationIds?: Array<number | string>;
  created_at?: string;
  updated_at?: string;
};

export type AdminBlogPayload = {
  category_ids: number[];
  title: string;
  slug?: string;
  thumbnail?: string | null;
  thumbnail_file?: File | null;
  content: string;
  status: "draft" | "published" | "archived";
  published_at?: string | null;
  location_ids: number[];
};

export function getAdminBlogCategoryIds(blog: AdminBlog) {
  if (Array.isArray(blog.category_ids)) return [...new Set(blog.category_ids.map(Number).filter(Boolean))];
  return (blog.categories ?? []).map((category) => Number(category.blog_category_id ?? category.id ?? 0)).filter(Boolean);
}

export function getAdminBlogCategoryNames(blog: AdminBlog) {
  return (blog.categories ?? []).map((category) => category.name).filter((name): name is string => Boolean(name));
}

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

function unwrapBlog(responseData: unknown) {
  const data = unwrapData<unknown>(responseData as { data?: unknown });
  if (data && typeof data === "object" && "blog" in data) {
    return (data as { blog?: AdminBlog }).blog as AdminBlog;
  }
  return data as AdminBlog;
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
  return blog.locations
    ?? blog.Locations
    ?? blog.blog_locations
    ?? blog.BlogLocations
    ?? blog.Blog_Locations
    ?? [];
}

export function getAdminBlogLocationIds(blog: AdminBlog) {
  const directIds = blog.location_ids ?? blog.locationIds;
  if (Array.isArray(directIds)) return [...new Set(directIds.map(Number).filter(Boolean))];
  return getAdminBlogLocations(blog)
    .map((location) => {
      if (typeof location === "number" || typeof location === "string") return Number(location);
      return location.location_id
        ?? location.id
        ?? location.location?.location_id
        ?? location.location?.id
        ?? location.Location?.location_id
        ?? location.Location?.id
        ?? 0;
    })
    .map(Number)
    .filter(Boolean)
    .filter((id, index, ids) => ids.indexOf(id) === index);
}

export const adminBlogService = {
  async list(params: { status?: AdminBlogPayload["status"]; blog_category_id?: number } = {}) {
    const response = await api.get("/admin/blogs", { params });
    return unwrapList(response.data);
  },
  async detail(id: number) {
    const response = await api.get(`/admin/blogs/${id}`);
    return unwrapBlog(response.data);
  },
  async create(payload: AdminBlogPayload) {
    const response = await api.post("/admin/blogs", toBlogRequest(payload));
    return unwrapBlog(response.data);
  },
  async update(id: number, payload: AdminBlogPayload) {
    const response = await api.put(`/admin/blogs/${id}`, toBlogRequest(payload));
    return unwrapBlog(response.data);
  },
  async remove(id: number) {
    const response = await api.delete(`/admin/blogs/${id}`);
    return unwrapData<unknown>(response.data);
  }
};

function toBlogRequest(payload: AdminBlogPayload) {
  if (!payload.thumbnail_file) {
    const { thumbnail_file: _file, ...json } = payload;
    return json;
  }

  const formData = new FormData();
  formData.append("title", payload.title);
  if (payload.slug) formData.append("slug", payload.slug);
  formData.append("thumbnail_file", payload.thumbnail_file);
  formData.append("content", payload.content);
  formData.append("status", payload.status);
  if (payload.published_at) formData.append("published_at", payload.published_at);
  formData.append("category_ids", JSON.stringify(payload.category_ids));
  formData.append("location_ids", JSON.stringify(payload.location_ids));
  return formData;
}
