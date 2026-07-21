"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Minus, Pencil, Plus, Search, X } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";

type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
type ManagedBooking = {
  id: string;
  user: string;
  tour: string;
  travelDate: string;
  adults: number;
  children: number;
  infants: number;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  remainingSeats: number;
  amount: number;
  status: BookingStatus;
};

const tourCatalog: Record<string, { adultPrice: number; childPrice: number; infantPrice: number; remainingSeats: number }> = {
  "Saigon One Day Tour": { adultPrice: 150, childPrice: 80, infantPrice: 0, remainingSeats: 5 },
  "Historic Ho Chi Minh City Tour": { adultPrice: 199, childPrice: 100, infantPrice: 0, remainingSeats: 8 },
  "Ha Long Bay Weekend": { adultPrice: 180, childPrice: 130, infantPrice: 0, remainingSeats: 4 },
  "Cu Chi Heritage Route": { adultPrice: 140, childPrice: 90, infantPrice: 0, remainingSeats: 8 },
  "Central Vietnam Discovery": { adultPrice: 178, childPrice: 110, infantPrice: 0, remainingSeats: 3 }
};

function calculateAmount(booking: Pick<ManagedBooking, "adults" | "children" | "infants" | "adultPrice" | "childPrice" | "infantPrice">) {
  return booking.adults * booking.adultPrice + booking.children * booking.childPrice + booking.infants * booking.infantPrice;
}

const initialBookings: ManagedBooking[] = ([
  { id: "BK-2048", user: "Sophie Martin", tour: "Saigon One Day Tour", travelDate: "2026-06-18", adults: 2, children: 1, infants: 0, status: "Confirmed", ...tourCatalog["Saigon One Day Tour"] },
  { id: "BK-2052", user: "David Lee", tour: "Historic Ho Chi Minh City Tour", travelDate: "2026-07-04", adults: 1, children: 0, infants: 0, status: "Pending", ...tourCatalog["Historic Ho Chi Minh City Tour"] },
  { id: "BK-2054", user: "Emma Johnson", tour: "Ha Long Bay Weekend", travelDate: "2026-07-12", adults: 2, children: 2, infants: 0, status: "Confirmed", ...tourCatalog["Ha Long Bay Weekend"] },
  { id: "BK-2055", user: "Michael Brown", tour: "Saigon One Day Tour", travelDate: "2026-07-20", adults: 1, children: 0, infants: 0, status: "Confirmed", ...tourCatalog["Saigon One Day Tour"] },
  { id: "BK-2056", user: "Minh Nguyen", tour: "Cu Chi Heritage Route", travelDate: "2026-08-02", adults: 3, children: 0, infants: 0, status: "Pending", ...tourCatalog["Cu Chi Heritage Route"] },
  { id: "BK-1988", user: "Anna Wilson", tour: "Central Vietnam Discovery", travelDate: "2026-04-21", adults: 2, children: 0, infants: 1, status: "Cancelled", ...tourCatalog["Central Vietnam Discovery"] }
] satisfies Array<Omit<ManagedBooking, "amount">>).map((booking) => ({ ...booking, amount: calculateAmount(booking) }));
const emptyBooking: ManagedBooking = { id: "", user: "", tour: "Saigon One Day Tour", travelDate: "", adults: 1, children: 0, infants: 0, amount: 150, status: "Pending", ...tourCatalog["Saigon One Day Tour"] };

