import { api } from "@/services/api";

export type GroupTripVisibility = "public" | "private";
export type GroupTripStatus = "active" | "archived";

export type GroupTripMember = {
  group_trip_member_id?: number;
  group_trip_id?: number;
  user_id: number;
  role: "leader" | "member" | string;
  status: "active" | "left" | "removed" | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  joined_at?: string | null;
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
  leader?: { user_id?: number; name?: string | null; avatar_url?: string | null } | null;
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
export type GroupTripMemberListResult = { items: GroupTripMember[]; page: number; limit: number; total: number; totalPages: number };

export type GroupTripInviteResult = {
  group_trip_invite_id: number;
  group_trip_id: number;
  invited_user_id: number;
  invited_email: string;
  status: string;
  expires_at: string;
  email_sent: boolean;
};

export type GroupTripInvitation = {
  group_trip_invite_id: number;
  invite_id?: number;
  group_trip_id: number;
  invited_user_id?: number | null;
  invited_email?: string | null;
  status: "pending" | "accepted" | "declined" | "expired" | "canceled" | string;
  expires_at?: string | null;
  created_at?: string | null;
  accepted_at?: string | null;
  declined_at?: string | null;
  canceled_at?: string | null;
  invited_user?: { user_id?: number; name?: string | null; email?: string | null; avatar_url?: string | null } | null;
  inviter?: { user_id?: number; name?: string | null; email?: string | null; avatar_url?: string | null } | null;
  invited_by_user?: { user_id?: number; name?: string | null; email?: string | null; avatar_url?: string | null } | null;
  group_trip?: Partial<GroupTrip> | null;
  trip?: Partial<GroupTrip> | null;
  group_trip_name?: string | null;
  inviter_name?: string | null;
};

export type GroupTripInvitationListResult = { items: GroupTripInvitation[]; page: number; limit: number; total: number; totalPages: number };

export type GroupTripTokenInvitation = {
  group_trip_invite_id: number;
  status: string;
  can_accept: boolean;
  unavailable_reason?: string | null;
  expires_at?: string | null;
  group_trip?: Partial<GroupTrip> | null;
};

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

function unwrapMemberList(value: unknown): GroupTripMemberListResult {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : body;
  const items = Array.isArray(data.items) ? data.items as GroupTripMember[] : [];
  const pagination = data.pagination && typeof data.pagination === "object" ? data.pagination as Record<string, unknown> : {};
  const limit = Number(pagination.limit ?? 20);
  const total = Number(pagination.total ?? items.length);
  return {
    items,
    page: Number(pagination.page ?? 1),
    limit,
    total,
    totalPages: Number(pagination.totalPages ?? Math.max(1, Math.ceil(total / limit)))
  };
}

function unwrapInvitationList(value: unknown): GroupTripInvitationListResult {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : body;
  const source = Array.isArray(body.data) ? body.data : data.items ?? data.invites ?? data.invitations ?? data.data;
  const items = Array.isArray(source) ? source as GroupTripInvitation[] : [];
  const pagination = (data.pagination ?? body.pagination) as Record<string, unknown> | undefined;
  const limit = Number(pagination?.limit ?? 20);
  const total = Number(pagination?.total ?? items.length);
  return { items, page: Number(pagination?.page ?? 1), limit, total, totalPages: Number(pagination?.totalPages ?? Math.max(1, Math.ceil(total / limit))) };
}

function unwrapData<T>(value: unknown) {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return (body.data ?? value) as T;
}

export const groupTripService = {
  async publicList(params: { page?: number; limit?: number; search?: string } = {}) {
    const response = await api.get("/group-trips/public", { params });
    return unwrapList(response.data);
  },
  async publicDetail(id: number | string) {
    const response = await api.get(`/group-trips/public/${id}`);
    return unwrapDetail(response.data);
  },
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
  async members(id: number | string, params: { page?: number; limit?: number; search?: string } = {}) {
    const response = await api.get(`/group-trips/${id}/members`, { params });
    return unwrapMemberList(response.data);
  },
  async leave(id: number | string) {
    const response = await api.post(`/group-trips/${id}/leave`);
    return response.data;
  },
  async removeMember(id: number | string, userId: number) {
    const response = await api.delete(`/group-trips/${id}/members/${userId}`);
    return response.data;
  },
  async changeLeader(id: number | string, userId: number) {
    const response = await api.patch(`/group-trips/${id}/leader`, { user_id: userId });
    return response.data;
  },
  async invite(id: number | string, email: string) {
    const response = await api.post(`/group-trips/${id}/invites`, { email });
    return unwrapData<GroupTripInviteResult>(response.data);
  },
  async sentInvites(id: number | string, params: { page?: number; limit?: number; search?: string; status?: string } = {}) {
    const response = await api.get(`/group-trips/${id}/invites`, { params });
    return unwrapInvitationList(response.data);
  },
  async cancelInvite(id: number | string, inviteId: number | string) {
    const response = await api.delete(`/group-trips/${id}/invites/${inviteId}`);
    return response.data;
  },
  async receivedInvites(params: { page?: number; limit?: number; status?: string } = {}) {
    const response = await api.get("/group-trip-invites", { params });
    return unwrapInvitationList(response.data);
  },
  async acceptReceivedInvite(inviteId: number | string) {
    const response = await api.post(`/group-trip-invites/${inviteId}/accept`);
    return response.data;
  },
  async declineReceivedInvite(inviteId: number | string) {
    const response = await api.post(`/group-trip-invites/${inviteId}/decline`);
    return response.data;
  },
  async acceptInvite(token: string) {
    const response = await api.post(`/group-trip-invites/${encodeURIComponent(token)}/accept`);
    return response.data;
  },
  async inviteByToken(token: string) {
    const response = await api.get(`/group-trip-invites/${encodeURIComponent(token)}`);
    return unwrapData<GroupTripTokenInvitation>(response.data);
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
