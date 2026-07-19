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

export function getTourContentItemId(item: AdminTourContentItem) {
  return item.content_item_id ?? item.tour_content_item_id ?? item.id ?? 0;
}

export const adminTourContentItemService = {
  async list(params: { type?: TourContentItemType; search?: string; status?: string } = {}) {
    const response = await api.get("/admin/tour-content-items", { params });
    return unwrapList(response.data);
  },
  async detail(id: number) {
    const response = await api.get(`/admin/tour-content-items/${id}`);
    return unwrapItem(response.data);
  },
  async create(payload: AdminTourContentItemPayload) {
    const response = await api.post("/admin/tour-content-items", payload);
    return unwrapItem(response.data);
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
