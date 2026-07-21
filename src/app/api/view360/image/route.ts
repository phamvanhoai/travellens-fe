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
    if (!response.ok) {
      return NextResponse.json({ message: "Panorama image is unavailable." }, { status: 502 });
    }

    const image = await response.arrayBuffer();
    const upstreamLength = Number(response.headers.get("content-length"));
    if (!image.byteLength || (Number.isFinite(upstreamLength) && upstreamLength > 0 && image.byteLength !== upstreamLength)) {
      return NextResponse.json({ message: "Panorama image download was incomplete." }, { status: 502 });
    }

    return new NextResponse(image, {
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "image/jpeg",
        "Content-Length": String(image.byteLength),
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return NextResponse.json({ message: "Panorama image is unavailable." }, { status: 502 });
  }
}
