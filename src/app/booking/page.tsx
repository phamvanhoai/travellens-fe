"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Loader2, Minus, Plus, Tag, Trash2, UserRound, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { bookingService, type BookingPassengerPayload } from "@/services/booking.service";
import { authService } from "@/services/auth.service";
import { couponService, type CouponValidationResult } from "@/services/coupon.service";
import { getPublicTourId, getPublicTourName, tourService, type PublicTour } from "@/services/tour.service";

type PassengerDraft = Omit<BookingPassengerPayload, "price">;
type BookingMetadata = Record<string, { booked_at: string; arrival_time: string; amount: number; passengers: PassengerDraft["age_category"][] }>;

const emptyPassenger = (): PassengerDraft => ({
  passenger_name: "",
  age_category: "adult",
  seat_number: "",
  special_request: ""
});

export default function BookingPage() {
  const router = useRouter();
  const showToast = useToast();
  const [tours, setTours] = useState<PublicTour[]>([]);
  const [tourId, setTourId] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [travelDate, setTravelDate] = useState("");
  const [passengers, setPassengers] = useState<PassengerDraft[]>([emptyPassenger()]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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
        } catch {
          // Keep fields empty for manual input.
        }
      }
    }

    void loadCustomer();
  }, []);

  const selectedTour = tours.find((tour) => String(getPublicTourId(tour)) === tourId);
  const unitPrice = Number(selectedTour?.price ?? 0);
  const availableSlots = getAvailableSlots(selectedTour);
  const subtotal = useMemo(
    () => passengers.reduce((sum, passenger) => sum + passengerPrice(unitPrice, passenger.age_category), 0),
    [passengers, unitPrice]
  );
  const discountAmount = getCouponDiscountAmount(appliedCoupon, subtotal);
  const finalTotal = getCouponFinalAmount(appliedCoupon, subtotal);

  useEffect(() => {
    if (!appliedCoupon) return;
    const couponAmount = Number(appliedCoupon.booking_amount ?? appliedCoupon.bookingAmount ?? 0);
    if (couponAmount && couponAmount !== subtotal) {
      setAppliedCoupon(null);
      setFieldErrors((current) => ({ ...current, coupon: "Booking amount changed. Please apply the coupon again." }));
    }
  }, [appliedCoupon, subtotal]);

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

  async function applyCoupon() {
    const code = couponCode.trim();
    setAppliedCoupon(null);
    setFieldErrors((current) => ({ ...current, coupon: "" }));

    if (!code) {
      setFieldErrors((current) => ({ ...current, coupon: "Enter a coupon code before applying." }));
      return;
    }

    if (subtotal <= 0) {
      setFieldErrors((current) => ({ ...current, coupon: "Select passengers before applying a coupon." }));
      return;
    }

    setValidatingCoupon(true);
    try {
      const result = await couponService.validate({ code, booking_amount: subtotal });
      const normalized = {
        ...result,
        code: result.code ?? result.coupon?.code ?? code,
        booking_amount: result.booking_amount ?? result.bookingAmount ?? subtotal
      };
      setAppliedCoupon(normalized);
      showToast({ variant: "success", title: "Coupon applied", description: normalized.message || code });
    } catch (err) {
      const message = getApiError(err, "Coupon cannot be applied.");
      setFieldErrors((current) => ({ ...current, coupon: message }));
      showToast({ variant: "error", title: "Coupon invalid", description: message });
    } finally {
      setValidatingCoupon(false);
    }
  }

  function removeCoupon() {
    setCouponCode("");
    setAppliedCoupon(null);
    setFieldErrors((current) => ({ ...current, coupon: "" }));
  }

  async function submitBooking(event: React.FormEvent) {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!tourId) errors.tour_id = "Tour is required.";
    if (!travelDate) errors.travel_date = "Travel date is required.";
    if (passengers.length === 0) errors.passengers = "Add at least one passenger.";
    if (!customerName.trim()) errors.customer_name = "Customer name is required.";
    if (!phone.trim()) errors.phone = "Phone number is required.";
    if (couponCode.trim() && !appliedCoupon) errors.coupon = "Please apply the coupon before submitting.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError("");
    try {
      const booking = await bookingService.create({
        tour_id: Number(tourId),
        travel_date: travelDate,
        coupon_code: appliedCoupon ? couponCode.trim() : undefined,
        passengers: passengers.map((passenger, index) => ({
          passenger_name: customerName.trim(),
          age_category: passenger.age_category,
          seat_number: index === 0 ? seatNumber.trim() || undefined : undefined,
          special_request: index === 0
            ? [
                `Travel date: ${travelDate}`,
                selectedTour?.schedule ? `Tour schedule: ${selectedTour.schedule}` : "",
                `Phone: ${phone.trim()}`,
                specialRequest.trim()
              ].filter(Boolean).join(" | ")
            : undefined,
          price: passengerPrice(unitPrice, passenger.age_category)
        }))
      });
      const bookingId = booking.booking_id ?? booking.id;
      if (bookingId && typeof window !== "undefined") {
        const metadata = readBookingMetadata();
        metadata[String(bookingId)] = {
          booked_at: new Date().toISOString(),
          arrival_time: travelDate,
          amount: finalTotal,
          passengers: passengers.map((passenger) => passenger.age_category)
        };
        localStorage.setItem("travel360_booking_metadata", JSON.stringify(metadata));
      }

      showToast({ variant: "success", title: "Booking created", description: "Your booking was created successfully." });
      if (bookingId) {
        router.push(`/payment/checkout?bookingId=${String(bookingId)}`);
        return;
      }
      router.push("/dashboard/bookings");
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

  return (
    <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <form noValidate onSubmit={submitBooking} className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="text-3xl font-bold">Create Booking</h1>
          <p className="mt-2 text-slate-500">Choose a tour and enter the passenger information.</p>
          {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
            <label className="block text-sm font-semibold">
              Tour
              <select
                value={tourId}
                onChange={(event) => {
                  setTourId(event.target.value);
                  setPassengers([emptyPassenger()]);
                  setAppliedCoupon(null);
                  setFieldErrors((current) => ({ ...current, tour_id: "", passengers: "", coupon: "" }));
                }}
                disabled={loading}
                className={`mt-2 h-12 w-full rounded-lg border px-4 outline-none ${fieldErrors.tour_id ? "border-rose-500" : "border-slate-200 focus:border-brand-600"}`}
              >
                <option value="">Select a tour</option>
                {tours.map((tour) => (
                  <option key={getPublicTourId(tour)} value={getPublicTourId(tour)}>
                    {getPublicTourName(tour)} - {formatVnd(Number(tour.price ?? 0))}
                  </option>
                ))}
              </select>
              {fieldErrors.tour_id ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.tour_id}</span> : null}
              {availableSlots !== null ? <span className="mt-2 block text-xs font-semibold text-brand-600">Available slots: {availableSlots}</span> : null}
            </label>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Travel Date
                <input
                  type="date"
                  value={travelDate}
                  min={getVietnamDateInputValue()}
                  onChange={(event) => {
                    setTravelDate(event.target.value);
                    setFieldErrors((current) => ({ ...current, travel_date: "" }));
                  }}
                  className={`mt-2 h-12 w-full rounded-lg border px-4 outline-none ${fieldErrors.travel_date ? "border-rose-500" : "border-slate-200 focus:border-brand-600"}`}
                />
                {fieldErrors.travel_date ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.travel_date}</span> : null}
                {selectedTour?.schedule ? <span className="mt-2 block text-xs font-semibold text-slate-500">Time: {selectedTour.schedule}</span> : null}
              </label>

              <div className="block text-sm font-semibold">
                Coupon Code <span className="font-normal text-slate-400">(optional)</span>
                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <input
                    value={couponCode}
                    onChange={(event) => {
                      setCouponCode(event.target.value.toUpperCase());
                      setAppliedCoupon(null);
                      setFieldErrors((current) => ({ ...current, coupon: "" }));
                    }}
                    className={`h-12 w-full rounded-lg border px-4 outline-none ${fieldErrors.coupon ? "border-rose-500" : appliedCoupon ? "border-emerald-500" : "border-slate-200 focus:border-brand-600"}`}
                    placeholder="SUMMER20"
                  />
                  {appliedCoupon ? (
                    <Button type="button" variant="outline" className="h-12 px-4 text-rose-600 hover:border-rose-300 hover:text-rose-700" onClick={removeCoupon}>
                      <Trash2 size={16} />
                      Remove
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" className="h-12 px-4" onClick={() => void applyCoupon()} disabled={validatingCoupon || !couponCode.trim()}>
                      {validatingCoupon ? <Loader2 className="size-4 animate-spin" /> : <Tag size={16} />}
                      Apply
                    </Button>
                  )}
                </div>
                {appliedCoupon ? <span className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="size-4" /> Coupon applied. Discount {formatVnd(discountAmount)}.</span> : null}
                {fieldErrors.coupon ? <span className="mt-2 flex items-center gap-1 text-xs font-semibold text-rose-600"><XCircle className="size-4" /> {fieldErrors.coupon}</span> : null}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold">Passenger Quantity</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {(["adult", "child", "infant"] as const).map((category) => {
                const count = passengers.filter((passenger) => passenger.age_category === category).length;
                const atCapacity = availableSlots !== null && passengers.length >= availableSlots;
                return (
                  <div key={category} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                    <div>
                      <p className="font-bold capitalize">{category}</p>
                      <p className="text-xs text-slate-500">{formatVnd(passengerPrice(unitPrice, category))} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => changePassengerCount(category, -1)} disabled={count === 0} className="grid size-8 place-items-center rounded-full border border-slate-200 bg-white disabled:opacity-40" aria-label={`Remove ${category}`}>
                        <Minus size={14} />
                      </button>
                      <span className="w-5 text-center font-bold">{count}</span>
                      <button type="button" onClick={() => changePassengerCount(category, 1)} disabled={atCapacity} className="grid size-8 place-items-center rounded-full border border-slate-200 bg-white disabled:opacity-40" aria-label={`Add ${category}`}>
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {fieldErrors.passengers ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.passengers}</p> : null}

            <h2 className="mt-7 text-xl font-bold">Customer Information</h2>
            <p className="mt-1 text-sm text-slate-500">Enter the information of the customer representing this booking.</p>
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <p className="mb-4 font-bold"><UserRound className="mr-2 inline size-4 text-brand-600" />Booking Contact</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Full Name
                  <input value={customerName} onChange={(event) => { setCustomerName(event.target.value); setFieldErrors((current) => ({ ...current, customer_name: "" })); }} className={`mt-2 h-11 w-full rounded-lg border bg-white px-3 outline-none ${fieldErrors.customer_name ? "border-rose-500" : "border-slate-200"}`} />
                  {fieldErrors.customer_name ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.customer_name}</span> : null}
                </label>
                <label className="text-sm font-semibold">
                  Phone Number
                  <input type="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setFieldErrors((current) => ({ ...current, phone: "" })); }} className={`mt-2 h-11 w-full rounded-lg border bg-white px-3 outline-none ${fieldErrors.phone ? "border-rose-500" : "border-slate-200"}`} placeholder="0901234567" />
                  {fieldErrors.phone ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.phone}</span> : null}
                </label>
                <label className="text-sm font-semibold">
                  Preferred Seat <span className="font-normal text-slate-400">(optional)</span>
                  <textarea value={seatNumber} onChange={(event) => setSeatNumber(event.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2" />
                </label>
                <label className="text-sm font-semibold">
                  Special Request <span className="font-normal text-slate-400">(optional)</span>
                  <textarea value={specialRequest} onChange={(event) => setSpecialRequest(event.target.value)} className="mt-2 min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2" />
                </label>
              </div>
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Booking Summary</h2>
          {loading ? (
            <p className="mt-5 text-sm text-slate-500"><Loader2 className="mr-2 inline size-4 animate-spin" />Loading tours...</p>
          ) : (
            <>
              <p className="mt-4 font-semibold">{selectedTour ? getPublicTourName(selectedTour) : "No tour selected"}</p>
              {selectedTour?.schedule ? <p className="mt-2 text-sm text-slate-500">Tour schedule: {selectedTour.schedule}</p> : null}
              {travelDate ? <p className="mt-3 flex gap-2 rounded-lg bg-brand-50 p-3 text-sm font-semibold text-brand-700"><CalendarClock className="size-4 shrink-0" /> {formatDate(travelDate)}</p> : null}
              <div className="mt-5 space-y-3 text-sm">
                {(["adult", "child", "infant"] as const).map((category) => {
                  const count = passengers.filter((passenger) => passenger.age_category === category).length;
                  return count ? <p key={category} className="flex justify-between capitalize"><span>{category} x {count}</span><span>{formatVnd(passengerPrice(unitPrice, category) * count)}</span></p> : null;
                })}
                <p className="flex justify-between border-t border-slate-200 pt-3"><span>Subtotal</span><span>{formatVnd(subtotal)}</span></p>
                {appliedCoupon ? <p className="flex justify-between text-emerald-700"><span>Coupon {appliedCoupon.code ?? couponCode}</span><span>-{formatVnd(discountAmount)}</span></p> : null}
                <p className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{formatVnd(finalTotal)}</span></p>
              </div>
            </>
          )}
          <Button type="submit" className="mt-6 w-full" disabled={loading || saving || validatingCoupon}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit Booking
          </Button>
        </aside>
      </form>
    </section>
  );
}

