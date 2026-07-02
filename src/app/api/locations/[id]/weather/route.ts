import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getBackendApiUrl() {
  const value = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
  if (!/^https?:\/\//i.test(value)) throw new Error("NEXT_PUBLIC_API_URL must be an absolute URL on the server.");
  return value.replace(/\/$/, "");
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Invalid location id." }, { status: 400 });
  }

  try {
    const response = await fetch(`${getBackendApiUrl()}/locations/${id}/weather`, {
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    });
    const payload = await response.json().catch(() => ({}));
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      { message: timedOut ? "The weather API timed out." : "The weather API is unavailable." },
      { status: timedOut ? 504 : 502 }
    );
  }
}
