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

export async function GET(request: NextRequest) {
  const destinationId = request.nextUrl.searchParams.get("destinationId")?.trim() ?? "";
  if (destinationId && !/^\d+$/.test(destinationId)) {
    return NextResponse.json({ message: "Invalid destinationId." }, { status: 400 });
  }

  try {
    const backendApiUrl = getBackendApiUrl();
    const signal = AbortSignal.timeout(12_000);
    const requests = [
      getJson(`${backendApiUrl}/view360`, signal),
      getJson(`${backendApiUrl}/view360-images`, signal)
    ];
    if (destinationId) requests.push(getJson(`${backendApiUrl}/travel-destinations/${destinationId}`, signal));

    const [scenes, images, destination] = await Promise.all(requests);
    return NextResponse.json({ scenes, images, destination: destination ?? null });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { message: timedOut ? "The View360 API timed out." : "The View360 API is unavailable." },
      { status: timedOut ? 504 : 502 }
    );
  }
}
