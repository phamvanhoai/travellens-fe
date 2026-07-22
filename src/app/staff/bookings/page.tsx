"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarCheck, CheckCircle2, Eye, Loader2, Minus, Pencil, Plus, RefreshCw, Search, Tag, Trash2, X, XCircle } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import { couponService, type CouponValidationResult } from "@/services/coupon.service";
import {
  getStaffBookingAmount,
  getStaffBookingCode,
  getStaffBookingCustomer,
  getStaffBookingId,
  getStaffBookingPassengers,
  getStaffBookingPaymentStatus,
  getStaffBookingTourName,
  getStaffBookingTravelDate,
  staffBookingService,
  type StaffBooking,
  type StaffBookingCreatePayload,
  type StaffCustomer,
  type StaffBookingStatus
} from "@/services/staff-booking.service";
import { getPublicTourId, getPublicTourName, tourService, type PublicTour, type PublicTourDeparture } from "@/services/tour.service";

type BookingFormValue = {
  id: number;
  code: string;
  customer: string;
  phone: string;
  tour: string;
  adults: number;
  children: number;
  infants: number;
  amount: number;
  remainingSeats: number;
  travelDate: string;
  status: StaffBookingStatus;
};

const pageSize = 10;
const bookingStatuses = ["pending", "confirmed", "completed", "cancelled", "canceled", "expired"];

