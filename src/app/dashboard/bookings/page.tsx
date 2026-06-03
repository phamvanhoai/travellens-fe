"use client";

import { useState } from "react";
import { CalendarCheck, Pencil, Search, X } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";

type BookingStatus = "Pending" | "Confirmed" | "Cancelled";

type UserBooking = {
  id: string;
  tour: string;
  date: string;
  adults: number;
  children: number;
  infants: number;
  specialRequest: string;
  status: BookingStatus;
  amount: number;
};

const initialBookings: UserBooking[] = [
  { id: "BK-2048", tour: "Saigon One Day Tour", date: "2026-06-18", adults: 2, children: 1, infants: 0, specialRequest: "Vegetarian meal", status: "Confirmed", amount: 387 },
  { id: "BK-2052", tour: "Cu Chi Heritage Route", date: "2026-07-04", adults: 2, children: 0, infants: 0, specialRequest: "English guide", status: "Pending", amount: 398 },
  { id: "BK-2054", tour: "Ha Long Bay Weekend", date: "2026-07-12", adults: 2, children: 2, infants: 0, specialRequest: "", status: "Confirmed", amount: 620 },
  { id: "BK-2055", tour: "Market Food Walk", date: "2026-07-20", adults: 1, children: 0, infants: 0, specialRequest: "No seafood", status: "Pending", amount: 129 },
  { id: "BK-1988", tour: "Central Vietnam Discovery", date: "2026-04-21", adults: 2, children: 0, infants: 1, specialRequest: "", status: "Cancelled", amount: 356 },
  { id: "BK-2060", tour: "City Museum Route", date: "2026-08-01", adults: 3, children: 0, infants: 0, specialRequest: "Wheelchair support", status: "Confirmed", amount: 450 }
];

export default function BookingsPage() {
  const [items, setItems] = useState(initialBookings);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<UserBooking | null>(null);
  const pageSize = 5;

  const visibleItems = items.filter((item) =>
    `${item.id} ${item.tour} ${item.status}`.toLowerCase().includes(query.toLowerCase())
  );
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function saveBooking(payload: UserBooking) {
    setItems((current) => current.map((item) => item.id === payload.id ? payload : item));
    setEditing(null);
  }

  function cancelBooking(item: UserBooking) {
    setItems((current) => current.map((booking) => booking.id === item.id ? { ...booking, status: "Cancelled" } : booking));
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Booking History</h1>
            <p className="mt-1 text-sm text-slate-500">Search and update your existing tour bookings.</p>
          </div>
        </div>

        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-3 size-5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
            placeholder="Search bookings..."
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[940px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Booking ID", "Tour", "Date", "Passengers", "Status", "Amount", "Actions"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr>
            </thead>
            <tbody>
              {paginatedItems.map((booking) => (
                <tr key={booking.id} className="border-t border-slate-100">
                  <td className="p-3 font-bold"><CalendarCheck className="mr-2 inline size-4 text-brand-600" />{booking.id}</td>
                  <td className="p-3">{booking.tour}</td>
                  <td className="p-3">{booking.date}</td>
                  <td className="p-3">{booking.adults} adult, {booking.children} child, {booking.infants} infant</td>
                  <td className="p-3"><Status value={booking.status} /></td>
                  <td className="p-3">{currency(booking.amount)}</td>
                  <td className="p-3">
                    <span className="flex gap-2">
                      <Button variant="outline" className="h-9 px-3" onClick={() => setEditing(booking)}><Pencil size={15} /> Edit</Button>
                      <Button variant="outline" className="h-9 px-3" onClick={() => cancelBooking(booking)}>Cancel</Button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="bookings" onPageChange={setPage} />
      </div>

      {editing ? (
        <BookingForm
          key={editing.id}
          title="Edit Booking"
          initialValue={editing}
          onClose={() => {
            setEditing(null);
          }}
          onSave={saveBooking}
        />
      ) : null}
    </>
  );
}

function BookingForm({ title, initialValue, onClose, onSave }: { title: string; initialValue: UserBooking; onClose: () => void; onSave: (payload: UserBooking) => void }) {
  const [form, setForm] = useState(initialValue);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form
        className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label="Tour"><input required value={form.tour} onChange={(event) => setForm({ ...form, tour: event.target.value })} className="input" placeholder="Saigon One Day Tour" /></Field></div>
          <Field label="Travel Date"><input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="input" /></Field>
          <Field label="Amount"><input required min="0" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} className="input" /></Field>
          <Field label="Adults"><input required min="1" type="number" value={form.adults} onChange={(event) => setForm({ ...form, adults: Number(event.target.value) })} className="input" /></Field>
          <Field label="Children"><input required min="0" type="number" value={form.children} onChange={(event) => setForm({ ...form, children: Number(event.target.value) })} className="input" /></Field>
          <Field label="Infants"><input required min="0" type="number" value={form.infants} onChange={(event) => setForm({ ...form, infants: Number(event.target.value) })} className="input" /></Field>
          <Field label="Status"><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BookingStatus })} className="input"><option>Pending</option><option>Confirmed</option><option>Cancelled</option></select></Field>
          <div className="sm:col-span-2"><Field label="Special Request"><textarea value={form.specialRequest} onChange={(event) => setForm({ ...form, specialRequest: event.target.value })} className="input min-h-24 py-3" placeholder="Optional request..." /></Field></div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Booking</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>;
}

function Status({ value }: { value: BookingStatus }) {
  const style = value === "Confirmed" ? "bg-emerald-50 text-emerald-700" : value === "Cancelled" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>;
}
