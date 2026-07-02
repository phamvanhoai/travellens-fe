"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Camera, Loader2, Map, MapPin, Pencil, Star, Trash2, Video, X } from "lucide-react";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import { reviewService } from "@/services/review.service";
import { getPublicLocationId, locationService, type PublicLocation } from "@/services/location.service";
import { useAuthStore } from "@/store/use-auth-store";
import { getPlainTextFromHtml } from "@/utils/html";

type RelatedRecord = Record<string, unknown>;
type LocationTab = "Overview" | "Map" | "Reviews" | "360 Scenes";

const locationTabs: LocationTab[] = ["Overview", "Map", "Reviews", "360 Scenes"];

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

function readNestedRecord(record: RelatedRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value as RelatedRecord;
  }
  return undefined;
}

function uniqueRecords(records: RelatedRecord[], idKeys: string[]) {
  const seen = new Set<string>();

  return records.filter((record, index) => {
    const id = readString(record, idKeys);
    const key = id ? `id:${id}` : `row:${index}:${JSON.stringify(record)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasAuthToken() {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("travel360_token") ?? localStorage.getItem("token"));
}

function getApiStatus(error: unknown) {
  return error && typeof error === "object" && "response" in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined;
}

function getReviewId(review: RelatedRecord) {
  const value = readNumber(review, ["review_id", "id"]);
  return value && Number.isFinite(value) ? value : 0;
}

function getCurrentUserId(user: unknown) {
  if (!user || typeof user !== "object") return 0;
  const record = user as RelatedRecord;
  return readNumber(record, ["user_id", "id"]) ?? 0;
}

function getReviewUserId(review: RelatedRecord) {
  const user = readNestedRecord(review, ["user", "User", "customer", "Customer"]);
  return readNumber(review, ["user_id", "customer_id"]) ?? readNumber(user, ["user_id", "id"]) ?? 0;
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
  const user = useAuthStore((state) => state.user);
  const showToast = useToast();
  const [location, setLocation] = useState<PublicLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<LocationTab>("Overview");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<number | null>(null);

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
      maps: uniqueRecords([...asRecords(location.maps), ...asRecords(location.Maps)], ["map_id", "id"]),
      scenes: uniqueRecords([...asRecords(location.view360), ...asRecords(location.view360s), ...asRecords(location.View360s)], ["view360_id", "id"]),
      reviews: uniqueRecords([...asRecords(location.reviews), ...asRecords(location.Reviews)], ["review_id", "id"])
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
  const currentUserId = getCurrentUserId(user);

  function resetReviewForm() {
    setReviewComment("");
    setReviewRating(5);
    setEditingReviewId(null);
  }

  function startEditReview(review: RelatedRecord) {
    const reviewId = getReviewId(review);
    if (!reviewId) return;
    setEditingReviewId(reviewId);
    setReviewRating(readNumber(review, ["rating"]) ?? 5);
    setReviewComment(readString(review, ["comment", "content", "review"]) ?? "");
  }

  async function submitReview(event: React.FormEvent) {
    event.preventDefault();

    if (!user || !hasAuthToken()) {
      showToast({ title: "Login required", description: "Please login to write a review.", variant: "error" });
      return;
    }

    setReviewSubmitting(true);
    try {
      const payload = { rating: reviewRating, comment: reviewComment.trim() };
      const saved = editingReviewId
        ? await reviewService.updateForLocation(locationId, editingReviewId, payload)
        : await reviewService.createForLocation(locationId, payload);
      const nextReview = {
        ...saved,
        user_id: saved.user_id ?? currentUserId,
        user_name: saved.user_name ?? user.name ?? user.email ?? "You",
        comment: saved.comment ?? reviewComment.trim(),
        rating: saved.rating ?? reviewRating
      } as RelatedRecord;

      setLocation((current) => {
        if (!current) return current;
        const currentReviews = uniqueRecords([...asRecords(current.reviews), ...asRecords(current.Reviews)], ["review_id", "id"]);
        const nextReviews = editingReviewId
          ? currentReviews.map((review) => getReviewId(review) === editingReviewId ? nextReview : review)
          : [nextReview, ...currentReviews];
        return { ...current, reviews: nextReviews, Reviews: undefined };
      });
      resetReviewForm();
      showToast({
        title: editingReviewId ? "Review updated" : "Review submitted",
        description: editingReviewId ? "Your review was updated." : "Thanks for sharing your experience.",
        variant: "success"
      });
    } catch (err) {
      const status = getApiStatus(err);
      showToast({
        title: editingReviewId ? "Cannot update review" : "Cannot submit review",
        description: status === 409 ? "You have already reviewed this location." : status === 401 ? "Please login again." : status === 403 ? "This review does not belong to your account." : "Please check your rating and comment, then try again.",
        variant: "error"
      });
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function deleteReview(review: RelatedRecord) {
    const reviewId = getReviewId(review);
    if (!reviewId || deletingReviewId) return;

    setDeletingReviewId(reviewId);
    try {
      await reviewService.deleteForLocation(locationId, reviewId);
      setLocation((current) => {
        if (!current) return current;
        const nextReviews = uniqueRecords([...asRecords(current.reviews), ...asRecords(current.Reviews)], ["review_id", "id"])
          .filter((item) => getReviewId(item) !== reviewId);
        return { ...current, reviews: nextReviews, Reviews: undefined };
      });
      if (editingReviewId === reviewId) resetReviewForm();
      showToast({ title: "Review deleted", description: "Your review was removed.", variant: "success" });
    } catch (err) {
      const status = getApiStatus(err);
      showToast({
        title: "Cannot delete review",
        description: status === 401 ? "Please login again." : status === 403 ? "This review does not belong to your account." : "Please try again later.",
        variant: "error"
      });
    } finally {
      setDeletingReviewId(null);
    }
  }

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

      <nav className="mt-10 flex gap-6 overflow-x-auto border-b border-slate-200 text-sm font-semibold">
        {locationTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={activeTab === tab ? "whitespace-nowrap border-b-2 border-brand-600 pb-3 text-brand-600" : "whitespace-nowrap pb-3 text-slate-600 hover:text-brand-600"}
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="mt-7">
        {activeTab === "Overview" ? (
          <div className="rounded-lg border border-slate-200 p-6">
            <h2 className="text-xl font-bold">Location Information</h2>
            <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Address</dt>
                <dd className="mt-1 font-semibold text-slate-700">{location.address ?? destinationName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-slate-400">Coordinates</dt>
                <dd className="mt-1 font-semibold text-slate-700">{latitude}, {longitude}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {activeTab === "Map" ? (
          <div className="relative min-h-96 overflow-hidden rounded-lg bg-blue-50">
            {mapImage ? (
              <img src={mapImage} alt={`${name} map`} className="h-full w-full object-cover opacity-90" />
            ) : (
              <div className="grid h-full min-h-96 place-items-center bg-slate-100 text-sm font-semibold text-slate-500">
                No map image available
              </div>
            )}
            <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white"><MapPin /></span>
          </div>
        ) : null}

        {activeTab === "Reviews" ? (
          <div>
            <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
              <form onSubmit={submitReview} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-xl font-bold">{editingReviewId ? "Edit Review" : "Write a Review"}</h2>
                  {editingReviewId ? (
                    <button type="button" onClick={resetReviewForm} className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100" aria-label="Cancel editing">
                      <X size={16} />
                    </button>
                  ) : null}
                </div>
                <label className="mt-5 block text-sm font-semibold">
                  Rating
                  <span className="mt-2 flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="text-amber-400"
                        aria-label={`${star} stars`}
                      >
                        <Star className={`size-6 ${star <= reviewRating ? "fill-amber-400" : "text-slate-300"}`} />
                      </button>
                    ))}
                  </span>
                </label>
                <label className="mt-5 block text-sm font-semibold">
                  Comment
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    maxLength={1000}
                    rows={5}
                    className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand-600"
                    placeholder="Share your experience at this location..."
                  />
                </label>
                <Button type="submit" disabled={reviewSubmitting} className="mt-5 w-full">
                  {reviewSubmitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  {editingReviewId ? "Update Review" : "Submit Review"}
                </Button>
              </form>

              <div>
                <h2 className="text-xl font-bold">Location Reviews</h2>
                <div className="mt-4 grid gap-4">
              {related.reviews.map((review, index) => {
                const reviewId = getReviewId(review);
                const canManage = Boolean(currentUserId && getReviewUserId(review) === currentUserId);
                return (
                  <ReviewCard
                    key={`${readString(review, ["review_id", "id"]) ?? "review"}-${index}`}
                    review={review}
                    canManage={canManage}
                    deleting={deletingReviewId === reviewId}
                    onEdit={() => startEditReview(review)}
                    onDelete={() => void deleteReview(review)}
                  />
                );
              })}
              {related.reviews.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No reviews yet.</p> : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === "360 Scenes" ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.scenes.slice(0, 4).map((scene, index) => {
              const sceneId = readString(scene, ["view360_id", "id"]);
              const sceneName = readString(scene, ["title", "name"]) ?? `Scene ${index + 1}`;
              const sceneImage = readString(scene, ["thumbnail_url", "thumbnail", "image_url", "image"]);
              return (
                <a key={`${sceneId ?? "scene"}-${index}`} href={`/view360?locationId=${locationId}${sceneId ? `&sceneId=${sceneId}` : ""}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white hover:border-brand-500">
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
        ) : null}
      </div>
    </section>
  );
}

