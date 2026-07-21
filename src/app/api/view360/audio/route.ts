import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const allowedHosts = new Set(["s3.cloudfly.vn"]);

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url");
  if (!source) return NextResponse.json({ message: "Missing audio URL." }, { status: 400 });

  try {
    const audioUrl = new URL(source);
    if (audioUrl.protocol !== "https:") {
      return NextResponse.json({ message: "Audio URL must use HTTPS." }, { status: 400 });
    }
    if (!allowedHosts.has(audioUrl.hostname)) {
      return NextResponse.redirect(audioUrl, 307);
    }

    const range = request.headers.get("range");
    const response = await fetch(audioUrl, {
      headers: range ? { Range: range } : undefined,
      signal: AbortSignal.timeout(15_000),
      cache: "no-store"
    });
    if (!response.ok || !response.body) {
      return NextResponse.json({ message: "Audio narration is unavailable." }, { status: 502 });
    }

    const headers = new Headers({
      "Content-Type": response.headers.get("content-type") ?? "audio/mpeg",
      "Accept-Ranges": response.headers.get("accept-ranges") ?? "bytes",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
    });
    for (const name of ["content-length", "content-range"]) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }

    return new NextResponse(response.body, { status: response.status, headers });
  } catch {
    return NextResponse.json({ message: "Audio narration is unavailable." }, { status: 502 });
  }
}
