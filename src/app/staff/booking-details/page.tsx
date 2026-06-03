"use client";

import { useState } from "react";
import { Pencil, Plus, ReceiptText, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";

type AgeCategory = "adult" | "child" | "infant";
type Detail = { id: number; bookingId: number; passengerName: string; ageCategory: AgeCategory; price: number; seatNumber: string; specialRequest: string };
const initial: Detail[] = [
  { id: 1, bookingId: 2048, passengerName: "Nguyen Van A", ageCategory: "adult", price: 700000, seatNumber: "A01", specialRequest: "Vegetarian meal" },
  { id: 2, bookingId: 2048, passengerName: "Nguyen Van B", ageCategory: "child", price: 450000, seatNumber: "A02", specialRequest: "" },
  { id: 3, bookingId: 2052, passengerName: "David Lee", ageCategory: "adult", price: 520000, seatNumber: "B01", specialRequest: "Window seat" },
  { id: 4, bookingId: 2054, passengerName: "Emma Johnson", ageCategory: "adult", price: 600000, seatNumber: "C01", specialRequest: "" },
  { id: 5, bookingId: 2054, passengerName: "John Johnson", ageCategory: "adult", price: 600000, seatNumber: "C02", specialRequest: "" },
  { id: 6, bookingId: 2055, passengerName: "Michael Brown", ageCategory: "adult", price: 450000, seatNumber: "D01", specialRequest: "English guide" }
];
const empty: Detail = { id: 0, bookingId: 0, passengerName: "", ageCategory: "adult", price: 0, seatNumber: "", specialRequest: "" };

export default function StaffBookingDetailsPage() {
  const [items, setItems] = useState(initial);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Detail | null>(null);
  const [deleting, setDeleting] = useState<Detail | null>(null);
  const pageSize = 5;
  const visible = items.filter((item) => `${item.bookingId} ${item.passengerName} ${item.ageCategory}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  function save(payload: Detail) { setItems((current) => editing ? current.map((item) => item.id === editing.id ? payload : item) : [...current, { ...payload, id: Math.max(...current.map((item) => item.id), 0) + 1 }]); setEditing(null); setCreating(false); }
  function remove() { if (!deleting) return; setItems((current) => current.filter((item) => item.id !== deleting.id)); setDeleting(null); }
  return <><div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Booking Detail Records</h1><p className="mt-1 text-sm text-slate-500">Manage passenger records for each booking.</p></div><Button onClick={() => setCreating(true)}><Plus size={17} /> Create Detail</Button></div><SearchBox value={query} onChange={(v) => { setQuery(v); setPage(1); }} /><div className="mt-6 overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Record", "Booking ID", "Passenger", "Age", "Price", "Seat", "Request", "Actions"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-bold"><ReceiptText className="mr-2 inline size-4 text-brand-600" />#{item.id}</td><td className="p-3">BK-{item.bookingId}</td><td className="p-3 font-semibold">{item.passengerName}</td><td className="p-3">{item.ageCategory}</td><td className="p-3">{currency(item.price)}</td><td className="p-3">{item.seatNumber || "-"}</td><td className="max-w-44 truncate p-3 text-slate-600">{item.specialRequest || "-"}</td><td className="p-3"><Actions onEdit={() => setEditing(item)} onDelete={() => setDeleting(item)} /></td></tr>)}</tbody></table></div><Pagination page={currentPage} pageCount={pageCount} totalItems={visible.length} pageSize={pageSize} itemLabel="booking details" onPageChange={setPage} /></div>{creating || editing ? <DetailForm initialValue={editing ?? empty} title={editing ? "Edit Booking Detail" : "Create Booking Detail"} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} /> : null}{deleting ? <ConfirmDialog title="Delete Booking Detail" message={`Delete passenger "${deleting.passengerName}"?`} onCancel={() => setDeleting(null)} onConfirm={remove} /> : null}</>;
}

function DetailForm({ title, initialValue, onClose, onSave }: { title: string; initialValue: Detail; onClose: () => void; onSave: (payload: Detail) => void }) { const [form, setForm] = useState(initialValue); return <Modal title={title} onClose={onClose} onSubmit={() => onSave(form)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Booking ID"><input type="number" value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: Number(e.target.value) })} className="input" /></Field><Field label="Passenger Name"><input required value={form.passengerName} onChange={(e) => setForm({ ...form, passengerName: e.target.value })} className="input" /></Field><Field label="Age Category"><select value={form.ageCategory} onChange={(e) => setForm({ ...form, ageCategory: e.target.value as AgeCategory })} className="input"><option>adult</option><option>child</option><option>infant</option></select></Field><Field label="Price"><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="input" /></Field><Field label="Seat Number"><input value={form.seatNumber} onChange={(e) => setForm({ ...form, seatNumber: e.target.value })} className="input" /></Field><Field label="Special Request"><input value={form.specialRequest} onChange={(e) => setForm({ ...form, specialRequest: e.target.value })} className="input" /></Field></div></Modal>; }
function SearchBox({ value, onChange }: { value: string; onChange: (value: string) => void }) { return <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search booking details..." /></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>; }
function Modal({ title, children, onClose, onSubmit }: { title: string; children: React.ReactNode; onClose: () => void; onSubmit: () => void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100"><X size={18} /></button></div><div className="mt-6">{children}</div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div></form></div>; }
function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) { return <span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={onEdit}>Edit</Button><button type="button" onClick={onDelete} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"><Trash2 size={15} /></button></span>; }
