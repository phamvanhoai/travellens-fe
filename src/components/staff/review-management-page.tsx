"use client";

import axios from "axios";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquareText, Pencil, RefreshCw, Search, Star, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import {
  getStaffReviewId,
  getStaffReviewLocationId,
  getStaffReviewLocationName,
  getStaffReviewUserId,
  getStaffReviewUserName,
  staffReviewService,
  type StaffReview,
  type StaffReviewPayload,
  type StaffReviewStatus
} from "@/services/staff-review.service";

const pageSize = 5;

export default function StaffReviewsPage() {
  return <ReviewManagementPage />;
}

function ReviewManagementPage() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin/");
  const title = isAdmin ? "Review Management" : "Staff Reviews";
  const description = isAdmin ? "Moderate, update and delete location reviews." : "Moderate and delete location reviews.";
  const [items, setItems] = useState<StaffReview[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<StaffReview | null>(null);
  const [deleting, setDeleting] = useState<StaffReview | null>(null);
  const showToast = useToast();

  const visible = items.filter((item) => `${getStaffReviewId(item)} ${getStaffReviewUserName(item)} ${getStaffReviewLocationName(item)} ${item.comment ?? ""} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await staffReviewService.list());
    } catch (err) {
      const message = getApiError(err, "Cannot load staff reviews from API.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  async function saveReview(review: StaffReview) {
    const payload: StaffReviewPayload = {
      user_id: getStaffReviewUserId(review),
      location_id: getStaffReviewLocationId(review),
      rating: Number(review.rating),
      comment: review.comment?.trim() ?? "",
      status: review.status
    };
    setSaving(true);
    setError("");
    try {
      await staffReviewService.update(getStaffReviewId(review), payload);
      showToast({ variant: "success", title: "Review updated", description: `Review #${getStaffReviewId(review)}` });
      setEditing(null);
      await loadReviews();
    } catch (err) {
      const message = getApiError(err, "Cannot update this review.");
      setError(message);
      showToast({ variant: "error", title: "Update failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  async function deleteReview() {
    if (!deleting || saving) return;
    const reviewId = getStaffReviewId(deleting);
    setSaving(true);
    setError("");
    try {
      await staffReviewService.remove(reviewId);
      showToast({ variant: "success", title: "Review deleted", description: `Review #${reviewId}` });
      setDeleting(null);
      await loadReviews();
    } catch (err) {
      const message = getApiError(err, "Cannot delete this review.");
      setError(message);
      showToast({ variant: "error", title: "Delete failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold">{title}</h1><p className="mt-1 text-sm text-slate-500">{description}</p></div><Button variant="outline" onClick={() => void loadReviews()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh</Button></div>
      {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search reviews..." /></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Review", "User", "Location", "Rating", "Comment", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {loading ? <AdminTableSkeleton columns={7} rows={10} />
          : rows.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">No reviews found.</td></tr>
            : rows.map((item) => <tr key={getStaffReviewId(item)} className="border-t border-slate-100"><td className="p-3 font-bold"><MessageSquareText className="mr-2 inline size-4 text-brand-600" />#{getStaffReviewId(item)}</td><td className="p-3">{getStaffReviewUserName(item)}</td><td className="p-3">{getStaffReviewLocationName(item)}</td><td className="p-3"><Star className="mr-1 inline size-4 fill-amber-400 text-amber-400" />{item.rating}</td><td className="max-w-64 truncate p-3 text-slate-600">{item.comment || "-"}</td><td className="p-3"><Status value={item.status} /></td><td className="p-3"><span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}><Pencil size={15} /> Edit</Button><button type="button" onClick={() => setDeleting(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label={`Delete review #${getStaffReviewId(item)}`}><Trash2 size={15} /></button></span></td></tr>)}
      </tbody></table></div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={visible.length} pageSize={pageSize} itemLabel="reviews" onPageChange={setPage} />
    </div>
    {editing ? <ReviewModal item={editing} saving={saving} onClose={() => setEditing(null)} onSave={saveReview} /> : null}
    {deleting ? <ConfirmDialog title="Delete Review" message={`Delete review #${getStaffReviewId(deleting)}? This action cannot be undone.`} onCancel={() => setDeleting(null)} onConfirm={() => void deleteReview()} /> : null}
  </>;
}

function ReviewModal({ item, saving, onClose, onSave }: { item: StaffReview; saving: boolean; onClose: () => void; onSave: (item: StaffReview) => Promise<void> }) {
  const [form, setForm] = useState(item);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); void onSave(form); }}><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Edit Review</h2><button type="button" onClick={onClose} disabled={saving} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div><div className="mt-6 grid gap-4"><Field label="Rating"><select value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })} className="input">{[1, 2, 3, 4, 5].map((rating) => <option key={rating} value={rating}>{rating} Star{rating > 1 ? "s" : ""}</option>)}</select></Field><Field label="Comment"><textarea value={form.comment ?? ""} onChange={(event) => setForm({ ...form, comment: event.target.value })} className="input min-h-24 py-3" /></Field><Field label="Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as StaffReviewStatus })} className="input"><option value="pending">pending</option><option value="approved">approved</option><option value="hidden">hidden</option></select></Field></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null} Save Review</Button></div></form></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>; }
function Status({ value }: { value: string }) { const style = value === "approved" ? "bg-emerald-50 text-emerald-700" : value === "hidden" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>; }

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return data?.message ?? data?.error ?? fallback;
}
