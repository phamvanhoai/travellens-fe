import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const allowedHosts = new Set([
  "s3.cloudfly.vn",
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "scontent.iocvnpt.com",
  "visitphuquoc.com.vn"
]);

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url");
  if (!source) return NextResponse.json({ message: "Missing image URL." }, { status: 400 });

  try {
    const imageUrl = new URL(source);
    if (imageUrl.protocol !== "https:" || !allowedHosts.has(imageUrl.hostname)) {
      return NextResponse.json({ message: "Image host is not allowed." }, { status: 400 });
    }

    const response = await fetch(imageUrl, {
      signal: AbortSignal.timeout(15_000),
      cache: "no-store"
    });
    if (!response.ok || !response.body) {
      return NextResponse.json({ message: "Panorama image is unavailable." }, { status: 502 });
    }

    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
      }
    });
  } catch {
    return NextResponse.json({ message: "Panorama image is unavailable." }, { status: 502 });
  }
}