function passengerPrice(basePrice: number, category: PassengerDraft["age_category"]) {
  return category === "child" ? Math.round(basePrice * 0.65) : category === "infant" ? 0 : basePrice;
}

function formatVnd(value: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value || 0);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

function getVietnamDateInputValue() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric"
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function getAvailableSlots(tour?: PublicTour) {
  if (!tour) return null;
  const direct = tour.available_slots ?? tour.remaining_slots ?? tour.available_capacity;
  if (direct !== undefined && direct !== null && Number.isFinite(Number(direct))) return Math.max(0, Number(direct));
  if (typeof tour.capacity === "number") return Math.max(0, tour.capacity);
  const numbers = String(tour.capacity ?? "").match(/\d+/g)?.map(Number) ?? [];
  return numbers.length ? Math.max(...numbers) : null;
}

function getCouponDiscountAmount(coupon: CouponValidationResult | null, subtotal: number) {
  if (!coupon) return 0;
  const direct = Number(coupon.discount_amount ?? coupon.discountAmount);
  if (Number.isFinite(direct) && direct > 0) return Math.min(direct, subtotal);
  const finalAmount = Number(coupon.final_amount ?? coupon.finalAmount);
  if (Number.isFinite(finalAmount)) return Math.max(0, subtotal - finalAmount);
  return 0;
}

function getCouponFinalAmount(coupon: CouponValidationResult | null, subtotal: number) {
  if (!coupon) return subtotal;
  const direct = Number(coupon.final_amount ?? coupon.finalAmount);
  if (Number.isFinite(direct) && direct >= 0) return direct;
  return Math.max(0, subtotal - getCouponDiscountAmount(coupon, subtotal));
}

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  if (error.response?.status === 401) return "Please sign in with a customer account to book a tour.";
  if (error.response?.status === 403) return "Only customer accounts can create bookings.";
  return data?.message ?? data?.error ?? fallback;
}

function readBookingMetadata(): BookingMetadata {
  try {
    return JSON.parse(localStorage.getItem("travel360_booking_metadata") ?? "{}");
  } catch {
    return {};
  }
}
