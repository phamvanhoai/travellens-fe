import { api } from "@/services/api";

export type TourContentItemType =
  | "highlight"
  | "requirement"
  | "inclusion"
  | "exclusion"
  | "booking_policy"
  | "cancellation_policy"
  | "additional_information";

export type AdminTourContentItem = {
  content_item_id?: number;
  tour_content_item_id?: number;
  id?: number;
  type: TourContentItemType;
  content: string;
  status?: "active" | "inactive" | string;
  created_at?: string;
  updated_at?: string;
};

export type AdminTourContentItemPayload = {
  type: TourContentItemType;
  content: string;
  status: "active" | "inactive";
};

export type AdminTourContentItemListMeta = {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
};

export type AdminTourContentItemBulkPayload = {
  type: TourContentItemType;
  status: "active" | "inactive";
  items: string[];
};

function unwrapItem(value: unknown): AdminTourContentItem {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = body.data ?? body.item ?? value;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const nested = data as Record<string, unknown>;
    return (nested.item && typeof nested.item === "object" ? nested.item : nested) as AdminTourContentItem;
  }
  return data as AdminTourContentItem;
}

function unwrapList(value: unknown) {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = body.data ?? value;
  const items = Array.isArray(data)
    ? data
    : data && typeof data === "object"
      ? (data as Record<string, unknown>).items ?? (data as Record<string, unknown>).content_items ?? (data as Record<string, unknown>).data
      : [];
  return Array.isArray(items) ? items as AdminTourContentItem[] : [];
}

function unwrapListMeta(value: unknown): AdminTourContentItemListMeta | undefined {
  if (!value || typeof value !== "object") return undefined;
  const body = value as Record<string, unknown>;
  const nested = body.data && typeof body.data === "object" && !Array.isArray(body.data)
    ? body.data as Record<string, unknown>
    : undefined;
  const raw = body.meta ?? nested?.meta;
  if (!raw || typeof raw !== "object") return undefined;
  const meta = raw as Record<string, unknown>;
  return {
    page: Number(meta.page ?? 1),
    limit: Number(meta.limit ?? 20),
    total: Number(meta.total ?? 0),
    total_pages: Math.max(1, Number(meta.total_pages ?? 1))
  };
}

export function getTourContentItemId(item: AdminTourContentItem) {
  return item.content_item_id ?? item.tour_content_item_id ?? item.id ?? 0;
}

export const adminTourContentItemService = {
  async list(params: { type?: TourContentItemType; search?: string; status?: string; page?: number; limit?: number; sort?: string; order?: "asc" | "desc" } = {}) {
    const response = await api.get("/admin/tour-content-items", { params });
    return unwrapList(response.data);
  },
  async listPage(params: { type?: TourContentItemType; search?: string; status?: string; page?: number; limit?: number; sort?: string; order?: "asc" | "desc" } = {}) {
    const response = await api.get("/admin/tour-content-items", { params });
    return { data: unwrapList(response.data), meta: unwrapListMeta(response.data) };
  },
  async detail(id: number) {
    const response = await api.get(`/admin/tour-content-items/${id}`);
    return unwrapItem(response.data);
  },
  async create(payload: AdminTourContentItemPayload) {
    const response = await api.post("/admin/tour-content-items", payload);
    return unwrapItem(response.data);
  },
  async createBulk(payload: AdminTourContentItemBulkPayload) {
    const response = await api.post("/admin/tour-content-items/bulk", payload);
    return unwrapList(response.data);
  },
  async update(id: number, payload: AdminTourContentItemPayload) {
    const response = await api.put(`/admin/tour-content-items/${id}`, payload);
    return unwrapItem(response.data);
  },
  async remove(id: number) {
    const response = await api.delete(`/admin/tour-content-items/${id}`);
    return response.data;
  }
};
