"use client";

import { useState } from "react";
import { Pencil, Percent, Plus, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";

type CouponStatus = "active" | "inactive" | "expired" | "deleted";
type DiscountType = "percentage" | "fixed";
type Coupon = { id: number; code: string; name: string; discountType: DiscountType; discountValue: number; minOrder: number; usageLimit: number; startDate: string; endDate: string; status: CouponStatus };

const initialCoupons: Coupon[] = [
  { id: 1, code: "SUMMER20", name: "Summer Discount", discountType: "percentage", discountValue: 20, minOrder: 500000, usageLimit: 100, startDate: "2026-06-01", endDate: "2026-06-30", status: "active" },
  { id: 2, code: "CITY10", name: "City Tour Deal", discountType: "percentage", discountValue: 10, minOrder: 300000, usageLimit: 80, startDate: "2026-06-01", endDate: "2026-08-31", status: "active" },
  { id: 3, code: "FAMILY50K", name: "Family Fixed Discount", discountType: "fixed", discountValue: 50000, minOrder: 700000, usageLimit: 50, startDate: "2026-05-01", endDate: "2026-07-31", status: "inactive" },
  { id: 4, code: "OLDTRIP", name: "Old Campaign", discountType: "percentage", discountValue: 15, minOrder: 400000, usageLimit: 40, startDate: "2026-01-01", endDate: "2026-02-01", status: "expired" },
  { id: 5, code: "WEEKEND", name: "Weekend Special", discountType: "fixed", discountValue: 100000, minOrder: 900000, usageLimit: 70, startDate: "2026-06-15", endDate: "2026-09-15", status: "active" },
  { id: 6, code: "LOCAL5", name: "Local Visitor", discountType: "percentage", discountValue: 5, minOrder: 200000, usageLimit: 120, startDate: "2026-06-01", endDate: "2026-12-31", status: "active" }
];
const emptyCoupon: Coupon = { id: 0, code: "", name: "", discountType: "percentage", discountValue: 0, minOrder: 0, usageLimit: 0, startDate: "", endDate: "", status: "active" };

export default function StaffCouponsPage() {
  const [items, setItems] = useState(initialCoupons);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const pageSize = 5;
  const visible = items.filter((item) => `${item.code} ${item.name} ${item.status}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function save(payload: Coupon) {
    setItems((current) => editing ? current.map((item) => item.id === editing.id ? payload : item) : [...current, { ...payload, id: Math.max(...current.map((item) => item.id), 0) + 1 }]);
    setEditing(null); setCreating(false);
  }

  function remove() {
    if (!deleting) return;
    setItems((current) => current.filter((item) => item.id !== deleting.id));
    setDeleting(null);
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Coupon Management</h1><p className="mt-1 text-sm text-slate-500">Create and maintain staff coupon campaigns.</p></div><Button onClick={() => setCreating(true)}><Plus size={17} /> Create Coupon</Button></div>
      <SearchBox value={query} onChange={(value) => { setQuery(value); setPage(1); }} placeholder="Search coupons..." />
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Code", "Name", "Discount", "Min Order", "Usage", "Dates", "Status", "Actions"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{rows.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-bold"><Percent className="mr-2 inline size-4 text-brand-600" />{item.code}</td><td className="p-3">{item.name}</td><td className="p-3">{item.discountType === "percentage" ? `${item.discountValue}%` : `${item.discountValue.toLocaleString()} VND`}</td><td className="p-3">{item.minOrder.toLocaleString()} VND</td><td className="p-3">{item.usageLimit}</td><td className="p-3 text-slate-600">{item.startDate} - {item.endDate}</td><td className="p-3"><Status value={item.status} /></td><td className="p-3"><Actions onEdit={() => setEditing(item)} onDelete={() => setDeleting(item)} /></td></tr>)}</tbody></table></div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={visible.length} pageSize={pageSize} itemLabel="coupons" onPageChange={setPage} />
    </div>
    {creating || editing ? <CouponForm initialValue={editing ?? emptyCoupon} title={editing ? "Edit Coupon" : "Create Coupon"} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} /> : null}
    {deleting ? <ConfirmDialog title="Delete Coupon" message={`Delete coupon "${deleting.code}"?`} onCancel={() => setDeleting(null)} onConfirm={remove} /> : null}
  </>;
}

function CouponForm({ title, initialValue, onClose, onSave }: { title: string; initialValue: Coupon; onClose: () => void; onSave: (payload: Coupon) => void }) {
  const [form, setForm] = useState(initialValue);
  return <Modal title={title} onClose={onClose} onSubmit={() => onSave(form)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Code"><input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input" /></Field><Field label="Name"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></Field><Field label="Discount Type"><select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })} className="input"><option value="percentage">percentage</option><option value="fixed">fixed</option></select></Field><Field label="Discount Value"><input required type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: Number(e.target.value) })} className="input" /></Field><Field label="Min Order"><input type="number" value={form.minOrder} onChange={(e) => setForm({ ...form, minOrder: Number(e.target.value) })} className="input" /></Field><Field label="Usage Limit"><input type="number" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: Number(e.target.value) })} className="input" /></Field><Field label="Start Date"><input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" /></Field><Field label="End Date"><input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" /></Field><Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CouponStatus })} className="input"><option>active</option><option>inactive</option><option>expired</option><option>deleted</option></select></Field></div></Modal>;
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder={placeholder} /></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>; }
function Modal({ title, children, onClose, onSubmit }: { title: string; children: React.ReactNode; onClose: () => void; onSubmit: () => void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(e) => { e.preventDefault(); onSubmit(); }}><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100"><X size={18} /></button></div><div className="mt-6">{children}</div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save</Button></div></form></div>; }
function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) { return <span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={onEdit}><Pencil size={15} /> Edit</Button><button type="button" onClick={onDelete} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"><Trash2 size={15} /></button></span>; }
function Status({ value }: { value: string }) { const style = value === "active" ? "bg-emerald-50 text-emerald-700" : value === "deleted" ? "bg-rose-50 text-rose-700" : value === "expired" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>; }
