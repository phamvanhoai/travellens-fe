import { api } from "@/services/api";

export type TravelStory = {
  story_id?: number;
  travel_story_id?: number;
  id?: number;
  user_id?: number;
  media_url?: string;
  url?: string;
  media_type?: "image" | "video" | string;
  caption?: string | null;
  viewer_count?: number;
  is_viewed?: boolean;
  created_at?: string;
  expires_at?: string;
  status?: string;
  user?: { user_id?: number; id?: number; name?: string; avatar_url?: string | null };
  author?: { user_id?: number; id?: number; name?: string; avatar_url?: string | null };
};

export type TravelStoryViewer = { user_id?: number; id?: number; name?: string; avatar_url?: string | null; viewed_at?: string };

function unwrapData<T>(value: unknown): T {
  const body = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return (body.data ?? value) as T;
}

function unwrapList<T>(value: unknown, keys: string[]) {
  const data = unwrapData<unknown>(value);
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;
  for (const key of keys) if (Array.isArray(record[key])) return record[key] as T[];
  return [];
}

export function getTravelStoryId(story: TravelStory) { return Number(story.story_id ?? story.travel_story_id ?? story.id ?? 0); }
export function getTravelStoryUserId(story: TravelStory) { return Number(story.user_id ?? story.user?.user_id ?? story.user?.id ?? story.author?.user_id ?? story.author?.id ?? 0); }
export function getTravelStoryAuthor(story: TravelStory) { return story.user?.name ?? story.author?.name ?? "Traveler"; }
export function getTravelStoryAvatar(story: TravelStory) { return story.user?.avatar_url ?? story.author?.avatar_url ?? ""; }
export function getTravelStoryMedia(story: TravelStory) { return story.media_url ?? story.url ?? ""; }

export const travelStoryService = {
  async feed(params: { page?: number; limit?: number } = {}) { const response = await api.get("/travel-stories", { params }); return unwrapList<TravelStory>(response.data, ["stories", "items", "data"]); },
  async mine(params: { page?: number; limit?: number; status?: "active" | "expired" } = {}) { const response = await api.get("/travel-stories/mine", { params }); return unwrapList<TravelStory>(response.data, ["stories", "items", "data"]); },
  async create(file: File, caption: string) { const form = new FormData(); form.append("media_file", file); if (caption.trim()) form.append("caption", caption.trim()); const response = await api.post("/travel-stories", form); return unwrapData<TravelStory>(response.data); },
  async detail(id: number) { const response = await api.get(`/travel-stories/${id}`); return unwrapData<TravelStory>(response.data); },
  async markViewed(id: number) { const response = await api.post(`/travel-stories/${id}/view`); return response.data; },
  async viewers(id: number, params: { page?: number; limit?: number } = {}) { const response = await api.get(`/travel-stories/${id}/viewers`, { params }); return unwrapList<TravelStoryViewer>(response.data, ["viewers", "items", "data"]); },
  async remove(id: number) { const response = await api.delete(`/travel-stories/${id}`); return response.data; }
};
