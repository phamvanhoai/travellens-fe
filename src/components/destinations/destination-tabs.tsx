"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Camera, Clock3, MapPin, MessageSquareText, Play, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DestinationRelatedItem, PublicTravelDestination } from "@/services/destination.service";
import type { Destination } from "@/types";
import { getPlainTextFromHtml } from "@/utils/html";

const tabs = ["Overview", "Locations", "Tours", "360 Experience", "Map", "Reviews", "Travel Guide"] as const;

type Tab = (typeof tabs)[number];

export function DestinationTabs({
  destination,
  detail
}: {
  destination: Destination;
  detail: PublicTravelDestination;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <div>
      <nav className="mt-6 flex gap-6 overflow-x-auto border-b border-slate-200 text-sm font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={
              activeTab === tab
                ? "whitespace-nowrap border-b-2 border-brand-600 pb-3 text-brand-600"
                : "whitespace-nowrap pb-3 text-slate-600 hover:text-brand-600"
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="mt-7">
        {activeTab === "Overview" ? <OverviewTab destination={destination} detail={detail} /> : null}
        {activeTab === "Locations" ? <LocationsTab destination={destination} locations={detail.locations ?? []} /> : null}
        {activeTab === "Tours" ? <ToursTab destination={destination} tours={detail.tours ?? []} /> : null}
        {activeTab === "360 Experience" ? <ExperienceTab destination={destination} scenes={detail.view360 ?? []} /> : null}
        {activeTab === "Map" ? <MapsTab destination={destination} maps={detail.maps ?? []} /> : null}
        {activeTab === "Reviews" ? <ReviewsTab reviews={detail.reviews ?? []} /> : null}
        {activeTab === "Travel Guide" ? <TravelGuideTab destination={destination} blogs={detail.blogs ?? []} /> : null}
      </div>
    </div>
  );
}

function OverviewTab({ destination, detail }: { destination: Destination; detail: PublicTravelDestination }) {
  return (
    <div>
      <h2 className="text-xl font-bold">About {destination.name}</h2>
      <RichDescription
        html={detail.description}
        fallback={destination.description || "No overview has been added for this destination."}
      />
    </div>
  );
}

