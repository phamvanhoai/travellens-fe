"use client";

import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2, RefreshCw, Search } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { getCustomerPaymentCode, getCustomerPaymentId, paymentService, type CustomerPayment, type CustomerPaymentStatus } from "@/services/payment.service";

const pageSize = 10;
const statuses: CustomerPaymentStatus[] = ["pending", "paid", "failed", "expired", "refunded"];

export default function PaymentsPage() {
  const [items, setItems] = useState<CustomerPayment[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await paymentService.listMine({
        page,
        limit: pageSize,
        search: query.trim() || undefined,
        status: status ? status as CustomerPaymentStatus : undefined
      });
      setItems(result.data);
      setTotal(result.pagination.total);
      setPageCount(result.pagination.totalPages);
    } catch (err) {
      setError(getApiError(err, "Cannot load your payment history."));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, query, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPayments(), 300);
    return () => window.clearTimeout(timer);
  }, [loadPayments]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold">Payment History</h1><p className="mt-1 text-sm text-slate-500">Payments belonging to your current customer account.</p></div><Button variant="outline" onClick={() => void loadPayments()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} />Refresh</Button></div>
      {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_200px]"><div className="relative"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Payment code, booking, transaction or tour..." /></div><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm"><option value="">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Payment", "Booking", "Tour", "Amount", "Bank", "Status", "Transaction"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {loading ? <PaymentRowsSkeleton /> : items.length === 0 ? <tr><td colSpan={7} className="p-10 text-center text-slate-500">No payment records found.</td></tr> : items.map((payment) => <tr key={getCustomerPaymentId(payment)} className="border-t border-slate-100"><td className="p-3 font-bold"><CreditCard className="mr-2 inline size-4 text-brand-600" />{getCustomerPaymentCode(payment) || `#${getCustomerPaymentId(payment)}`}</td><td className="p-3">{payment.booking?.booking_code || `#${payment.booking_id ?? payment.booking?.booking_id ?? "-"}`}</td><td className="p-3 font-semibold">{payment.booking?.tour_name || payment.booking?.tour?.name || payment.booking?.tour?.title || payment.tour?.name || payment.tour?.title || "-"}</td><td className="p-3 font-semibold">{formatMoney(Number(payment.amount ?? 0), payment.currency ?? "VND")}</td><td className="p-3">{payment.bank_name || "SePay"}</td><td className="p-3"><Status value={payment.status ?? "pending"} /></td><td className="p-3 text-slate-600">{payment.transaction_code || payment.transfer_content || "-"}</td></tr>)}
      </tbody></table></div>
      <Pagination page={Math.min(page, pageCount)} pageCount={pageCount} totalItems={total} pageSize={pageSize} itemLabel="payments" onPageChange={setPage} />
    </div>
  );
}

function PaymentRowsSkeleton() {
  return <>{Array.from({ length: 5 }, (_, row) => <tr key={row} className="border-t border-slate-100 animate-pulse">{Array.from({ length: 7 }, (_, cell) => <td key={cell} className="p-3"><div className={`h-4 rounded bg-slate-100 ${cell === 2 ? "w-36" : "w-24"}`} /></td>)}</tr>)}</>;
}

function Status({ value }: { value: CustomerPaymentStatus }) {
  const normalized = String(value).toLowerCase();
  const style = normalized === "paid" ? "bg-emerald-50 text-emerald-700" : ["failed", "expired"].includes(normalized) ? "bg-rose-50 text-rose-700" : normalized === "refunded" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{label(normalized)}</span>;
}

function label(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
function formatMoney(value: number, currency: string) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: currency || "VND" }).format(value || 0); }
function getApiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; if (error.response?.status === 401) return "Please sign in to view your payments."; return data?.message ?? data?.error ?? fallback; }
