"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Loader2, RefreshCw, Search, X, XCircle } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import {
  bookingService,
  getCustomerBookingAmount,
  getCustomerBookingCancelStatus,
  getCustomerBookingCode,
  getCustomerBookingId,
  getCustomerBookingPaymentStatus,
  getCustomerBookingPassengers,
  getCustomerBookingTourName,
  type CustomerBooking
} from "@/services/booking.service";
import { paymentService } from "@/services/payment.service";
import { getPublicTourId, getPublicTourName, tourService } from "@/services/tour.service";

const pageSize = 5;

export default function BookingsPage() {
  const [items, setItems] = useState<CustomerBooking[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<CustomerBooking | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelReasonError, setCancelReasonError] = useState("");
  const showToast = useToast();

  const visibleItems = items.filter((item) => `${getCustomerBookingCode(item)} ${getCustomerBookingTourName(item)} ${item.status ?? ""} ${getCustomerBookingPaymentStatus(item) ?? ""}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [bookings, tours] = await Promise.all([
        bookingService.listMine(),
        tourService.list().catch(() => [])
      ]);
      const tourNames = new Map(tours.map((tour) => [getPublicTourId(tour), getPublicTourName(tour)]));
      const metadata = readBookingMetadata();
      const paymentMap = readPaymentMap();
      const detailedBookings = await Promise.all(bookings.map(async (booking) => {
        const bookingId = getCustomerBookingId(booking);
        const detail = bookingId ? await bookingService.detail(bookingId).catch(() => null) : null;
        const storedPaymentId = paymentMap[String(bookingId)];
        const payment = storedPaymentId ? await paymentService.detail(storedPaymentId).catch(() => null) : null;
        const merged = detail ? { ...booking, ...detail } : booking;
        const tourId = merged.tour_id ?? merged.tour?.tour_id ?? merged.tour?.id ?? merged.Tour?.tour_id ?? merged.Tour?.id;
        const local = metadata[String(bookingId)];
        return {
          ...merged,
          ...(payment ? { payment } : {}),
          tour_name: merged.tour_name ?? (tourId ? tourNames.get(Number(tourId)) : undefined),
          booked_at: merged.booked_at ?? merged.booking_date ?? merged.created_at ?? local?.booked_at,
          preferred_arrival_time: merged.preferred_arrival_time ?? merged.departure_at ?? merged.arrival_time ?? merged.travel_date ?? local?.arrival_time,
          amount: merged.amount ?? merged.total_amount ?? merged.final_amount ?? merged.total_price ?? payment?.amount ?? local?.amount,
          passengers: getCustomerBookingPassengers(merged).length ? getCustomerBookingPassengers(merged) : Array.isArray(local?.passengers) ? local.passengers.map((age_category) => ({ age_category, passenger_name: "", price: 0 })) : []
        };
      }));
      setItems(detailedBookings);
    } catch (err) {
      const message = getApiError(err, "Cannot load your bookings.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  async function cancelBooking() {
    if (!selected || cancelling) return;
    const reason = cancelReason.trim();
    if (!reason) {
      setCancelReasonError("Please enter a cancellation reason.");
      return;
    }

    setCancelling(true);
    setError("");
    try {
      await bookingService.cancel(getCustomerBookingId(selected), reason);
      showToast({ variant: "success", title: "Booking cancelled", description: getCustomerBookingCode(selected) });
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

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h1 className="text-2xl font-bold">My Bookings</h1><p className="mt-1 text-sm text-slate-500">Bookings created by your current customer account.</p></div><Button variant="outline" onClick={() => void loadBookings()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh</Button></div>
      {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search my bookings..." /></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Booking", "Tour", "Desired Arrival Date", "Passengers", "Payment Status", "Amount", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {loading ? <tr><td colSpan={7} className="p-8 text-center text-slate-500"><Loader2 className="mr-2 inline size-5 animate-spin" /> Loading your bookings...</td></tr>
          : rows.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">This account has no bookings yet.</td></tr>
            : rows.map((booking) => { const passengers = getCustomerBookingPassengers(booking); const paymentStatus = getCustomerBookingPaymentStatus(booking) ?? "pending"; const cancelActionStatus = getCancelActionStatus(booking); const canCancel = canCancelBooking(booking); const arrival = booking.preferred_arrival_time ?? booking.departure_at ?? booking.arrival_time ?? booking.travel_date; return <tr key={getCustomerBookingId(booking)} className="border-t border-slate-100"><td className="p-3 font-bold"><CalendarCheck className="mr-2 inline size-4 text-brand-600" />{getCustomerBookingCode(booking)}</td><td className="p-3 font-semibold">{getCustomerBookingTourName(booking)}</td><td className="p-3 text-slate-600">{arrival ? formatDate(arrival) : getArrivalFromRequest(booking)}</td><td className="p-3">{passengerSummary(booking, passengers)}</td><td className="p-3"><Status value={paymentStatus} /></td><td className="p-3 font-semibold">{formatVnd(getCustomerBookingAmount(booking))}</td><td className="p-3">{cancelActionStatus ? <Status value={cancelActionStatus} /> : <button type="button" onClick={() => openCancelDialog(booking)} disabled={!canCancel} title={canCancel ? "Cancel booking" : "This booking can no longer be cancelled"} className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 px-3 font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white"><XCircle size={15} /> Cancel</button>}</td></tr>; })}
      </tbody></table></div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="bookings" onPageChange={setPage} />
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
  </>;
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
          Cancellation Reason
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
            {cancelling ? "Cancelling..." : "Cancel Booking"}
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
  return hoursUntilDeparture > 24 * 60 * 60 * 1000;
}

function getCancelActionStatus(booking: CustomerBooking) {
  const bookingStatus = (booking.status ?? "").toLowerCase();
  const cancelStatus = getCustomerBookingCancelStatus(booking);
  const paymentStatus = (getCustomerBookingPaymentStatus(booking) ?? "").toLowerCase();

  if (bookingStatus === "cancel_pending") return "Pending Cancel";
  if (paymentStatus === "refunded") return "completed";
  if (cancelStatus && cancelStatus !== "completed") return cancelStatus;
  if (["cancelled", "canceled"].includes(bookingStatus)) return "pending";

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
