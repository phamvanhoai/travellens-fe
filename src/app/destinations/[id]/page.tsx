"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Check, Clock, Globe2, Languages, MapPin, Play, Share2, Star } from "lucide-react";
import { DestinationDetailSaveButton } from "@/components/common/destination-detail-save-button";
import { DestinationTabs } from "@/components/destinations/destination-tabs";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import {
  destinationService,
  type PublicTravelDestination,
  toDestinationDetailModel
} from "@/services/destination.service";
import type { Destination } from "@/types";

export default function DestinationDetailPage() {
  const params = useParams<{ id: string }>();
  const [destination, setDestination] = useState<Destination | null>(null);
  const [destinationDetail, setDestinationDetail] = useState<PublicTravelDestination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    async function loadDestination() {
      if (!params.id) return;
      setIsLoading(true);
      setError("");
      try {
        const detail = await destinationService.detail(params.id);
        const mappedDestination = toDestinationDetailModel(detail, images.santorini);
        setDestination(mappedDestination);
        setDestinationDetail(detail);
      } catch (err) {
        console.error("Failed to fetch destination detail:", err);
        setError("Cannot load this travel destination.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadDestination();
  }, [params.id]);

  if (isLoading) {
    return <DestinationDetailSkeleton />;
  }

  if (error || !destination || !destinationDetail) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <h1 className="text-2xl font-bold">Destination not available</h1>
          <p className="mt-2 text-sm text-slate-500">{error || "This travel destination could not be found."}</p>
          <Button href="/destinations" className="mt-6">Back to Destinations</Button>
        </div>
      </section>
    );
  }

  const descriptionPreview = destination.description.length > 180
    ? `${destination.description.slice(0, 177).trimEnd()}...`
    : destination.description;

  async function handleShare() {
    const shareData = {
      title: destination?.name ?? "Travel destination",
      text: descriptionPreview,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareData.url);
      setShareStatus("copied");
      window.setTimeout(() => setShareStatus("idle"), 2000);
    } catch (shareError) {
      if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      setShareStatus("failed");
      window.setTimeout(() => setShareStatus("idle"), 2000);
    }
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 text-sm text-slate-500">Home / Destinations / {destination.region} / {destination.name}</div>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative min-h-[430px] overflow-hidden rounded-lg">
            <img src={destination.image} alt={destination.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute right-4 top-4 flex gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="rounded-lg bg-black/45 px-4 py-2 text-sm font-semibold text-white"
              >
                {shareStatus === "copied" ? <Check className="mr-2 inline size-4" /> : <Share2 className="mr-2 inline size-4" />}
                {shareStatus === "copied" ? "Copied" : shareStatus === "failed" ? "Try again" : "Share"}
              </button>
              <DestinationDetailSaveButton id={destination.id} />
            </div>
            <div className="absolute bottom-6 left-6 max-w-2xl text-white">
              <span className="rounded-md bg-brand-600 px-3 py-1 text-xs font-bold">Top Destination</span>
              <h1 className="mt-4 text-4xl font-bold">{destination.name}, {destination.country}</h1>
              <p className="mt-3 flex items-center gap-4 text-sm">
                <span><Star className="inline size-4 fill-amber-400 text-amber-400" /> {destination.rating} ({destination.reviews} reviews)</span>
                <span><MapPin className="inline size-4" /> {destination.region}</span>
              </p>
              <p className="mt-4 max-w-xl line-clamp-3 text-sm leading-6 text-white/85 sm:text-base">
                {descriptionPreview}
              </p>
            </div>
          </div>

          <DestinationTabs destination={destination} detail={destinationDetail} />
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-bold">{destination.name}, {destination.country}</h2>
              <span className="rounded-md bg-brand-600 px-3 py-1 text-xs font-bold text-white">{destination.badge ?? "Top"}</span>
            </div>
            <p className="mt-3 line-clamp-5 text-sm leading-6 text-slate-600">{descriptionPreview}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <span><Clock className="mr-2 inline size-4" />{destination.bestTime}</span>
              <span><Languages className="mr-2 inline size-4" />English</span>
              <span><Globe2 className="mr-2 inline size-4" />VND</span>
              <span><MapPin className="mr-2 inline size-4" />GMT +7</span>
            </div>
            <div className="mt-6">
              <Button href={`/view360?destinationId=${destination.id}`} className="w-full">View 360</Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg p-5 text-white">
            <img src={destination.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative">
              <span className="grid size-14 place-items-center rounded-full bg-white text-brand-600"><Play fill="currentColor" /></span>
              <h3 className="mt-8 text-xl font-bold">360 Experience Preview</h3>
              <p className="mt-2 text-sm text-white/85">Explore {destination.name} in 360</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-6">
            <h3 className="font-bold">Destination Details</h3>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Category</dt>
                <dd className="mt-1 flex items-center gap-2 font-semibold text-slate-700">
                  <Globe2 size={16} className="text-brand-600" /> {destination.category}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Coordinates</dt>
                <dd className="mt-1 flex items-center gap-2 font-semibold text-slate-700">
                  <MapPin size={16} className="text-brand-600" />
                  {destinationDetail.latitude ?? "-"}, {destinationDetail.longitude ?? "-"}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}

function DestinationDetailSkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-label="Loading destination" aria-busy="true">
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, index) => <div key={index} className={`h-3.5 animate-pulse rounded bg-slate-100 ${index % 2 ? "w-3" : "w-20"}`} />)}
      </div>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative min-h-[430px] overflow-hidden rounded-lg bg-slate-200">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-slate-400/60 via-slate-300/20 to-transparent" />
            <div className="absolute right-4 top-4 flex gap-2"><div className="h-10 w-24 animate-pulse rounded-lg bg-white/50" /><div className="size-10 animate-pulse rounded-lg bg-white/50" /></div>
            <div className="absolute bottom-6 left-6 right-6 max-w-2xl">
              <div className="h-6 w-28 animate-pulse rounded bg-brand-300/70" />
              <div className="mt-4 h-9 w-3/5 animate-pulse rounded bg-white/60" />
              <div className="mt-3 h-4 w-2/5 animate-pulse rounded bg-white/40" />
              <div className="mt-4 space-y-2"><div className="h-3.5 w-full animate-pulse rounded bg-white/35" /><div className="h-3.5 w-4/5 animate-pulse rounded bg-white/35" /></div>
            </div>
          </div>
          <div className="mt-6 flex gap-3 border-b border-slate-200 pb-3">
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-9 w-24 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
          <div className="mt-6 space-y-3 rounded-lg border border-slate-200 bg-white p-6">
            <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
            {Array.from({ length: 5 }, (_, index) => <div key={index} className={`h-3.5 animate-pulse rounded bg-slate-100 ${index === 4 ? "w-2/3" : "w-full"}`} />)}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex justify-between gap-4"><div className="h-7 w-3/5 animate-pulse rounded bg-slate-200" /><div className="h-6 w-12 animate-pulse rounded bg-brand-100" /></div>
            <div className="mt-4 space-y-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className={`h-3.5 animate-pulse rounded bg-slate-100 ${index === 3 ? "w-3/4" : "w-full"}`} />)}</div>
            <div className="mt-6 grid grid-cols-2 gap-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-4 w-24 animate-pulse rounded bg-slate-200" />)}</div>
            <div className="mt-6 h-11 w-full animate-pulse rounded-lg bg-brand-100" />
          </div>
          <div className="h-52 animate-pulse rounded-lg bg-slate-200" />
          <div className="rounded-lg border border-slate-200 p-6"><div className="h-5 w-36 animate-pulse rounded bg-slate-200" /><div className="mt-5 h-3 w-20 animate-pulse rounded bg-slate-100" /><div className="mt-2 h-4 w-32 animate-pulse rounded bg-slate-200" /><div className="mt-5 h-3 w-24 animate-pulse rounded bg-slate-100" /><div className="mt-2 h-4 w-40 animate-pulse rounded bg-slate-200" /></div>
        </aside>
      </div>
    </section>
  );
}
