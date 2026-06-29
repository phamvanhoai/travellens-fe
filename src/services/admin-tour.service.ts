import { api } from "@/services/api";

export type AdminTourStatus = "active" | "inactive" | "draft" | "deleted" | string;

export type AdminTourDestination = {
  travel_destination_id?: number;
  destination_id?: number;
  id?: number;
  name?: string;
  destination_name?: string;
  travel_destination_name?: string;
  order_index?: number;
  estimated_time?: string | null;
  note?: string | null;
};

export type AdminTourCategoryRef = {
  tour_category_id?: number;
  category_id?: number;
  id?: number;
  name?: string;
};

export type AdminTour = {
  tour_id?: number;
  id?: number;
  name?: string;
  title?: string;
  description?: string;
  price?: number | string;
  child_price?: number | string;
  schedule?: string;
  duration?: string;
  capacity?: number | string;
  status?: AdminTourStatus;
  thumbnail_url?: string;
  thumbnail?: string;
  thumbnail_file?: string;
  tour_category_id?: number | string | null;
  category_id?: number | string | null;
  tour_category_name?: string;
  category_name?: string;
  tour_category?: AdminTourCategoryRef;
  category?: AdminTourCategoryRef;
  TourCategory?: AdminTourCategoryRef;
  destinations?: AdminTourDestination[];
  tour_destinations?: AdminTourDestination[];
  travel_destinations?: AdminTourDestination[];
};

export type AdminTourPayload = {
  tour_category_id: string;
  name: string;
  description: string;
  price: string;
  child_price: string;
  schedule: string;
  capacity: string;
  status: string;
  destinations: AdminTourDestinationPayload[];
  thumbnail_file?: File | null;
};

export type AdminTourDestinationPayload = {
  destination_id: string;
  estimated_time: string;
  note: string;
};

type ListResponse = {
  data?: AdminTour[];
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
    data: Array.isArray(responseData) ? responseData as AdminTour[] : []
  };
}

function toFormData(payload: AdminTourPayload) {
  const formData = new FormData();
  formData.append("tour_category_id", payload.tour_category_id);
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("price", payload.price);
  formData.append("child_price", payload.child_price);
  formData.append("schedule", payload.schedule);
  formData.append("capacity", payload.capacity);
  formData.append("status", payload.status);
  formData.append(
    "destinations",
    JSON.stringify(payload.destinations.map((destination, index) => ({
      destination_id: Number(destination.destination_id),
      order_index: index + 1,
      estimated_time: destination.estimated_time.trim() || null,
      note: destination.note.trim() || null
    })))
  );
  if (payload.thumbnail_file) formData.append("thumbnail_file", payload.thumbnail_file);
  return formData;
}

export function getAdminTourId(tour: AdminTour) {
  return tour.tour_id ?? tour.id ?? 0;
}

export function getAdminTourName(tour: AdminTour) {
  return tour.name ?? tour.title ?? "";
}

export function getAdminTourThumbnail(tour: AdminTour) {
  return tour.thumbnail_url ?? tour.thumbnail ?? tour.thumbnail_file ?? "";
}

export function getAdminTourCategoryId(tour: AdminTour) {
  return tour.tour_category_id
    ?? tour.category_id
    ?? tour.tour_category?.tour_category_id
    ?? tour.tour_category?.category_id
    ?? tour.tour_category?.id
    ?? tour.category?.tour_category_id
    ?? tour.category?.category_id
    ?? tour.category?.id
    ?? tour.TourCategory?.tour_category_id
    ?? tour.TourCategory?.category_id
    ?? tour.TourCategory?.id
    ?? "";
}

export function getAdminTourCategoryName(tour: AdminTour) {
  return tour.tour_category_name
    ?? tour.category_name
    ?? tour.tour_category?.name
    ?? tour.category?.name
    ?? tour.TourCategory?.name
    ?? getAdminTourCategoryId(tour)
    ?? "-";
}

export function getAdminTourDestinations(tour: AdminTour) {
  return tour.destinations ?? tour.tour_destinations ?? tour.travel_destinations ?? [];
}

export function getAdminTourDestinationId(destination: AdminTourDestination) {
  return destination.travel_destination_id ?? destination.destination_id ?? destination.id ?? 0;
}

export function getAdminTourDestinationName(destination: AdminTourDestination) {
  return destination.travel_destination_name ?? destination.destination_name ?? destination.name ?? `#${getAdminTourDestinationId(destination)}`;
}

export const adminTourService = {
  async list(params: {
    page?: number;
    limit?: number;
    search?: string;
    destination_id?: string;
    tour_category_id?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: "ASC" | "DESC";
  } = {}) {
    const response = await api.get("/admin/tours", { params });
    return unwrapList(response.data);
  },
  async create(payload: AdminTourPayload) {
    const response = await api.post("/admin/tours", toFormData(payload));
    return response.data;
  },
  async get(id: number) {
    const response = await api.get(`/admin/tours/${id}`);
    const body = response.data as { data?: AdminTour } | AdminTour;
    return body && typeof body === "object" && "data" in body ? body.data as AdminTour : body as AdminTour;
  },
  async update(id: number, payload: AdminTourPayload) {
    const response = await api.put(`/admin/tours/${id}`, toFormData(payload));
    return response.data;
  },
  async remove(id: number) {
    const response = await api.delete(`/admin/tours/${id}`);
    return response.data;
  }
};
