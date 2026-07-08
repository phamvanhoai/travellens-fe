import { Bus, CalendarDays, CheckCircle2, Clock3, HelpCircle, Star, Users, XCircle } from "lucide-react";
import { CustomerRouteNavigationLoader } from "@/components/navigation/customer-route-navigation-loader";
import { TourSectionNav, TourVideoButton } from "@/components/tours/tour-detail-controls";
import { Button } from "@/components/ui/button";
import { images, tours } from "@/lib/data";
import { currency } from "@/lib/utils";
import { TourDetailSaveButton } from "@/components/common/tour-detail-save-button";

type TourView = {
  id: string;
  title: string;
  destination: string;
  image: string;
  rating: number;
  reviews: string;
  duration: string;
  price: number;
  category: string;
  capacity: string;
  badge?: string;
  schedule?: string;
  status?: string;
  videoUrl?: string;
};

type BackendTour = Record<string, unknown>;

const tourSections = [
  { label: "Overview", href: "#overview" },
  { label: "Itinerary", href: "#itinerary" },
  { label: "Inclusions", href: "#inclusions" },
  { label: "Exclusions", href: "#exclusions" },
  { label: "Reviews", href: "#reviews" },
  { label: "FAQs", href: "#faqs" }
];

export function generateStaticParams() {
  return tours.map((tour) => ({ id: tour.id }));
}

export default async function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tour = await getTourDetail(id);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 text-sm text-slate-500">Home / Tours / {tour.destination} / {tour.title}</div>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="relative h-[460px] overflow-hidden rounded-lg">
            <img src={tour.image} alt={tour.title} className="h-full w-full object-cover" />
            <span className="absolute left-5 top-5 rounded-md bg-orange-500 px-3 py-1 text-xs font-bold text-white">{tour.badge ?? "Featured"}</span>
            <TourVideoButton title={tour.title} image={tour.image} videoUrl={tour.videoUrl} />
          </div>
          <TourSectionNav sections={tourSections} />
          <div id="overview" className="mt-7 grid scroll-mt-24 gap-8 lg:grid-cols-2">
            <div>
              <h1 className="text-3xl font-bold">{tour.title}</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">Join an unforgettable experience in {tour.destination}. This curated route combines expert guidance, local experiences, scenic stops and flexible booking support.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-brand-600">
                {["Stunning Views", "Local Guide", "Hotel Pick-up", "Wine Tasting"].map((item) => <span key={item} className="rounded-lg bg-brand-50 p-3 font-semibold">{item}</span>)}
              </div>
              <h2 className="mt-7 font-bold">Highlights</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {["Visit iconic viewpoints", "Explore hidden local spots", "Taste regional food and drinks", "Enjoy stress-free transport"].map((item) => (
                  <li key={item} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-600" />{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-bold">Route Navigation</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                The live route map below loads ordered destinations, coordinates, polyline points and itinerary data from the backend navigation API.
              </p>
            </div>
          </div>
          <div id="itinerary" className="mt-10 scroll-mt-24">
            <CustomerRouteNavigationLoader tourId={id} />
          </div>
          <div id="inclusions" className="mt-10 grid scroll-mt-24 gap-5 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-5">
              <h2 className="font-bold text-emerald-900">Included</h2>
              <div className="mt-4 space-y-3">
                {["Hotel pick-up", "Professional local guide", "Wine tasting", "All taxes and fees"].map((item) => (
                  <p key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="size-5 shrink-0 text-emerald-600" />{item}</p>
                ))}
              </div>
            </div>
            <div id="exclusions" className="scroll-mt-24 rounded-lg border border-rose-100 bg-rose-50/60 p-5">
              <h2 className="font-bold text-rose-900">Not Included</h2>
              <div className="mt-4 space-y-3">
                {["Meals and drinks", "Personal expenses", "Tips"].map((item) => (
                  <p key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700"><XCircle className="size-5 shrink-0 text-rose-500" />{item}</p>
                ))}
              </div>
            </div>
          </div>
          <div id="faqs" className="mt-10 scroll-mt-24 rounded-lg border border-slate-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <HelpCircle className="size-5 text-brand-600" />
              <h2 className="font-bold">FAQs</h2>
            </div>
            <div className="mt-5 divide-y divide-slate-100">
              <FaqItem question="How long is this tour?" answer={tour.duration} />
              <FaqItem question="How many guests can join?" answer={tour.capacity} />
              <FaqItem question="What is the price per person?" answer={`${currency(tour.price)} / person`} />
              <FaqItem question="What is the tour schedule?" answer={tour.schedule || "Schedule will be confirmed by the operator."} />
            </div>
          </div>
        </div>
        <aside className="space-y-5">
          <div id="reviews" className="scroll-mt-24 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">{tour.title}</h2>
            <p className="mt-2 text-sm text-slate-500"><Star className="inline size-4 fill-amber-400 text-amber-400" /> {formatRating(tour.rating)} ({tour.reviews} reviews) - {tour.destination}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <span><Clock3 className="mr-2 inline size-4" />{tour.duration}</span>
              <span><Users className="mr-2 inline size-4" />{tour.capacity}</span>
              <span><Bus className="mr-2 inline size-4" />Pick-up</span>
              <span><CheckCircle2 className="mr-2 inline size-4" />Instant</span>
            </div>
            <p className="mt-6 text-sm text-slate-500">From</p>
            <p className="text-3xl font-bold">{currency(tour.price)} <span className="text-sm font-normal text-slate-500">/ person</span></p>
            <Button href="/booking" className="mt-5 w-full">Check Availability</Button>
            <TourDetailSaveButton id={id} />
          </div>
          <div className="rounded-lg border border-slate-200 p-6">
            <h3 className="font-bold">Check Availability</h3>
            <label className="mt-4 block text-sm font-semibold">Date<input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3" type="date" /></label>
            <label className="mt-4 block text-sm font-semibold">Guests<select className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3"><option>2 Adults</option><option>2 Adults, 1 Child</option></select></label>
            <Button href="/booking" className="mt-5 w-full"><CalendarDays size={16} /> Check Availability</Button>
          </div>
        </aside>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <p className="font-semibold text-ink">{question}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{answer}</p>
    </div>
  );
}

async function getTourDetail(id: string): Promise<TourView> {
  const fallback = tours.find((item) => item.id === id) ?? tours[0];

  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
    const response = await fetch(`${baseUrl}/tours/${id}`, { cache: "no-store" });
    if (!response.ok) return fallback;

    const body = await response.json();
    const record = unwrapRecord(body);
    if (!record) return fallback;

    return mapBackendTour(record, fallback);
  } catch {
    return fallback;
  }
}

