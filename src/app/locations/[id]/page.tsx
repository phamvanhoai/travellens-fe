"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Camera, Loader2, Map, MapPin, Star, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import { getPublicLocationId, locationService, type PublicLocation } from "@/services/location.service";
import { getPlainTextFromHtml } from "@/utils/html";

type RelatedRecord = Record<string, unknown>;

function readString(record: RelatedRecord | null | undefined, keys: string[]) {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return undefined;
}

function readNumber(record: RelatedRecord | null | undefined, keys: string[]) {
  if (!record) return undefined;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function asRecords(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is RelatedRecord => Boolean(item) && typeof item === "object") : [];
}

function getLocationName(location: PublicLocation) {
  return location.name ?? location.title ?? `Location #${getPublicLocationId(location)}`;
}

function getDestinationName(location: PublicLocation) {
  return location.travel_destination_name ??
    location.travel_destination?.name ??
    location.TravelDestination?.name ??
    "Travel destination";
}

function getDestinationId(location: PublicLocation) {
  return location.travel_destination_id ??
    location.travel_destination?.travel_destination_id ??
    location.travel_destination?.destination_id ??
    location.travel_destination?.id ??
    location.TravelDestination?.travel_destination_id ??
    location.TravelDestination?.destination_id ??
    location.TravelDestination?.id;
}

function getLocationImage(location: PublicLocation) {
  return location.thumbnail_url ??
    location.thumbnail ??
    location.image_url ??
    location.image ??
    location.travel_destination?.thumbnail_url ??
    location.travel_destination?.thumbnail ??
    location.travel_destination?.image_url ??
    location.travel_destination?.image ??
    location.TravelDestination?.thumbnail_url ??
    location.TravelDestination?.thumbnail ??
    location.TravelDestination?.image_url ??
    location.TravelDestination?.image ??
    images.santorini;
}

function getMapImage(location: PublicLocation, maps: RelatedRecord[]) {
  const firstMap = maps[0];
  return readString(firstMap, ["map_url", "map_file", "image_url", "thumbnail_url"]) ??
    location.map_url ??
    location.map_file;
}

