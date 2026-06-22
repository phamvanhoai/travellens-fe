import { api } from "@/services/api";

export type AdminMedia = {
  media_id?: number;
  id?: number;
  url?: string;
  file_url?: string;
  image_url?: string;
  path?: string;
  original_name?: string;
  file_name?: string;
  filename?: string;
  mime_type?: string;
  created_at?: string;
};

export type AdminMediaList = {
  data: AdminMedia[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
};

function unwrapData<T>(responseData: T | { data?: T }) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data?: T }).data as T;
  }
  return responseData as T;
}

function unwrapList(responseData: unknown): AdminMediaList {
  const body = unwrapData<unknown>(responseData as { data?: unknown });
  if (Array.isArray(body)) return { data: body as AdminMedia[] };
  if (body && typeof body === "object") {
    const result = body as { data?: unknown; pagination?: AdminMediaList["pagination"] };
    return { data: Array.isArray(result.data) ? result.data as AdminMedia[] : [], pagination: result.pagination };
  }
  return { data: [] };
}

export function getAdminMediaId(media: AdminMedia) {
  return media.media_id ?? media.id ?? 0;
}

export function getAdminMediaUrl(media: AdminMedia) {
  return media.url ?? media.file_url ?? media.image_url ?? media.path ?? "";
}

export function getAdminMediaName(media: AdminMedia) {
  return media.original_name ?? media.file_name ?? media.filename ?? `Image #${getAdminMediaId(media)}`;
}

export const adminMediaService = {
  async list(params: { page?: number; limit?: number; search?: string; mime_type?: string } = {}) {
    const response = await api.get("/admin/media", { params });
    return unwrapList(response.data);
  },
  async upload(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/admin/media", formData);
    return unwrapData<AdminMedia>(response.data);
  },
  async detail(id: number) {
    const response = await api.get(`/admin/media/${id}`);
    return unwrapData<AdminMedia>(response.data);
  },
  async rename(id: number, originalName: string) {
    const response = await api.put(`/admin/media/${id}`, { original_name: originalName });
    return unwrapData<AdminMedia>(response.data);
  },
  async remove(id: number) {
    const response = await api.delete(`/admin/media/${id}`);
    return unwrapData<unknown>(response.data);
  }
};
