"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, Minus, Pencil, Plus, Search, XCircle } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled" | "expired";
type Booking = {
  id: number;
  code: string;
  customer: string;
  tour: string;
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  remainingSeats: number;
  adults: number;
  children: number;
  infants: number;
  amount: number;
  travelDate: string;
  status: BookingStatus;
};

const tourCatalog: Record<string, { adultPrice: number; childPrice: number; infantPrice: number; remainingSeats: number }> = {
  "Saigon One Day Tour": { adultPrice: 150000, childPrice: 80000, infantPrice: 0, remainingSeats: 5 },
  "Cu Chi Heritage Route": { adultPrice: 260000, childPrice: 120000, infantPrice: 0, remainingSeats: 6 },
  "Ha Long Weekend": { adultPrice: 450000, childPrice: 300000, infantPrice: 0, remainingSeats: 4 },
  "City Museum Route": { adultPrice: 450000, childPrice: 160000, infantPrice: 0, remainingSeats: 8 },
  "Central Vietnam Discovery": { adultPrice: 450000, childPrice: 220000, infantPrice: 0, remainingSeats: 3 },
  "Market Food Walk": { adultPrice: 350000, childPrice: 150000, infantPrice: 0, remainingSeats: 7 }
};

function bookingAmount(booking: Pick<Booking, "adults" | "children" | "infants" | "adultPrice" | "childPrice" | "infantPrice">) {
  return booking.adults * booking.adultPrice + booking.children * booking.childPrice + booking.infants * booking.infantPrice;
}

const initial: Booking[] = ([
  { id: 1, code: "BK-2048", customer: "Sophie Martin", tour: "Saigon One Day Tour", adults: 2, children: 1, infants: 0, travelDate: "2026-06-18", status: "confirmed", ...tourCatalog["Saigon One Day Tour"] },
  { id: 2, code: "BK-2052", customer: "David Lee", tour: "Cu Chi Heritage Route", adults: 2, children: 0, infants: 0, travelDate: "2026-07-04", status: "pending", ...tourCatalog["Cu Chi Heritage Route"] },
  { id: 3, code: "BK-2054", customer: "Emma Johnson", tour: "Ha Long Weekend", adults: 2, children: 2, infants: 0, travelDate: "2026-07-12", status: "confirmed", ...tourCatalog["Ha Long Weekend"] },
  { id: 4, code: "BK-2055", customer: "Michael Brown", tour: "City Museum Route", adults: 1, children: 0, infants: 0, travelDate: "2026-07-20", status: "pending", ...tourCatalog["City Museum Route"] },
  { id: 5, code: "BK-1988", customer: "Anna Wilson", tour: "Central Vietnam Discovery", adults: 2, children: 0, infants: 1, travelDate: "2026-04-21", status: "cancelled", ...tourCatalog["Central Vietnam Discovery"] },
  { id: 6, code: "BK-2060", customer: "Minh Nguyen", tour: "Market Food Walk", adults: 1, children: 0, infants: 0, travelDate: "2026-08-01", status: "expired", ...tourCatalog["Market Food Walk"] }
] satisfies Array<Omit<Booking, "amount">>).map((booking) => ({ ...booking, amount: bookingAmount(booking) }));

