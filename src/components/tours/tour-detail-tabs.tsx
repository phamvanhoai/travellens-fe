"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, HelpCircle, Images, Info, MapPin, Maximize2, Route, Sparkles, Star, X, XCircle } from "lucide-react";
import { CustomerRouteNavigationLoader } from "@/components/navigation/customer-route-navigation-loader";
import { getPlainTextFromHtml } from "@/utils/html";

export type TourDetailDestination = {
  id: number;
  name: string;
  orderIndex: number;
  estimatedTime: string;
  note: string;
  locationsCount: number | null;
};

export type TourDetailReview = {
  id: number;
  userName: string;
  avatarUrl: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type TourDetailContent = {
  highlights: string[];
  inclusions: string[];
  exclusions: string[];
  requirements: string[];
  cancellationPolicy: string;
  bookingPolicy: string;
  additionalInformation: string;
  faqs: Array<{ id: number; question: string; answer: string; orderIndex: number }>;
  gallery: Array<{ id: number; url: string; alt: string; orderIndex: number }>;
};

const tabs = ["Overview", "Highlights", "Itinerary", "Included", "Policies", "Gallery", "Reviews"] as const;
type Tab = (typeof tabs)[number];

export function TourDetailTabs({
  tourId,
  title,
  description,
  destinations,
  reviews,
  content
}: {
  tourId: string;
  title: string;
  description: string;
  destinations: TourDetailDestination[];
  reviews: TourDetailReview[];
  content: TourDetailContent;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <div>
      <nav className="mt-6 flex gap-6 overflow-x-auto border-b border-slate-200 text-sm font-semibold" aria-label="Tour detail sections">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab
              ? "whitespace-nowrap border-b-2 border-brand-600 pb-3 text-brand-600"
              : "whitespace-nowrap pb-3 text-slate-600 transition hover:text-brand-600"}
          >
            {tab}{tab === "Reviews" ? ` (${reviews.length})` : ""}
          </button>
        ))}
      </nav>

      <div className="mt-7">
        {activeTab === "Overview" ? <OverviewTab title={title} description={description} /> : null}
        {activeTab === "Highlights" ? <HighlightsTab highlights={content.highlights} requirements={content.requirements} /> : null}
        {activeTab === "Itinerary" ? <ItineraryTab tourId={tourId} destinations={destinations} /> : null}
        {activeTab === "Included" ? <IncludedTab inclusions={content.inclusions} exclusions={content.exclusions} /> : null}
        {activeTab === "Policies" ? <PoliciesTab content={content} /> : null}
        {activeTab === "Gallery" ? <GalleryTab images={content.gallery} /> : null}
        {activeTab === "Reviews" ? <ReviewsTab reviews={reviews} /> : null}
      </div>
    </div>
  );
}

function HighlightsTab({ highlights, requirements }: { highlights: string[]; requirements: string[] }) {
  if (!highlights.length && !requirements.length) return <EmptyState text="No tour highlights or requirements have been added yet." />;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ListCard title="Tour highlights" icon={<Sparkles className="size-5 text-brand-600" />} items={highlights} empty="No highlights provided." />
      <ListCard title="Requirements" icon={<AlertCircle className="size-5 text-amber-600" />} items={requirements} empty="No special requirements." />
    </div>
  );
}

function IncludedTab({ inclusions, exclusions }: { inclusions: string[]; exclusions: string[] }) {
  if (!inclusions.length && !exclusions.length) return <EmptyState text="Inclusions and exclusions have not been provided for this tour." />;
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <ListCard title="Included" icon={<CheckCircle2 className="size-5 text-emerald-600" />} items={inclusions} empty="No inclusions provided." tone="emerald" />
      <ListCard title="Not included" icon={<XCircle className="size-5 text-rose-500" />} items={exclusions} empty="No exclusions provided." tone="rose" />
    </div>
  );
}

