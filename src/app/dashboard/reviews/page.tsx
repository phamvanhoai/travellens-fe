"use client";

import { useState } from "react";
import { MessageSquareText, Pencil, Search, Star, X } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";

type ReviewStatus = "Pending" | "Approved" | "Hidden";

type UserReview = {
  id: string;
  target: string;
  targetType: "TravelDestination" | "Location" | "Tour";
  rating: number;
  comment: string;
  status: ReviewStatus;
};

const initialReviews: UserReview[] = [
  { id: "REV-1001", target: "Independence Palace", targetType: "TravelDestination", rating: 5, comment: "The 360 preview helped us plan a thoughtful visit.", status: "Approved" },
  { id: "REV-1002", target: "Conference Hall", targetType: "Location", rating: 4, comment: "Clear visitor route and useful diagram images.", status: "Approved" },
  { id: "REV-1003", target: "Saigon One Day Tour", targetType: "Tour", rating: 5, comment: "Smooth itinerary and knowledgeable local guide.", status: "Approved" },
  { id: "REV-1004", target: "Ben Thanh Market", targetType: "TravelDestination", rating: 4, comment: "Busy but worth visiting for local food.", status: "Pending" },
  { id: "REV-1005", target: "Command Bunker", targetType: "Location", rating: 3, comment: "Interesting location, but the audio was hard to hear.", status: "Pending" },
  { id: "REV-1006", target: "Ha Long Bay Weekend", targetType: "Tour", rating: 5, comment: "Great route and comfortable schedule.", status: "Approved" }
];

export default function ReviewsPage() {
  const [items, setItems] = useState(initialReviews);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<UserReview | null>(null);
  const pageSize = 5;
  const visibleItems = items.filter((item) =>
    `${item.id} ${item.target} ${item.targetType} ${item.status} ${item.comment}`.toLowerCase().includes(query.toLowerCase())
  );
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function saveReview(payload: UserReview) {
    setItems((current) => current.map((item) => item.id === payload.id ? payload : item));
    setEditing(null);
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Review History</h1>
        <p className="mt-1 text-sm text-slate-500">Search and update your review comments.</p>

        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-3 size-5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
            placeholder="Search reviews..."
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Review ID", "Target Type", "Target", "Rating", "Comment", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {paginatedItems.map((review) => (
                <tr key={review.id} className="border-t border-slate-100">
                  <td className="p-3 font-bold"><MessageSquareText className="mr-2 inline size-4 text-brand-600" />{review.id}</td>
                  <td className="p-3 text-slate-600">{review.targetType}</td>
                  <td className="p-3 font-semibold">{review.target}</td>
                  <td className="p-3"><Star className="mr-1 inline size-4 fill-amber-400 text-amber-400" />{review.rating}</td>
                  <td className="max-w-64 truncate p-3 text-slate-600">{review.comment}</td>
                  <td className="p-3"><Status value={review.status} /></td>
                  <td className="p-3"><Button variant="outline" className="h-9 px-3" onClick={() => setEditing(review)}><Pencil size={15} /> Edit</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="reviews" onPageChange={setPage} />
      </div>

      {editing ? <ReviewForm initialValue={editing} onClose={() => setEditing(null)} onSave={saveReview} /> : null}
    </>
  );
}

function ReviewForm({ initialValue, onClose, onSave }: { initialValue: UserReview; onClose: () => void; onSave: (payload: UserReview) => void }) {
  const [form, setForm] = useState(initialValue);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form
        className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Edit Review</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 grid gap-4">
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            {form.targetType}: <span className="font-bold text-ink">{form.target}</span>
          </div>
          <Field label="Rating"><select value={form.rating} onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })} className="input"><option value="1">1 Star</option><option value="2">2 Stars</option><option value="3">3 Stars</option><option value="4">4 Stars</option><option value="5">5 Stars</option></select></Field>
          <Field label="Comment"><textarea required value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} className="input min-h-28 py-3" /></Field>
          <Field label="Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as ReviewStatus })} className="input"><option>Pending</option><option>Approved</option><option>Hidden</option></select></Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Review</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>;
}

function Status({ value }: { value: ReviewStatus }) {
  const style = value === "Approved" ? "bg-emerald-50 text-emerald-700" : value === "Hidden" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>;
}
