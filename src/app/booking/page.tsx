"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Loader2, Minus, Plus, UserRound } from "lucide-react";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { bookingService, type BookingPassengerPayload } from "@/services/booking.service";
import { authService } from "@/services/auth.service";
import { getPublicTourId, getPublicTourName, tourService, type PublicTour } from "@/services/tour.service";

type PassengerDraft = Omit<BookingPassengerPayload, "price">;
const emptyPassenger = (): PassengerDraft => ({ passenger_name: "", age_category: "adult", seat_number: "", special_request: "" });

export default function BookingPage() {
  const [tours, setTours] = useState<PublicTour[]>([]);
  const [tourId, setTourId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [passengers, setPassengers] = useState<PassengerDraft[]>([emptyPassenger()]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [createdBooking, setCreatedBooking] = useState<Record<string, unknown> | null>(null);
  const showToast = useToast();

  useEffect(() => {
    async function loadTours() {
      try {
        const result = await tourService.list();
        setTours(result);
        const requestedTourId = new URLSearchParams(window.location.search).get("tourId");
        const initialTour = result.find((tour) => String(getPublicTourId(tour)) === requestedTourId) ?? result[0];
        if (initialTour) setTourId(String(getPublicTourId(initialTour)));
      } catch (err) {
        setError(getApiError(err, "Cannot load available tours."));
      } finally {
        setLoading(false);
      }
    }
    void loadTours();
  }, []);

  useEffect(() => {
    async function loadCustomer() {
      try {
        const response = await authService.getProfile();
        const profile = response.data?.data ?? response.data;
        setPhone((current) => current || profile?.phone || "");
      } catch {
        try {
          const user = JSON.parse(localStorage.getItem("user") ?? "{}");
          setPhone((current) => current || user.phone || "");
        } catch { /* Keep fields empty for manual input. */ }
      }
    }
    void loadCustomer();
  }, []);

  const selectedTour = tours.find((tour) => String(getPublicTourId(tour)) === tourId);
  const unitPrice = Number(selectedTour?.price ?? 0);
  const availableSlots = getAvailableSlots(selectedTour);
  const total = useMemo(() => passengers.reduce((sum, passenger) => sum + passengerPrice(unitPrice, passenger.age_category), 0), [passengers, unitPrice]);

  function changePassengerCount(category: PassengerDraft["age_category"], delta: number) {
    if (delta > 0 && availableSlots !== null && passengers.length >= availableSlots) {
      setFieldErrors((current) => ({ ...current, passengers: `Only ${availableSlots} slot${availableSlots === 1 ? " is" : "s are"} available for this tour.` }));
      return;
    }
    setPassengers((current) => {
      if (delta > 0) return [...current, { ...emptyPassenger(), age_category: category }];
      const removeIndex = current.findLastIndex((passenger) => passenger.age_category === category);
      return removeIndex < 0 ? current : current.filter((_, index) => index !== removeIndex);
    });
    setFieldErrors((current) => ({ ...current, passengers: "" }));
  }

  async function submitBooking(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!tourId) errors.tour_id = "Tour is required.";
    if (!reservationTime) errors.reservation_time = "Preferred arrival time is required.";
    if (passengers.length === 0) errors.passengers = "Add at least one passenger.";
    if (!customerName.trim()) errors.customer_name = "Customer name is required.";
    if (!phone.trim()) errors.phone = "Phone number is required.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError("");
    try {
      const booking = await bookingService.create({
        tour_id: Number(tourId),
        coupon_code: couponCode.trim() || undefined,
        passengers: passengers.map((passenger, index) => ({
          passenger_name: customerName.trim(),
          age_category: passenger.age_category,
          seat_number: index === 0 ? seatNumber.trim() || undefined : undefined,
          special_request: index === 0 ? [`Preferred arrival time: ${reservationTime}`, `Phone: ${phone.trim()}`, specialRequest.trim()].filter(Boolean).join(" | ") : undefined,
          price: passengerPrice(unitPrice, passenger.age_category)
        }))
      });
      const bookingId = booking.booking_id ?? booking.id;
      if (bookingId && typeof window !== "undefined") {
        const metadata = readBookingMetadata();
        metadata[String(bookingId)] = {
          booked_at: new Date().toISOString(),
          arrival_time: reservationTime,
          amount: total,
          passengers: passengers.map((passenger) => passenger.age_category)
        };
        localStorage.setItem("travel360_booking_metadata", JSON.stringify(metadata));
      }
      setCreatedBooking(booking);
      showToast({ variant: "success", title: "Booking created", description: "Your booking was created successfully." });
    } catch (err) {
      const message = getApiError(err, "Cannot create this booking.");
      setError(message);
      if (message.toLowerCase().includes("slot")) {
        setFieldErrors((current) => ({ ...current, passengers: `${message}. Please reduce the passenger quantity.` }));
      }
      showToast({ variant: "error", title: "Booking failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  if (createdBooking) {
    const bookingId = createdBooking.booking_id ?? createdBooking.id;
    return <section className="mx-auto max-w-2xl px-4 py-16"><div className="rounded-lg border border-emerald-200 bg-white p-8 text-center shadow-sm"><h1 className="text-3xl font-bold">Booking Created</h1><p className="mt-3 text-slate-600">Booking {bookingId ? `#${String(bookingId)}` : ""} has been submitted successfully.</p><div className="mt-7 flex justify-center gap-3"><Button href="/dashboard/bookings" variant="outline">View My Bookings</Button>{bookingId ? <Button href={`/payment/checkout?bookingId=${String(bookingId)}`}>Continue to Payment</Button> : null}</div></div></section>;
  }

  return <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8"><form noValidate onSubmit={submitBooking} className="grid gap-8 lg:grid-cols-[1fr_320px]">
    <div><h1 className="text-3xl font-bold">Create Booking</h1><p className="mt-2 text-slate-500">Choose a tour and enter the passenger information.</p>{error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6"><label className="block text-sm font-semibold">Tour<select value={tourId} onChange={(event) => { setTourId(event.target.value); setPassengers([emptyPassenger()]); setFieldErrors((current) => ({ ...current, tour_id: "", passengers: "" })); }} disabled={loading} className={`mt-2 h-12 w-full rounded-lg border px-4 outline-none ${fieldErrors.tour_id ? "border-rose-500" : "border-slate-200 focus:border-brand-600"}`}><option value="">Select a tour</option>{tours.map((tour) => <option key={getPublicTourId(tour)} value={getPublicTourId(tour)}>{getPublicTourName(tour)} — {formatVnd(Number(tour.price ?? 0))}</option>)}</select>{fieldErrors.tour_id ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.tour_id}</span> : null}{availableSlots !== null ? <span className="mt-2 block text-xs font-semibold text-brand-600">Available slots: {availableSlots}</span> : null}</label>
        <div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Preferred Arrival Time<input type="datetime-local" value={reservationTime} min={new Date().toISOString().slice(0, 16)} onChange={(event) => { setReservationTime(event.target.value); setFieldErrors((current) => ({ ...current, reservation_time: "" })); }} className={`mt-2 h-12 w-full rounded-lg border px-4 outline-none ${fieldErrors.reservation_time ? "border-rose-500" : "border-slate-200 focus:border-brand-600"}`} />{fieldErrors.reservation_time ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.reservation_time}</span> : null}</label><label className="block text-sm font-semibold">Coupon Code <span className="font-normal text-slate-400">(optional)</span><input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-brand-600" placeholder="SUMMER20" /></label></div>
      </div>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6"><h2 className="text-xl font-bold">Passenger Quantity</h2><div className="mt-5 grid gap-3 sm:grid-cols-3">{(["adult", "child", "infant"] as const).map((category) => { const count = passengers.filter((passenger) => passenger.age_category === category).length; const atCapacity = availableSlots !== null && passengers.length >= availableSlots; return <div key={category} className="flex items-center justify-between rounded-lg bg-slate-50 p-4"><div><p className="font-bold capitalize">{category}</p><p className="text-xs text-slate-500">{formatVnd(passengerPrice(unitPrice, category))} each</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => changePassengerCount(category, -1)} disabled={count === 0} className="grid size-8 place-items-center rounded-full border border-slate-200 bg-white disabled:opacity-40" aria-label={`Remove ${category}`}><Minus size={14} /></button><span className="w-5 text-center font-bold">{count}</span><button type="button" onClick={() => changePassengerCount(category, 1)} disabled={atCapacity} className="grid size-8 place-items-center rounded-full border border-slate-200 bg-white disabled:opacity-40" aria-label={`Add ${category}`}><Plus size={14} /></button></div></div>; })}</div>{fieldErrors.passengers ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.passengers}</p> : null}
        <h2 className="mt-7 text-xl font-bold">Customer Information</h2><p className="mt-1 text-sm text-slate-500">Enter the information of the customer representing this booking.</p><div className="mt-5 rounded-lg bg-slate-50 p-4"><p className="mb-4 font-bold"><UserRound className="mr-2 inline size-4 text-brand-600" />Booking Contact</p><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Full Name<input value={customerName} onChange={(event) => { setCustomerName(event.target.value); setFieldErrors((current) => ({ ...current, customer_name: "" })); }} className={`mt-2 h-11 w-full rounded-lg border bg-white px-3 outline-none ${fieldErrors.customer_name ? "border-rose-500" : "border-slate-200"}`} />{fieldErrors.customer_name ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.customer_name}</span> : null}</label><label className="text-sm font-semibold">Phone Number<input type="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setFieldErrors((current) => ({ ...current, phone: "" })); }} className={`mt-2 h-11 w-full rounded-lg border bg-white px-3 outline-none ${fieldErrors.phone ? "border-rose-500" : "border-slate-200"}`} placeholder="0901234567" />{fieldErrors.phone ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.phone}</span> : null}</label><label className="text-sm font-semibold">Preferred Seat <span className="font-normal text-slate-400">(optional)</span><textarea value={seatNumber} onChange={(event) => setSeatNumber(event.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2" /></label><label className="text-sm font-semibold">Special Request <span className="font-normal text-slate-400">(optional)</span><textarea value={specialRequest} onChange={(event) => setSpecialRequest(event.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2" /></label></div></div></div>
    </div>
    <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Booking Summary</h2>{loading ? <p className="mt-5 text-sm text-slate-500"><Loader2 className="mr-2 inline size-4 animate-spin" />Loading tours...</p> : <><p className="mt-4 font-semibold">{selectedTour ? getPublicTourName(selectedTour) : "No tour selected"}</p>{selectedTour?.schedule ? <p className="mt-2 text-sm text-slate-500">Tour schedule: {selectedTour.schedule}</p> : null}{reservationTime ? <p className="mt-3 flex gap-2 rounded-lg bg-brand-50 p-3 text-sm font-semibold text-brand-700"><CalendarClock className="size-4 shrink-0" /> {formatDateTime(reservationTime)}</p> : null}<div className="mt-5 space-y-3 text-sm">{(["adult", "child", "infant"] as const).map((category) => { const count = passengers.filter((passenger) => passenger.age_category === category).length; return count ? <p key={category} className="flex justify-between capitalize"><span>{category} x {count}</span><span>{formatVnd(passengerPrice(unitPrice, category) * count)}</span></p> : null; })}<p className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{formatVnd(total)}</span></p></div></>}<Button type="submit" className="mt-6 w-full" disabled={loading || saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null} Submit Booking</Button></aside>
  </form></section>;
}

function passengerPrice(basePrice: number, category: PassengerDraft["age_category"]) { return category === "child" ? Math.round(basePrice * 0.65) : category === "infant" ? 0 : basePrice; }
function formatVnd(value: number) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
function getAvailableSlots(tour?: PublicTour) {
  if (!tour) return null;
  const direct = tour.available_slots ?? tour.remaining_slots ?? tour.available_capacity;
  if (direct !== undefined && direct !== null && Number.isFinite(Number(direct))) return Math.max(0, Number(direct));
  if (typeof tour.capacity === "number") return Math.max(0, tour.capacity);
  const numbers = String(tour.capacity ?? "").match(/\d+/g)?.map(Number) ?? [];
  return numbers.length ? Math.max(...numbers) : null;
}
function getApiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; if (error.response?.status === 401) return "Please sign in with a customer account to book a tour."; if (error.response?.status === 403) return "Only customer accounts can create bookings."; return data?.message ?? data?.error ?? fallback; }

type BookingMetadata = Record<string, { booked_at: string; arrival_time: string; amount: number; passengers: PassengerDraft["age_category"][] }>;
function readBookingMetadata(): BookingMetadata { try { return JSON.parse(localStorage.getItem("travel360_booking_metadata") ?? "{}"); } catch { return {}; } }