export default function StaffBookingsPage() {
  const showToast = useToast();
  const [items, setItems] = useState<StaffBooking[]>([]);
  const [query, setQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BookingFormValue | null>(null);
  const [details, setDetails] = useState<StaffBooking | null>(null);
  const [detailsLoadingId, setDetailsLoadingId] = useState(0);

  const loadBookings = useCallback(async (nextPage: number, search: string, status: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await staffBookingService.list({
        page: nextPage,
        limit: pageSize,
        search: search || undefined,
        status: status || undefined
      });
      const total = result.pagination?.total ?? result.data.length;
      const nextPageCount = result.pagination?.totalPages ?? result.pagination?.total_pages ?? Math.max(1, Math.ceil(total / pageSize));
      setItems(result.data);
      setTotalItems(total);
      setPageCount(nextPageCount);
    } catch (err) {
      const message = getApiError(err, "Cannot load staff bookings from API.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void loadBookings(1, "", "");
  }, [loadBookings]);

  const currentPage = Math.min(page, pageCount);
  const rows = items;

  async function handleSearch() {
    const value = searchInput.trim();
    setQuery(value);
    setPage(1);
    await loadBookings(1, value, statusFilter);
  }

  async function handleStatusFilter(value: string) {
    setStatusFilter(value);
    setPage(1);
    await loadBookings(1, query, value);
  }

  async function handlePageChange(nextPage: number) {
    setPage(nextPage);
    await loadBookings(nextPage, query, statusFilter);
  }

  async function save(payload: BookingFormValue) {
    setSaving(true);
    setError("");
    try {
      await staffBookingService.update(payload.id, {
        customer_name: payload.customer,
        phone: payload.phone,
        status: payload.status,
      });
      showToast({ variant: "success", title: "Booking updated", description: payload.code });
      setEditing(null);
      await loadBookings(page, query, statusFilter);
    } catch (err) {
      const message = getApiError(err, "Cannot update this booking.");
      setError(message);
      showToast({ variant: "error", title: "Update failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  async function create(payload: StaffBookingCreatePayload) {
    setSaving(true);
    setError("");
    try {
      const booking = await staffBookingService.create(payload);
      showToast({ variant: "success", title: "Booking created", description: `${getStaffBookingCode(booking)}. Notification email sent to the customer.` });
      setCreating(false);
      await loadBookings(1, query, statusFilter);
      setPage(1);
    } catch (err) {
      const message = getApiError(err, "Cannot create this booking.");
      setError(message);
      showToast({ variant: "error", title: "Create failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  async function openDetails(item: StaffBooking) {
    const id = getStaffBookingId(item);
    setDetailsLoadingId(id);
    try {
      setDetails(await staffBookingService.detail(id));
    } catch (err) {
      const message = getApiError(err, "Cannot load booking details.");
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setDetailsLoadingId(0);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Staff Bookings</h1>
            <p className="mt-1 text-sm text-slate-500">Manage tour bookings and update booking status.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={() => setCreating(true)} disabled={loading || saving}>
              <Plus size={17} /> Create Booking
            </Button>
            <Button type="button" variant="outline" onClick={() => void loadBookings(page, query, statusFilter)} disabled={loading}>
              <RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <form className="mt-6 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_120px_180px]" onSubmit={(event) => { event.preventDefault(); void handleSearch(); }}>
          <div className="relative">
            <Search className="absolute left-3 top-3 size-5 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
              placeholder="Search bookings..."
            />
          </div>
          <Button type="submit" disabled={loading} className="h-11 justify-center"><Search size={17} /> Search</Button>
          <select value={statusFilter} onChange={(event) => void handleStatusFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600">
            <option value="">All statuses</option>
            {bookingStatuses.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}
          </select>
        </form>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Code", "Customer", "Tour", "Date", "Passengers", "Amount", "Status", "Actions"].map((head) => <th key={head} className="p-3">{head}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <AdminTableSkeleton columns={8} rows={10} /> : null}
              {!loading && rows.length === 0 ? <TableMessage colSpan={8} message="No staff bookings found." /> : null}
              {!loading && rows.map((item) => {
                const formValue = toFormValue(item);

                return (
                  <tr key={getStaffBookingId(item)} className="border-t border-slate-100 align-top">
                    <td className="p-3 font-bold"><CalendarCheck className="mr-2 inline size-4 text-brand-600" />{formValue.code}</td>
                    <td className="p-3">{formValue.customer}</td>
                    <td className="p-3 text-slate-600">{formValue.tour}</td>
                    <td className="p-3">{formatDate(formValue.travelDate)}</td>
                    <td className="p-3">{formValue.adults} adult, {formValue.children} child, {formValue.infants} infant</td>
                    <td className="p-3 font-semibold">{formatVnd(formValue.amount)}</td>
                    <td className="p-3"><StatusBadge value={formValue.status} /></td>
                    <td className="p-3">
                      <span className="flex gap-2">
                        <Button variant="outline" className="h-9 px-3" disabled={detailsLoadingId === getStaffBookingId(item)} onClick={() => void openDetails(item)}>
                          {detailsLoadingId === getStaffBookingId(item) ? <Loader2 className="size-4 animate-spin" /> : <Eye size={15} />} Details
                        </Button>
                        <Button variant="outline" className="h-9 px-3" onClick={() => setEditing(formValue)}>
                          <Pencil size={15} /> Edit
                        </Button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={currentPage} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="bookings" onPageChange={(nextPage) => void handlePageChange(nextPage)} />
      </div>

      {creating ? <CreateBookingModal saving={saving} onClose={() => setCreating(false)} onCreate={create} /> : null}
      {editing ? <BookingModal item={editing} saving={saving} onClose={() => setEditing(null)} onSave={save} /> : null}
      {details ? <BookingDetailsModal booking={details} onClose={() => setDetails(null)} /> : null}
    </>
  );
}

type PassengerCategory = "adult" | "child" | "infant";

const emptyCounts: Record<PassengerCategory, number> = {
  adult: 1,
  child: 0,
  infant: 0
};

function CreateBookingModal({ saving, onClose, onCreate }: { saving: boolean; onClose: () => void; onCreate: (payload: StaffBookingCreatePayload) => Promise<void> }) {
  const showToast = useToast();
  const [tours, setTours] = useState<PublicTour[]>([]);
  const [tourId, setTourId] = useState("");
  const [departureId, setDepartureId] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [departures, setDepartures] = useState<PublicTourDeparture[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [customer, setCustomer] = useState<StaffCustomer | null>(null);
  const [contactPhone, setContactPhone] = useState("");
  const [passengerName, setPassengerName] = useState("");
  const [seatNumber, setSeatNumber] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [counts, setCounts] = useState<Record<PassengerCategory, number>>(emptyCounts);
  const [loadingTours, setLoadingTours] = useState(true);
  const [lookingUpCustomer, setLookingUpCustomer] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const requestId = useRef("");

  useEffect(() => {
    async function loadTours() {
      try {
        const result = await tourService.list();
        setTours(result);
        const firstTour = result[0];
        if (firstTour) setTourId(String(getPublicTourId(firstTour)));
      } catch (err) {
        const message = getApiError(err, "Cannot load available tours.");
        setFieldErrors((current) => ({ ...current, tours: message }));
      } finally {
        setLoadingTours(false);
      }
    }

    void loadTours();
  }, []);

  useEffect(() => {
    setDepartureId("");
    setDepartureDate("");
    setDepartures([]);
    if (!tourId) return;
    void tourService.departures(tourId).then(setDepartures).catch(() => setFieldErrors((current) => ({ ...current, travel_date: "Cannot load open departures for this tour." })));
  }, [tourId]);

  const selectedTour = tours.find((tour) => String(getPublicTourId(tour)) === tourId);
  const selectedDeparture = departures.find((item) => String(item.tour_departure_id) === departureId);
  const departuresForDate = departures.filter((item) => staffDepartureDate(item.departure_at) === departureDate);
  const departureDateRange = getStaffDepartureDateRange(departures);
  const adultPrice = Number(selectedDeparture?.price ?? selectedTour?.price ?? 0);
  const childPrice = Number(selectedDeparture?.child_price ?? selectedTour?.child_price ?? adultPrice * 0.65);
  const availableSlots = selectedDeparture ? Number(selectedDeparture.available_slots) : null;
  const passengerTotal = counts.adult + counts.child + counts.infant;
  const subtotal = counts.adult * adultPrice + counts.child * childPrice;
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

  function changeCount(category: PassengerCategory, delta: number) {
    setCounts((current) => {
      const nextTotal = passengerTotal + delta;
      if (delta > 0 && availableSlots !== null && nextTotal > availableSlots) {
        setFieldErrors((errors) => ({ ...errors, passengers: `Only ${availableSlots} slot${availableSlots === 1 ? " is" : "s are"} available for this tour.` }));
        return current;
      }
      const nextValue = Math.max(0, current[category] + delta);
      const next = { ...current, [category]: nextValue };
      if (next.adult + next.child + next.infant > 0) setFieldErrors((errors) => ({ ...errors, passengers: "" }));
      return next;
    });
    setAppliedCoupon(null);
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
      setAppliedCoupon({ ...result, code: result.code ?? result.coupon?.code ?? code, booking_amount: result.booking_amount ?? result.bookingAmount ?? subtotal });
      showToast({ variant: "success", title: "Coupon applied", description: code });
    } catch (err) {
      const message = getApiError(err, "Coupon cannot be applied.");
      setFieldErrors((current) => ({ ...current, coupon: message }));
      showToast({ variant: "error", title: "Coupon invalid", description: message });
    } finally {
      setValidatingCoupon(false);
    }
  }

  async function lookupCustomer() {
    const email = customerEmail.trim();
    setCustomer(null);
    setFieldErrors((current) => ({ ...current, customer_email: "", customer_lookup: "" }));

    if (!email) {
      setFieldErrors((current) => ({ ...current, customer_email: "Customer email is required." }));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors((current) => ({ ...current, customer_email: "Enter a valid customer email." }));
      return;
    }

    setLookingUpCustomer(true);
    try {
      const result = await staffBookingService.lookupCustomer(email);
      const lookupCustomer = result.customer ?? null;
      const userId = lookupCustomer ? getLookupCustomerId(lookupCustomer) : 0;
      if (result.exists === false || !lookupCustomer) {
        setFieldErrors((current) => ({ ...current, customer_lookup: result.message || "Customer not found, inactive, or not a customer account." }));
        return;
      }

      if (!userId) {
        setFieldErrors((current) => ({ ...current, customer_lookup: "Customer was found but does not include a valid user_id." }));
        return;
      }

      setCustomer(lookupCustomer);
      setPassengerName(getLookupCustomerName(lookupCustomer));
      setContactPhone(String(lookupCustomer.phone ?? ""));
      showToast({ variant: "success", title: "Customer found", description: `${getLookupCustomerName(lookupCustomer)} - #${userId}` });
    } catch (err) {
      const message = getApiError(err, "Customer not found, inactive, or not a customer account.");
      setFieldErrors((current) => ({ ...current, customer_lookup: message }));
      showToast({ variant: "error", title: "Lookup failed", description: message });
    } finally {
      setLookingUpCustomer(false);
    }
  }

  async function submit() {
    const errors: Record<string, string> = {};
    const cleanPassengerName = passengerName.trim();
    const cleanContactPhone = contactPhone.trim();
    const userId = customer ? getLookupCustomerId(customer) : 0;

    if (!tourId) errors.tour_id = "Tour is required.";
    if (!selectedDeparture) errors.travel_date = "Select an open departure.";
    if (!customerEmail.trim()) errors.customer_email = "Customer email is required.";
    if (!userId) errors.customer_lookup = "Lookup an active customer by email before creating the booking.";
    if (!cleanContactPhone) errors.contact_phone = "Contact phone is required.";
    else if (!isValidVietnamMobilePhone(cleanContactPhone)) errors.contact_phone = "Contact phone must be a valid Vietnamese mobile number.";
    if (!cleanPassengerName) errors.passenger_name = "Passenger name is required.";
    else if (!isValidPersonName(cleanPassengerName)) errors.passenger_name = "Passenger name must contain at least 2 words and only letters/spaces.";
    if (passengerTotal <= 0) errors.passengers = "Add at least one passenger.";
    if (availableSlots !== null && passengerTotal > availableSlots) errors.passengers = `Only ${availableSlots} slots are available for this tour.`;
    if (couponCode.trim() && !appliedCoupon) errors.coupon = "Please apply the coupon before submitting.";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const passengers = (["adult", "child", "infant"] as const).flatMap((category) =>
      Array.from({ length: counts[category] }, (_, index) => ({
        passenger_name: cleanPassengerName,
        age_category: category,
        seat_number: index === 0 ? seatNumber.trim() || undefined : undefined,
        special_request: index === 0 ? specialRequest.trim() || undefined : undefined
      }))
    );

    if (!requestId.current) requestId.current = crypto.randomUUID();
    await onCreate({
      user_id: userId,
      tour_id: Number(tourId),
      tour_departure_id: Number(departureId),
      contact_phone: cleanContactPhone,
      request_id: requestId.current,
      policy_accepted: true,
      coupon_code: appliedCoupon ? couponCode.trim() : null,
      passengers
    });
  }

  return (
    <Modal title="Create Booking" onClose={onClose} onSubmit={() => void submit()} saveDisabled={loadingTours || saving || validatingCoupon || lookingUpCustomer} saving={saving}>
      {fieldErrors.tours ? <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{fieldErrors.tours}</div> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tour">
          <select value={tourId} disabled={loadingTours} onChange={(event) => { setTourId(event.target.value); setAppliedCoupon(null); setFieldErrors((current) => ({ ...current, tour_id: "", passengers: "", coupon: "" })); }} className={`input ${fieldErrors.tour_id ? "border-rose-500" : ""}`}>
            <option value="">Select a tour</option>
            {tours.map((tour) => <option key={getPublicTourId(tour)} value={getPublicTourId(tour)}>{getPublicTourName(tour)} - {formatVnd(Number(tour.price ?? 0))}</option>)}
          </select>
          {fieldErrors.tour_id ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.tour_id}</span> : null}
          {availableSlots !== null ? <span className="mt-2 block text-xs font-semibold text-brand-600">Available slots: {availableSlots}</span> : null}
        </Field>
        <Field label="Tour Departure">
          <div className="grid gap-2"><input type="date" value={departureDate} min={departureDateRange.min} max={departureDateRange.max} disabled={!departures.length} onChange={(event) => { setDepartureDate(event.target.value); setDepartureId(""); setFieldErrors((current) => ({ ...current, travel_date: "" })); }} className={`input ${fieldErrors.travel_date ? "border-rose-500" : ""}`} /><select value={departureId} disabled={!departureDate || !departuresForDate.length} onChange={(event) => { setDepartureId(event.target.value); setFieldErrors((current) => ({ ...current, travel_date: "" })); }} className={`input ${fieldErrors.travel_date ? "border-rose-500" : ""}`}><option value="">{departureDate ? "Select departure time" : "Select a date first"}</option>{departuresForDate.map((departure) => <option key={departure.tour_departure_id} value={departure.tour_departure_id} disabled={Number(departure.available_slots) <= 0}>{formatStaffDepartureTime(departure)}</option>)}</select></div>
          {fieldErrors.travel_date ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.travel_date}</span> : null}
          {!departures.length ? <span className="mt-2 block text-xs font-semibold text-rose-600">No open departures.</span> : departureDate && !departuresForDate.length ? <span className="mt-2 block text-xs font-semibold text-amber-600">No departure is available on this date.</span> : null}
        </Field>
        <Field label="Customer Email">
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
            <input
              type="email"
              value={customerEmail}
              onChange={(event) => {
                setCustomerEmail(event.target.value);
                setCustomer(null);
                setContactPhone("");
                setFieldErrors((current) => ({ ...current, customer_email: "", customer_lookup: "" }));
              }}
              className={`h-11 rounded-lg border px-3 text-sm outline-none focus:border-brand-600 ${fieldErrors.customer_email || fieldErrors.customer_lookup ? "border-rose-500" : customer ? "border-emerald-500" : "border-slate-200"}`}
              placeholder="customer@example.com"
            />
            <Button type="button" variant="outline" className="px-4" onClick={() => void lookupCustomer()} disabled={saving || lookingUpCustomer}>
              {lookingUpCustomer ? <Loader2 className="size-4 animate-spin" /> : <Search size={16} />} Lookup
            </Button>
          </div>
          {fieldErrors.customer_email ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.customer_email}</span> : null}
          {fieldErrors.customer_lookup ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.customer_lookup}</span> : null}
          {customer ? <CustomerLookupCard customer={customer} /> : null}
        </Field>
        <Field label="Passenger Name">
          <input value={passengerName} onChange={(event) => { setPassengerName(event.target.value); setFieldErrors((current) => ({ ...current, passenger_name: "" })); }} className={`input ${fieldErrors.passenger_name ? "border-rose-500" : ""}`} />
          {fieldErrors.passenger_name ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.passenger_name}</span> : null}
        </Field>
        <Field label="Contact Phone">
          <input type="tel" value={contactPhone} onChange={(event) => { setContactPhone(event.target.value); setFieldErrors((current) => ({ ...current, contact_phone: "" })); }} className={`input ${fieldErrors.contact_phone ? "border-rose-500" : ""}`} placeholder="0901234567" />
          {fieldErrors.contact_phone ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.contact_phone}</span> : null}
        </Field>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="font-bold">Passenger Quantity</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(["adult", "child", "infant"] as const).map((category) => (
            <div key={category} className="flex items-center justify-between rounded-lg bg-white p-3">
              <div>
                <p className="font-bold capitalize">{category}</p>
                <p className="text-xs text-slate-500">{formatVnd(passengerPrice(adultPrice, childPrice, category))}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => changeCount(category, -1)} disabled={saving || counts[category] === 0} className="grid size-8 place-items-center rounded-full border border-slate-200 disabled:opacity-40" aria-label={`Remove ${category}`}><Minus size={14} /></button>
                <span className="w-5 text-center font-bold">{counts[category]}</span>
                <button type="button" onClick={() => changeCount(category, 1)} disabled={saving || (availableSlots !== null && passengerTotal >= availableSlots)} className="grid size-8 place-items-center rounded-full border border-slate-200 disabled:opacity-40" aria-label={`Add ${category}`}><Plus size={14} /></button>
              </div>
            </div>
          ))}
        </div>
        {fieldErrors.passengers ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.passengers}</p> : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Preferred Seat">
          <textarea value={seatNumber} onChange={(event) => setSeatNumber(event.target.value)} className="input min-h-24 py-2" />
        </Field>
        <Field label="Special Request">
          <textarea value={specialRequest} onChange={(event) => setSpecialRequest(event.target.value)} className="input min-h-24 py-2" />
        </Field>
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 p-4">
        <p className="font-bold">Coupon Code <span className="font-normal text-slate-400">(optional)</span></p>
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <input value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); setAppliedCoupon(null); setFieldErrors((current) => ({ ...current, coupon: "" })); }} className={`h-11 rounded-lg border px-3 text-sm outline-none focus:border-brand-600 ${fieldErrors.coupon ? "border-rose-500" : appliedCoupon ? "border-emerald-500" : "border-slate-200"}`} placeholder="SUMMER20" />
          {appliedCoupon ? (
            <Button type="button" variant="outline" className="px-4 text-rose-600" onClick={() => { setCouponCode(""); setAppliedCoupon(null); }} disabled={saving}><Trash2 size={16} /> Remove</Button>
          ) : (
            <Button type="button" variant="outline" className="px-4" onClick={() => void applyCoupon()} disabled={saving || validatingCoupon || !couponCode.trim()}>{validatingCoupon ? <Loader2 className="size-4 animate-spin" /> : <Tag size={16} />} Apply</Button>
          )}
        </div>
        {appliedCoupon ? <span className="mt-2 flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 className="size-4" /> Coupon applied. Discount {formatVnd(discountAmount)}.</span> : null}
        {fieldErrors.coupon ? <span className="mt-2 flex items-center gap-1 text-xs font-semibold text-rose-600"><XCircle className="size-4" /> {fieldErrors.coupon}</span> : null}
      </div>

      <div className="mt-5 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm">
        <p className="flex justify-between"><span>Subtotal</span><span>{formatVnd(subtotal)}</span></p>
        {appliedCoupon ? <p className="mt-2 flex justify-between text-emerald-700"><span>Discount</span><span>-{formatVnd(discountAmount)}</span></p> : null}
        <p className="mt-3 flex justify-between border-t border-brand-200 pt-3 text-lg font-bold"><span>Total</span><span>{formatVnd(finalTotal)}</span></p>
      </div>
    </Modal>
  );
}

function BookingModal({ item, saving, onClose, onSave }: { item: BookingFormValue; saving: boolean; onClose: () => void; onSave: (item: BookingFormValue) => void }) {
  const [form, setForm] = useState(item);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const today = useMemo(() => startOfDay(new Date()), []);
  const requestedSeats = item.adults + item.children;
  const travelDate = item.travelDate ? startOfDay(new Date(`${item.travelDate}T00:00:00`)) : null;
  const travelDatePassed = Boolean(travelDate && travelDate < today);
  const statusLocked = ["cancelled", "canceled"].includes(String(item.status).toLowerCase());
  const editable = !travelDatePassed && !saving;
  const statusOptions = getEditStatusOptions(item.status);

  function submit() {
    if (travelDatePassed) return;

    const errors: Record<string, string> = {};
    const customer = form.customer.trim();
    const phone = form.phone.trim();

    if (!customer) errors.customer = "Customer name is required.";
    else if (customer.length < 2) errors.customer = "Customer name must contain at least 2 characters.";
    else if (customer.length > 100) errors.customer = "Customer name must contain at most 100 characters.";
    else if (!/^[\p{L}\s]+$/u.test(customer)) errors.customer = "Customer name must not contain special characters.";

    if (!/^\d{10}$/.test(phone)) errors.phone = "Phone number must contain exactly 10 digits.";

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    onSave({ ...form, customer, phone, status: statusLocked ? item.status : form.status });
  }

  return (
    <Modal title="Edit Booking" onClose={onClose} onSubmit={submit} saveDisabled={!editable} saving={saving}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Customer">
          <input value={form.customer} disabled={!editable} onChange={(event) => { setForm({ ...form, customer: event.target.value }); setFieldErrors((current) => ({ ...current, customer: "" })); }} className={`input disabled:bg-slate-50 disabled:text-slate-500 ${fieldErrors.customer ? "border-rose-500" : ""}`} />
          {fieldErrors.customer ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.customer}</span> : null}
        </Field>
        <Field label="Phone">
          <input type="tel" value={form.phone} disabled={!editable} onChange={(event) => { setForm({ ...form, phone: event.target.value }); setFieldErrors((current) => ({ ...current, phone: "" })); }} className={`input disabled:bg-slate-50 disabled:text-slate-500 ${fieldErrors.phone ? "border-rose-500" : ""}`} />
          {fieldErrors.phone ? <span className="mt-2 block text-xs font-semibold text-rose-600">{fieldErrors.phone}</span> : null}
        </Field>
        <Field label="Tour"><input value={form.tour} readOnly disabled className="input bg-slate-50 text-slate-500" /></Field>
        <Field label="Travel Date"><input value={formatDate(form.travelDate)} readOnly disabled className="input bg-slate-50 text-slate-500" /></Field>
        <Field label="Status"><select value={form.status} disabled={!editable || statusLocked} onChange={(event) => setForm({ ...form, status: event.target.value as StaffBookingStatus })} className="input disabled:bg-slate-50 disabled:text-slate-500">{statusOptions.map((status) => <option key={status} value={status}>{formatLabel(status)}</option>)}</select></Field>
        <ReadOnlyMetric label="Adults" value={form.adults} />
        <ReadOnlyMetric label="Children" value={form.children} />
        <ReadOnlyMetric label="Infants" value={form.infants} />
        <AmountPreview amount={form.amount} />
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <span><span className="font-semibold text-slate-800">Remaining Seats:</span> {form.remainingSeats}</span>
        <span><span className="font-semibold text-slate-800">Requested Seats:</span> {requestedSeats}</span>
      </div>
      {travelDatePassed ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">This booking cannot be edited because the travel date has passed.</p> : null}
      {statusLocked && !travelDatePassed ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700">This booking status cannot be changed.</p> : null}
    </Modal>
  );
}

function CustomerLookupCard({ customer }: { customer: StaffCustomer }) {
  return (
    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
      <p className="font-bold">Customer #{getLookupCustomerId(customer)}</p>
      <p className="mt-1">{getLookupCustomerName(customer)}</p>
      {customer.email ? <p className="mt-1">{customer.email}</p> : null}
      {customer.phone ? <p className="mt-1">{customer.phone}</p> : null}
      <p className="mt-1">Role: {customer.role ?? "customer"} | Status: {customer.status ?? "active"}</p>
    </div>
  );
}

function Modal({ title, children, onClose, onSubmit, saveDisabled, saving }: { title: string; children: React.ReactNode; onClose: () => void; onSubmit: () => void; saveDisabled?: boolean; saving: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form noValidate className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} disabled={saving} className="grid size-9 place-items-center rounded-full hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="mt-6">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button type="submit" disabled={saveDisabled || saving}>{saving ? "Saving..." : "Save"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3 [&_.input]:outline-none [&_.input:focus]:border-brand-600">{label}{children}</label>;
}

function AmountPreview({ amount }: { amount: number }) {
  return <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 shadow-sm"><p className="text-sm font-semibold text-brand-700">Total Amount</p><p className="mt-2 text-2xl font-bold text-brand-900">{formatVnd(amount)}</p></div>;
}

function ReadOnlyMetric({ label, value }: { label: string; value: number }) {
  return <div className="block text-sm font-semibold"><span>{label}</span><div className="mt-2 grid h-11 place-items-center rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700">{value}</div></div>;
}

function StatusBadge({ value }: { value: string }) {
  const label = String(value || "-");
  const normalized = label.toLowerCase();
  const style = ["confirmed", "paid", "approved", "completed"].includes(normalized) ? "bg-emerald-50 text-emerald-700" : ["cancelled", "canceled", "failed", "hidden", "expired", "rejected"].includes(normalized) ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{formatLabel(label)}</span>;
}

function formatLabel(value: string) {
  return value ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "-";
}

function TableMessage({ message, colSpan }: { message: React.ReactNode; colSpan: number }) {
  return <tr><td colSpan={colSpan} className="p-8 text-center text-sm font-semibold text-slate-500">{message}</td></tr>;
}

function toFormValue(booking: StaffBooking): BookingFormValue {
  return {
    id: getStaffBookingId(booking),
    code: getStaffBookingCode(booking),
    customer: getStaffBookingCustomer(booking),
    phone: getStaffBookingPhone(booking),
    tour: getStaffBookingTourName(booking),
    adults: getPassengerCount(booking, "adult"),
    children: getPassengerCount(booking, "child"),
    infants: getPassengerCount(booking, "infant"),
    amount: getStaffBookingAmount(booking),
    remainingSeats: Number(booking.remaining_seats ?? booking.available_seats ?? booking.tour?.remaining_seats ?? booking.tour?.available_seats ?? 0),
    travelDate: toDateInputValue(getStaffBookingTravelDate(booking)),
    status: booking.status ?? "pending"
  };
}

function getStaffBookingPhone(booking: StaffBooking) {
  const direct = booking as StaffBooking & { phone?: string; phone_number?: string; phoneNumber?: string; customer_phone?: string; customerPhone?: string };
  const customer = typeof booking.customer === "object" && booking.customer ? booking.customer : null;
  return String(direct.phone ?? direct.phone_number ?? direct.phoneNumber ?? direct.customer_phone ?? direct.customerPhone ?? customer?.phone ?? "");
}

function getPassengerCount(booking: StaffBooking, category: "adult" | "child" | "infant") {
  const direct = category === "adult"
    ? booking.adult_count ?? booking.adultCount ?? booking.adults
    : category === "child"
      ? booking.child_count ?? booking.childCount ?? booking.children
      : booking.infant_count ?? booking.infantCount ?? booking.infants;
  if (direct !== undefined && direct !== null && direct !== "") return Number(direct) || 0;

  const passengers = getStaffBookingPassengers(booking);
  const count = passengers.filter((passenger) => (passenger.age_category ?? passenger.ageCategory)?.toLowerCase() === category).length;
  if (count > 0) return count;

  const total = Number(booking.passenger_count ?? booking.passengerCount ?? booking.total_passengers ?? booking.totalPassengers ?? 0);
  return category === "adult" && total > 0 ? total : 0;
}

function getEditStatusOptions(status: StaffBookingStatus) {
  const normalized = String(status || "pending").toLowerCase();
  if (["cancelled", "canceled"].includes(normalized)) return [status];
  return ["pending", "confirmed", "completed", "cancelled", "expired"] as StaffBookingStatus[];
}

function formatDate(value: string) {
  if (!value) return "-";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : toDateInput(date);
}

function formatVnd(value: number | string | undefined | null) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function toDateInputValue(value: string) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : toDateInput(date);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function getLookupCustomerId(customer: StaffCustomer) {
  return Number(customer.user_id ?? customer.id ?? 0);
}

function getLookupCustomerName(customer: StaffCustomer) {
  return customer.name ?? customer.full_name ?? customer.fullName ?? customer.email ?? `User #${getLookupCustomerId(customer)}`;
}

function passengerPrice(adultPrice: number, childPrice: number, category: PassengerCategory) {
  return category === "child" ? childPrice : category === "infant" ? 0 : adultPrice;
}

function getAvailableSlots(tour?: PublicTour) {
  if (!tour) return null;
  const direct = tour.available_slots ?? tour.remaining_slots ?? tour.available_capacity;
  if (direct !== undefined && direct !== null && Number.isFinite(Number(direct))) return Math.max(0, Number(direct));
  if (typeof tour.capacity === "number") return Math.max(0, tour.capacity);
  const numbers = String(tour.capacity ?? "").match(/\d+/g)?.map(Number) ?? [];
  return numbers.length ? Math.max(...numbers) : null;
}

function buildDepartureAt(date: string, schedule?: string) {
  const timeMatch = schedule?.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  const hour = timeMatch?.[1]?.padStart(2, "0") ?? "08";
  const minute = timeMatch?.[2] ?? "00";
  return `${date}T${hour}:${minute}:00+07:00`;
}

function BookingDetailsModal({ booking, onClose }: { booking: StaffBooking; onClose: () => void }) {
  const passengers = getStaffBookingPassengers(booking);
  const customer = typeof booking.customer === "object" && booking.customer ? booking.customer : booking.user ?? booking.User;
  const record = booking as StaffBooking & { contact_phone?: string; phone?: string; coupon_code?: string; discount_amount?: number | string; subtotal?: number | string; currency?: string };
  const phone = record.contact_phone ?? record.phone ?? (customer as { phone?: string } | null | undefined)?.phone ?? "-";
  const email = customer?.email ?? "-";
  const paymentStatus = getStaffBookingPaymentStatus(booking) ?? "unpaid";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-auto rounded-xl bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div><p className="text-xs font-bold uppercase tracking-wider text-brand-600">Booking details</p><h2 className="mt-1 text-2xl font-bold">{getStaffBookingCode(booking)}</h2><p className="mt-1 text-sm text-slate-500">Created {formatDateTime(booking.created_at)}</p></div>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close booking details"><X size={18} /></button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <DetailCard label="Booking status"><StatusBadge value={booking.status ?? "pending"} /></DetailCard>
          <DetailCard label="Payment status"><StatusBadge value={paymentStatus} /></DetailCard>
          <DetailCard label="Travel date" value={formatDate(getStaffBookingTravelDate(booking))} />
          <DetailCard label="Total amount" value={formatVnd(getStaffBookingAmount(booking))} strong />
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <section className="rounded-lg border border-slate-200 p-4"><h3 className="font-bold">Customer</h3><dl className="mt-3 grid gap-3 text-sm"><DetailRow label="Name" value={getStaffBookingCustomer(booking)} /><DetailRow label="Email" value={email} /><DetailRow label="Phone" value={phone} /><DetailRow label="User ID" value={booking.user_id ? `#${booking.user_id}` : "-"} /></dl></section>
          <section className="rounded-lg border border-slate-200 p-4"><h3 className="font-bold">Tour & pricing</h3><dl className="mt-3 grid gap-3 text-sm"><DetailRow label="Tour" value={getStaffBookingTourName(booking)} /><DetailRow label="Tour ID" value={booking.tour_id ? `#${booking.tour_id}` : "-"} /><DetailRow label="Subtotal" value={record.subtotal !== undefined ? formatVnd(record.subtotal) : "-"} /><DetailRow label="Coupon" value={record.coupon_code || "None"} /><DetailRow label="Discount" value={record.discount_amount !== undefined ? formatVnd(record.discount_amount) : "-"} /></dl></section>
        </div>

        <section className="mt-6"><div className="flex items-center justify-between"><h3 className="font-bold">Passengers</h3><span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{passengers.length} passenger{passengers.length === 1 ? "" : "s"}</span></div><div className="mt-3 overflow-x-auto rounded-lg border border-slate-200"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Passenger", "Category", "Price", "Seat", "Special request"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>{passengers.length ? passengers.map((passenger, index) => <tr key={passenger.booking_detail_id ?? passenger.id ?? index} className="border-t border-slate-100"><td className="p-3 font-semibold">{passenger.passenger_name ?? passenger.name ?? `Passenger ${index + 1}`}</td><td className="p-3 capitalize">{passenger.age_category ?? passenger.ageCategory ?? "-"}</td><td className="p-3">{formatVnd(passenger.price)}</td><td className="p-3">{passenger.seat_number || "-"}</td><td className="max-w-xs p-3 text-slate-600">{passenger.special_request || "-"}</td></tr>) : <tr><td colSpan={5} className="p-8 text-center text-slate-500">No passenger records returned by the API.</td></tr>}</tbody></table></div></section>

        <div className="mt-6 flex justify-end"><Button type="button" variant="outline" onClick={onClose}>Close</Button></div>
      </div>
    </div>
  );
}

function DetailCard({ label, value, strong = false, children }: { label: string; value?: React.ReactNode; strong?: boolean; children?: React.ReactNode }) { return <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs font-bold uppercase text-slate-400">{label}</p><div className={`mt-2 ${strong ? "text-lg font-bold text-brand-700" : "font-semibold text-slate-800"}`}>{children ?? value ?? "-"}</div></div>; }
function DetailRow({ label, value }: { label: string; value: React.ReactNode }) { return <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-3"><dt className="text-slate-400">{label}</dt><dd className="break-words font-semibold text-slate-700">{value}</dd></div>; }
function formatDateTime(value?: string) { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date); }
function formatStaffDeparture(departure: PublicTourDeparture) { return `${formatDateTime(departure.departure_at)} · ${departure.available_slots} slots · ${formatVnd(departure.price)}`; }
function formatStaffDepartureTime(departure: PublicTourDeparture) { const time = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(departure.departure_at)); return `${time} · ${departure.available_slots} slots · ${formatVnd(departure.price)}`; }
function staffDepartureDate(value: string) { return new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)); }
function getStaffDepartureDateRange(departures: PublicTourDeparture[]) { const dates = departures.map((item) => staffDepartureDate(item.departure_at)).sort(); return { min: dates[0], max: dates[dates.length - 1] }; }

function isValidVietnamMobilePhone(value: string) {
  return /^0(?:3|5|7|8|9)\d{8}$/.test(value);
}

function isValidPersonName(value: string) {
  return /^[\p{L}]+(?:\s+[\p{L}]+)+$/u.test(value);
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
  if (error.response?.status === 401) return "Please sign in with a staff account.";
  if (error.response?.status === 403) return "This account does not have staff permission.";
  return data?.message ?? data?.error ?? fallback;
}
