import { Bus, CalendarDays, Clock3, MapPin, Star, Tags, Users } from "lucide-react";
import { TourDetailSaveButton } from "@/components/common/tour-detail-save-button";
import { TourDetailTabs, type TourDetailContent, type TourDetailDestination, type TourDetailReview } from "@/components/tours/tour-detail-tabs";
import { TourVideoButton } from "@/components/tours/tour-detail-controls";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import { getPlainTextFromHtml } from "@/utils/html";

type BackendRecord = Record<string, unknown>;

type TourView = {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  childPrice: number;
  schedule: string;
  capacity: number;
  bookedSlots: number;
  availableSlots: number;
  category: string;
  status: string;
  videoUrl: string;
  destinations: TourDetailDestination[];
  reviews: TourDetailReview[];
  rating: number;
  reviewCount: number;
  shortDescription: string;
  durationDays: number;
  durationNights: number;
  startTime: string;
  endTime: string;
  tourType: string;
  languages: string[];
  difficulty: string;
  meetingPoint: string;
  pickupAvailable: boolean;
  pickupDescription: string;
  infantPrice: number;
  currency: string;
  content: TourDetailContent;
};

export default async function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tour = await getTourDetail(id);

  if (!tour) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8">
          <h1 className="text-2xl font-bold">Tour not available</h1>
          <p className="mt-2 text-sm text-slate-500">This tour could not be loaded from the backend.</p>
          <Button href="/tours" className="mt-6">Back to Tours</Button>
        </div>
      </section>
    );
  }

  const destinationNames = tour.destinations.map((item) => item.name).join(" · ") || "Destination pending";
  const descriptionPreview = tour.shortDescription || getPlainTextFromHtml(tour.description) || "No description has been added for this tour.";

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 text-sm text-slate-500">Home / Tours / {tour.category} / {tour.title}</div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="relative min-h-[460px] overflow-hidden rounded-lg">
            <img src={tour.image} alt={tour.title} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <span className="absolute left-5 top-5 rounded-md bg-brand-600 px-3 py-1 text-xs font-bold text-white">{tour.category}</span>
            {tour.videoUrl ? <TourVideoButton title={tour.title} image={tour.image} videoUrl={tour.videoUrl} /> : null}
            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h1 className="text-3xl font-bold sm:text-4xl">{tour.title}</h1>
              <p className="mt-3 flex flex-wrap gap-4 text-sm">
                <span><Star className="mr-1 inline size-4 fill-amber-400 text-amber-400" />{formatRating(tour.rating)} ({tour.reviewCount} reviews)</span>
                <span><MapPin className="mr-1 inline size-4" />{destinationNames}</span>
              </p>
              <p className="mt-4 max-w-2xl line-clamp-2 text-sm leading-6 text-white/85">{descriptionPreview}</p>
            </div>
          </div>

          <TourDetailTabs tourId={tour.id} title={tour.title} description={tour.description} destinations={tour.destinations} reviews={tour.reviews} content={tour.content} />
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-2xl font-bold">{tour.title}</h2>
              <span className={`rounded-md px-3 py-1 text-xs font-bold capitalize ${tour.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{tour.status || "Unknown"}</span>
            </div>
            <p className="mt-3 text-sm text-slate-500"><MapPin className="mr-1 inline size-4" />{destinationNames}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <span><Clock3 className="mr-2 inline size-4" />{tour.schedule || "Not scheduled"}</span>
              <span><Users className="mr-2 inline size-4" />{tour.availableSlots}/{tour.capacity} available</span>
              <span><Bus className="mr-2 inline size-4" />{tour.destinations.length} stops</span>
              <span><Tags className="mr-2 inline size-4" />{tour.category}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              {tour.tourType ? <span className="rounded-full bg-slate-100 px-3 py-1 capitalize">{tour.tourType.replace(/_/g, " ")}</span> : null}
              {tour.difficulty ? <span className="rounded-full bg-slate-100 px-3 py-1 capitalize">{tour.difficulty}</span> : null}
              {tour.languages.map((language) => <span key={language} className="rounded-full bg-slate-100 px-3 py-1 uppercase">{language}</span>)}
            </div>
            <div className="mt-6 border-t border-slate-100 pt-5">
              <p className="text-sm text-slate-500">Adult price</p>
              <p className="text-3xl font-bold text-brand-600">{formatVnd(tour.price)}</p>
              <p className="mt-2 text-sm text-slate-500">Child: <span className="font-semibold text-slate-700">{formatVnd(tour.childPrice)}</span></p>
              <p className="mt-1 text-sm text-slate-500">Infant: <span className="font-semibold text-slate-700">{formatVnd(tour.infantPrice)}</span></p>
            </div>
            <Button href={`/booking?tourId=${tour.id}`} className="mt-5 w-full">Book This Tour</Button>
            <TourDetailSaveButton id={tour.id} />
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h3 className="font-bold">Availability</h3>
            <dl className="mt-4 space-y-4 text-sm">
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Capacity</dt><dd className="font-semibold">{tour.capacity} guests</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Booked</dt><dd className="font-semibold">{tour.bookedSlots} guests</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Available</dt><dd className="font-semibold text-emerald-700">{tour.availableSlots} slots</dd></div>
              {tour.meetingPoint ? <div className="flex justify-between gap-4"><dt className="text-slate-500">Meeting point</dt><dd className="max-w-[190px] text-right font-semibold">{tour.meetingPoint}</dd></div> : null}
              <div className="flex justify-between gap-4"><dt className="text-slate-500">Pickup</dt><dd className="text-right font-semibold">{tour.pickupAvailable ? tour.pickupDescription || "Available" : "Not available"}</dd></div>
            </dl>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${tour.capacity ? Math.min(100, (tour.bookedSlots / tour.capacity) * 100) : 0}%` }} />
            </div>
            <Button href={`/booking?tourId=${tour.id}`} variant="outline" className="mt-5 w-full"><CalendarDays size={16} /> Check Availability</Button>
          </div>
        </aside>
      </div>
    </section>
  );
}

