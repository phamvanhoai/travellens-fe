"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, Loader2, Minus, Plus, Tag, Trash2, UserRound, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { resolveBackendAssetUrl } from "@/lib/avatar";
import { bookingService, type BookingPassengerPayload } from "@/services/booking.service";
import { authService } from "@/services/auth.service";
import { couponService, type CouponValidationResult } from "@/services/coupon.service";
import { getPublicTourId, getPublicTourName, tourService, type PublicTour } from "@/services/tour.service";

type PassengerDraft = BookingPassengerPayload;
type BookingMetadata = Record<string, { booked_at: string; arrival_time: string; amount: number; passengers: PassengerDraft["age_category"][] }>;
const BOOKING_DEADLINE_HOURS = 4;

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
  const [specialRequest, setSpecialRequest] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadTours() {
      try {
        const requestedTourId = new URLSearchParams(window.location.search).get("tourId");
        if (!requestedTourId) {
          setError("Please choose a tour from the tour detail page before booking.");
          return;
        }
        const tour = await tourService.detail(requestedTourId);
        if (!tour || !getPublicTourId(tour)) {
          setError("The selected tour could not be found.");
          return;
        }
        setTours([tour]);
        setTourId(String(getPublicTourId(tour)));
      } catch (err) {
        setError(getApiError(err, "Cannot load the selected tour."));
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
  const minimumTravelDate = getMinimumTravelDate(selectedTour);
  const unitPrice = Number(selectedTour?.price ?? 0);
  const childPrice = Number(selectedTour?.child_price ?? unitPrice * 0.65);
  const infantPrice = Number(selectedTour?.infant_price ?? 0);
  const availableSlots = getAvailableSlots(selectedTour);
  const minimumBooking = Math.max(1, Number(selectedTour?.minimum_booking ?? 1));
  const maximumBooking = getMaximumBooking(selectedTour, availableSlots);
  const subtotal = useMemo(
    () => passengers.reduce((sum, passenger) => sum + passengerPrice(unitPrice, childPrice, infantPrice, passenger.age_category), 0),
    [passengers, unitPrice, childPrice, infantPrice]
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
    if (delta > 0 && maximumBooking !== null && passengers.length >= maximumBooking) {
      setFieldErrors((current) => ({ ...current, passengers: `You can book at most ${maximumBooking} passenger${maximumBooking === 1 ? "" : "s"} for this tour.` }));
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
    else {
      const departureError = getDepartureValidationMessage(travelDate, selectedTour);
      if (departureError) errors.travel_date = departureError;
    }
    if (passengers.length < minimumBooking) errors.passengers = `This tour requires at least ${minimumBooking} passenger${minimumBooking === 1 ? "" : "s"} per booking.`;
    else if (maximumBooking !== null && passengers.length > maximumBooking) errors.passengers = `This tour allows at most ${maximumBooking} passengers per booking.`;
    if (String(selectedTour?.currency ?? "VND").toUpperCase() !== "VND") errors.tour_id = "Online booking currently supports VND tours only.";
    if (!customerName.trim()) errors.customer_name = "Contact name is required.";
    else if (!isValidPersonName(customerName.trim())) errors.customer_name = "Enter at least 2 words using letters and spaces only.";
    if (!phone.trim()) errors.phone = "Phone number is required.";
    else if (!isValidVietnamMobilePhone(phone.trim())) errors.phone = "Phone number must be a valid Vietnamese mobile number.";
    if (couponCode.trim() && !appliedCoupon) errors.coupon = "Please apply the coupon before submitting.";
    if (!acceptedPolicies) errors.policies = "Please confirm the booking and cancellation policies.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setError("");
    try {
      const booking = await bookingService.create({
        tour_id: Number(tourId),
        contact_phone: phone.trim(),
        travel_date: travelDate,
        coupon_code: appliedCoupon ? couponCode.trim() : null,
        passengers: passengers.map((passenger, index) => ({
          passenger_name: customerName.trim(),
          age_category: passenger.age_category,
          special_request: index === 0 ? specialRequest.trim() || undefined : undefined
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
        if (finalTotal <= 0) {
          showToast({ variant: "info", title: "No payment required", description: "This booking total is 0 VND." });
          router.push("/dashboard/bookings");
          return;
        }
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

  if (loading) return <BookingPageSkeleton />;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <form noValidate onSubmit={submitBooking} className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold">Create Booking</h1>
          <p className="mt-2 text-slate-500">Review the selected tour and enter the passenger information.</p>
          {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <div className="block text-sm font-semibold">
              Selected Tour
              <div className={`mt-2 rounded-lg border p-4 ${fieldErrors.tour_id ? "border-rose-500 bg-rose-50" : "border-brand-100 bg-brand-50/50"}`}>
                {selectedTour ? <div className="grid gap-4 sm:grid-cols-[140px_1fr]"><div className="h-28 overflow-hidden rounded-lg bg-slate-100">{selectedTour.thumbnail_url || selectedTour.thumbnail ? <img src={resolveBackendAssetUrl(selectedTour.thumbnail_url ?? selectedTour.thumbnail ?? "")} alt={getPublicTourName(selectedTour)} className="h-full w-full object-cover" /> : null}</div><div><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-base font-bold text-slate-900">{getPublicTourName(selectedTour)}</p><p className="mt-1 text-xs font-normal text-slate-500">{selectedTour.short_description || "Your selected tour is locked for this booking."}</p></div><p className="font-bold text-brand-700">{formatVnd(Number(selectedTour.price ?? 0))}</p></div><div className="mt-3 grid gap-2 text-xs font-normal text-slate-600 sm:grid-cols-2"><p>Tour time: {getTourTimeRange(selectedTour)}</p><p>Duration: {selectedTour.duration_days ?? 1} day(s), {selectedTour.duration_nights ?? 0} night(s)</p><p>Meeting point: {selectedTour.meeting_point || "See tour instructions"}</p><p>Pickup: {selectedTour.pickup_available ? selectedTour.pickup_description || "Available" : "Not included"}</p></div></div></div> : <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-rose-700">No valid tour selected.</p><Button href="/tours" variant="outline" className="h-9">Choose a Tour</Button></div>}
              </div>
              {fieldErrors.tour_id ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.tour_id}</span> : null}
              {availableSlots !== null ? <span className="mt-2 block text-xs font-semibold text-brand-600">Available slots: {availableSlots}</span> : null}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">
                Travel Date
                <input
                  type="date"
                  value={travelDate}
                  min={minimumTravelDate}
                  onChange={(event) => {
                    const value = event.target.value;
                    setTravelDate(value);
                    setFieldErrors((current) => ({
                      ...current,
                      travel_date: getDepartureValidationMessage(value, selectedTour) ?? ""
                    }));
                  }}
                  className={`mt-2 h-12 w-full rounded-lg border px-4 outline-none ${fieldErrors.travel_date ? "border-rose-500" : "border-slate-200 focus:border-brand-600"}`}
                />
                {fieldErrors.travel_date ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.travel_date}</span> : null}
                {selectedTour ? <span className="mt-2 block text-xs font-semibold text-slate-500">Tour time: {getTourTimeRange(selectedTour)}</span> : null}
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

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
            <h2 className="text-xl font-bold">Passenger Quantity</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {(["adult", "child", "infant"] as const).map((category) => {
                const count = passengers.filter((passenger) => passenger.age_category === category).length;
                const atCapacity = maximumBooking !== null && passengers.length >= maximumBooking;
                return (
                  <div key={category} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                    <div>
                      <p className="font-bold capitalize">{category}</p>
                      <p className="text-xs text-slate-500">{formatVnd(passengerPrice(unitPrice, childPrice, infantPrice, category))} each</p>
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
            <p className="mt-2 text-xs text-slate-500">Booking limit: {minimumBooking}{maximumBooking !== null ? `–${maximumBooking}` : "+"} passengers.</p>

            <h2 className="mt-7 text-xl font-bold">Booking Contact</h2>
            <p className="mt-1 text-sm text-slate-500">Only the representative making this booking needs to provide contact information.</p>
            <div className="mt-4 grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2"><label className="text-sm font-semibold"><UserRound className="mr-2 inline size-4 text-brand-600" />Contact Name<input value={customerName} onChange={(event) => { setCustomerName(event.target.value); setFieldErrors((current) => ({ ...current, customer_name: "" })); }} className={`mt-2 h-11 w-full rounded-lg border bg-white px-3 outline-none ${fieldErrors.customer_name ? "border-rose-500" : "border-slate-200"}`} placeholder="Nguyen Van A" />{fieldErrors.customer_name ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.customer_name}</span> : null}</label><label className="text-sm font-semibold">Contact Phone<input type="tel" value={phone} onChange={(event) => { setPhone(event.target.value); setFieldErrors((current) => ({ ...current, phone: "" })); }} className={`mt-2 h-11 w-full rounded-lg border bg-white px-3 outline-none ${fieldErrors.phone ? "border-rose-500" : "border-slate-200"}`} placeholder="0901234567" />{fieldErrors.phone ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.phone}</span> : null}</label><label className="text-sm font-semibold sm:col-span-2">General Request <span className="font-normal text-slate-400">(optional)</span><textarea value={specialRequest} onChange={(event) => setSpecialRequest(event.target.value)} className="mt-2 min-h-20 w-full rounded-lg border border-slate-200 bg-white px-3 py-2" placeholder="Pickup, accessibility, dietary or other requests" /></label></div>

            <div className="mt-6 rounded-lg border border-slate-200 p-4"><h2 className="text-lg font-bold">Booking Policies</h2><div className="mt-3 grid gap-3 text-sm text-slate-600 sm:grid-cols-2"><div><p className="font-semibold text-slate-800">Booking policy</p><p className="mt-1 line-clamp-4 whitespace-pre-line">{plainText(selectedTour?.booking_policy) || "The booking is subject to availability and payment confirmation."}</p></div><div><p className="font-semibold text-slate-800">Cancellation policy</p><p className="mt-1 line-clamp-4 whitespace-pre-line">{plainText(selectedTour?.cancellation_policy) || "Cancellation must follow the tour cancellation terms."}</p></div></div><label className="mt-4 flex items-start gap-3 rounded-lg bg-brand-50 p-3 text-sm font-semibold text-brand-900"><input type="checkbox" checked={acceptedPolicies} onChange={(event) => { setAcceptedPolicies(event.target.checked); setFieldErrors((current) => ({ ...current, policies: "" })); }} className="mt-0.5" />I have reviewed and agree to the booking and cancellation policies.</label>{fieldErrors.policies ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.policies}</p> : null}</div>
          </div>
        </div>

        <aside className="h-fit min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 sm:p-6">
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
                  return count ? <p key={category} className="flex justify-between capitalize"><span>{category} x {count}</span><span>{formatVnd(passengerPrice(unitPrice, childPrice, infantPrice, category) * count)}</span></p> : null;
                })}
                <p className="flex justify-between border-t border-slate-200 pt-3"><span>Subtotal</span><span>{formatVnd(subtotal)}</span></p>
                {appliedCoupon ? <p className="flex justify-between text-emerald-700"><span>Coupon {appliedCoupon.code ?? couponCode}</span><span>-{formatVnd(discountAmount)}</span></p> : null}
                <p className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{formatVnd(finalTotal)}</span></p>
              </div>
              {customerName.trim() ? <div className="mt-5 border-t border-slate-200 pt-4"><p className="text-sm font-bold">Booking contact</p><p className="mt-2 text-xs text-slate-600">{customerName.trim()} · {phone || "No phone entered"}</p></div> : null}
            </>
          )}
          <Button type="submit" className="mt-6 w-full" disabled={loading || saving || validatingCoupon || !selectedTour}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            Submit Booking
          </Button>
        </aside>
      </form>
    </section>
  );
}

function BookingPageSkeleton() {
  return <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-label="Loading booking form" aria-busy="true">
    <div className="grid min-w-0 animate-pulse gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0">
        <div className="h-9 w-56 rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-full max-w-md rounded bg-slate-100" />
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="mt-3 grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-[140px_1fr]">
            <div className="h-28 rounded-lg bg-slate-200" />
            <div><div className="h-5 w-2/3 rounded bg-slate-200" /><div className="mt-3 h-3 w-full rounded bg-slate-200" /><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="h-3 rounded bg-slate-200" /><div className="h-3 rounded bg-slate-200" /><div className="h-3 rounded bg-slate-200" /><div className="h-3 rounded bg-slate-200" /></div></div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><SkeletonField /><SkeletonField /></div>
        </div>
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
          <div className="h-6 w-48 rounded bg-slate-200" />
          <div className="mt-5 grid gap-3 sm:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-20 rounded-lg bg-slate-100" />)}</div>
          <div className="mt-8 h-6 w-44 rounded bg-slate-200" />
          <div className="mt-4 grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-2"><SkeletonField /><SkeletonField /><div className="h-20 rounded-lg bg-slate-200 sm:col-span-2" /></div>
          <div className="mt-6 h-40 rounded-lg bg-slate-100" />
        </div>
      </div>
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="h-6 w-44 rounded bg-slate-200" /><div className="mt-6 h-5 w-3/4 rounded bg-slate-200" /><div className="mt-6 space-y-4">{[1, 2, 3, 4].map((item) => <div key={item} className="flex justify-between gap-4"><div className="h-4 w-24 rounded bg-slate-100" /><div className="h-4 w-20 rounded bg-slate-200" /></div>)}</div><div className="mt-7 h-11 rounded-lg bg-slate-200" /></aside>
    </div>
  </section>;
}

function SkeletonField() {
  return <div><div className="h-4 w-24 rounded bg-slate-200" /><div className="mt-2 h-12 rounded-lg bg-slate-100" /></div>;
}

function passengerPrice(adultPrice: number, childPrice: number, infantPrice: number, category: PassengerDraft["age_category"]) {
  return category === "child" ? childPrice : category === "infant" ? infantPrice : adultPrice;
}

function plainText(value?: string | null) {
  return String(value ?? "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " ").trim();
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

function getTourStartTime(tour?: PublicTour) {
  const direct = String(tour?.start_time ?? "").match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  const schedule = String(tour?.schedule ?? "").match(/(?:^|\D)([01]?\d|2[0-3]):([0-5]\d)/);
  const match = direct ?? schedule;
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : null;
}

function normalizeTourTime(value?: string | null) {
  const match = String(value ?? "").match(/^([01]?\d|2[0-3]):([0-5]\d)/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : null;
}

function getTourTimeRange(tour?: PublicTour) {
  const startTime = normalizeTourTime(tour?.start_time) ?? getTourStartTime(tour);
  const endTime = normalizeTourTime(tour?.end_time);
  if (startTime && endTime) return `${startTime} – ${endTime}`;
  if (startTime) return `${startTime} – End time updating`;
  return tour?.schedule?.trim() || "Time updating";
}

function getTourDepartureTime(travelDate: string, tour?: PublicTour) {
  const startTime = getTourStartTime(tour);
  if (!travelDate || !startTime) return null;
  const value = new Date(`${travelDate}T${startTime}:00+07:00`).getTime();
  return Number.isFinite(value) ? value : null;
}

function getMinimumTravelDate(tour?: PublicTour) {
  const startTime = getTourStartTime(tour);
  if (!startTime) return getVietnamDateInputValue();
  const cutoff = Date.now() + BOOKING_DEADLINE_HOURS * 60 * 60 * 1000;
  let date = getVietnamDateInputValue();
  for (let index = 0; index < 4; index += 1) {
    const departure = new Date(`${date}T${startTime}:00+07:00`).getTime();
    if (departure > cutoff) return date;
    date = new Date(new Date(`${date}T00:00:00+07:00`).getTime() + 24 * 60 * 60 * 1000)
      .toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  }
  return date;
}

function getDepartureValidationMessage(travelDate: string, tour?: PublicTour) {
  const departure = getTourDepartureTime(travelDate, tour);
  if (departure === null) return null;
  const remaining = departure - Date.now();
  if (remaining <= 0) return "This tour has already started or finished for the selected date.";
  if (remaining < BOOKING_DEADLINE_HOURS * 60 * 60 * 1000) {
    return `Bookings close ${BOOKING_DEADLINE_HOURS} hours before the tour starts.`;
  }
  return null;
}

function isValidVietnamMobilePhone(value: string) {
  return /^0(?:3|5|7|8|9)\d{8}$/.test(value);
}

function isValidPersonName(value: string) {
  return /^[\p{L}]+(?:\s+[\p{L}]+)+$/u.test(value);
}

function getAvailableSlots(tour?: PublicTour) {
  if (!tour) return null;
  const direct = tour.available_slots ?? tour.remaining_slots ?? tour.available_capacity;
  if (direct !== undefined && direct !== null && Number.isFinite(Number(direct))) return Math.max(0, Number(direct));
  if (typeof tour.capacity === "number") return Math.max(0, tour.capacity);
  const numbers = String(tour.capacity ?? "").match(/\d+/g)?.map(Number) ?? [];
  return numbers.length ? Math.max(...numbers) : null;
}

function getMaximumBooking(tour: PublicTour | undefined, availableSlots: number | null) {
  const configured = tour?.maximum_booking == null || tour.maximum_booking === "" ? null : Number(tour.maximum_booking);
  const limits = [configured, availableSlots].filter((value): value is number => value !== null && Number.isFinite(value));
  return limits.length ? Math.max(0, Math.min(...limits)) : null;
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
