"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { Play } from "lucide-react";

export function TourVideoButton({ title, image, videoUrl }: { title: string; image: string; videoUrl?: string }) {
  const [open, setOpen] = useState(false);
  const embedUrl = useMemo(() => getEmbedUrl(videoUrl), [videoUrl]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="absolute bottom-5 left-5 grid size-14 place-items-center rounded-full bg-white text-brand-600 shadow-sm transition hover:scale-105"
        aria-label={`Play video for ${title}`}
      >
        <Play fill="currentColor" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-3xl overflow-hidden rounded-lg bg-white shadow-soft">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold">{title}</h2>
              <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close video">
                <X size={18} />
              </button>
            </div>
            <div className="aspect-video bg-slate-950">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={`${title} video`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : videoUrl ? (
                <video className="h-full w-full" src={videoUrl} poster={image} controls autoPlay />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm font-semibold text-white">
                  No tour video has been uploaded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function getEmbedUrl(url?: string) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    }
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}?autoplay=1` : url;
    }
  } catch {
    return "";
  }

  return "";
}
