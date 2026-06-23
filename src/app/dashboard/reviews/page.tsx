"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquareText, Plus, RefreshCw, Search, Star, X } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { getPublicLocationId, locationService, type PublicLocation } from "@/services/location.service";
import { getCustomerReviewId, getCustomerReviewLocationName, reviewService, type CustomerReview } from "@/services/review.service";

type ReviewFormValue = { location_id: string; rating: string; comment: string };
type ReviewFieldErrors = Partial<Record<keyof ReviewFormValue, string>>;

const emptyForm: ReviewFormValue = { location_id: "", rating: "5", comment: "" };
const pageSize = 5;

export default function ReviewsPage() {
  const [items, setItems] = useState<CustomerReview[]>([]);
  const [locations, setLocations] = useState<PublicLocation[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const showToast = useToast();

  const visibleItems = items.filter((item) => `${getCustomerReviewId(item)} ${getCustomerReviewLocationName(item)} ${item.comment ?? ""} ${item.status ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [reviews, locationList] = await Promise.all([reviewService.list(), locationService.list()]);
      setItems(reviews);
      setLocations(locationList);
    } catch (err) {
      const message = getApiError(err, "Cannot load reviews from API.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function createReview(form: ReviewFormValue) {
    setSaving(true);
    setError("");
    try {
      await reviewService.createForLocation(Number(form.location_id), {
        rating: Number(form.rating),
        comment: form.comment.trim()
      });
      showToast({ variant: "success", title: "Review submitted", description: "Your review has been sent for moderation." });
      setCreating(false);
      await loadData();
    } catch (err) {
      const message = getApiError(err, "Cannot submit this review.");
      setError(message);
      showToast({ variant: "error", title: "Submit failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold">Location Reviews</h1><p className="mt-1 text-sm text-slate-500">View traveler reviews and share your experience at a location.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh</Button><Button onClick={() => setCreating(true)} disabled={loading}><Plus size={17} /> Write Review</Button></div></div>
      {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search reviews..." /></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Review", "Location", "Rating", "Comment", "Status"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {loading ? <tr><td colSpan={5} className="p-8 text-center text-slate-500"><Loader2 className="mr-2 inline size-5 animate-spin" /> Loading reviews...</td></tr>
          : rows.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">No reviews found.</td></tr>
            : rows.map((review) => <tr key={getCustomerReviewId(review)} className="border-t border-slate-100"><td className="p-3 font-bold"><MessageSquareText className="mr-2 inline size-4 text-brand-600" />#{getCustomerReviewId(review)}</td><td className="p-3 font-semibold">{getCustomerReviewLocationName(review)}</td><td className="p-3"><Star className="mr-1 inline size-4 fill-amber-400 text-amber-400" />{review.rating}</td><td className="max-w-80 truncate p-3 text-slate-600">{review.comment || "-"}</td><td className="p-3"><Status value={review.status ?? "approved"} /></td></tr>)}
      </tbody></table></div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="reviews" onPageChange={setPage} />
    </div>
    {creating ? <CreateReviewForm locations={locations} saving={saving} onClose={() => setCreating(false)} onSave={createReview} /> : null}
  </>;
}

function CreateReviewForm({ locations, saving, onClose, onSave }: { locations: PublicLocation[]; saving: boolean; onClose: () => void; onSave: (form: ReviewFormValue) => Promise<void> }) {
  const [form, setForm] = useState(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<ReviewFieldErrors>({});

  function clearError(field: keyof ReviewFormValue) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form noValidate className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); const errors = validateReview(form); setFieldErrors(errors); if (Object.keys(errors).length === 0) void onSave(form); }}><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Write a Review</h2><p className="mt-1 text-sm text-slate-500">You can review each location once.</p></div><button type="button" onClick={onClose} disabled={saving} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div><div className="mt-6 grid gap-4">
    <Field label="Location" message={fieldErrors.location_id}><select value={form.location_id} onChange={(event) => { clearError("location_id"); setForm({ ...form, location_id: event.target.value }); }} className="input"><option value="">Select a location</option>{locations.map((location) => <option key={getPublicLocationId(location)} value={getPublicLocationId(location)}>{location.name}</option>)}</select></Field>
    <Field label="Rating" message={fieldErrors.rating}><select value={form.rating} onChange={(event) => { clearError("rating"); setForm({ ...form, rating: event.target.value }); }} className="input">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} Star{rating > 1 ? "s" : ""}</option>)}</select></Field>
    <Field label="Comment" message={fieldErrors.comment}><textarea value={form.comment} onChange={(event) => { clearError("comment"); setForm({ ...form, comment: event.target.value }); }} className="input min-h-32 py-3" placeholder="Share your experience..." /></Field>
  </div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null} Submit Review</Button></div></form></div>;
}

function Field({ label, message, children }: { label: string; message?: string; children: React.ReactNode }) { return <label className={`block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:px-3 [&_.input]:outline-none ${message ? "[&_.input]:border-rose-500" : "[&_.input]:border-slate-200 [&_.input]:focus:border-brand-600"}`}>{label}{children}{message ? <span className="mt-2 block text-xs font-semibold text-rose-600">{message}</span> : null}</label>; }
function Status({ value }: { value: string }) { const normalized = value.toLowerCase(); const style = normalized === "approved" ? "bg-emerald-50 text-emerald-700" : normalized === "hidden" || normalized === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>; }

function validateReview(form: ReviewFormValue) {
  const errors: ReviewFieldErrors = {};
  if (!form.location_id) errors.location_id = "Location is required.";
  if (!form.rating || Number(form.rating) < 1 || Number(form.rating) > 5) errors.rating = "Choose a rating from 1 to 5.";
  if (!form.comment.trim()) errors.comment = "Comment is required.";
  return errors;
}

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  if (error.response?.status === 409) return data?.message ?? "You have already reviewed this location.";
  if (error.response?.status === 401) return "Please sign in with a customer account to submit a review.";
  return data?.message ?? data?.error ?? fallback;
}
