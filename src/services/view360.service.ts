import { resolveBackendAssetUrl } from "@/lib/avatar";

export type PublicView360Scene = {
  view_id?: number;
  view360_id?: number;
  id?: number;
  location_id?: number;
  title?: string;
  description?: string;
  audio_file?: string | null;
  audio_url?: string | null;
  language?: string | null;
  order_index?: number | string | null;
};

export type PublicView360Image = {
  image_id?: number;
  view360_image_id?: number;
  id?: number;
  view_id?: number;
  view360_id?: number;
  image_file?: string | null;
  image_url?: string | null;
  order_index?: number | string | null;
};

export type View360Experience = {
  id: number;
  locationId: number;
  title: string;
  description: string;
  audioUrl: string;
  language: string;
  orderIndex: number;
  images: Array<{ id: number; src: string; orderIndex: number }>;
};

function unwrapList<T>(value: unknown): T[] {
  const data = value && typeof value === "object" && "data" in value
    ? (value as { data?: unknown }).data
    : value;
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== "object") return [];
  const record = data as { data?: unknown; items?: unknown; rows?: unknown };
  const nested = record.data ?? record.items ?? record.rows;
  return Array.isArray(nested) ? nested as T[] : [];
}

function getSceneId(scene: PublicView360Scene) {
  return Number(scene.view_id ?? scene.view360_id ?? scene.id ?? 0);
}

function getImageId(image: PublicView360Image) {
  return Number(image.image_id ?? image.view360_image_id ?? image.id ?? 0);
}

function getImageSceneId(image: PublicView360Image) {
  return Number(image.view_id ?? image.view360_id ?? 0);
}

function getPanoramaImageUrl(value: string) {
  const source = resolveBackendAssetUrl(value);
  return source ? `/api/view360/image?url=${encodeURIComponent(source)}` : "";
}

function getNarrationAudioUrl(value: string) {
  const source = resolveBackendAssetUrl(value);
  return source ? `/api/view360/audio?url=${encodeURIComponent(source)}` : "";
}

export const view360Service = {
  async list(destinationId?: string) {
    const query = destinationId ? `?destinationId=${encodeURIComponent(destinationId)}` : "";
    const response = await fetch(`/api/view360${query}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(15_000)
    });
    const payload = await response.json() as { scenes?: unknown; images?: unknown; destination?: unknown; message?: string };
    if (!response.ok) throw new Error(payload.message ?? "The View360 API is unavailable.");

    let scenes = unwrapList<PublicView360Scene>(payload.scenes);
    const images = unwrapList<PublicView360Image>(payload.images);

    if (destinationId) {
      const destinationData = payload.destination && typeof payload.destination === "object" && "data" in payload.destination
        ? (payload.destination as { data?: Record<string, unknown> }).data
        : payload.destination as Record<string, unknown> | undefined;
      const destinationScenes = Array.isArray(destinationData?.view360) ? destinationData.view360 as PublicView360Scene[] : [];
      const allowedIds = new Set(destinationScenes.map(getSceneId).filter(Boolean));
      scenes = scenes.filter((scene) => allowedIds.has(getSceneId(scene)));
    }

    return scenes
      .map<View360Experience>((scene) => {
        const id = getSceneId(scene);
        return {
          id,
          locationId: Number(scene.location_id ?? 0),
          title: scene.title?.trim() || `360 Scene #${id}`,
          description: scene.description?.trim() || "Explore this location from every angle.",
          audioUrl: getNarrationAudioUrl(scene.audio_url ?? scene.audio_file ?? ""),
          language: scene.language?.trim() || "Narration",
          orderIndex: Number(scene.order_index ?? 0),
          images: images
            .filter((image) => getImageSceneId(image) === id)
            .map((image) => ({
              id: getImageId(image),
              src: getPanoramaImageUrl(image.image_url ?? image.image_file ?? ""),
              orderIndex: Number(image.order_index ?? 0)
            }))
            .filter((image) => image.src)
            .sort((a, b) => a.orderIndex - b.orderIndex)
        };
      })
      .filter((scene) => scene.id && scene.images.length > 0)
      .sort((a, b) => a.orderIndex - b.orderIndex || a.id - b.id);
  }
};
