"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2, UserRound } from "lucide-react";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { bookingService, type BookingPassengerPayload } from "@/services/booking.service";
import { getPublicTourId, getPublicTourName, tourService, type PublicTour } from "@/services/tour.service";

type PassengerDraft = Omit<BookingPassengerPayload, "price">;
const emptyPassenger = (): PassengerDraft => ({ passenger_name: "", age_category: "adult", seat_number: "", special_request: "" });

export default function BookingPage() {
  const [tours, setTours] = useState<PublicTour[]>([]);
  const [tourId, setTourId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [passengers, setPassengers] = useState<PassengerDraft[]>([emptyPassenger()]);
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

  const selectedTour = tours.find((tour) => String(getPublicTourId(tour)) === tourId);
  const unitPrice = Number(selectedTour?.price ?? 0);
  const total = useMemo(() => passengers.reduce((sum, passenger) => sum + passengerPrice(unitPrice, passenger.age_category), 0), [passengers, unitPrice]);

  function updatePassenger(index: number, patch: Partial<PassengerDraft>) {
    setPassengers((current) => current.map((passenger, passengerIndex) => passengerIndex === index ? { ...passenger, ...patch } : passenger));
    setFieldErrors((current) => ({ ...current, [`passenger_${index}`]: "" }));
  }

  async function submitBooking(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!tourId) errors.tour_id = "Tour is required.";
    passengers.forEach((passenger, index) => { if (!passenger.passenger_name.trim()) errors[`passenger_${index}`] = "Passenger name is required."; });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError("");
    try {
      const booking = await bookingService.create({
        tour_id: Number(tourId),
        coupon_code: couponCode.trim() || undefined,
        passengers: passengers.map((passenger) => ({
          ...passenger,
          passenger_name: passenger.passenger_name.trim(),
          seat_number: passenger.seat_number?.trim() || undefined,
          special_request: passenger.special_request?.trim() || undefined,
          price: passengerPrice(unitPrice, passenger.age_category)
        }))
      });
      setCreatedBooking(booking);
      showToast({ variant: "success", title: "Booking created", description: "Your booking was created successfully." });
    } catch (err) {
      const message = getApiError(err, "Cannot create this booking.");
      setError(message);
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
      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6"><label className="block text-sm font-semibold">Tour<select value={tourId} onChange={(event) => { setTourId(event.target.value); setFieldErrors((current) => ({ ...current, tour_id: "" })); }} disabled={loading} className={`mt-2 h-12 w-full rounded-lg border px-4 outline-none ${fieldErrors.tour_id ? "border-rose-500" : "border-slate-200 focus:border-brand-600"}`}><option value="">Select a tour</option>{tours.map((tour) => <option key={getPublicTourId(tour)} value={getPublicTourId(tour)}>{getPublicTourName(tour)} — {formatVnd(Number(tour.price ?? 0))}</option>)}</select>{fieldErrors.tour_id ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.tour_id}</span> : null}</label>
        <label className="mt-5 block text-sm font-semibold">Coupon Code <span className="font-normal text-slate-400">(optional)</span><input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-brand-600" placeholder="SUMMER20" /></label>
      </div>
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Passengers</h2><Button type="button" variant="outline" className="h-9 px-3" onClick={() => setPassengers((current) => [...current, emptyPassenger()])}><Plus size={15} /> Add Passenger</Button></div><div className="mt-5 space-y-5">{passengers.map((passenger, index) => <div key={index} className="rounded-lg bg-slate-50 p-4"><div className="mb-4 flex items-center justify-between"><p className="font-bold"><UserRound className="mr-2 inline size-4 text-brand-600" />Passenger {index + 1}</p>{passengers.length > 1 ? <button type="button" onClick={() => setPassengers((current) => current.filter((_, passengerIndex) => passengerIndex !== index))} className="grid size-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label={`Remove passenger ${index + 1}`}><Trash2 size={16} /></button> : null}</div><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold">Full Name<input value={passenger.passenger_name} onChange={(event) => updatePassenger(index, { passenger_name: event.target.value })} className={`mt-2 h-11 w-full rounded-lg border bg-white px-3 outline-none ${fieldErrors[`passenger_${index}`] ? "border-rose-500" : "border-slate-200"}`} /></label><label className="text-sm font-semibold">Age Category<select value={passenger.age_category} onChange={(event) => updatePassenger(index, { age_category: event.target.value as PassengerDraft["age_category"] })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3"><option value="adult">Adult</option><option value="child">Child</option><option value="infant">Infant</option></select></label><label className="text-sm font-semibold">Seat <span className="font-normal text-slate-400">(optional)</span><input value={passenger.seat_number} onChange={(event) => updatePassenger(index, { seat_number: event.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3" /></label><label className="text-sm font-semibold">Special Request <span className="font-normal text-slate-400">(optional)</span><input value={passenger.special_request} onChange={(event) => updatePassenger(index, { special_request: event.target.value })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3" /></label></div>{fieldErrors[`passenger_${index}`] ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors[`passenger_${index}`]}</p> : null}</div>)}</div></div>
    </div>
    <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-xl font-bold">Booking Summary</h2>{loading ? <p className="mt-5 text-sm text-slate-500"><Loader2 className="mr-2 inline size-4 animate-spin" />Loading tours...</p> : <><p className="mt-4 font-semibold">{selectedTour ? getPublicTourName(selectedTour) : "No tour selected"}</p><div className="mt-5 space-y-3 text-sm">{passengers.map((passenger, index) => <p key={index} className="flex justify-between"><span>{passenger.passenger_name || `Passenger ${index + 1}`} ({passenger.age_category})</span><span>{formatVnd(passengerPrice(unitPrice, passenger.age_category))}</span></p>)}<p className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{formatVnd(total)}</span></p></div></>}<Button type="submit" className="mt-6 w-full" disabled={loading || saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null} Submit Booking</Button></aside>
  </form></section>;
}

function passengerPrice(basePrice: number, category: PassengerDraft["age_category"]) { return category === "child" ? Math.round(basePrice * 0.65) : category === "infant" ? 0 : basePrice; }
function formatVnd(value: number) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0); }
function getApiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; if (error.response?.status === 401) return "Please sign in with a customer account to book a tour."; if (error.response?.status === 403) return "Only customer accounts can create bookings."; return data?.message ?? data?.error ?? fallback; }
