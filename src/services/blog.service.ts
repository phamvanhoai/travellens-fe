import { api } from "@/services/api";
import { resolveBackendAssetUrl } from "@/lib/avatar";

export type CustomerBlog = {
  blog_id?: number;
  id?: number;
  user_id?: number;
  category_ids?: Array<number | string>;
  categories?: Array<{ blog_category_id?: number; id?: number; name?: string }>;
  title: string;
  slug?: string | null;
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
  category_ids?: number[];
  title: string;
  content: string;
  location_ids: number[];
};

export type BlogComment = {
  comment_id?: number;
  blog_comment_id?: number;
  commentId?: number;
  blogCommentId?: number;
  id?: number;
  blog_id?: number;
  user_id?: number;
  parent_comment_id?: number | null;
  content?: string | null;
  comment?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
  user_name?: string;
  customer_name?: string;
  user?: { user_id?: number; id?: number; name?: string; email?: string };
  User?: { user_id?: number; id?: number; name?: string; email?: string };
  replies?: BlogComment[];
  Replies?: BlogComment[];
};

export type BlogCommentPayload = {
  content: string;
  comment?: string;
  parent_comment_id?: number | null;
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

function unwrapCommentList(value: unknown) {
  const data = unwrapData<unknown>(value as { data?: unknown });
  if (Array.isArray(data)) return data as BlogComment[];
  if (data && typeof data === "object") {
    const nested = (data as { comments?: unknown; rows?: unknown; items?: unknown; results?: unknown; data?: unknown }).comments ??
      (data as { rows?: unknown }).rows ??
      (data as { items?: unknown }).items ??
      (data as { results?: unknown }).results ??
      (data as { data?: unknown }).data;
    return Array.isArray(nested) ? nested as BlogComment[] : [];
  }
  return [];
}

function unwrapComment(value: unknown) {
  const data = unwrapData<unknown>(value as { data?: unknown });
  if (data && typeof data === "object" && "comment" in data) return (data as { comment?: BlogComment }).comment as BlogComment;
  return data as BlogComment;
}

export function getCustomerBlogId(blog: CustomerBlog) { return blog.blog_id ?? blog.id ?? 0; }
export function getCustomerBlogPath(blog: CustomerBlog) {
  const identifier = blog.slug?.trim() || String(getCustomerBlogId(blog));
  return identifier && identifier !== "0" ? `/blogs/${encodeURIComponent(identifier)}` : "/blogs";
}
export function getCustomerBlogUserId(blog: CustomerBlog) { return blog.user_id ?? blog.user?.user_id ?? blog.user?.id ?? blog.User?.user_id ?? blog.User?.id ?? 0; }
export function getCustomerBlogAuthor(blog: CustomerBlog) { return blog.user_name ?? blog.author_name ?? blog.user?.name ?? blog.User?.name ?? "Travel360 traveler"; }
export function getCustomerBlogLocationIds(blog: CustomerBlog) { if (Array.isArray(blog.location_ids)) return blog.location_ids.map(Number).filter(Boolean); return [...(blog.locations ?? []), ...(blog.Locations ?? [])].map((location) => location.location_id ?? location.id ?? 0).filter(Boolean); }
export function getCustomerBlogLocations(blog: CustomerBlog) { return [...(blog.locations ?? []), ...(blog.Locations ?? [])]; }
export function getCustomerBlogCategoryIds(blog: CustomerBlog) { if (Array.isArray(blog.category_ids)) return blog.category_ids.map(Number).filter(Boolean); return (blog.categories ?? []).map((category) => Number(category.blog_category_id ?? category.id ?? 0)).filter(Boolean); }
export function getCustomerBlogCategoryNames(blog: CustomerBlog) { return (blog.categories ?? []).map((category) => category.name).filter((name): name is string => Boolean(name)); }
export function getCustomerBlogImage(blog: CustomerBlog, fallback: string) {
  const image = [blog.thumbnail_url, blog.thumbnail, blog.image_url, blog.image, extractFirstImage(blog.content)]
    .find((value): value is string => Boolean(value?.trim()))
    ?.trim();

  return image ? resolveBackendAssetUrl(image) : fallback;
}
export function getCustomerBlogExcerpt(blog: CustomerBlog, maxLength = 180) {
  const text = plainText(blog.excerpt ?? blog.description ?? blog.content ?? "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}
export function getBlogCommentId(comment: BlogComment) { return Number(comment.comment_id ?? comment.blog_comment_id ?? comment.commentId ?? comment.blogCommentId ?? comment.id ?? 0); }
export function getBlogCommentUserId(comment: BlogComment) { return comment.user_id ?? comment.user?.user_id ?? comment.user?.id ?? comment.User?.user_id ?? comment.User?.id ?? 0; }
export function getBlogCommentAuthor(comment: BlogComment) { return comment.user_name ?? comment.customer_name ?? comment.user?.name ?? comment.User?.name ?? comment.user?.email ?? comment.User?.email ?? "Traveler"; }
export function getBlogCommentContent(comment: BlogComment) { return comment.content ?? comment.comment ?? ""; }
export function getBlogCommentReplies(comment: BlogComment) { return [...(comment.replies ?? []), ...(comment.Replies ?? [])]; }

function extractFirstImage(value?: string | null) {
  if (!value) return undefined;
  const match = value.match(/<img\b[^>]*?\bsrc\s*=\s*(?:["']([^"']+)["']|([^\s>]+))/i);
  const source = match?.[1] ?? match?.[2];
  return source ? decodeHtmlAttribute(source) : undefined;
}

function decodeHtmlAttribute(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function plainText(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export const blogService = {
  async list() { const response = await api.get("/blogs"); return unwrapList(response.data); },
  async detail(identifier: string | number) {
    try {
      const response = await api.get(`/blogs/${encodeURIComponent(String(identifier))}`);
      return unwrapData<CustomerBlog>(response.data);
    } catch (error) {
      const isNumericId = /^\d+$/.test(String(identifier));
      if (isNumericId) throw error;

      const listResponse = await api.get("/blogs");
      const match = unwrapList(listResponse.data).find((blog) => blog.slug === String(identifier));
      const id = match ? getCustomerBlogId(match) : 0;
      if (!id) throw error;
      const response = await api.get(`/blogs/${id}`);
      return unwrapData<CustomerBlog>(response.data);
    }
  },
  async create(payload: CustomerBlogPayload) { const response = await api.post("/blogs", payload); return unwrapData<CustomerBlog>(response.data); },
  async update(id: number, payload: CustomerBlogPayload) { const response = await api.put(`/blogs/${id}`, payload); return unwrapData<CustomerBlog>(response.data); },
  async remove(id: number) { const response = await api.delete(`/blogs/${id}`); return unwrapData<unknown>(response.data); },
  async listComments(blogId: number | string, params: { page?: number; limit?: number } = {}) {
    const response = await api.get(`/blogs/${blogId}/comments`, { params });
    return unwrapCommentList(response.data);
  },
  async createComment(blogId: number | string, payload: BlogCommentPayload) {
    const response = await api.post(`/blogs/${blogId}/comments`, payload);
    return unwrapComment(response.data);
  },
  async replyComment(blogId: number | string, commentId: number, payload: BlogCommentPayload) {
    const response = await api.post(`/blogs/${blogId}/comments/${commentId}/replies`, payload);
    return unwrapComment(response.data);
  },
  async updateComment(blogId: number | string, commentId: number, payload: BlogCommentPayload) {
    const response = await api.put(`/blogs/${blogId}/comments/${commentId}`, payload);
    return unwrapComment(response.data);
  },
  async deleteComment(blogId: number | string, commentId: number) {
    const response = await api.delete(`/blogs/${blogId}/comments/${commentId}`);
    return unwrapData<unknown>(response.data);
  }
};
