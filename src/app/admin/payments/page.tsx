"use client";

import { useState } from "react";
import { CreditCard, Pencil, Plus, Search, X } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";

type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";
type RefundStatus = "None" | "Requested" | "Processing" | "Completed";
type ManagedPayment = { id: string; bookingId: string; amount: number; currencyCode: string; method: string; transactionCode: string; paymentStatus: PaymentStatus; refundStatus: RefundStatus };

const initialPayments: ManagedPayment[] = [
  { id: "PAY-3001", bookingId: "BK-2048", amount: 387, currencyCode: "VND", method: "Visa", transactionCode: "TXN-827391", paymentStatus: "Paid", refundStatus: "None" },
  { id: "PAY-3002", bookingId: "BK-2052", amount: 398, currencyCode: "VND", method: "PayPal", transactionCode: "TXN-827402", paymentStatus: "Pending", refundStatus: "None" },
  { id: "PAY-3003", bookingId: "BK-2054", amount: 620, currencyCode: "VND", method: "Mastercard", transactionCode: "TXN-827455", paymentStatus: "Paid", refundStatus: "None" },
  { id: "PAY-3004", bookingId: "BK-2055", amount: 129, currencyCode: "VND", method: "Apple Pay", transactionCode: "TXN-827461", paymentStatus: "Paid", refundStatus: "None" },
  { id: "PAY-3005", bookingId: "BK-2056", amount: 420, currencyCode: "VND", method: "Visa", transactionCode: "TXN-827498", paymentStatus: "Failed", refundStatus: "None" },
  { id: "PAY-2988", bookingId: "BK-1988", amount: 356, currencyCode: "VND", method: "Visa", transactionCode: "TXN-826910", paymentStatus: "Refunded", refundStatus: "Completed" }
];
const emptyPayment: ManagedPayment = { id: "", bookingId: "", amount: 0, currencyCode: "VND", method: "Visa", transactionCode: "", paymentStatus: "Pending", refundStatus: "None" };

export default function AdminPaymentsPage() {
  const [items, setItems] = useState(initialPayments);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ManagedPayment | null>(null);
  const pageSize = 5;
  const visibleItems = items.filter((item) => `${item.id} ${item.bookingId} ${item.transactionCode} ${item.paymentStatus}`.toLowerCase().includes(query.toLowerCase()));
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function save(payload: ManagedPayment) {
    setItems((current) => editing
      ? current.map((item) => item.id === editing.id ? payload : item)
      : [...current, { ...payload, id: `PAY-${Math.max(...current.map((item) => Number(item.id.replace("PAY-", ""))), 3000) + 1}` }]);
    setEditing(null);
    setCreating(false);
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h1 className="text-2xl font-bold">Payment Management</h1><p className="mt-1 text-sm text-slate-500">Create transactions and update payment or refund status.</p></div><Button onClick={() => setCreating(true)}><Plus size={17} /> Create Payment</Button></div>
      <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search payments..." /></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[1040px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Payment ID", "Booking ID", "Amount", "Method", "Transaction Code", "Payment Status", "Refund Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {paginatedItems.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="p-3 font-bold"><CreditCard className="mr-2 inline size-4 text-brand-600" />{item.id}</td><td className="p-3 font-semibold">{item.bookingId}</td><td className="p-3">{currency(item.amount, "VND")} <span className="text-xs text-slate-500">VND</span></td><td className="p-3">{item.method}</td><td className="p-3 text-slate-600">{item.transactionCode}</td><td className="p-3"><PaymentBadge value={item.paymentStatus} /></td><td className="p-3"><RefundBadge value={item.refundStatus} /></td><td className="p-3"><Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}><Pencil size={15} /> Edit</Button></td></tr>)}
      </tbody></table></div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="payments" onPageChange={setPage} />
    </div>
    {creating || editing ? <PaymentForm key={editing?.id ?? "create"} title={editing ? "Edit Payment" : "Create Payment"} initialValue={editing ?? emptyPayment} onClose={() => { setEditing(null); setCreating(false); }} onSave={save} /> : null}
  </>;
}

function PaymentForm({ title, initialValue, onClose, onSave }: { title: string; initialValue: ManagedPayment; onClose: () => void; onSave: (payload: ManagedPayment) => void }) {
  const [form, setForm] = useState(initialValue);
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); onSave(form); }}>
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Field label="Booking ID"><input required value={form.bookingId} onChange={(event) => setForm({ ...form, bookingId: event.target.value })} className="input" placeholder="BK-2048" /></Field>
      <Field label="Amount"><input required min="0" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} className="input" /></Field>
      <Field label="Currency"><select value="VND" disabled className="input bg-slate-50"><option>VND</option></select></Field>
      <Field label="Payment Method"><select value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value })} className="input"><option>Visa</option><option>Mastercard</option><option>PayPal</option><option>Apple Pay</option><option>Bank Transfer</option></select></Field>
      <div className="sm:col-span-2"><Field label="Transaction Code"><input required value={form.transactionCode} onChange={(event) => setForm({ ...form, transactionCode: event.target.value })} className="input" placeholder="TXN-827391" /></Field></div>
      <Field label="Payment Status"><select value={form.paymentStatus} onChange={(event) => setForm({ ...form, paymentStatus: event.target.value as PaymentStatus })} className="input"><option>Pending</option><option>Paid</option><option>Failed</option><option>Refunded</option></select></Field>
      <Field label="Refund Status"><select value={form.refundStatus} onChange={(event) => setForm({ ...form, refundStatus: event.target.value as RefundStatus })} className="input"><option>None</option><option>Requested</option><option>Processing</option><option>Completed</option></select></Field>
    </div>
    <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit">Save Payment</Button></div>
  </form></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}</label>; }
function PaymentBadge({ value }: { value: PaymentStatus }) { const style = value === "Paid" ? "bg-emerald-50 text-emerald-700" : value === "Failed" ? "bg-rose-50 text-rose-700" : value === "Refunded" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>; }
function RefundBadge({ value }: { value: RefundStatus }) { return <span className={value === "None" ? "text-slate-400" : "rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"}>{value}</span>; }