function RichDescription({ html, fallback }: { html?: string | null; fallback: string }) {
  if (!html) return <p className="mt-3 text-sm leading-7 text-slate-600">{fallback}</p>;

  const parts = html.split(/(<img\b[^>]*>)/gi);

  return (
    <div className="mt-3 space-y-4 text-sm leading-7 text-slate-600">
      {parts.map((part, index) => {
        if (/^<img\b/i.test(part)) {
          const src = part.match(/\bsrc=["']([^"']+)["']/i)?.[1];
          const alt = part.match(/\balt=["']([^"']*)["']/i)?.[1] ?? destinationImageAlt(fallback);
          if (!src || !/^https?:\/\//i.test(src)) return null;

          return (
            <img
              key={`image-${index}`}
              src={src}
              alt={alt}
              loading="lazy"
              className="max-h-[520px] w-full rounded-lg object-cover"
            />
          );
        }

        const text = getPlainTextFromHtml(part);
        return text ? <p key={`text-${index}`}>{text}</p> : null;
      })}
    </div>
  );
}

function destinationImageAlt(fallback: string) {
  return fallback.length > 80 ? "Destination image" : fallback;
}

function LocationsTab({ destination, locations }: { destination: Destination; locations: DestinationRelatedItem[] }) {
  if (!locations.length) return <EmptyState title="No locations available" text={`No locations have been added to ${destination.name} yet.`} />;

  return (
    <div>
      <h2 className="text-xl font-bold">Locations in {destination.name}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {locations.map((location, index) => {
          const id = readId(location, ["location_id", "id"]);
          const name = readString(location, ["name", "title"]) || `Location ${index + 1}`;
          const description = cleanText(readString(location, ["description"]));
          const image = readString(location, ["thumbnail_url", "thumbnail", "image_url", "image"]);
          const content = (
            <div className="h-full overflow-hidden rounded-lg border border-slate-200 bg-white">
              {image ? <img src={image} alt={name} className="h-44 w-full object-cover" /> : null}
              <div className="p-5">
                <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><MapPin size={18} /></span>
                <h3 className="mt-4 font-bold">{name}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{description || "Explore this location inside the destination."}</p>
              </div>
            </div>
          );
          return id ? <Link key={id} href={`/locations/${id}`}>{content}</Link> : <div key={`${name}-${index}`}>{content}</div>;
        })}
      </div>
    </div>
  );
}

function ToursTab({ destination, tours }: { destination: Destination; tours: DestinationRelatedItem[] }) {
  if (!tours.length) return <EmptyState title="No tours available" text={`There are no active tours connected to ${destination.name} yet.`} />;

  return (
    <div>
      <h2 className="text-xl font-bold">Tours in {destination.name}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour, index) => {
          const id = readId(tour, ["tour_id", "id"]);
          const title = readString(tour, ["name", "title"]) || `Tour ${index + 1}`;
          const image = readString(tour, ["thumbnail_url", "thumbnail", "image_url", "image"]) || destination.image;
          const price = readNumber(tour, ["price", "adult_price", "min_price"]);
          const capacity = readString(tour, ["capacity", "available_slots", "remaining_slots"]);
          const duration = formatDuration(tour);
          return (
            <Link key={id || `${title}-${index}`} href={id ? `/tours/${id}` : "/tours"} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
              <img src={image} alt={title} className="h-48 w-full object-cover" />
              <div className="p-4">
                <h3 className="font-bold">{title}</h3>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                  {duration ? <span className="flex items-center gap-1"><Clock3 size={13} />{duration}</span> : null}
                  {capacity ? <span className="flex items-center gap-1"><Users size={13} />{capacity}</span> : null}
                </div>
                {price !== null ? <p className="mt-4 font-bold text-brand-600">{formatVnd(price)}</p> : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ExperienceTab({ destination, scenes }: { destination: Destination; scenes: DestinationRelatedItem[] }) {
  if (!scenes.length) return <EmptyState title="No 360 experiences available" text={`No 360 scenes have been added to ${destination.name} yet.`} />;

  const featured = scenes[0];
  const featuredImage = readRelatedImage(featured) || destination.image;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="relative min-h-[360px] overflow-hidden rounded-lg text-white">
        <img src={featuredImage} alt={readString(featured, ["title", "name"]) || destination.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative flex min-h-[360px] flex-col justify-end p-6">
          <span className="grid size-16 place-items-center rounded-full bg-white text-brand-600"><Play fill="currentColor" /></span>
          <h2 className="mt-6 text-3xl font-bold">{readString(featured, ["title", "name"]) || `Explore ${destination.name} in 360`}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/85">{cleanText(readString(featured, ["description"]))}</p>
          <Button href={`/view360?destinationId=${destination.id}`} className="mt-5 w-fit">Open 360 Viewer</Button>
        </div>
      </div>
      <div className="space-y-3">
        {scenes.map((scene, index) => (
          <div key={readId(scene, ["view360_id", "view_id", "id"]) || index} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><Camera size={17} /></span>
            <span>
              <span className="block font-bold">{readString(scene, ["title", "name"]) || `Scene ${index + 1}`}</span>
              <span className="text-xs text-slate-500">Scene {readString(scene, ["order_index"]) || index + 1}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MapsTab({ destination, maps }: { destination: Destination; maps: DestinationRelatedItem[] }) {
  if (!maps.length) return <EmptyState title="No maps available" text={`No visitor maps have been added to ${destination.name} yet.`} />;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{destination.name} Maps</h2>
          <p className="mt-2 text-sm text-slate-600">Visitor diagrams and map files for this destination.</p>
        </div>
        <Button href="/maps/travel">Open Travel Map</Button>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {maps.map((map, index) => {
          const title = readString(map, ["title", "name"]) || `Map ${index + 1}`;
          const image = readString(map, ["map_url", "map_file", "image_url", "image", "thumbnail"]);
          return (
            <div key={readId(map, ["map_id", "id"]) || index} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              {image ? <img src={image} alt={title} className="h-64 w-full object-cover" /> : <div className="grid h-48 place-items-center bg-slate-50 text-slate-400"><MapPin size={30} /></div>}
              <div className="p-4">
                <h3 className="font-bold">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{cleanText(readString(map, ["description"])) || "Destination visitor map."}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewsTab({ reviews }: { reviews: DestinationRelatedItem[] }) {
  if (!reviews.length) return <EmptyState title="No reviews yet" text="No approved traveler reviews are available for this destination." />;

  return (
    <div>
      <h2 className="text-xl font-bold">Traveler Reviews</h2>
      <div className="mt-5 grid gap-4">
        {reviews.map((review, index) => {
          const user = readNestedRecord(review, ["user", "User"]);
          const name = readString(review, ["user_name", "reviewer_name", "name"]) || readString(user, ["name"]) || "Traveler";
          const rating = readNumber(review, ["rating"]) ?? 0;
          const comment = cleanText(readString(review, ["comment", "content", "review"]));
          return (
            <div key={readId(review, ["review_id", "id"]) || index} className="rounded-lg border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <p className="font-bold">{name}</p>
                <span className="flex items-center gap-1 text-sm font-bold"><Star className="size-4 fill-amber-400 text-amber-400" /> {rating}</span>
              </div>
              <p className="mt-3 flex gap-2 text-sm leading-6 text-slate-600"><MessageSquareText size={17} className="mt-0.5 shrink-0 text-brand-600" /> {comment || "No written comment."}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TravelGuideTab({ destination, blogs }: { destination: Destination; blogs: DestinationRelatedItem[] }) {
  if (!blogs.length) return <EmptyState title="No travel guides available" text={`No blog guides have been connected to ${destination.name} yet.`} />;

  return (
    <div>
      <h2 className="text-xl font-bold">{destination.name} Travel Guides</h2>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        {blogs.map((blog, index) => {
          const id = readId(blog, ["blog_id", "id"]);
          const title = readString(blog, ["title", "name"]) || `Travel Guide ${index + 1}`;
          const image = readString(blog, ["thumbnail_url", "thumbnail", "image_url", "image"]);
          const excerpt = cleanText(readString(blog, ["content", "description", "excerpt"]));
          return (
            <Link key={id || `${title}-${index}`} href={id ? `/blogs/${id}` : "/blogs"} className="overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-brand-300">
              {image ? <img src={image} alt={title} className="h-44 w-full object-cover" /> : null}
              <div className="p-5">
                <BookOpen className="size-7 text-brand-600" />
                <h3 className="mt-3 font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{truncate(excerpt || "Read this destination travel guide.", 180)}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
      <h2 className="font-bold">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function readString(record: DestinationRelatedItem | undefined, keys: string[]) {
  if (!record) return "";
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
  }
  return "";
}

function readNumber(record: DestinationRelatedItem, keys: string[]) {
  const value = readString(record, keys);
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function readId(record: DestinationRelatedItem, keys: string[]) {
  return readString(record, keys);
}

function readNestedRecord(record: DestinationRelatedItem, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value as DestinationRelatedItem;
  }
  return undefined;
}

function readRelatedImage(record: DestinationRelatedItem) {
  const direct = readString(record, ["image_url", "image", "thumbnail_url", "thumbnail"]);
  if (direct) return direct;
  const images = record.images;
  if (!Array.isArray(images) || !images.length || typeof images[0] !== "object" || !images[0]) return "";
  return readString(images[0] as DestinationRelatedItem, ["image_url", "image_file", "image"]);
}

function cleanText(value: string) {
  return getPlainTextFromHtml(value);
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength).trim()}...` : value;
}

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
}

function formatDuration(tour: DestinationRelatedItem) {
  const direct = readString(tour, ["duration", "schedule"]);
  if (direct) return direct;
  const days = readString(tour, ["duration_days"]);
  const nights = readString(tour, ["duration_nights"]);
  return [days ? `${days} days` : "", nights ? `${nights} nights` : ""].filter(Boolean).join(" ");
}
