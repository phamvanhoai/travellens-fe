import { api } from "@/services/api";

export type AdminView360 = {
  view360_id?: number;
  view_id?: number;
  id?: number;
  location_id?: number | string;
  location_name?: string;
  title: string;
  description?: string;
  audio_url?: string;
  audio_file?: string;
  language?: string;
  order_index?: number | string;
  images?: AdminView360Image[];
  image_count?: number;
  created_at?: string;
  updated_at?: string;
};

export type AdminView360Image = {
  view360_image_id?: number;
  image_id?: number;
  id?: number;
  view360_id?: number | string;
  image_url?: string;
  image_file?: string;
  order_index?: number | string;
};

export type AdminView360Payload = {
  title: string;
  description: string;
  audio_file?: File | string | null;
  language: string;
  order_index: string;
};

export type View360HotspotType = "info" | "navigation" | "link" | "location";

export type AdminView360Hotspot = {
  hotspot_id?: number;
  id?: number;
  view360_id?: number | string;
  type?: View360HotspotType;
  title?: string | null;
  description?: string | null;
  yaw?: number | string;
  pitch?: number | string;
  target_view360_id?: number | string | null;
  target_url?: string | null;
  order_index?: number | string | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AdminView360HotspotPayload = {
  type: View360HotspotType;
  title: string | null;
  description: string | null;
  yaw: number;
  pitch: number;
  target_view360_id: number | null;
  target_url: string | null;
  order_index: number;
  is_active: boolean;
};

function unwrapData<T>(responseData: unknown): T {
  if (responseData && typeof responseData === "object" && "data" in responseData) {
    return (responseData as { data: T }).data;
  }
  return responseData as T;
}

function unwrapList<T>(responseData: unknown): T[] {
  const data = unwrapData<T[] | unknown>(responseData);
  return Array.isArray(data) ? data as T[] : [];
}

function sceneFormData(payload: AdminView360Payload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description);
  if (payload.audio_file) {
    formData.append("audio_file", payload.audio_file instanceof File ? payload.audio_file : payload.audio_file.trim());
  }
  if (payload.language) formData.append("language", payload.language);
  if (payload.order_index) formData.append("order_index", payload.order_index);
  return formData;
}

function imageFormData(file: File, orderIndex: number) {
  const formData = new FormData();
  formData.append("image_file", file);
  formData.append("order_index", String(orderIndex));
  return formData;
}

export function getView360Id(scene: AdminView360) {
  return scene.view360_id ?? scene.view_id ?? scene.id ?? 0;
}

export function getView360Audio(scene: AdminView360) {
  return scene.audio_url ?? scene.audio_file ?? "";
}

export function getView360ImageId(image: AdminView360Image) {
  return image.view360_image_id ?? image.image_id ?? image.id ?? 0;
}

export function getView360ImageSrc(image: AdminView360Image) {
  return image.image_url ?? image.image_file ?? "";
}

export function getView360HotspotId(hotspot: AdminView360Hotspot) {
  return Number(hotspot.hotspot_id ?? hotspot.id ?? 0);
}

export const adminView360Service = {
  async list(params: { page?: number; limit?: number; search?: string; location_id?: number } = {}) {
    const response = await api.get(`/admin/view360`, { params });
    const body = response.data as { data?: AdminView360[]; pagination?: { page?: number; limit?: number; total?: number; totalPages?: number } };
    return {
      data: Array.isArray(body.data) ? body.data : [],
      pagination: {
        page: Number(body.pagination?.page ?? params.page ?? 1),
        limit: Number(body.pagination?.limit ?? params.limit ?? 10),
        total: Number(body.pagination?.total ?? 0),
        totalPages: Number(body.pagination?.totalPages ?? 1)
      }
    };
  },
  async listByLocation(locationId: number) {
    const response = await api.get(`/admin/locations/${locationId}/view360`);
    return unwrapList<AdminView360>(response.data);
  },
  async create(locationId: number, payload: AdminView360Payload) {
    const response = await api.post(`/admin/locations/${locationId}/view360`, sceneFormData(payload));
    return unwrapData<AdminView360 | { view360_id?: number; id?: number }>(response.data);
  },
  async update(viewId: number, payload: AdminView360Payload) {
    const response = await api.put(`/admin/view360/${viewId}`, sceneFormData(payload));
    return unwrapData<AdminView360>(response.data);
  },
  async remove(viewId: number) {
    const response = await api.delete(`/admin/view360/${viewId}`);
    return response.data;
  },
  async listImages(viewId: number) {
    const response = await api.get(`/admin/view360/${viewId}/images`);
    return unwrapList<AdminView360Image>(response.data);
  },
  async addImage(viewId: number, file: File, orderIndex: number) {
    const response = await api.post(`/admin/view360/${viewId}/images`, imageFormData(file, orderIndex));
    return unwrapData<AdminView360Image>(response.data);
  },
  async removeImage(imageId: number) {
    const response = await api.delete(`/admin/view360-images/${imageId}`);
    return response.data;
  },
  async listHotspots(viewId: number) {
    const response = await api.get(`/admin/view360/${viewId}/hotspots`);
    return unwrapList<AdminView360Hotspot>(response.data);
  },
  async listNavigationTargets(viewId: number) {
    const response = await api.get(`/admin/view360/${viewId}/navigation-targets`);
    return unwrapList<AdminView360>(response.data);
  },
  async createHotspot(viewId: number, payload: AdminView360HotspotPayload) {
    const response = await api.post(`/admin/view360/${viewId}/hotspots`, payload);
    return unwrapData<AdminView360Hotspot>(response.data);
  },
  async updateHotspot(hotspotId: number, payload: AdminView360HotspotPayload) {
    const response = await api.put(`/admin/view360-hotspots/${hotspotId}`, payload);
    return unwrapData<AdminView360Hotspot>(response.data);
  },
  async removeHotspot(hotspotId: number) {
    const response = await api.delete(`/admin/view360-hotspots/${hotspotId}`);
    return response.data;
  }
};