async function getTourDetail(id: string): Promise<TourView | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";
    const [tourResponse, reviewResponse] = await Promise.all([
      fetch(`${baseUrl}/tours/${encodeURIComponent(id)}`, { cache: "no-store" }),
      fetch(`${baseUrl}/tours/${encodeURIComponent(id)}/reviews?page=1&limit=100`, { cache: "no-store" })
    ]);
    if (!tourResponse.ok) return null;

    const tourRecord = unwrapRecord(await tourResponse.json());
    if (!tourRecord) return null;
    const reviewRecords = reviewResponse.ok ? unwrapList(await reviewResponse.json()) : [];
    return mapTour(tourRecord, reviewRecords);
  } catch {
    return null;
  }
}

function mapTour(record: BackendRecord, reviewRecords: BackendRecord[]): TourView {
  const destinations = readArray(record, ["destinations", "travel_destinations", "tour_destinations"])
    .map<TourDetailDestination>((item, index) => ({
      id: readNumber(item, ["destination_id", "travel_destination_id", "id"]) ?? 0,
      name: readString(item, ["name", "destination_name", "travel_destination_name"]) || `Destination ${index + 1}`,
      orderIndex: readNumber(item, ["order_index", "order"]) ?? index + 1,
      estimatedTime: readString(item, ["estimated_time", "duration"]),
      note: readString(item, ["note", "description"]),
      locationsCount: readNumber(item, ["locations_count"])
    }))
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const reviews = reviewRecords.map<TourDetailReview>((item, index) => ({
    id: readNumber(item, ["review_id", "id"]) ?? index,
    userName: readString(item, ["user_name", "name"]) || "Traveler",
    avatarUrl: readString(item, ["user_avatar_url", "avatar_url"]),
    rating: Math.max(0, Math.min(5, readNumber(item, ["rating"]) ?? 0)),
    comment: readString(item, ["comment", "content"]),
    createdAt: readString(item, ["date_created", "created_at"])
  }));
  const capacity = readNumber(record, ["capacity"]) ?? 0;
  const bookedSlots = readNumber(record, ["booked_slots"]) ?? Math.max(0, capacity - (readNumber(record, ["available_slots"]) ?? capacity));

  return {
    id: String(readNumber(record, ["tour_id", "id"]) ?? ""),
    title: readString(record, ["name", "title"]) || "Unnamed tour",
    description: readString(record, ["description"]),
    image: readString(record, ["thumbnail", "thumbnail_url", "image_url", "image"]) || images.swiss,
    price: readNumber(record, ["price"]) ?? 0,
    childPrice: readNumber(record, ["child_price"]) ?? 0,
    schedule: readString(record, ["schedule"]),
    capacity,
    bookedSlots,
    availableSlots: readNumber(record, ["available_slots"]) ?? Math.max(0, capacity - bookedSlots),
    category: readNestedString(record, "tour_category", ["name"]) || readString(record, ["tour_category_name", "category_name"]) || "Tour",
    status: readString(record, ["status"]),
    videoUrl: readString(record, ["video_url", "video", "trailer_url"]),
    destinations,
    reviews,
    rating: readNumber(record, ["average_rating", "rating"]) ?? (reviews.length ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length : 0),
    reviewCount: readNumber(record, ["review_count", "reviews_count"]) ?? reviews.length,
    shortDescription: readString(record, ["short_description"]),
    durationDays: readNumber(record, ["duration_days"]) ?? 0,
    durationNights: readNumber(record, ["duration_nights"]) ?? 0,
    startTime: readString(record, ["start_time"]),
    endTime: readString(record, ["end_time"]),
    tourType: readString(record, ["tour_type"]),
    languages: readStringArray(record, ["languages"]),
    difficulty: readString(record, ["difficulty"]),
    meetingPoint: readString(record, ["meeting_point"]),
    pickupAvailable: readBoolean(record, ["pickup_available"]),
    pickupDescription: readString(record, ["pickup_description"]),
    infantPrice: readNumber(record, ["infant_price"]) ?? 0,
    currency: readString(record, ["currency"]) || "VND",
    content: {
      highlights: readStringArray(record, ["highlights"]),
      inclusions: readStringArray(record, ["inclusions"]),
      exclusions: readStringArray(record, ["exclusions"]),
      requirements: readStringArray(record, ["requirements"]),
      cancellationPolicy: readString(record, ["cancellation_policy"]),
      bookingPolicy: readString(record, ["booking_policy"]),
      additionalInformation: readString(record, ["additional_information"]),
      faqs: readArray(record, ["faqs"]).map((item, index) => ({
        id: readNumber(item, ["faq_id", "id"]) ?? index,
        question: readString(item, ["question"]),
        answer: readString(item, ["answer"]),
        orderIndex: readNumber(item, ["order_index"]) ?? index + 1
      })).filter((item) => item.question && item.answer).sort((a, b) => a.orderIndex - b.orderIndex),
      gallery: readArray(record, ["gallery"]).map((item, index) => ({
        id: readNumber(item, ["media_id", "image_id", "id"]) ?? index,
        url: readString(item, ["url", "image_url", "media_url"]),
        alt: readString(item, ["alt", "alt_text", "title"]),
        orderIndex: readNumber(item, ["order_index"]) ?? index + 1
      })).filter((item) => /^https?:\/\//i.test(item.url)).sort((a, b) => a.orderIndex - b.orderIndex)
    }
  };
}

function unwrapRecord(value: unknown): BackendRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as BackendRecord;
  const nested = record.data ?? record.tour ?? record.item;
  return nested && typeof nested === "object" && !Array.isArray(nested) ? unwrapRecord(nested) : record;
}

