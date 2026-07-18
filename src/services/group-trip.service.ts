import { api } from "@/services/api";

export type GroupTripVisibility = "public" | "private";
export type GroupTripStatus = "active" | "archived";

export type GroupTripMember = {
  user_id: number;
  role: "leader" | "member" | string;
  status: "active" | string;
  name?: string | null;
  avatar_url?: string | null;
};

export type GroupTripItineraryItem = {
  itinerary_item_id: number;
  group_trip_id: number;
  itinerary_date: string;
  start_time?: string | null;
  title: string;
  description?: string | null;
  location_id?: number | null;
  custom_location?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  order_index?: number;
};

export type GroupTrip = {
  group_trip_id: number;
  booking_id?: null;
  name: string;
  description?: string | null;
  destination_id?: number | null;
  destination_name?: string | null;
  start_date: string;
  end_date: string;
  max_members?: number | null;
  visibility: GroupTripVisibility;
  status: GroupTripStatus;
  leader_id: number;
  created_by?: number;
  current_member?: GroupTripMember | null;
  members?: GroupTripMember[];
  member_count: number;
  itinerary?: GroupTripItineraryItem[];
  created_at?: string;
  updated_at?: string;
};

export type GroupTripPayload = {
  name: string;
  description?: string;
  destination_id?: number | null;
  destination_name?: string | null;
  start_date: string;
  end_date: string;
  max_members?: number;
  visibility?: GroupTripVisibility;
};

export type GroupTripListResult = { items: GroupTrip[]; total: number; totalPages: number };

export type GroupTripItineraryPayload = {
  itinerary_date: string;
  start_time?: string | null;
  title: string;
  description?: string | null;
  location_id?: number | null;
  custom_location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  order_index?: number;
};

function unwrapDetail(value: unknown) {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = body.data ?? value;
  if (data && typeof data === "object" && "group_trip" in data) return (data as { group_trip: GroupTrip }).group_trip;
  return data as GroupTrip;
}

function unwrapList(value: unknown): GroupTripListResult {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = body.data ?? value;
  const record = data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
  const source = Array.isArray(data) ? data : record.items ?? record.group_trips ?? record.data;
  const items = Array.isArray(source) ? source as GroupTrip[] : [];
  const pagination = (record.pagination ?? body.pagination) as Record<string, unknown> | undefined;
  const total = Number(pagination?.total ?? items.length);
  const limit = Number(pagination?.limit ?? Math.max(items.length, 1));
  return { items, total, totalPages: Number(pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit))) };
}

export const groupTripService = {
  async list(params: { page?: number; limit?: number; search?: string } = {}) {
    const response = await api.get("/group-trips", { params });
    return unwrapList(response.data);
  },
  async detail(id: number | string) {
    const response = await api.get(`/group-trips/${id}`);
    return unwrapDetail(response.data);
  },
  async create(payload: GroupTripPayload) {
    const response = await api.post("/group-trips", payload);
    return unwrapDetail(response.data);
  },
  async update(id: number | string, payload: Partial<GroupTripPayload>) {
    const response = await api.patch(`/group-trips/${id}/settings`, payload);
    return unwrapDetail(response.data);
  },
  async remove(id: number | string) {
    const response = await api.delete(`/group-trips/${id}`);
    return response.data;
  },
  async addItinerary(id: number | string, payload: GroupTripItineraryPayload) {
    const response = await api.post(`/group-trips/${id}/itinerary`, payload);
    return response.data;
  },
  async updateItinerary(id: number | string, itemId: number | string, payload: Partial<GroupTripItineraryPayload>) {
    const response = await api.patch(`/group-trips/${id}/itinerary/${itemId}`, payload);
    return response.data;
  },
  async deleteItinerary(id: number | string, itemId: number | string) {
    const response = await api.delete(`/group-trips/${id}/itinerary/${itemId}`);
    return response.data;
  }
};
