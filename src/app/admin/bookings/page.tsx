"use client";

import { useState } from "react";
import { CalendarCheck, Pencil, Plus, Search, X } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";

type BookingStatus = "Pending" | "Confirmed" | "Cancelled";
type ManagedBooking = { id: string; user: string; tour: string; travelDate: string; adults: number; children: number; infants: number; amount: number; status: BookingStatus };

const initialBookings: ManagedBooking[] = [
  { id: "BK-2048", user: "Sophie Martin", tour: "Saigon One Day Tour", travelDate: "2026-06-18", adults: 2, children: 1, infants: 0, amount: 387, status: "Confirmed" },
  { id: "BK-2052", user: "David Lee", tour: "Historic Ho Chi Minh City Tour", travelDate: "2026-07-04", adults: 2, children: 0, infants: 0, amount: 398, status: "Pending" },
  { id: "BK-2054", user: "Emma Johnson", tour: "Ha Long Bay Weekend", travelDate: "2026-07-12", adults: 2, children: 2, infants: 0, amount: 620, status: "Confirmed" },
  { id: "BK-2055", user: "Michael Brown", tour: "Saigon One Day Tour", travelDate: "2026-07-20", adults: 1, children: 0, infants: 0, amount: 129, status: "Confirmed" },
  { id: "BK-2056", user: "Minh Nguyen", tour: "Cu Chi Heritage Route", travelDate: "2026-08-02", adults: 3, children: 0, infants: 0, amount: 420, status: "Pending" },
  { id: "BK-1988", user: "Anna Wilson", tour: "Central Vietnam Discovery", travelDate: "2026-04-21", adults: 2, children: 0, infants: 1, amount: 356, status: "Cancelled" }
];
const emptyBooking: ManagedBooking = { id: "", user: "", tour: "", travelDate: "", adults: 1, children: 0, infants: 0, amount: 0, status: "Pending" };

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
    setItems((current) => editing
      ? current.map((item) => item.id === editing.id ? payload : item)
      : [...current, { ...payload, id: `BK-${Math.max(...current.map((item) => Number(item.id.replace("BK-", ""))), 2000) + 1}` }]);
    setEditing(null);
    setCreating(false);
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Booking Management</h1><p className="mt-1 text-sm text-slate-500">Create bookings and update passenger totals or booking status.</p></div><Button onClick={() => setCreating(true)}><Plus size={17} /> Create Booking</Button></div>
      <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search bookings..." /></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Booking ID", "User", "Tour", "Travel Date", "Passengers", "Amount", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {paginatedItems.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-bold"><CalendarCheck className="mr-2 inline size-4 text-brand-600" />{item.id}</td><td className="p-3">{item.user}</td><td className="p-3 text-slate-600">{item.tour}</td><td className="p-3">{item.travelDate}</td><td className="p-3">{item.adults} adult, {item.children} child, {item.infants} infant</td><td className="p-3 font-semibold">{currency(item.amount)}</td><td className="p-3"><Status value={item.status} /></td><td className="p-3"><Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}><Pencil size={15} /> Edit</Button></td></tr>)}
      </tbody></table></div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="bookings" onPageChange={setPage} />
    </div>
    {creating || editing ? <BookingForm key={editing?.id ?? "create"} title={editing ? "Edit Booking" : "Create Booking"} initialValue={editing ?? emptyBooking} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} /> : null}
  </>;
}

function BookingForm({ title, initialValue, onClose, onSave }: { title: string; initialValue: ManagedBooking; onClose: () => void; onSave: (payload: ManagedBooking) => void }) {
  const [form, setForm] = useState(initialValue);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Field label="User"><input required value={form.user} onChange={(event) => setForm({ ...form, user: event.target.value })} className="input" placeholder="Sophie Martin" /></Field>
      <Field label="Tour"><input required value={form.tour} onChange={(event) => setForm({ ...form, tour: event.target.value })} className="input" placeholder="Saigon One Day Tour" /></Field>
      <Field label="Travel Date"><input required type="date" value={form.travelDate} onChange={(event) => setForm({ ...form, travelDate: event.target.value })} className="input" /></Field>
      <Field label="Amount"><input required min="0" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} className="input" /></Field>
      <Field label="Adults"><input required min="1" type="number" value={form.adults} onChange={(event) => setForm({ ...form, adults: Number(event.target.value) })} className="input" /></Field>
      <Field label="Children"><input required min="0" type="number" value={form.children} onChange={(event) => setForm({ ...form, children: Number(event.target.value) })} className="input" /></Field>
      <Field label="Infants"><input required min="0" type="number" value={form.infants} onChange={(event) => setForm({ ...form, infants: Number(event.target.value) })} className="input" /></Field>
      <Field label="Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BookingStatus })} className="input"><option>Pending</option><option>Confirmed</option><option>Cancelled</option></select></Field>
    </div>
    <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save Booking</Button></div>
  </form></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>; }
function Status({ value }: { value: BookingStatus }) { const style = value === "Confirmed" ? "bg-emerald-50 text-emerald-700" : value === "Cancelled" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>; }