function unwrapList(value: unknown): BackendRecord[] {
  if (Array.isArray(value)) return value.filter(isRecord);
  if (!isRecord(value)) return [];
  const nested = value.data ?? value.reviews ?? value.items;
  return Array.isArray(nested) ? nested.filter(isRecord) : isRecord(nested) ? unwrapList(nested) : [];
}

function isRecord(value: unknown): value is BackendRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function readArray(record: BackendRecord, keys: string[]) {
  for (const key of keys) if (Array.isArray(record[key])) return (record[key] as unknown[]).filter(isRecord);
  return [];
}

function readString(record: BackendRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string") return value;
    if (typeof value === "number") return String(value);
  }
  return "";
}

function readNumber(record: BackendRecord, keys: string[]) {
  const value = readString(record, keys);
  if (!value) return null;
  const number = Number(value.replace(/,/g, ""));
  return Number.isFinite(number) ? number : null;
}

function readStringArray(record: BackendRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string" && Boolean(item.trim()));
  }
  return [];
}

function readBoolean(record: BackendRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "boolean") return value;
    if (value === 1 || value === "1" || value === "true") return true;
  }
  return false;
}

function readNestedString(record: BackendRecord, key: string, keys: string[]) {
  return isRecord(record[key]) ? readString(record[key] as BackendRecord, keys) : "";
}

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);
}

function formatRating(value: number) {
  return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}
