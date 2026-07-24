"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, CreditCard, Eye, Loader2, Pencil, RefreshCw, Search, Star, X, XCircle } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import {
  bookingService,
  getCustomerBookingReview,
  getCustomerBookingAmount,
  getCustomerBookingCancelStatus,
  getCustomerBookingCode,
  getCustomerBookingId,
  getCustomerBookingPaymentStatus,
  getCustomerBookingPassengers,
  getCustomerBookingTourName,
  type CustomerBooking
} from "@/services/booking.service";
const pageSize = 5;

export default function BookingsPage() {
  const [items, setItems] = useState<CustomerBooking[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CustomerBooking | null>(null);
  const [reviewing, setReviewing] = useState<CustomerBooking | null>(null);
  const [detailBooking, setDetailBooking] = useState<CustomerBooking | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState(0);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const showToast = useToast();

  const currentPage = Math.min(page, pageCount);
  const rows = items;

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await bookingService.listMinePage({ page, limit: pageSize, search: query.trim() || undefined });
      setItems(result.data);
      setTotalItems(result.meta?.total ?? result.data.length);
      setPageCount(result.meta?.total_pages ?? 1);
    } catch (err) {
      const message = getApiError(err, "Cannot load your bookings.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [page, query, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadBookings(), 300);
    return () => window.clearTimeout(timer);
  }, [loadBookings]);

  async function cancelBooking() {
    if (!selected || cancelling) return;
    const reason = cancelReason.trim();

    setCancelling(true);
    setError("");
    try {
      const response = await bookingService.cancel(getCustomerBookingId(selected), reason || undefined);
      const isPendingRefund = response.data?.data?.status === "cancel_pending";
      showToast({
        variant: "success",
        title: isPendingRefund ? "Cancellation requested" : "Booking cancelled",
        description: isPendingRefund ? `${getCustomerBookingCode(selected)} is waiting for refund review.` : getCustomerBookingCode(selected)
      });
      setSelected(null);
      setCancelReason("");
      setCancelReasonError("");
      await loadBookings();
    } catch (err) {
      const message = getApiError(err, "Cannot cancel this booking.");
      setError(message);
      showToast({ variant: "error", title: "Cancel failed", description: message });
    } finally {
      setCancelling(false);
    }
  }

  async function saveTourReview(form: ReviewFormValue) {
    if (!reviewing) return;
    const bookingId = getCustomerBookingId(reviewing);
    const existingReview = getCustomerBookingReview(reviewing);
    const payload = { rating: Number(form.rating), comment: form.comment.trim() };

    try {
      const saved = existingReview
        ? await bookingService.updateTourReview(bookingId, payload)
        : await bookingService.createTourReview(bookingId, payload);
      setItems((current) => current.map((booking) => getCustomerBookingId(booking) === bookingId
        ? { ...booking, review: { ...saved, rating: saved.rating ?? payload.rating, comment: saved.comment ?? payload.comment }, Review: undefined, reviews: undefined, Reviews: undefined }
        : booking));
      showToast({ variant: "success", title: existingReview ? "Review updated" : "Review submitted", description: getCustomerBookingTourName(reviewing) });
      setReviewing(null);
    } catch (err) {
      const message = getReviewApiError(err, existingReview ? "Cannot update this tour review." : "Cannot submit this tour review.");
      showToast({ variant: "error", title: existingReview ? "Update failed" : "Submit failed", description: message });
    }
  }

  function openCancelDialog(booking: CustomerBooking) {
    setSelected(booking);
    setCancelReason("");
    setCancelReasonError("");
  }

  function closeCancelDialog() {
    if (cancelling) return;
    setSelected(null);
    setCancelReason("");
    setCancelReasonError("");
  }

  async function openBookingDetail(booking: CustomerBooking) {
    const id = getCustomerBookingId(booking);
    setDetailLoadingId(id);
    try {
      const detail = await bookingService.detail(id);
      setDetailBooking({ ...booking, ...detail });
    } catch (err) {
      showToast({ variant: "error", title: "Detail unavailable", description: getApiError(err, "Cannot load booking details.") });
    } finally {
      setDetailLoadingId(0);
    }
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h1 className="text-2xl font-bold">My Bookings</h1><p className="mt-1 text-sm text-slate-500">Bookings created by your current customer account.</p></div><Button variant="outline" onClick={() => void loadBookings()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh</Button></div>
      {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search my bookings..." /></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Booking", "Tour", "Departure", "Passengers", "Payment Status", "Amount", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {loading ? <BookingsTableSkeleton rows={pageSize} />
          : rows.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">This account has no bookings yet.</td></tr>
            : rows.map((booking) => {
              const passengers = getCustomerBookingPassengers(booking); const paymentStatus = getCustomerBookingPaymentStatus(booking) ?? "unpaid"; const cancelActionStatus = getCancelActionStatus(booking); const canCancel = canCancelBooking(booking); const needsPayment = canPayBooking(booking); const canReview = canReviewBooking(booking); const review = getCustomerBookingReview(booking); const bookingId = getCustomerBookingId(booking); const arrival = booking.preferred_arrival_time ?? booking.departure_at ?? booking.arrival_time ?? booking.travel_date;
              return <tr key={bookingId} className="border-t border-slate-100"><td className="p-3 font-bold"><CalendarCheck className="mr-2 inline size-4 text-brand-600" />{getCustomerBookingCode(booking)}</td><td className="p-3 font-semibold">{getCustomerBookingTourName(booking)}</td><td className="p-3 text-slate-600">{arrival ? formatDate(arrival) : getArrivalFromRequest(booking)}</td><td className="p-3">{passengerSummary(booking, passengers)}</td><td className="p-3"><Status value={paymentStatus} /></td><td className="p-3 font-semibold">{formatVnd(getCustomerBookingAmount(booking))}</td><td className="p-3"><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void openBookingDetail(booking)} disabled={detailLoadingId === bookingId} className="inline-flex h-9 items-center gap-2 rounded-lg border border-brand-100 px-3 font-semibold text-brand-700 hover:bg-brand-50 disabled:opacity-50">{detailLoadingId === bookingId ? <Loader2 className="animate-spin" size={15} /> : <Eye size={15} />} Detail</button>{cancelActionStatus ? <Status value={cancelActionStatus} /> : <>{needsPayment ? <Button href={`/payment/checkout?bookingId=${bookingId}`} className="h-9 px-3"><CreditCard size={15} /> Pay Now</Button> : null}{canCancel ? <button type="button" onClick={() => openCancelDialog(booking)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 px-3 font-semibold text-rose-600 hover:bg-rose-50"><XCircle size={15} /> Cancel</button> : null}</>}{canReview ? review ? <button type="button" onClick={() => setReviewing(booking)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 hover:bg-slate-50"><Pencil size={15} /> Review</button> : <button type="button" onClick={() => setReviewing(booking)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-200 px-3 font-semibold text-amber-700 hover:bg-amber-50"><Star size={15} /> Review Tour</button> : null}</div></td></tr>;
            })}
      </tbody></table></div>
      {!loading ? <Pagination page={currentPage} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="bookings" onPageChange={setPage} /> : null}
    </div>
    {selected ? (
      <CancelBookingDialog
        booking={selected}
        reason={cancelReason}
        reasonError={cancelReasonError}
        cancelling={cancelling}
        onReasonChange={(value) => {
          setCancelReason(value.slice(0, 1000));
          setCancelReasonError("");
        }}
        onCancel={closeCancelDialog}
        onConfirm={() => void cancelBooking()}
      />
    ) : null}
    {reviewing ? <TourReviewDialog booking={reviewing} onCancel={() => setReviewing(null)} onSave={saveTourReview} /> : null}
    {detailBooking ? <BookingDetailDialog booking={detailBooking} onClose={() => setDetailBooking(null)} /> : null}
  </>;
}

function BookingsTableSkeleton({ rows }: { rows: number }) {
  return Array.from({ length: rows }, (_, index) => (
    <tr key={index} className="animate-pulse border-t border-slate-100" aria-hidden="true">
      <td className="p-3"><div className="h-4 w-24 rounded bg-slate-200" /></td>
      <td className="p-3"><div className="h-4 w-36 rounded bg-slate-200" /></td>
      <td className="p-3"><div className="h-4 w-28 rounded bg-slate-100" /></td>
      <td className="p-3"><div className="h-4 w-20 rounded bg-slate-100" /></td>
      <td className="p-3"><div className="h-7 w-20 rounded-full bg-slate-200" /></td>
      <td className="p-3"><div className="h-4 w-24 rounded bg-slate-200" /></td>
      <td className="p-3"><div className="h-9 w-24 rounded-lg bg-slate-100" /></td>
    </tr>
  ));
}

type ReviewFormValue = { rating: string; comment: string };

function BookingDetailDialog({ booking, onClose }: { booking: CustomerBooking; onClose: () => void }) {
  const passengers = getCustomerBookingPassengers(booking);
  const raw = booking as CustomerBooking & { original_amount?: number | string; discount_amount?: number | string; coupon_id?: number; policy_accepted_at?: string; special_request?: string; payment_method?: string };
  const departure = booking.departure_at ?? booking.preferred_arrival_time ?? booking.arrival_time ?? booking.travel_date;
  const originalAmount = Number(raw.original_amount ?? passengers.reduce((sum, item) => sum + Number(item.price || 0), 0));
  const discount = Number(raw.discount_amount ?? Math.max(0, originalAmount - getCustomerBookingAmount(booking)));
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4"><div role="dialog" aria-modal="true" aria-label="Booking details" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-600">Booking detail</p><h2 className="mt-1 text-2xl font-bold">{getCustomerBookingCode(booking)}</h2><p className="mt-1 text-sm text-slate-500">Created {formatDate(booking.created_at ?? booking.booking_date ?? booking.booked_at)}</p></div><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close booking details"><X size={18} /></button></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><DetailInfo label="Tour" value={getCustomerBookingTourName(booking)} /><DetailInfo label="Departure" value={formatDate(departure)} /><DetailInfo label="Booking status" value={<Status value={booking.status ?? "pending"} />} /><DetailInfo label="Payment status" value={<Status value={getCustomerBookingPaymentStatus(booking) ?? "unpaid"} />} /><DetailInfo label="Contact phone" value={booking.contact_phone || "-"} /><DetailInfo label="Payment method" value={raw.payment_method || "-"} /></div>
    <section className="mt-7"><h3 className="font-bold">Passengers ({passengers.length})</h3><div className="mt-3 overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[560px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Passenger</th><th className="p-3">Category</th><th className="p-3">Seat</th><th className="p-3">Special request</th><th className="p-3 text-right">Price</th></tr></thead><tbody>{passengers.length ? passengers.map((item, index) => <tr key={item.booking_detail_id ?? item.id ?? index} className="border-t border-slate-100"><td className="p-3 font-semibold">{item.passenger_name || `Passenger ${index + 1}`}</td><td className="p-3 capitalize">{item.age_category}</td><td className="p-3">{item.seat_number || "-"}</td><td className="max-w-56 p-3 text-slate-500">{item.special_request || "-"}</td><td className="p-3 text-right font-semibold">{formatVnd(Number(item.price || 0))}</td></tr>) : <tr><td colSpan={5} className="p-8 text-center text-slate-500">No passenger details available.</td></tr>}</tbody></table></div></section>
    <section className="ml-auto mt-6 max-w-sm space-y-3 rounded-lg bg-slate-50 p-4 text-sm"><PriceRow label="Original amount" value={originalAmount} /><PriceRow label={raw.coupon_id ? `Discount (coupon #${raw.coupon_id})` : "Discount"} value={-discount} muted /><div className="border-t border-slate-200 pt-3"><PriceRow label="Total" value={getCustomerBookingAmount(booking)} total /></div></section>
    {raw.policy_accepted_at ? <p className="mt-4 text-xs text-slate-400">Booking policy accepted at {formatDate(raw.policy_accepted_at)}.</p> : null}
    <div className="mt-6 flex justify-end"><Button type="button" variant="outline" onClick={onClose}>Close</Button></div>
  </div></div>;
}

function DetailInfo({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-lg border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-400">{label}</p><div className="mt-1 font-semibold text-slate-800">{value}</div></div>; }
function PriceRow({ label, value, muted, total }: { label: string; value: number; muted?: boolean; total?: boolean }) { return <div className={`flex items-center justify-between gap-4 ${total ? "text-base font-bold text-brand-700" : muted ? "text-slate-500" : "text-slate-700"}`}><span>{label}</span><span>{value < 0 ? `-${formatVnd(Math.abs(value))}` : formatVnd(value)}</span></div>; }

function TourReviewDialog({ booking, onCancel, onSave }: { booking: CustomerBooking; onCancel: () => void; onSave: (form: ReviewFormValue) => Promise<void> }) {
  const existingReview = getCustomerBookingReview(booking);
  const [form, setForm] = useState<ReviewFormValue>({
    rating: String(existingReview?.rating ?? 5),
    comment: existingReview?.comment ?? ""
  });
  const [saving, setSaving] = useState(false);
  const [commentError, setCommentError] = useState("");

  async function submit() {
    const comment = form.comment.trim();
    if (!comment) {
      setCommentError("Comment is required.");
      return;
    }

    setSaving(true);
    try {
      await onSave({ ...form, comment });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4">
      <form className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{existingReview ? "Edit Tour Review" : "Review Tour"}</h2>
            <p className="mt-1 text-sm text-slate-500">{getCustomerBookingTourName(booking)}</p>
          </div>
          <button type="button" onClick={onCancel} disabled={saving} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <label className="mt-5 block text-sm font-semibold">
          Rating
          <span className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button key={rating} type="button" onClick={() => setForm((current) => ({ ...current, rating: String(rating) }))} className="text-amber-400" aria-label={`${rating} stars`}>
                <Star className={`size-6 ${rating <= Number(form.rating) ? "fill-amber-400" : "text-slate-300"}`} />
              </button>
            ))}
          </span>
        </label>
        <label className="mt-5 block text-sm font-semibold">
          Comment
          <textarea
            value={form.comment}
            onChange={(event) => { setCommentError(""); setForm((current) => ({ ...current, comment: event.target.value.slice(0, 1000) })); }}
            className={`mt-2 min-h-32 w-full resize-y rounded-lg border px-3 py-3 text-sm outline-none focus:border-brand-600 ${commentError ? "border-rose-500" : "border-slate-200"}`}
            placeholder="Share your tour experience..."
            disabled={saving}
            maxLength={1000}
          />
        </label>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-rose-600">{commentError}</span>
          <span className="text-slate-400">{form.comment.length}/1000</span>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null} {existingReview ? "Update Review" : "Submit Review"}</Button>
        </div>
      </form>
    </div>
  );
}

function CancelBookingDialog({
  booking,
  reason,
  reasonError,
  cancelling,
  onReasonChange,
  onCancel,
  onConfirm
}: {
  booking: CustomerBooking;
  reason: string;
  reasonError: string;
  cancelling: boolean;
  onReasonChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4">
      <form className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); onConfirm(); }}>
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600">
            <XCircle size={22} />
          </span>
          <button type="button" onClick={onCancel} disabled={cancelling} className="grid size-9 place-items-center rounded-full hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <h2 className="mt-5 text-xl font-bold">Cancel booking?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Cancel {getCustomerBookingCode(booking)}. Paid bookings will create a manual refund request for staff to process.
        </p>
        <label className="mt-5 block text-sm font-semibold">
          Cancellation Reason <span className="font-normal text-slate-400">(optional)</span>
          <textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            className={`mt-2 min-h-32 w-full resize-y rounded-lg border px-3 py-3 text-sm outline-none focus:border-brand-600 ${reasonError ? "border-rose-500" : "border-slate-200"}`}
            placeholder="I changed my travel plan"
            disabled={cancelling}
            maxLength={1000}
          />
        </label>
        <div className="mt-2 flex items-center justify-between gap-3 text-xs">
          <span className="font-semibold text-rose-600">{reasonError}</span>
          <span className="text-slate-400">{reason.length}/1000</span>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={cancelling}>Keep Booking</Button>
          <button
            type="submit"
            disabled={cancelling}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cancelling ? "Processing..." : (getCustomerBookingPaymentStatus(booking) ?? "").toLowerCase() === "paid" ? "Request Cancellation" : "Cancel Booking"}
          </button>
        </div>
      </form>
    </div>
  );
}

function passengerSummary(booking: CustomerBooking, passengers: ReturnType<typeof getCustomerBookingPassengers>) {
  if (passengers.length) {
    const summary = (["adult", "child", "infant"] as const)
      .map((category) => ({ category, count: passengers.filter((passenger) => passenger.age_category?.toLowerCase() === category).length }))
      .filter((item) => item.count > 0)
      .map((item) => `${item.count} ${item.category}`)
      .join(", ");

    return summary || `${passengers.length} passenger${passengers.length === 1 ? "" : "s"}`;
  }

  const raw = booking as CustomerBooking & {
    passenger_count?: number | string;
    passengerCount?: number | string;
    total_passengers?: number | string;
    totalPassengers?: number | string;
    guest_count?: number | string;
  };
  const count = Number(raw.passenger_count ?? raw.passengerCount ?? raw.total_passengers ?? raw.totalPassengers ?? raw.guest_count ?? 0);
  return count > 0 ? `${count} passenger${count === 1 ? "" : "s"}` : "-";
}

function canCancelBooking(booking: CustomerBooking) {
  const status = (booking.status ?? "pending").toLowerCase();
  if (["cancel_pending", "cancelled", "canceled", "expired", "refunded", "completed"].includes(status)) return false;

  const departure = getBookingDepartureDate(booking);
  if (!departure) return true;

  const hoursUntilDeparture = departure.getTime() - Date.now();
  return hoursUntilDeparture >= 24 * 60 * 60 * 1000;
}

function canPayBooking(booking: CustomerBooking) {
  if (getCustomerBookingAmount(booking) <= 0) return false;
  const bookingStatus = (booking.status ?? "pending").toLowerCase();
  const paymentStatus = (getCustomerBookingPaymentStatus(booking) ?? "unpaid").toLowerCase();
  if (["cancel_pending", "cancelled", "canceled", "expired", "refunded", "completed"].includes(bookingStatus)) return false;
  return ["unpaid", "pending", "failed"].includes(paymentStatus);
}

function canReviewBooking(booking: CustomerBooking) {
  const bookingStatus = (booking.status ?? "").toLowerCase();
  const paymentStatus = (getCustomerBookingPaymentStatus(booking) ?? "").toLowerCase();
  if (["cancel_pending", "cancelled", "canceled", "expired", "refunded", "rejected"].includes(bookingStatus)) return false;
  const isPaidOrCompleted = ["paid", "completed"].includes(paymentStatus) || ["completed"].includes(bookingStatus);
  if (!isPaidOrCompleted) return false;
  if (bookingStatus === "completed") return true;

  const departure = getBookingDepartureDate(booking);
  return Boolean(departure && departure.getTime() <= Date.now());
}

function getCancelActionStatus(booking: CustomerBooking) {
  const bookingStatus = (booking.status ?? "").toLowerCase();
  const cancelStatus = getCustomerBookingCancelStatus(booking);
  const paymentStatus = (getCustomerBookingPaymentStatus(booking) ?? "").toLowerCase();

  if (bookingStatus === "cancel_pending") return "Pending Cancel";
  if (paymentStatus === "refunded") return "Refunded";
  if (["cancelled", "canceled"].includes(bookingStatus)) {
    if (["pending", "approved"].includes(cancelStatus.toLowerCase()) || paymentStatus === "paid") return "Refund Pending";
    return "Canceled";
  }
  if (cancelStatus && cancelStatus !== "completed") return cancelStatus;

  return "";
}

function getBookingDepartureDate(booking: CustomerBooking) {
  const value = booking.departure_at ?? booking.preferred_arrival_time ?? booking.arrival_time ?? booking.travel_date;
  if (!value) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? `${value}T00:00:00+07:00`
    : /([zZ]|[+-]\d{2}:\d{2})$/.test(value)
      ? value
      : value.includes("T")
        ? `${value}+07:00`
        : value;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getArrivalFromRequest(booking: CustomerBooking) {
  const request = getCustomerBookingPassengers(booking)
    .map((passenger) => passenger.special_request ?? "")
    .find((value) => value.includes("Preferred arrival time:") || value.includes("Travel date:"));
  const match = request?.match(/(?:Preferred arrival time|Travel date):\s*([^|]+)/i)?.[1]?.trim();
  return formatDate(match);
}

function Status({ value }: { value: string }) { const label = String(value || "-"); const normalized = label.toLowerCase(); const style = normalized === "-" ? "bg-slate-100 text-slate-500" : ["confirmed", "paid", "completed"].includes(normalized) ? "bg-emerald-50 text-emerald-700" : ["cancelled", "canceled", "expired", "refunded", "rejected"].includes(normalized) ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{label}</span>; }
function formatVnd(value: number) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0); }
function formatDate(value?: string) { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(date); }
function readBookingMetadata() { try { return JSON.parse(localStorage.getItem("travel360_booking_metadata") ?? "{}") as Record<string, { booked_at: string; arrival_time: string; amount: number; passengers: Array<"adult" | "child" | "infant"> }>; } catch { return {}; } }
function readPaymentMap() { try { return JSON.parse(localStorage.getItem("travel360_payment_by_booking") ?? "{}") as Record<string, number>; } catch { return {}; } }
function getApiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; if (error.response?.status === 401) return "Please sign in to view your bookings."; return data?.message ?? data?.error ?? fallback; }
function getReviewApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  if (error.response?.status === 400) return data?.message ?? "This booking is not eligible for review.";
  if (error.response?.status === 401) return "Please sign in to review this tour.";
  if (error.response?.status === 403) return "This review does not belong to your account.";
  if (error.response?.status === 404) return data?.message ?? "Booking or review was not found.";
  if (error.response?.status === 409) return data?.message ?? "This booking has already been reviewed.";
  return data?.message ?? data?.error ?? fallback;
}
