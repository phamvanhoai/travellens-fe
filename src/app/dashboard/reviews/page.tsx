import { reviews } from "@/lib/data";

export default function ReviewsPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Review History</h1>
      <div className="mt-6 grid gap-4">
        {reviews.map((review) => <div key={review.name} className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">“{review.quote}” <span className="font-bold text-ink">Rating {review.rating}.0</span></div>)}
      </div>
    </div>
  );
}
