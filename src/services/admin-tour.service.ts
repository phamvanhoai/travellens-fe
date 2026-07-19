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
  slug?: string;
  short_description?: string;
  duration_days?: number | string;
  duration_nights?: number | string;
  start_time?: string;
  end_time?: string;
  tour_type?: "group" | "private" | "self_guided" | string;
  languages?: string[];
  difficulty?: "easy" | "moderate" | "challenging" | "difficult" | string;
  minimum_participants?: number | string;
  minimum_booking?: number | string;
  maximum_booking?: number | string | null;
  meeting_point?: string | null;
  pickup_available?: boolean;
  pickup_description?: string | null;
  price?: number | string;
  child_price?: number | string;
  infant_price?: number | string;
  currency?: string;
  schedule?: string;
  duration?: string;
  capacity?: number | string;
  status?: AdminTourStatus;
  thumbnail_url?: string;
  thumbnail?: string;
  thumbnail_file?: string;
  video_url?: string | null;
  highlights?: string[];
  inclusions?: string[];
  exclusions?: string[];
  requirements?: string[];
  cancellation_policy?: string | null;
  booking_policy?: string | null;
  additional_information?: string | null;
  faqs?: AdminTourFaq[];
  gallery?: AdminTourGalleryItem[];
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
  content_items?: AdminTourContentItemLink[];
  tour_content_items?: AdminTourContentItemLink[];
};

export type AdminTourFaq = { faq_id?: number; id?: number; question: string; answer: string; order_index?: number };
export type AdminTourGalleryItem = { media_id?: number; id?: number; type?: string; url: string; alt?: string; order_index?: number };
export type AdminTourContentItemLink = {
  id?: number;
  content_item_id?: number;
  tour_content_item_id?: number;
  sort_order?: number;
  order_index?: number;
  type?: string;
  content?: string;
};

export type AdminTourPayload = {
  content_items: Array<{ id: number; sort_order: number }>;
  tour_category_id: string;
  name: string;
  description: string;
  slug: string;
  short_description: string;
  duration_days: string;
  duration_nights: string;
  start_time: string;
  end_time: string;
  tour_type: string;
  languages: string[];
  difficulty: string;
  minimum_participants: string;
  minimum_booking: string;
  maximum_booking: string;
  meeting_point: string;
  pickup_available: boolean;
  pickup_description: string;
  price: string;
  child_price: string;
  infant_price: string;
  currency: string;
  schedule: string;
  capacity: string;
  status: string;
  video_url: string;
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  cancellation_policy: string;
  booking_policy: string;
  additional_information: string;
  faqs: AdminTourFaq[];
  gallery: AdminTourGalleryItem[];
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
  formData.append("content_items", JSON.stringify(payload.content_items));
  formData.append("tour_category_id", payload.tour_category_id);
  formData.append("name", payload.name);
  if (payload.slug.trim()) formData.append("slug", payload.slug.trim());
  formData.append("short_description", payload.short_description);
  formData.append("duration_days", payload.duration_days);
  formData.append("duration_nights", payload.duration_nights);
  formData.append("start_time", payload.start_time);
  formData.append("end_time", payload.end_time);
  formData.append("tour_type", payload.tour_type);
  formData.append("languages", JSON.stringify(payload.languages));
  formData.append("difficulty", payload.difficulty);
  formData.append("minimum_participants", payload.minimum_participants);
  formData.append("minimum_booking", payload.minimum_booking);
  if (payload.maximum_booking.trim()) formData.append("maximum_booking", payload.maximum_booking);
  formData.append("meeting_point", payload.meeting_point);
  formData.append("pickup_available", String(payload.pickup_available));
  formData.append("pickup_description", payload.pickup_description);
  formData.append("description", payload.description);
  formData.append("price", payload.price);
  formData.append("child_price", payload.child_price);
  formData.append("infant_price", payload.infant_price);
  formData.append("currency", payload.currency);
  formData.append("schedule", payload.schedule);
  formData.append("capacity", payload.capacity);
  formData.append("status", payload.status);
  formData.append("video_url", payload.video_url);
  formData.append("highlights", JSON.stringify(payload.highlights));
  formData.append("inclusions", JSON.stringify(payload.inclusions));
  formData.append("exclusions", JSON.stringify(payload.exclusions));
  formData.append("requirements", JSON.stringify(payload.requirements));
  if (payload.cancellation_policy.trim()) formData.append("cancellation_policy", payload.cancellation_policy);
  if (payload.booking_policy.trim()) formData.append("booking_policy", payload.booking_policy);
  if (payload.additional_information.trim()) formData.append("additional_information", payload.additional_information);
  formData.append("faqs", JSON.stringify(payload.faqs
    .filter((faq) => faq.question.trim() && faq.answer.trim())
    .map((faq, index) => ({ question: faq.question.trim(), answer: faq.answer.trim(), order_index: index + 1 }))));
  formData.append("gallery", JSON.stringify(payload.gallery
    .filter((item) => item.url.trim())
    .map((item, index) => ({ type: item.type || "image", url: item.url.trim(), alt: item.alt?.trim() || "", order_index: index + 1 }))));
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

export function getAdminTourContentItems(tour: AdminTour) {
  return (tour.content_items ?? tour.tour_content_items ?? [])
    .map((item, index) => ({
      id: Number(item.content_item_id ?? item.tour_content_item_id ?? item.id ?? 0),
      sort_order: Number(item.sort_order ?? item.order_index ?? index + 1)
    }))
    .filter((item) => item.id > 0)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item, index) => ({ ...item, sort_order: index + 1 }));
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
