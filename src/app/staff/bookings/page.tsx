"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarCheck, Loader2, Pencil, RefreshCw, Search, X } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import {
  getStaffBookingAmount,
  getStaffBookingCode,
  getStaffBookingCustomer,
  getStaffBookingId,
  getStaffBookingPassengers,
  getStaffBookingTourName,
  getStaffBookingTravelDate,
  staffBookingService,
  type StaffBooking,
  type StaffBookingStatus
} from "@/services/staff-booking.service";

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
  const [editing, setEditing] = useState<BookingFormValue | null>(null);

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

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Staff Bookings</h1>
            <p className="mt-1 text-sm text-slate-500">Manage tour bookings and update booking status.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void loadBookings(page, query, statusFilter)} disabled={loading}>
            <RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
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
              {loading ? <TableMessage colSpan={8} message={<><Loader2 className="mr-2 inline size-5 animate-spin" /> Loading staff bookings...</>} /> : null}
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

      {editing ? <BookingModal item={editing} saving={saving} onClose={() => setEditing(null)} onSave={save} /> : null}
    </>
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

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  if (error.response?.status === 401) return "Please sign in with a staff account.";
  if (error.response?.status === 403) return "This account does not have staff permission.";
  return data?.message ?? data?.error ?? fallback;
}