function ListCard({ title, icon, items, empty, tone = "slate" }: { title: string; icon: React.ReactNode; items: string[]; empty: string; tone?: "slate" | "emerald" | "rose" }) {
  const styles = tone === "emerald" ? "border-emerald-100 bg-emerald-50/50" : tone === "rose" ? "border-rose-100 bg-rose-50/50" : "border-slate-200 bg-white";
  return (
    <section className={`rounded-lg border p-5 ${styles}`}>
      <h2 className="flex items-center gap-2 font-bold">{icon}{title}</h2>
      {items.length ? <ul className="mt-4 space-y-3">{items.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-sm leading-6 text-slate-600"><CheckCircle2 className="mt-1 size-4 shrink-0 text-brand-600" />{item}</li>)}</ul> : <p className="mt-4 text-sm text-slate-500">{empty}</p>}
    </section>
  );
}

function PoliciesTab({ content }: { content: TourDetailContent }) {
  const hasPolicies = content.bookingPolicy || content.cancellationPolicy || content.additionalInformation;
  if (!hasPolicies && !content.faqs.length) return <EmptyState text="Policies and FAQs have not been added for this tour." />;
  return (
    <div className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <PolicyCard title="Booking policy" text={content.bookingPolicy} />
        <PolicyCard title="Cancellation policy" text={content.cancellationPolicy} />
      </div>
      {content.additionalInformation ? <section className="rounded-lg border border-brand-100 bg-brand-50/50 p-5"><h2 className="flex items-center gap-2 font-bold"><Info className="size-5 text-brand-600" />Additional information</h2><p className="mt-3 text-sm leading-7 text-slate-600">{content.additionalInformation}</p></section> : null}
      {content.faqs.length ? <section><h2 className="flex items-center gap-2 text-xl font-bold"><HelpCircle className="size-5 text-brand-600" />Frequently asked questions</h2><div className="mt-4 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white px-5">{content.faqs.map((faq) => <div key={faq.id} className="py-4"><h3 className="font-semibold">{faq.question}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{faq.answer}</p></div>)}</div></section> : null}
    </div>
  );
}

function PolicyCard({ title, text }: { title: string; text: string }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5"><h2 className="font-bold">{title}</h2><p className="mt-3 text-sm leading-7 text-slate-600">{text || "No policy has been provided."}</p></section>;
}

function GalleryTab({ images }: { images: TourDetailContent["gallery"] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  if (!images.length) return <EmptyState text="No gallery images have been uploaded for this tour." />;

  function changeImage(direction: -1 | 1) {
    setSelectedIndex((current) => current === null ? 0 : (current + direction + images.length) % images.length);
  }

  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Tour gallery</h2>
          <p className="mt-1 text-sm text-slate-500">Explore moments and places featured in this tour.</p>
        </div>
        <span className="flex shrink-0 items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"><Images size={14} />{images.length} photos</span>
      </div>

      <div className={`grid overflow-hidden rounded-xl bg-slate-100 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2 gap-1 md:grid-cols-4 md:grid-rows-2"}`}>
        {images.slice(0, 5).map((item, index) => {
          const remaining = images.length - 5;
          return (
            <button
              key={`tour-gallery-${item.id}-${item.url}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`group relative overflow-hidden bg-slate-200 text-left ${index === 0 && images.length > 1 ? "col-span-2 row-span-2 min-h-[320px] md:min-h-[520px]" : images.length === 1 ? "min-h-[420px] md:min-h-[560px]" : "min-h-[190px] md:min-h-0"}`}
            >
              <img src={item.url} alt={item.alt || `Tour gallery image ${index + 1}`} loading={index === 0 ? "eager" : "lazy"} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/5 opacity-80 transition group-hover:opacity-100" />
              <span className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
                <span className="line-clamp-2 text-sm font-semibold drop-shadow">{item.alt || `Photo ${index + 1}`}</span>
                <Maximize2 className="size-5 shrink-0 opacity-0 transition group-hover:opacity-100" />
              </span>
              {index === 4 && remaining > 0 ? <span className="absolute inset-0 grid place-items-center bg-black/55 text-2xl font-bold text-white">+{remaining} photos</span> : null}
            </button>
          );
        })}
      </div>

      {selectedIndex !== null ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label="Tour gallery viewer">
          <div className="flex h-16 shrink-0 items-center justify-between px-4 text-white sm:px-6">
            <div>
              <p className="text-sm font-bold">{selectedIndex + 1} / {images.length}</p>
              <p className="mt-0.5 max-w-[70vw] truncate text-xs text-white/65">{images[selectedIndex].alt || "Tour gallery image"}</p>
            </div>
            <button type="button" onClick={() => setSelectedIndex(null)} className="grid size-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" aria-label="Close gallery"><X size={22} /></button>
          </div>
          <div className="relative min-h-0 flex-1 px-4 pb-4 sm:px-16 sm:pb-8">
            <img src={images[selectedIndex].url} alt={images[selectedIndex].alt || "Tour gallery image"} className="h-full w-full object-contain" />
            {images.length > 1 ? (
              <>
                <button type="button" onClick={() => changeImage(-1)} className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:left-5" aria-label="Previous image"><ChevronLeft size={26} /></button>
                <button type="button" onClick={() => changeImage(1)} className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-5" aria-label="Next image"><ChevronRight size={26} /></button>
              </>
            ) : null}
          </div>
          {images.length > 1 ? <div className="flex h-24 shrink-0 gap-2 overflow-x-auto px-4 pb-4 sm:justify-center">{images.map((item, index) => <button key={`gallery-thumb-${item.id}-${index}`} type="button" onClick={() => setSelectedIndex(index)} className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${selectedIndex === index ? "border-white" : "border-transparent opacity-50 hover:opacity-90"}`}><img src={item.url} alt="" className="h-full w-full object-cover" /></button>)}</div> : null}
        </div>
      ) : null}
    </section>
  );
}

function OverviewTab({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold">About {title}</h2>
      <RichDescription title={title} html={description} fallback="No description has been added for this tour." />
    </div>
  );
}

function RichDescription({ title, html, fallback }: { title: string; html: string; fallback: string }) {
  if (!html) return <p className="mt-3 text-sm leading-7 text-slate-600">{fallback}</p>;
  const parts = html.split(/(<img\b[^>]*>)/gi);

  return (
    <div className="mt-3 space-y-4 text-sm leading-7 text-slate-600">
      {parts.map((part, index) => {
        if (/^<img\b/i.test(part)) {
          const src = part.match(/\bsrc=["']([^"']+)["']/i)?.[1];
          const alt = part.match(/\balt=["']([^"']*)["']/i)?.[1] || `${title} tour image`;
          return src && /^https?:\/\//i.test(src)
            ? <img key={`image-${index}`} src={src} alt={alt} loading="lazy" className="max-h-[520px] w-full rounded-lg object-cover" />
            : null;
        }
        const text = getPlainTextFromHtml(part);
        return text ? <p key={`text-${index}`}>{text}</p> : null;
      })}
    </div>
  );
}

function ItineraryTab({ tourId, destinations }: { tourId: string; destinations: TourDetailDestination[] }) {
  return (
    <div className="space-y-7">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold"><Route className="size-5 text-brand-600" /> Tour itinerary</h2>
        {destinations.length ? (
          <div className="mt-5 space-y-4">
            {destinations.map((destination, index) => (
              <div key={`${destination.id}-${destination.orderIndex}`} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-600 font-bold text-white">{destination.orderIndex || index + 1}</span>
                <div className="min-w-0">
                  <h3 className="font-bold">{destination.name}</h3>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                    {destination.estimatedTime ? <span className="flex items-center gap-1"><Clock3 size={15} />{destination.estimatedTime}</span> : null}
                    {destination.locationsCount !== null ? <span className="flex items-center gap-1"><MapPin size={15} />{destination.locationsCount} locations</span> : null}
                  </div>
                  {destination.note ? <p className="mt-3 text-sm leading-6 text-slate-600">{destination.note}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : <EmptyState text="No destinations have been added to this tour." />}
      </div>
      <CustomerRouteNavigationLoader tourId={tourId} />
    </div>
  );
}

function ReviewsTab({ reviews }: { reviews: TourDetailReview[] }) {
  if (!reviews.length) return <EmptyState text="This tour does not have any approved reviews yet." />;

  return (
    <div>
      <h2 className="text-xl font-bold">Traveler reviews</h2>
      <div className="mt-5 space-y-4">
        {reviews.map((review) => (
          <article key={review.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-start gap-3">
              {review.avatarUrl
                ? <img src={review.avatarUrl} alt={review.userName} className="size-11 rounded-full object-cover" />
                : <span className="grid size-11 rounded-full bg-brand-50 place-items-center font-bold text-brand-700">{review.userName.charAt(0).toUpperCase()}</span>}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold">{review.userName}</h3>
                  {review.createdAt ? <time className="text-xs text-slate-400">{formatDate(review.createdAt)}</time> : null}
                </div>
                <div className="mt-1 flex gap-1" aria-label={`${review.rating} out of 5 stars`}>
                  {Array.from({ length: 5 }, (_, index) => <Star key={index} className={`size-4 ${index < review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />)}
                </div>
                {review.comment ? <p className="mt-3 text-sm leading-6 text-slate-600">{review.comment}</p> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
      <CheckCircle2 className="mx-auto mb-3 size-7 text-slate-300" />{text}
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}
