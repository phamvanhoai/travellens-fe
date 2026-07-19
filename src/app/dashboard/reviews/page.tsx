"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { Loader2, MessageSquareText, RefreshCw, Search, Star } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { getCustomerReviewId, getCustomerReviewLocationName, reviewService, type CustomerReview } from "@/services/review.service";
const pageSize = 5;

export default function ReviewsPage() {
  const [items, setItems] = useState<CustomerReview[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const showToast = useToast();

  const visibleItems = items.filter((item) => `${getCustomerReviewId(item)} ${getCustomerReviewLocationName(item)} ${item.comment ?? ""} ${item.status ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const reviews = await reviewService.list();
      setItems(reviews);
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

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold">Community Location Reviews</h1><p className="mt-1 text-sm text-slate-500">Browse reviews shared by travelers across all locations.</p></div><Button variant="outline" onClick={() => void loadData()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh</Button></div>
      {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search reviews..." /></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Review", "Location", "Rating", "Comment", "Status"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {loading ? <tr><td colSpan={5} className="p-8 text-center text-slate-500"><Loader2 className="mr-2 inline size-5 animate-spin" /> Loading reviews...</td></tr>
          : rows.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">No reviews found.</td></tr>
            : rows.map((review) => <tr key={getCustomerReviewId(review)} className="border-t border-slate-100"><td className="p-3 font-bold"><MessageSquareText className="mr-2 inline size-4 text-brand-600" />#{getCustomerReviewId(review)}</td><td className="p-3 font-semibold">{getCustomerReviewLocationName(review)}</td><td className="p-3"><Star className="mr-1 inline size-4 fill-amber-400 text-amber-400" />{review.rating}</td><td className="max-w-80 truncate p-3 text-slate-600">{review.comment || "-"}</td><td className="p-3"><Status value={review.status ?? "approved"} /></td></tr>)}
      </tbody></table></div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="reviews" onPageChange={setPage} />
    </div>
  </>;
}
function Status({ value }: { value: string }) { const normalized = value.toLowerCase(); const style = normalized === "approved" ? "bg-emerald-50 text-emerald-700" : normalized === "hidden" || normalized === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>; }

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  if (error.response?.status === 409) return data?.message ?? "You have already reviewed this location.";
  if (error.response?.status === 401) return "Please sign in with a customer account to submit a review.";
  return data?.message ?? data?.error ?? fallback;
}
