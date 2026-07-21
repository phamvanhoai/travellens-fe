"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2, Pencil, RefreshCw, RotateCcw, Search, X } from "lucide-react";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { currency } from "@/lib/utils";
import { getCustomerPaymentCode, getCustomerPaymentId, paymentService, type CustomerPayment, type CustomerPaymentStatus } from "@/services/payment.service";

const pageSize = 10;
const statuses = ["pending", "paid", "failed", "expired", "refunded"];

export default function StaffPaymentsPage() {
  const showToast = useToast();
  const [items, setItems] = useState<CustomerPayment[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<CustomerPayment | null>(null);
  const [refunding, setRefunding] = useState<CustomerPayment | null>(null);

  const loadPayments = useCallback(async (nextPage: number, search: string, status: string) => {
    setLoading(true);
    setError("");
    try {
      const result = await paymentService.listForStaff({ page: nextPage, limit: pageSize, search: search || undefined, status: status || undefined });
      setItems(result.data);
      setTotalItems(result.pagination.total);
      setPageCount(result.pagination.totalPages);
    } catch (err) {
      const message = getApiError(err, "Cannot load staff payments.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadPayments(1, "", ""); }, [loadPayments]);

  async function changePage(nextPage: number) {
    setPage(nextPage);
    await loadPayments(nextPage, query, statusFilter);
  }

  async function updateStatus(status: CustomerPaymentStatus) {
    if (!editing) return;
    setSaving(true);
    try {
      await paymentService.updateStatusForStaff(getCustomerPaymentId(editing), status);
      showToast({ variant: "success", title: "Payment updated", description: `${getCustomerPaymentCode(editing) || `Payment #${getCustomerPaymentId(editing)}`} is now ${status}.` });
      setEditing(null);
      await loadPayments(page, query, statusFilter);
    } catch (err) {
      const message = getApiError(err, "Cannot update payment status.");
      setError(message);
      showToast({ variant: "error", title: "Update failed", description: message });
    } finally { setSaving(false); }
  }

  async function refund(transactionCode: string) {
    if (!refunding) return;
    setSaving(true);
    try {
      await paymentService.refundForStaff(getCustomerPaymentId(refunding), { transaction_code: transactionCode.trim() || undefined });
      showToast({ variant: "success", title: "Payment refunded", description: getCustomerPaymentCode(refunding) || `Payment #${getCustomerPaymentId(refunding)}` });
      setRefunding(null);
      await loadPayments(page, query, statusFilter);
    } catch (err) {
      const message = getApiError(err, "Cannot refund this payment.");
      setError(message);
      showToast({ variant: "error", title: "Refund failed", description: message });
    } finally { setSaving(false); }
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold">Staff Payments</h1><p className="mt-1 text-sm text-slate-500">Review live payments, update valid statuses and process refunds.</p></div><Button variant="outline" onClick={() => void loadPayments(page, query, statusFilter)} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} />Refresh</Button></div>
      {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
      <form className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]" onSubmit={(event) => { event.preventDefault(); const value = searchInput.trim(); setQuery(value); setPage(1); void loadPayments(1, value, statusFilter); }}>
        <div className="relative"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Payment code or transaction..." /></div>
        <select value={statusFilter} onChange={(event) => { const value = event.target.value; setStatusFilter(value); setPage(1); void loadPayments(1, query, value); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm"><option value="">All statuses</option>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</select>
        <Button type="submit" variant="outline"><Search size={17} />Search</Button>
      </form>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Payment", "Booking", "Amount", "Status", "Transaction", "Created", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {loading ? <AdminTableSkeleton columns={7} rows={10} /> : items.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-slate-500">No payments found.</td></tr> : items.map((item) => {
          const status = String(item.status ?? "pending");
          const canUpdate = status === "pending";
          const canRefund = status === "paid";
          return <tr key={getCustomerPaymentId(item)} className="border-t border-slate-100"><td className="p-3"><p className="font-bold"><CreditCard className="mr-2 inline size-4 text-brand-600" />#{getCustomerPaymentId(item)}</p><p className="mt-1 text-xs text-slate-500">{getCustomerPaymentCode(item) || "No payment code"}</p></td><td className="p-3 font-semibold">BK-{item.booking_id}</td><td className="p-3 font-semibold">{currency(Number(item.amount ?? 0), "VND")}</td><td className="p-3"><Status value={status} /></td><td className="p-3 text-slate-600">{item.transaction_code || "-"}</td><td className="p-3 text-slate-500">{formatDate(item.created_at)}</td><td className="p-3"><span className="flex gap-2"><Button variant="outline" className="h-9 px-3" disabled={!canUpdate} onClick={() => setEditing(item)}><Pencil size={15} />Status</Button><Button variant="outline" className="h-9 px-3" disabled={!canRefund} onClick={() => setRefunding(item)}><RotateCcw size={15} />Refund</Button></span></td></tr>;
        })}
      </tbody></table></div>
      <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="payments" onPageChange={(nextPage) => void changePage(nextPage)} />
    </div>
    {editing ? <StatusModal item={editing} saving={saving} onClose={() => setEditing(null)} onSave={updateStatus} /> : null}
    {refunding ? <RefundModal item={refunding} saving={saving} onClose={() => setRefunding(null)} onSave={refund} /> : null}
  </>;
}

function StatusModal({ item, saving, onClose, onSave }: { item: CustomerPayment; saving: boolean; onClose: () => void; onSave: (status: CustomerPaymentStatus) => void }) {
  const [status, setStatus] = useState<CustomerPaymentStatus>("paid");
  return <Modal title="Update Payment Status" saving={saving} onClose={onClose} onSubmit={() => onSave(status)}><p className="text-sm text-slate-500">Payment #{getCustomerPaymentId(item)} · Current status: <strong>{item.status}</strong></p><label className="mt-5 block text-sm font-semibold">New status<select value={status} onChange={(event) => setStatus(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3"><option value="paid">paid</option><option value="failed">failed</option><option value="expired">expired</option></select></label></Modal>;
}

function RefundModal({ item, saving, onClose, onSave }: { item: CustomerPayment; saving: boolean; onClose: () => void; onSave: (transactionCode: string) => void }) {
  const [transactionCode, setTransactionCode] = useState("");
  return <Modal title="Refund Payment" saving={saving} onClose={onClose} onSubmit={() => onSave(transactionCode)}><div className="rounded-lg bg-slate-50 p-4"><p className="text-sm text-slate-500">Refund amount</p><p className="mt-1 text-xl font-bold">{currency(Number(item.amount ?? 0), "VND")}</p></div><label className="mt-5 block text-sm font-semibold">Refund transaction code <span className="font-normal text-slate-400">(optional)</span><input value={transactionCode} onChange={(event) => setTransactionCode(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3" placeholder="REF-..." /></label></Modal>;
}

function Modal({ title, saving, children, onClose, onSubmit }: { title: string; saving: boolean; children: React.ReactNode; onClose: () => void; onSubmit: () => void }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form className="w-full max-w-md rounded-lg bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} disabled={saving} className="grid size-9 place-items-center rounded-full hover:bg-slate-100"><X size={18} /></button></div><div className="mt-6">{children}</div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Confirm</Button></div></form></div>; }
function Status({ value }: { value: string }) { const style = value === "paid" ? "bg-emerald-50 text-emerald-700" : value === "failed" ? "bg-rose-50 text-rose-700" : value === "refunded" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${style}`}>{value}</span>; }
function formatDate(value?: string) { if (!value) return "-"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(date); }
function getApiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