function unwrapRecord(value: unknown): BackendTour | null {
  if (!value || typeof value !== "object") return null;
  const record = value as BackendTour;
  const nested = record.data ?? record.tour ?? record.item;
  if (nested && typeof nested === "object") return unwrapRecord(nested);
  return record;
}

function mapBackendTour(record: BackendTour, fallback: TourView): TourView {
  const durationDays = readNumber(record, ["duration_days", "days"]);
  const durationNights = readNumber(record, ["duration_nights", "nights"]);
  const duration = readString(record, ["duration", "schedule"]) || formatDuration(durationDays, durationNights) || fallback.duration;
  const capacity = readNumber(record, ["capacity", "max_people", "max_guests"]);
  const destination = readString(record, ["destination_name", "destination", "location_name"]) || fallback.destination;

  return {
    id: String(readValue(record, ["tour_id", "id"]) ?? fallback.id),
    title: readString(record, ["name", "title"]) || fallback.title,
    destination,
    image: readString(record, ["thumbnail", "image", "image_url", "cover_image"]) || fallback.image || images.swiss,
    rating: readNumber(record, ["average_rating", "avg_rating", "rating"]) ?? fallback.rating ?? 0,
    reviews: formatReviewCount(readValue(record, ["reviews_count", "review_count", "total_reviews", "reviews"])),
    duration,
    price: readNumber(record, ["price", "adult_price"]) ?? fallback.price ?? 0,
    category: readString(record, ["tour_category", "category", "category_name"]) || fallback.category,
    capacity: capacity ? `${capacity} People` : fallback.capacity,
    badge: readString(record, ["badge", "label"]) || fallback.badge,
    schedule: readString(record, ["schedule", "time", "start_time"]),
    status: readString(record, ["status"]),
    videoUrl: readString(record, ["video_url", "videoUrl", "video", "trailer_url", "trailerUrl"])
  };
}

function readValue(record: BackendTour, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function readString(record: BackendTour, keys: string[]) {
  const value = readValue(record, keys);
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : "";
}

function readNumber(record: BackendTour, keys: string[]) {
  const value = readValue(record, keys);
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(/,/g, "")) : NaN;
  return Number.isFinite(number) ? number : undefined;
}

function formatDuration(days?: number, nights?: number) {
  if (days && nights !== undefined) return `${days} day${days > 1 ? "s" : ""} ${nights} night${nights !== 1 ? "s" : ""}`;
  if (days) return `${days} day${days > 1 ? "s" : ""}`;
  return "";
}

function formatRating(value: number) {
  return Number.isFinite(value) ? value.toFixed(1).replace(/\.0$/, "") : "0";
}

function formatReviewCount(value: unknown) {
  if (Array.isArray(value)) return String(value.length);
  if (typeof value === "number") return String(value);
  if (typeof value === "string" && value.trim()) return value;
  return "0";
}
