import { api } from "@/services/api";

export type TravelFeedSort = "newest" | "oldest" | "popular";

export type TravelFeedAuthor = {
  user_id?: number;
  id?: number;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  avatar?: string | null;
};

export type TravelFeedPlace = {
  travel_destination_id?: number;
  destination_id?: number;
  location_id?: number;
  id?: number;
  name?: string | null;
  title?: string | null;
};

export type TravelFeedPost = {
  post_id?: number;
  travel_post_id?: number;
  feed_id?: number;
  id?: number;
  user_id?: number;
  title?: string | null;
  caption?: string | null;
  content?: string | null;
  description?: string | null;
  photos?: Array<string | { url?: string | null; image_url?: string | null; photo_url?: string | null; path?: string | null }>;
  images?: Array<string | { url?: string | null; image_url?: string | null; photo_url?: string | null; path?: string | null }>;
  media?: Array<string | { url?: string | null; image_url?: string | null; photo_url?: string | null; path?: string | null }>;
  photo_urls?: string[];
  image_urls?: string[];
  thumbnail?: string | null;
  thumbnail_url?: string | null;
  image?: string | null;
  image_url?: string | null;
  location_id?: number;
  destination_id?: number;
  travel_destination_id?: number;
  location_name?: string | null;
  destination_name?: string | null;
  travel_destination_name?: string | null;
  location?: TravelFeedPlace | null;
  Location?: TravelFeedPlace | null;
  destination?: TravelFeedPlace | null;
  travel_destination?: TravelFeedPlace | null;
  TravelDestination?: TravelFeedPlace | null;
  author?: TravelFeedAuthor | null;
  user?: TravelFeedAuthor | null;
  User?: TravelFeedAuthor | null;
  author_name?: string | null;
  user_name?: string | null;
  likes_count?: number | string | null;
  like_count?: number | string | null;
  comments_count?: number | string | null;
  comment_count?: number | string | null;
  is_liked?: boolean | null;
  liked?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type TravelFeedListParams = {
  page?: number;
  limit?: number;
  search?: string;
  destination_id?: number;
  location_id?: number;
  user_id?: number;
  sort?: TravelFeedSort;
};

export type CreateTravelFeedPostPayload = {
  content: string;
  destination_id?: number;
  location_id?: number;
  photos?: File[];
};

export type TravelFeedListResult = {
  items: TravelFeedPost[];
  total: number;
  totalPages: number;
};

function unwrapList(value: unknown): TravelFeedListResult {
  const body = isRecord(value) ? value : {};
  const data = body.data ?? value;
  const dataRecord = isRecord(data) ? data : {};
  const listSource = Array.isArray(data)
    ? data
    : dataRecord.items ?? dataRecord.posts ?? dataRecord.feed ?? dataRecord.rows ?? dataRecord.results ?? dataRecord.data;
  const items = Array.isArray(listSource) ? listSource as TravelFeedPost[] : [];
  const pagination = (body.pagination ?? dataRecord.pagination ?? dataRecord.meta) as Record<string, unknown> | undefined;
  const total = Number(pagination?.total ?? pagination?.totalItems ?? dataRecord.total ?? items.length);
  const limit = Number(pagination?.limit ?? pagination?.pageSize ?? Math.max(items.length, 1));
  const totalPages = Number(pagination?.totalPages ?? pagination?.pageCount ?? Math.max(1, Math.ceil(total / limit)));

  return { items, total, totalPages };
}

function unwrapPost(value: unknown) {
  const body = isRecord(value) ? value : {};
  const data = body.data ?? value;
  if (isRecord(data) && "post" in data) return data.post as TravelFeedPost;
  if (isRecord(data) && "travel_post" in data) return data.travel_post as TravelFeedPost;
  return data as TravelFeedPost;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function firstString(...values: Array<unknown>) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? "";
}

function readPhotoUrl(value: unknown) {
  if (typeof value === "string") return value;
  if (!isRecord(value)) return "";
  return firstString(value.url, value.image_url, value.photo_url, value.path);
}

export function getTravelFeedPostId(post: TravelFeedPost) {
  return post.post_id ?? post.travel_post_id ?? post.feed_id ?? post.id ?? 0;
}

export function getTravelFeedTitle(post: TravelFeedPost) {
  return firstString(post.title, post.caption) || "Travel moment";
}

export function getTravelFeedContent(post: TravelFeedPost) {
  return firstString(post.content, post.description, post.caption);
}

export function getTravelFeedPhotos(post: TravelFeedPost) {
  const candidates = [
    ...(post.photos ?? []),
    ...(post.images ?? []),
    ...(post.media ?? []),
    ...(post.photo_urls ?? []),
    ...(post.image_urls ?? []),
    post.thumbnail_url,
    post.thumbnail,
    post.image_url,
    post.image
  ];

  return candidates.map(readPhotoUrl).filter(Boolean);
}

export function getTravelFeedAuthor(post: TravelFeedPost) {
  const author = post.author ?? post.user ?? post.User;
  return {
    name: firstString(post.author_name, post.user_name, author?.name, author?.email) || "Travel360 traveler",
    avatar: firstString(author?.avatar_url, author?.avatar)
  };
}

export function getTravelFeedLocationName(post: TravelFeedPost) {
  return firstString(post.location_name, post.location?.name, post.Location?.name, post.location?.title, post.Location?.title);
}

export function getTravelFeedDestinationName(post: TravelFeedPost) {
  return firstString(
    post.destination_name,
    post.travel_destination_name,
    post.destination?.name,
    post.travel_destination?.name,
    post.TravelDestination?.name,
    post.destination?.title,
    post.travel_destination?.title,
    post.TravelDestination?.title
  );
}

export function getTravelFeedLocationId(post: TravelFeedPost) {
  return post.location_id ?? post.location?.location_id ?? post.Location?.location_id ?? post.location?.id ?? post.Location?.id ?? 0;
}

export function getTravelFeedDestinationId(post: TravelFeedPost) {
  return post.destination_id
    ?? post.travel_destination_id
    ?? post.destination?.travel_destination_id
    ?? post.travel_destination?.travel_destination_id
    ?? post.TravelDestination?.travel_destination_id
    ?? post.destination?.destination_id
    ?? post.travel_destination?.destination_id
    ?? post.TravelDestination?.destination_id
    ?? post.destination?.id
    ?? post.travel_destination?.id
    ?? post.TravelDestination?.id
    ?? 0;
}

export function getTravelFeedLikeCount(post: TravelFeedPost) {
  return Number(post.likes_count ?? post.like_count ?? 0);
}

export function getTravelFeedCommentCount(post: TravelFeedPost) {
  return Number(post.comments_count ?? post.comment_count ?? 0);
}

export function isTravelFeedLiked(post: TravelFeedPost) {
  return Boolean(post.is_liked ?? post.liked);
}

export const travelFeedService = {
  async list(params: TravelFeedListParams = {}) {
    const response = await api.get("/travel-feed", { params });
    return unwrapList(response.data);
  },
  async create(payload: CreateTravelFeedPostPayload) {
    const hasPhotos = Boolean(payload.photos?.length);

    if (!hasPhotos) {
      const response = await api.post("/travel-feed", {
        content: payload.content,
        destination_id: payload.destination_id,
        location_id: payload.location_id
      });
      return unwrapPost(response.data);
    }

    const formData = new FormData();
    formData.append("content", payload.content);
    if (payload.destination_id) formData.append("destination_id", String(payload.destination_id));
    if (payload.location_id) formData.append("location_id", String(payload.location_id));
    payload.photos?.forEach((photo) => formData.append("photos", photo));

    const response = await api.post("/travel-feed", formData);
    return unwrapPost(response.data);
  }
};