export default function AdminBookingsPage() {
  const [items, setItems] = useState(initialBookings);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ManagedBooking | null>(null);
  const pageSize = 5;
  const visibleItems = items.filter((item) => `${item.id} ${item.user} ${item.tour} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function save(payload: ManagedBooking) {
    const nextPayload = { ...payload, amount: calculateAmount(payload) };
    setItems((current) => editing
      ? current.map((item) => item.id === editing.id ? nextPayload : item)
      : [...current, { ...nextPayload, id: `BK-${Math.max(...current.map((item) => Number(item.id.replace("BK-", ""))), 2000) + 1}` }]);
    setEditing(null);
    setCreating(false);
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Booking Management</h1><p className="mt-1 text-sm text-slate-500">Create bookings and update passenger totals or booking status.</p></div><Button onClick={() => setCreating(true)}><Plus size={17} /> Create Booking</Button></div>
      <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search bookings..." /></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Booking ID", "User", "Tour", "Travel Date", "Passengers", "Amount", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {paginatedItems.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-bold"><CalendarCheck className="mr-2 inline size-4 text-brand-600" />{item.id}</td><td className="p-3">{item.user}</td><td className="p-3 text-slate-600">{item.tour}</td><td className="p-3">{item.travelDate}</td><td className="p-3">{item.adults} adult, {item.children} child, {item.infants} infant</td><td className="p-3 font-semibold">{currency(item.amount, "VND")}</td><td className="p-3"><Status value={item.status} /></td><td className="p-3"><Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}><Pencil size={15} /> Edit</Button></td></tr>)}
      </tbody></table></div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="bookings" onPageChange={setPage} />
    </div>
    {creating || editing ? <BookingForm key={editing?.id ?? "create"} title={editing ? "Edit Booking" : "Create Booking"} initialValue={editing ?? emptyBooking} isEditing={Boolean(editing)} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} /> : null}
  </>;
}

function BookingForm({ title, initialValue, isEditing, onClose, onSave }: { title: string; initialValue: ManagedBooking; isEditing: boolean; onClose: () => void; onSave: (payload: ManagedBooking) => void }) {
  const [form, setForm] = useState(initialValue);
  const [message, setMessage] = useState("");
  const today = useMemo(() => startOfDay(new Date()), []);
  const travelDate = form.travelDate ? startOfDay(new Date(`${form.travelDate}T00:00:00`)) : null;
  const travelDatePassed = Boolean(isEditing && travelDate && travelDate < today);
  const statusLocked = isEditing && form.status === "Cancelled";
  const editable = !travelDatePassed && !statusLocked;
  const amount = calculateAmount(form);
  const requestedSeats = form.adults + form.children;
  const originalRequestedSeats = isEditing ? initialValue.adults + initialValue.children : 0;
  const editableSeatCapacity = form.remainingSeats + originalRequestedSeats;
  const seatsAfterEdit = Math.max(0, editableSeatCapacity - requestedSeats);
  const seatLimitReached = requestedSeats >= editableSeatCapacity;
  const hasSeatError = requestedSeats > editableSeatCapacity;
  const statusOptions = isEditing ? getAllowedStatuses(initialValue.status) : ["Pending", "Confirmed", "Cancelled"] as BookingStatus[];

  function updatePassenger(field: "adults" | "children" | "infants", delta: number) {
    const minimum = field === "adults" ? 1 : 0;
    setForm((current) => ({ ...current, [field]: Math.max(minimum, current[field] + delta) }));
  }

  function changeTour(tour: string) {
    setForm((current) => ({ ...current, tour, ...tourCatalog[tour] }));
  }

  function submit() {
    setMessage("");
    if (travelDatePassed) {
      setMessage("This booking cannot be edited because the travel date has passed.");
      return;
    }
    if (statusLocked) {
      setMessage("Booking is cancelled. Status cannot be changed.");
      return;
    }
    if (travelDate && travelDate < today) {
      setMessage("Travel date cannot be in the past.");
      return;
    }
    if (!travelDate || travelDate.getTime() === today.getTime()) {
      setMessage("Travel date must be in the future.");
      return;
    }
    if (requestedSeats > editableSeatCapacity) {
      setMessage(`Not enough seats available. Only ${editableSeatCapacity} seats available for this booking.`);
      return;
    }
    if (!statusOptions.includes(form.status)) {
      setMessage("This status change is not allowed.");
      return;
    }
    onSave({ ...form, amount, remainingSeats: seatsAfterEdit });
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); submit(); }}>
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Field label="User"><input required value={form.user} readOnly={isEditing} disabled={isEditing || !editable} onChange={(event) => setForm({ ...form, user: event.target.value })} className="input disabled:bg-slate-50 disabled:text-slate-500" placeholder="Sophie Martin" /></Field>
      <Field label="Tour">{isEditing ? <input required value={form.tour} readOnly disabled className="input bg-slate-50 text-slate-500" /> : <select value={form.tour} disabled={!editable} onChange={(event) => changeTour(event.target.value)} className="input disabled:bg-slate-50 disabled:text-slate-500">{Object.keys(tourCatalog).map((tour) => <option key={tour} value={tour}>{tour}</option>)}</select>}</Field>
      <Field label="Travel Date"><input required type="date" min={toDateInput(addDays(today, 1))} value={form.travelDate} disabled={!editable} onChange={(event) => setForm({ ...form, travelDate: event.target.value })} className="input disabled:bg-slate-50 disabled:text-slate-500" /></Field>
      <Field label="Status"><select value={form.status} disabled={!editable} onChange={(event) => setForm({ ...form, status: event.target.value as BookingStatus })} className="input disabled:bg-slate-50 disabled:text-slate-500">{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></Field>
      <PassengerStepper label="Adults" value={form.adults} minusDisabled={!editable || form.adults <= 1} plusDisabled={!editable || seatLimitReached} onMinus={() => updatePassenger("adults", -1)} onPlus={() => updatePassenger("adults", 1)} />
      <PassengerStepper label="Children" value={form.children} minusDisabled={!editable || form.children <= 0} plusDisabled={!editable || seatLimitReached} onMinus={() => updatePassenger("children", -1)} onPlus={() => updatePassenger("children", 1)} />
      <PassengerStepper label="Infants" value={form.infants} minusDisabled={!editable || form.infants <= 0} plusDisabled={!editable || seatLimitReached} onMinus={() => updatePassenger("infants", -1)} onPlus={() => updatePassenger("infants", 1)} />
      <AmountPreview amount={amount} />
    </div>
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <RemainingSeats value={seatsAfterEdit} />
      <span><span className="font-semibold text-slate-800">Requested Seats:</span> {requestedSeats}</span>
    </div>
    {travelDatePassed ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">This booking cannot be edited because the travel date has passed.</p> : null}
    {statusLocked && !travelDatePassed ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700">Booking is cancelled. Status cannot be changed.</p> : null}
    {hasSeatError ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">Not enough seats available. Only {editableSeatCapacity} seats available for this booking.</p> : null}
    {message ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{message}</p> : null}
    <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={!editable || hasSeatError}>Save Booking</Button></div>
  </form></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>; }
function AmountPreview({ amount }: { amount: number }) { return <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 shadow-sm"><p className="text-sm font-semibold text-brand-700">Total Amount</p><p className="mt-2 text-2xl font-bold text-brand-900">{currency(amount, "VND")}</p></div>; }
function RemainingSeats({ value }: { value: number }) { const state = value <= 0 ? { label: "Full", style: "border-rose-200 bg-rose-50 text-rose-700", dot: "bg-rose-500" } : value <= 5 ? { label: "Limited", style: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" } : { label: "Available", style: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" }; return <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-800">Remaining Seats:</span><span className="font-bold text-slate-900">{value}</span><span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${state.style}`}><span className={`size-2 rounded-full ${state.dot}`} />{state.label}</span></span>; }
function PassengerStepper({ label, value, minusDisabled, plusDisabled, onMinus, onPlus }: { label: string; value: number; minusDisabled: boolean; plusDisabled: boolean; onMinus: () => void; onPlus: () => void }) { return <div className="block text-sm font-semibold"><span>{label}</span><div className="mt-2 flex h-11 overflow-hidden rounded-lg border border-slate-200"><button type="button" onClick={onMinus} disabled={minusDisabled} className="grid w-11 place-items-center border-r border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Decrease ${label}`}><Minus size={16} /></button><div className="grid flex-1 place-items-center bg-white text-sm font-bold">{value}</div><button type="button" onClick={onPlus} disabled={plusDisabled} className="grid w-11 place-items-center border-l border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Increase ${label}`}><Plus size={16} /></button></div></div>; }
function Status({ value }: { value: BookingStatus }) { const style = value === "Confirmed" || value === "Completed" ? "bg-emerald-50 text-emerald-700" : value === "Cancelled" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>; }
function getAllowedStatuses(status: BookingStatus) {
  if (status === "Pending") return ["Pending", "Confirmed", "Cancelled"] as BookingStatus[];
  if (status === "Confirmed") return ["Confirmed", "Completed"] as BookingStatus[];
  return [status];
}
function startOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function addDays(date: Date, days: number) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
function toDateInput(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
