import { api } from "@/services/api";

export type AdminUserRole = "admin" | "staff" | "customer";
export type AdminUserStatus = "active" | "inactive" | "blocked" | "deleted" | string;

export type AdminUser = {
  user_id?: number;
  id?: number;
  name: string;
  email: string;
  role: AdminUserRole | string;
  status: AdminUserStatus;
  profile_info?: string;
  google_id?: string;
  avatar_url?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
};

export type AdminUserPayload = {
  name: string;
  email: string;
  password?: string;
  role: AdminUserRole;
  status: string;
  phone?: string;
  avatar_file?: File | null;
};

export type AdminUserCreatePayload = AdminUserPayload & {
  password: string;
};

export type AdminUserUpdatePayload = Partial<AdminUserPayload>;

type ListResponse = {
  data?: AdminUser[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages?: number;
  };
};

function unwrapList(responseData: unknown): ListResponse {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    const body = responseData as ListResponse;
    return {
      data: Array.isArray(body.data) ? body.data : [],
      pagination: body.pagination
    };
  }

  return {
    data: Array.isArray(responseData) ? responseData as AdminUser[] : []
  };
}

function unwrapData<T>(responseData: T | { data?: T }) {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data?: T }).data as T;
  }
  return responseData as T;
}

function toFormData(payload: AdminUserPayload | AdminUserUpdatePayload) {
  const formData = new FormData();
  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.email !== undefined) formData.append("email", payload.email);
  if (payload.role !== undefined) formData.append("role", payload.role);
  if (payload.status !== undefined) formData.append("status", payload.status);
  if (payload.phone !== undefined) formData.append("phone", payload.phone);
  if (payload.password) formData.append("password", payload.password);
  if (payload.avatar_file) formData.append("avatar_file", payload.avatar_file);
  return formData;
}

export function getAdminUserId(user: AdminUser) {
  return user.user_id ?? user.id ?? 0;
}

export const adminUserService = {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  } = {}) {
    const response = await api.get("/admin/users", { params });
    return unwrapList(response.data);
  },
  async create(payload: AdminUserCreatePayload) {
    const response = await api.post("/admin/users", toFormData(payload));
    return unwrapData<AdminUser>(response.data);
  },
  async update(id: number, payload: AdminUserUpdatePayload) {
    const response = await api.put(`/admin/users/${id}`, toFormData(payload));
    return unwrapData<AdminUser>(response.data);
  },
  async remove(id: number) {
    const response = await api.delete(`/admin/users/${id}`);
    return unwrapData<unknown>(response.data);
  }
};