export default function LocationDetailPage() {
  const params = useParams<{ id: string }>();
  const [location, setLocation] = useState<PublicLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLocation() {
      if (!params.id) return;
      setLoading(true);
      setError("");

      try {
        setLocation(await locationService.detail(params.id));
      } catch (err) {
        setError("Cannot load this location.");
      } finally {
        setLoading(false);
      }
    }

    void loadLocation();
  }, [params.id]);

  const related = useMemo(() => {
    if (!location) return { maps: [], scenes: [], reviews: [] };
    return {
      maps: [...asRecords(location.maps), ...asRecords(location.Maps)],
      scenes: [...asRecords(location.view360), ...asRecords(location.view360s), ...asRecords(location.View360s)],
      reviews: [...asRecords(location.reviews), ...asRecords(location.Reviews)]
    };
  }, [location]);

  if (loading) {
    return (
      <section className="mx-auto flex min-h-[520px] max-w-7xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Loader2 className="size-9 animate-spin text-brand-600" />
      </section>
    );
  }

  if (error || !location) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <h1 className="text-2xl font-bold">Location not available</h1>
          <p className="mt-2 text-sm text-slate-500">{error || "This location could not be found."}</p>
          <Button href="/destinations" className="mt-6">Back to Destinations</Button>
        </div>
      </section>
    );
  }

  const locationId = getPublicLocationId(location);
  const name = getLocationName(location);
  const destinationName = getDestinationName(location);
  const destinationId = getDestinationId(location);
  const description = getPlainTextFromHtml(location.description ?? "") || "No description has been added for this location yet.";
  const image = getLocationImage(location);
  const mapImage = getMapImage(location, related.maps);
  const rating = Number(location.average_rating ?? location.rating ?? 0);
  const reviewCount = Number(location.reviews_count ?? location.review_count ?? related.reviews.length);
  const latitude = location.latitude ?? "-";
  const longitude = location.longitude ?? "-";

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 text-sm text-slate-500">Home / Locations / {destinationName} / {name}</div>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-lg">
          <img src={image} alt={name} className="h-[480px] w-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Location detail</p>
          <h1 className="mt-3 text-4xl font-bold">{name}</h1>
          <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2"><MapPin size={16} /> {destinationName}</span>
            {rating > 0 ? <span className="inline-flex items-center gap-1"><Star className="size-4 fill-amber-400 text-amber-400" /> {rating.toFixed(1)} ({reviewCount} reviews)</span> : null}
          </p>
          <p className="mt-5 leading-7 text-slate-600">{description}</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            <span className="rounded-lg bg-brand-50 p-4 text-center text-sm font-bold text-brand-600"><Map className="mx-auto mb-2 size-5" />{related.maps.length} maps</span>
            <span className="rounded-lg bg-brand-50 p-4 text-center text-sm font-bold text-brand-600"><Video className="mx-auto mb-2 size-5" />{related.scenes.length} scenes</span>
            <span className="rounded-lg bg-brand-50 p-4 text-center text-sm font-bold text-brand-600"><Star className="mx-auto mb-2 size-5" />{reviewCount} reviews</span>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={`/view360?locationId=${locationId}`}>Open 360 Gallery</Button>
            {destinationId ? <Button href={`/destinations/${destinationId}`} variant="outline">View Destination</Button> : null}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-7 lg:grid-cols-2">
        <div className="relative min-h-80 overflow-hidden rounded-lg bg-blue-50">
          {mapImage ? (
            <img src={mapImage} alt={`${name} map`} className="h-full w-full object-cover opacity-90" />
          ) : (
            <div className="grid h-full min-h-80 place-items-center bg-slate-100 text-sm font-semibold text-slate-500">
              No map image available
            </div>
          )}
          <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white"><MapPin /></span>
        </div>
        <div className="rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold">Location Information</h2>
          <dl className="mt-5 grid gap-4 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Address</dt>
              <dd className="mt-1 font-semibold text-slate-700">{location.address ?? destinationName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-400">Coordinates</dt>
              <dd className="mt-1 font-semibold text-slate-700">{latitude}, {longitude}</dd>
            </div>
          </dl>

          <h3 className="mt-7 font-bold">Reviews</h3>
          <div className="mt-3 space-y-3">
            {related.reviews.slice(0, 3).map((review, index) => (
              <p key={readString(review, ["review_id", "id"]) ?? index} className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
                {readString(review, ["comment", "content", "review"]) ?? "No comment"}
              </p>
            ))}
            {related.reviews.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No reviews yet.</p> : null}
          </div>
        </div>
      </div>

      <h2 className="mt-10 text-2xl font-bold">360 Scenes</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {related.scenes.slice(0, 4).map((scene, index) => {
          const sceneId = readString(scene, ["view360_id", "id"]);
          const sceneName = readString(scene, ["title", "name"]) ?? `Scene ${index + 1}`;
          const sceneImage = readString(scene, ["thumbnail_url", "thumbnail", "image_url", "image"]);
          return (
            <a key={sceneId ?? index} href={`/view360?locationId=${locationId}${sceneId ? `&sceneId=${sceneId}` : ""}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white hover:border-brand-500">
              {sceneImage ? <img src={sceneImage} alt="" className="h-36 w-full object-cover" /> : <div className="grid h-36 place-items-center bg-brand-50 text-brand-600"><Camera /></div>}
              <div className="p-4">
                <p className="font-bold">{sceneName}</p>
                <p className="mt-1 text-xs text-slate-500">View360 scene</p>
              </div>
            </a>
          );
        })}
        {related.scenes.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No 360 scenes available for this location.</p> : null}
      </div>
    </section>
  );
}