export default function StaffBookingsPage() {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Booking | null>(null);
  const pageSize = 5;
  const visible = items.filter((item) => `${item.code} ${item.customer} ${item.tour} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  function save(payload: Booking) { setItems((current) => current.map((item) => item.id === payload.id ? { ...payload, amount: bookingAmount(payload) } : item)); setEditing(null); }
  function cancel(item: Booking) { setItems((current) => current.map((booking) => booking.id === item.id ? { ...booking, status: "cancelled" } : booking)); }
  return <><StaffTable title="Staff Bookings" desc="Update bookings and cancel unpaid bookings." query={query} setQuery={(v) => { setQuery(v); setPage(1); }} heads={["Code", "Customer", "Tour", "Date", "Passengers", "Amount", "Status", "Actions"]}>{rows.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-bold"><CalendarCheck className="mr-2 inline size-4 text-brand-600" />{item.code}</td><td className="p-3">{item.customer}</td><td className="p-3 text-slate-600">{item.tour}</td><td className="p-3">{item.travelDate}</td><td className="p-3">{item.adults} adult, {item.children} child, {item.infants} infant</td><td className="p-3 font-semibold">{currency(item.amount)}</td><td className="p-3"><Status value={item.status} /></td><td className="p-3"><span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}><Pencil size={15} /> Edit</Button><button type="button" onClick={() => cancel(item)} disabled={item.status === "cancelled"} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"><XCircle size={15} /></button></span></td></tr>)}</StaffTable><Pagination page={currentPage} pageCount={pageCount} totalItems={visible.length} pageSize={pageSize} itemLabel="bookings" onPageChange={setPage} />{editing ? <BookingModal item={editing} onClose={() => setEditing(null)} onSave={save} /> : null}</>;
}

function BookingModal({ item, onClose, onSave }: { item: Booking; onClose: () => void; onSave: (item: Booking) => void }) {
  const [form, setForm] = useState(item);
  const [message, setMessage] = useState("");
  const today = useMemo(() => startOfDay(new Date()), []);
  const totalSeats = form.adults + form.children;
  const amount = bookingAmount(form);
  const travelDate = form.travelDate ? startOfDay(new Date(`${form.travelDate}T00:00:00`)) : null;
  const travelDatePassed = Boolean(travelDate && travelDate < today);
  const statusLocked = item.status === "cancelled" || item.status === "expired" || item.status === "completed";
  const editable = !travelDatePassed && !statusLocked;
  const originalRequestedSeats = item.adults + item.children;
  const editableSeatCapacity = form.remainingSeats + originalRequestedSeats;
  const seatsAfterEdit = Math.max(0, editableSeatCapacity - totalSeats);
  const seatLimitReached = totalSeats >= editableSeatCapacity;
  const hasSeatError = totalSeats > editableSeatCapacity;
  const statusOptions = getAllowedStatuses(item.status);

  function updatePassenger(field: "adults" | "children" | "infants", delta: number) {
    const minimum = field === "adults" ? 1 : 0;
    setForm((current) => ({ ...current, [field]: Math.max(minimum, current[field] + delta) }));
  }

  function submit() {
    setMessage("");
    if (travelDatePassed) {
      setMessage("This booking cannot be edited because the travel date has passed.");
      return;
    }
    if (statusLocked) {
      setMessage(item.status === "cancelled" ? "Booking is cancelled. Status cannot be changed." : "This booking status cannot be changed.");
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
    if (totalSeats > editableSeatCapacity) {
      setMessage(`Not enough seats available. Only ${editableSeatCapacity} seats available for this booking.`);
      return;
    }
    if (!statusOptions.includes(form.status)) {
      setMessage("This status change is not allowed.");
      return;
    }
    onSave({ ...form, amount, remainingSeats: seatsAfterEdit });
  }

  return <Modal title="Edit Booking" onClose={onClose} onSubmit={submit} saveDisabled={!editable || hasSeatError}>
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Customer"><input value={form.customer} readOnly disabled className="input bg-slate-50 text-slate-500" /></Field>
      <Field label="Tour"><input value={form.tour} readOnly disabled className="input bg-slate-50 text-slate-500" /></Field>
      <Field label="Travel Date"><input type="date" min={toDateInput(addDays(today, 1))} value={form.travelDate} disabled={!editable} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} className="input disabled:bg-slate-50 disabled:text-slate-500" /></Field>
      <Field label="Status"><select value={form.status} disabled={!editable} onChange={(e) => setForm({ ...form, status: e.target.value as BookingStatus })} className="input disabled:bg-slate-50 disabled:text-slate-500">{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></Field>
      <PassengerStepper label="Adults" value={form.adults} minusDisabled={!editable || form.adults <= 1} plusDisabled={!editable || seatLimitReached} onMinus={() => updatePassenger("adults", -1)} onPlus={() => updatePassenger("adults", 1)} />
      <PassengerStepper label="Children" value={form.children} minusDisabled={!editable || form.children <= 0} plusDisabled={!editable || seatLimitReached} onMinus={() => updatePassenger("children", -1)} onPlus={() => updatePassenger("children", 1)} />
      <PassengerStepper label="Infants" value={form.infants} minusDisabled={!editable || form.infants <= 0} plusDisabled={!editable || seatLimitReached} onMinus={() => updatePassenger("infants", -1)} onPlus={() => updatePassenger("infants", 1)} />
      <AmountPreview amount={amount} />
    </div>
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
      <RemainingSeats value={seatsAfterEdit} />
      <span><span className="font-semibold text-slate-800">Requested Seats:</span> {totalSeats}</span>
    </div>
    {travelDatePassed ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">This booking cannot be edited because the travel date has passed.</p> : null}
    {statusLocked && !travelDatePassed ? <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-700">{item.status === "cancelled" ? "Booking is cancelled. Status cannot be changed." : "This booking status cannot be changed."}</p> : null}
    {hasSeatError ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">Not enough seats available. Only {editableSeatCapacity} seats available for this booking.</p> : null}
    {message ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{message}</p> : null}
  </Modal>;
}

function StaffTable({ title, desc, query, setQuery, heads, children }: { title: string; desc: string; query: string; setQuery: (v: string) => void; heads: string[]; children: React.ReactNode }) { return <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold">{title}</h1><p className="mt-1 text-sm text-slate-500">{desc}</p><div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search..." /></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{heads.map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div></div>; }
function Modal({ title, children, onClose, onSubmit, saveDisabled }: { title: string; children: React.ReactNode; onClose: () => void; onSubmit: () => void; saveDisabled?: boolean }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}><h2 className="text-xl font-bold">{title}</h2><div className="mt-6">{children}</div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saveDisabled}>Save</Button></div></form></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>; }
function AmountPreview({ amount }: { amount: number }) { return <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 shadow-sm"><p className="text-sm font-semibold text-brand-700">Total Amount</p><p className="mt-2 text-2xl font-bold text-brand-900">{currency(amount)}</p></div>; }
function RemainingSeats({ value }: { value: number }) { const state = value <= 0 ? { label: "Full", style: "border-rose-200 bg-rose-50 text-rose-700", dot: "bg-rose-500" } : value <= 5 ? { label: "Limited", style: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" } : { label: "Available", style: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" }; return <span className="flex flex-wrap items-center gap-2"><span className="font-semibold text-slate-800">Remaining Seats:</span><span className="font-bold text-slate-900">{value}</span><span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${state.style}`}><span className={`size-2 rounded-full ${state.dot}`} />{state.label}</span></span>; }
function PassengerStepper({ label, value, minusDisabled, plusDisabled, onMinus, onPlus }: { label: string; value: number; minusDisabled: boolean; plusDisabled: boolean; onMinus: () => void; onPlus: () => void }) { return <div className="block text-sm font-semibold"><span>{label}</span><div className="mt-2 flex h-11 overflow-hidden rounded-lg border border-slate-200"><button type="button" onClick={onMinus} disabled={minusDisabled} className="grid w-11 place-items-center border-r border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Decrease ${label}`}><Minus size={16} /></button><div className="grid flex-1 place-items-center bg-white text-sm font-bold">{value}</div><button type="button" onClick={onPlus} disabled={plusDisabled} className="grid w-11 place-items-center border-l border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50" aria-label={`Increase ${label}`}><Plus size={16} /></button></div></div>; }
function Status({ value }: { value: string }) { const style = value === "confirmed" || value === "paid" || value === "approved" || value === "completed" ? "bg-emerald-50 text-emerald-700" : value === "cancelled" || value === "failed" || value === "hidden" || value === "expired" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>; }
function getAllowedStatuses(status: BookingStatus) {
  if (status === "pending") return ["pending", "confirmed", "cancelled"] as BookingStatus[];
  if (status === "confirmed") return ["confirmed", "completed"] as BookingStatus[];
  return [status];
}
function startOfDay(date: Date) { return new Date(date.getFullYear(), date.getMonth(), date.getDate()); }
function addDays(date: Date, days: number) { const next = new Date(date); next.setDate(next.getDate() + days); return next; }
function toDateInput(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
