"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import {
  bookingService,
  getCustomerBookingAmount,
  getCustomerBookingCode,
  getCustomerBookingId,
  getCustomerBookingPassengers,
  getCustomerBookingTourName,
  type CustomerBooking
} from "@/services/booking.service";
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
  const showToast = useToast();

  const visibleItems = items.filter((item) => `${getCustomerBookingCode(item)} ${getCustomerBookingTourName(item)} ${item.status ?? ""}`.toLowerCase().includes(query.toLowerCase()));
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
      const detailedBookings = await Promise.all(bookings.map(async (booking) => {
        const bookingId = getCustomerBookingId(booking);
        const detail = bookingId ? await bookingService.detail(bookingId).catch(() => null) : null;
        const merged = detail ? { ...booking, ...detail } : booking;
        const tourId = merged.tour_id ?? merged.tour?.tour_id ?? merged.tour?.id ?? merged.Tour?.tour_id ?? merged.Tour?.id;
        const local = metadata[String(bookingId)];
        return {
          ...merged,
          tour_name: merged.tour_name ?? (tourId ? tourNames.get(Number(tourId)) : undefined),
          booked_at: merged.booked_at ?? merged.booking_date ?? merged.created_at ?? local?.booked_at,
          preferred_arrival_time: merged.preferred_arrival_time ?? merged.arrival_time ?? merged.travel_date ?? local?.arrival_time,
          amount: merged.amount ?? merged.total_amount ?? local?.amount,
          passengers: getCustomerBookingPassengers(merged).length ? getCustomerBookingPassengers(merged) : local?.passengers.map((age_category) => ({ age_category, passenger_name: "", price: 0 }))
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
    setCancelling(true);
    setError("");
    try {
      await bookingService.cancel(getCustomerBookingId(selected));
      showToast({ variant: "success", title: "Booking cancelled", description: getCustomerBookingCode(selected) });
      setSelected(null);
      await loadBookings();
    } catch (err) {
      const message = getApiError(err, "Cannot cancel this booking.");
      setError(message);
      showToast({ variant: "error", title: "Cancel failed", description: message });
    } finally {
      setCancelling(false);
    }
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h1 className="text-2xl font-bold">My Bookings</h1><p className="mt-1 text-sm text-slate-500">Bookings created by your current customer account.</p></div><Button variant="outline" onClick={() => void loadBookings()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh</Button></div>
      {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search my bookings..." /></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Booking", "Tour", "Desired Arrival Date", "Passengers", "Status", "Amount", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {loading ? <tr><td colSpan={7} className="p-8 text-center text-slate-500"><Loader2 className="mr-2 inline size-5 animate-spin" /> Loading your bookings...</td></tr>
          : rows.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">This account has no bookings yet.</td></tr>
            : rows.map((booking) => { const passengers = getCustomerBookingPassengers(booking); const status = booking.status ?? "pending"; const canCancel = !["cancelled", "canceled", "expired", "refunded"].includes(status.toLowerCase()); const arrival = booking.preferred_arrival_time ?? booking.arrival_time ?? booking.travel_date; return <tr key={getCustomerBookingId(booking)} className="border-t border-slate-100"><td className="p-3 font-bold"><CalendarCheck className="mr-2 inline size-4 text-brand-600" />{getCustomerBookingCode(booking)}</td><td className="p-3 font-semibold">{getCustomerBookingTourName(booking)}</td><td className="p-3 text-slate-600">{arrival ? formatDate(arrival) : getArrivalFromRequest(booking)}</td><td className="p-3">{passengerSummary(passengers)}</td><td className="p-3"><Status value={status} /></td><td className="p-3 font-semibold">{formatVnd(getCustomerBookingAmount(booking))}</td><td className="p-3">{canCancel ? <button type="button" onClick={() => setSelected(booking)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-200 px-3 font-semibold text-rose-600 hover:bg-rose-50"><XCircle size={15} /> Cancel</button> : <span className="text-slate-400">-</span>}</td></tr>; })}
      </tbody></table></div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="bookings" onPageChange={setPage} />
    </div>
    {selected ? <ConfirmDialog title="Cancel booking?" message={`Cancel ${getCustomerBookingCode(selected)}? Paid bookings require staff refund before cancellation.`} confirmLabel={cancelling ? "Cancelling..." : "Cancel Booking"} onCancel={() => setSelected(null)} onConfirm={() => void cancelBooking()} /> : null}
  </>;
}

function passengerSummary(passengers: ReturnType<typeof getCustomerBookingPassengers>) {
  if (!passengers.length) return "-";
  return (["adult", "child", "infant"] as const).map((category) => ({ category, count: passengers.filter((passenger) => passenger.age_category === category).length })).filter((item) => item.count > 0).map((item) => `${item.count} ${item.category}`).join(", ");
}

function getArrivalFromRequest(booking: CustomerBooking) {
  const request = getCustomerBookingPassengers(booking).map((passenger) => passenger.special_request ?? "").find((value) => value.includes("Preferred arrival time:"));
  const match = request?.match(/Preferred arrival time:\s*([^|]+)/i)?.[1]?.trim();
  return formatDate(match);
}

function Status({ value }: { value: string }) { const normalized = value.toLowerCase(); const style = ["confirmed", "paid", "completed"].includes(normalized) ? "bg-emerald-50 text-emerald-700" : ["cancelled", "canceled", "expired", "refunded"].includes(normalized) ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>; }
function formatVnd(value: number) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0); }
function formatDate(value?: string) { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date); }
function readBookingMetadata() { try { return JSON.parse(localStorage.getItem("travel360_booking_metadata") ?? "{}") as Record<string, { booked_at: string; arrival_time: string; amount: number; passengers: Array<"adult" | "child" | "infant"> }>; } catch { return {}; } }
function getApiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; if (error.response?.status === 401) return "Please sign in to view your bookings."; return data?.message ?? data?.error ?? fallback; }
