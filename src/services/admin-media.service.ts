import { api } from "@/services/api";

export type AdminMedia = {
  media_id?: number;
  id?: number;
  url?: string;
  file_url?: string;
  image_url?: string;
  media_url?: string;
  public_url?: string;
  secure_url?: string;
  path?: string;
  file_path?: string;
  storage_path?: string;
  original_name?: string;
  file_name?: string;
  filename?: string;
  name?: string;
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
  if (Array.isArray(responseData)) return { data: responseData as AdminMedia[] };

  if (responseData && typeof responseData === "object") {
    const data = findMediaArray(responseData);
    const pagination = findPagination(responseData);
    return { data, pagination };
  }

  return { data: [] };
}

export function getAdminMediaId(media: AdminMedia) {
  return media.media_id ?? media.id ?? 0;
}

export function getAdminMediaUrl(media: AdminMedia) {
  return media.url ?? media.file_url ?? media.image_url ?? media.media_url ?? media.public_url ?? media.secure_url ?? media.path ?? media.file_path ?? media.storage_path ?? "";
}

export function getAdminMediaName(media: AdminMedia) {
  return media.original_name ?? media.file_name ?? media.filename ?? media.name ?? `Image #${getAdminMediaId(media)}`;
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

function findMediaArray(value: unknown): AdminMedia[] {
  if (Array.isArray(value)) return value as AdminMedia[];
  if (!value || typeof value !== "object") return [];

  const objectValue = value as Record<string, unknown>;
  const arrayKeys = ["data", "items", "media", "medias", "images", "files", "rows", "records", "results"];

  for (const key of arrayKeys) {
    if (Array.isArray(objectValue[key])) return objectValue[key] as AdminMedia[];
  }

  for (const key of ["data", "result", "payload"]) {
    const nested = objectValue[key];
    if (nested && typeof nested === "object") {
      const nestedArray = findMediaArray(nested);
      if (nestedArray.length > 0) return nestedArray;
    }
  }

  return [];
}

function findPagination(value: unknown): AdminMediaList["pagination"] {
  if (!value || typeof value !== "object") return undefined;

  const objectValue = value as Record<string, unknown>;
  const direct = normalizePagination(objectValue.pagination);
  if (direct) return direct;

  for (const key of ["data", "result", "payload", "meta"]) {
    const nested = objectValue[key];
    if (nested && typeof nested === "object") {
      const nestedPagination = findPagination(nested);
      if (nestedPagination) return nestedPagination;
    }
  }

  return normalizePagination(objectValue);
}

function normalizePagination(value: unknown): AdminMediaList["pagination"] {
  if (!value || typeof value !== "object") return undefined;
  const data = value as Record<string, unknown>;
  const total = toNumber(data.total ?? data.totalItems ?? data.total_items ?? data.count);
  if (total == null) return undefined;

  const page = toNumber(data.page ?? data.currentPage ?? data.current_page) ?? 1;
  const limit = toNumber(data.limit ?? data.pageSize ?? data.page_size ?? data.perPage ?? data.per_page) ?? 20;
  const totalPages = toNumber(data.totalPages ?? data.total_pages ?? data.lastPage ?? data.last_page) ?? Math.max(1, Math.ceil(total / limit));

  return { page, limit, total, totalPages };
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}
