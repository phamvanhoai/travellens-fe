import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBackendApiUrl() {
  const value = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  if (!/^https?:\/\//i.test(value)) throw new Error("NEXT_PUBLIC_API_URL must be an absolute URL on the server.");
  return value.replace(/\/$/, "");
}

async function getJson(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(`Backend returned ${response.status} for ${url}`);
  return response.json() as Promise<unknown>;
}

function unwrapData(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  return "data" in value ? (value as { data?: unknown }).data : value;
}

function destinationScenes(value: unknown): Array<Record<string, unknown>> {
  const data = unwrapData(value);
  if (!data || typeof data !== "object") return [];
  const scenes = (data as { view360?: unknown }).view360;
  return Array.isArray(scenes) ? scenes.filter((scene): scene is Record<string, unknown> => Boolean(scene) && typeof scene === "object") : [];
}

export async function GET(request: NextRequest) {
  const destinationId = request.nextUrl.searchParams.get("destinationId")?.trim() ?? "";
  if (destinationId && !/^\d+$/.test(destinationId)) {
    return NextResponse.json({ message: "Invalid destinationId." }, { status: 400 });
  }

  try {
    const backendApiUrl = getBackendApiUrl();
    const signal = AbortSignal.timeout(12_000);
    if (destinationId) {
      const destination = await getJson(`${backendApiUrl}/travel-destinations/${destinationId}`, signal);
      const scenes = destinationScenes(destination);
      const imageResponses = await Promise.all(
        scenes.map((scene) => {
          const viewId = Number(scene.view_id ?? scene.id);
          return Number.isInteger(viewId) && viewId > 0
            ? getJson(`${backendApiUrl}/view360-images?view_id=${viewId}&limit=100`, signal)
            : Promise.resolve({ data: [] });
        })
      );
      const images = imageResponses.flatMap((response) => {
        const data = unwrapData(response);
        return Array.isArray(data) ? data : [];
      });
      return NextResponse.json({ scenes, images, destination });
    }

    const [scenes, images] = await Promise.all([
      getJson(`${backendApiUrl}/view360?limit=100`, signal),
      getJson(`${backendApiUrl}/view360-images?limit=100`, signal)
    ]);
    return NextResponse.json({ scenes, images, destination: null });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { message: timedOut ? "The View360 API timed out." : "The View360 API is unavailable." },
      { status: timedOut ? 504 : 502 }
    );
  }
}
