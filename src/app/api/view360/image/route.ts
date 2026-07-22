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

    const headers = new Headers({
      "Content-Type": response.headers.get("content-type") ?? "image/webp",
      "Cache-Control": "public, max-age=31536000, immutable",
      "CDN-Cache-Control": "public, max-age=31536000, immutable",
      "Vercel-CDN-Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff"
    });
    const contentLength = response.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);

    return new NextResponse(response.body, { headers });
  } catch {
    return NextResponse.json({ message: "Panorama image is unavailable." }, { status: 502 });
  }
}
