import { api } from "@/services/api";
import type { GroupTrip, GroupTripMember, GroupTripPayload } from "@/services/group-trip.service";

type ListResult = { items: GroupTrip[]; page: number; limit: number; total: number; totalPages: number };
type MemberListResult = { items: GroupTripMember[]; page: number; limit: number; total: number; totalPages: number };
type AdminGroupTripUpdatePayload = Partial<Omit<GroupTripPayload, "description" | "max_members">> & {
  description?: string | null;
  max_members?: number | null;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function unwrapDetail(value: unknown): GroupTrip {
  const body = record(value);
  const data = body.data ?? value;
  const dataRecord = record(data);
  return (dataRecord.group_trip ?? data) as GroupTrip;
}

function unwrapList(value: unknown): ListResult {
  const body = record(value);
  const data = body.data ?? value;
  const dataRecord = record(data);
  const source = Array.isArray(data) ? data : dataRecord.items ?? dataRecord.group_trips ?? dataRecord.data;
  const items = Array.isArray(source) ? source as GroupTrip[] : [];
  const pagination = record(dataRecord.pagination ?? body.pagination);
  const limit = Number(pagination.limit ?? Math.max(items.length, 1));
  const total = Number(pagination.total ?? items.length);
  return { items, page: Number(pagination.page ?? 1), limit, total, totalPages: Number(pagination.totalPages ?? Math.max(1, Math.ceil(total / limit))) };
}

function unwrapMembers(value: unknown): MemberListResult {
  const result = unwrapList(value);
  return { ...result, items: result.items as unknown as GroupTripMember[] };
}

export const adminGroupTripService = {
  async list(params: { page?: number; limit?: number; search?: string; visibility?: string; status?: string } = {}) {
    const response = await api.get("/admin/group-trips", { params });
    return unwrapList(response.data);
  },
  async detail(id: number | string) {
    const response = await api.get(`/admin/group-trips/${id}`);
    return unwrapDetail(response.data);
  },
  async members(id: number | string, params: { page?: number; limit?: number; search?: string } = {}) {
    const response = await api.get(`/admin/group-trips/${id}/members`, { params });
    return unwrapMembers(response.data);
  },
  async update(id: number | string, payload: AdminGroupTripUpdatePayload) {
    const response = await api.patch(`/admin/group-trips/${id}`, payload);
    return unwrapDetail(response.data);
  },
  async remove(id: number | string) {
    const response = await api.delete(`/admin/group-trips/${id}`);
    return response.data;
  }
};