function ReviewCard({
  review,
  canManage = false,
  deleting = false,
  onEdit,
  onDelete
}: {
  review: RelatedRecord;
  canManage?: boolean;
  deleting?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const user = readNestedRecord(review, ["user", "User", "customer", "Customer"]);
  const reviewerName = readString(review, ["user_name", "reviewer_name", "customer_name", "name"]) ??
    readString(user, ["name", "full_name", "email"]) ??
    "Traveler";
  const rating = readNumber(review, ["rating"]);
  const comment = readString(review, ["comment", "content", "review"]) ?? "No written comment.";

  return (
    <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
      <div className="flex items-center justify-between gap-3">
        <p className="font-bold text-ink">{reviewerName}</p>
        <span className="flex items-center gap-3">
          {rating ? (
            <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`size-4 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                />
              ))}
            </span>
          ) : null}
          {canManage ? (
            <span className="inline-flex items-center gap-1">
              <button type="button" onClick={onEdit} className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-white hover:text-brand-600" aria-label="Edit review">
                <Pencil size={15} />
              </button>
              <button type="button" onClick={onDelete} disabled={deleting} className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-white hover:text-rose-600" aria-label="Delete review">
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 size={15} />}
              </button>
            </span>
          ) : null}
        </span>
      </div>
      <p className="mt-2 leading-6">{comment}</p>
    </div>
  );
}
