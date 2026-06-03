"use client";

import { useState } from "react";
import { CalendarCheck, Pencil, Search, XCircle } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";

type BookingStatus = "pending" | "confirmed" | "cancelled" | "expired";
type Booking = { id: number; code: string; customer: string; tour: string; amount: number; travelDate: string; status: BookingStatus };
const initial: Booking[] = [
  { id: 1, code: "BK-2048", customer: "Sophie Martin", tour: "Saigon One Day Tour", amount: 700000, travelDate: "2026-06-18", status: "confirmed" },
  { id: 2, code: "BK-2052", customer: "David Lee", tour: "Cu Chi Heritage Route", amount: 520000, travelDate: "2026-07-04", status: "pending" },
  { id: 3, code: "BK-2054", customer: "Emma Johnson", tour: "Ha Long Weekend", amount: 1200000, travelDate: "2026-07-12", status: "confirmed" },
  { id: 4, code: "BK-2055", customer: "Michael Brown", tour: "City Museum Route", amount: 450000, travelDate: "2026-07-20", status: "pending" },
  { id: 5, code: "BK-1988", customer: "Anna Wilson", tour: "Central Vietnam Discovery", amount: 900000, travelDate: "2026-04-21", status: "cancelled" },
  { id: 6, code: "BK-2060", customer: "Minh Nguyen", tour: "Market Food Walk", amount: 350000, travelDate: "2026-08-01", status: "expired" }
];

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
  function save(payload: Booking) { setItems((current) => current.map((item) => item.id === payload.id ? payload : item)); setEditing(null); }
  function cancel(item: Booking) { setItems((current) => current.map((booking) => booking.id === item.id ? { ...booking, status: "cancelled" } : booking)); }
  return <><StaffTable title="Staff Bookings" desc="Update bookings and cancel unpaid bookings." query={query} setQuery={(v) => { setQuery(v); setPage(1); }} heads={["Code", "Customer", "Tour", "Date", "Amount", "Status", "Actions"]}>{rows.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-bold"><CalendarCheck className="mr-2 inline size-4 text-brand-600" />{item.code}</td><td className="p-3">{item.customer}</td><td className="p-3 text-slate-600">{item.tour}</td><td className="p-3">{item.travelDate}</td><td className="p-3">{currency(item.amount)}</td><td className="p-3"><Status value={item.status} /></td><td className="p-3"><span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}><Pencil size={15} /> Edit</Button><button type="button" onClick={() => cancel(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"><XCircle size={15} /></button></span></td></tr>)}</StaffTable><Pagination page={currentPage} pageCount={pageCount} totalItems={visible.length} pageSize={pageSize} itemLabel="bookings" onPageChange={setPage} />{editing ? <BookingModal item={editing} onClose={() => setEditing(null)} onSave={save} /> : null}</>;
}
function BookingModal({ item, onClose, onSave }: { item: Booking; onClose: () => void; onSave: (item: Booking) => void }) { const [form, setForm] = useState(item); return <Modal title="Edit Booking" onClose={onClose} onSubmit={() => onSave(form)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Customer"><input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} className="input" /></Field><Field label="Tour"><input value={form.tour} onChange={(e) => setForm({ ...form, tour: e.target.value })} className="input" /></Field><Field label="Travel Date"><input type="date" value={form.travelDate} onChange={(e) => setForm({ ...form, travelDate: e.target.value })} className="input" /></Field><Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as BookingStatus })} className="input"><option>pending</option><option>confirmed</option><option>cancelled</option><option>expired</option></select></Field></div></Modal>; }

function StaffTable({ title, desc, query, setQuery, heads, children }: { title: string; desc: string; query: string; setQuery: (v: string) => void; heads: string[]; children: React.ReactNode }) { return <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><h1 className="text-2xl font-bold">{title}</h1><p className="mt-1 text-sm text-slate-500">{desc}</p><div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search..." /></div><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{heads.map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{children}</tbody></table></div></div>; }
function Modal({ title, children, onClose, onSubmit }: { title: string; children: React.ReactNode; onClose: () => void; onSubmit: () => void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}><h2 className="text-xl font-bold">{title}</h2><div className="mt-6">{children}</div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div></form></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>; }
function Status({ value }: { value: string }) { const style = value === "confirmed" || value === "paid" || value === "approved" ? "bg-emerald-50 text-emerald-700" : value === "cancelled" || value === "failed" || value === "hidden" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>; }
