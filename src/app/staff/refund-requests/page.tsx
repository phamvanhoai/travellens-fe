"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CircleDollarSign, RefreshCw, Search, ShieldCheck, X, XCircle } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import {
  getStaffRefundAmount,
  getStaffRefundBookingId,
  getStaffRefundCustomer,
  getStaffRefundPaymentCode,
  getStaffRefundPaymentId,
  getStaffRefundRequestId,
  staffRefundRequestService,
  type StaffRefundRequest,
  type StaffRefundRequestFilters
} from "@/services/staff-refund-request.service";

type ActionType = "approve" | "reject" | "complete";
type ActionState = { type: ActionType; item: StaffRefundRequest } | null;

const pageSize = 8;

export default function StaffRefundRequestsPage() {
  const showToast = useToast();
  const [items, setItems] = useState<StaffRefundRequest[]>([]);
  const [filters, setFilters] = useState<StaffRefundRequestFilters>({});
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState<ActionState>(null);

  async function load(nextFilters = filters) {
    try {
      setLoading(true);
      setError("");
      const data = await staffRefundRequestService.list(nextFilters);
      setItems(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;

    return items.filter((item) => {
      const text = [
        getStaffRefundRequestId(item),
        getStaffRefundBookingId(item),
        getStaffRefundPaymentId(item),
        getStaffRefundPaymentCode(item),
        getStaffRefundCustomer(item),
        item.status,
        item.reason,
        item.staff_note,
        item.transaction_code
      ].join(" ").toLowerCase();

      return text.includes(term);
    });
  }, [items, query]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function updateFilter(key: keyof StaffRefundRequestFilters, value: string) {
    const next = { ...filters, [key]: value || undefined };
    setFilters(next);
    setPage(1);
    load(next);
  }

  async function runAction(payload: { staff_note: string; transaction_code: string }) {
    if (!action) return;

    const id = getStaffRefundRequestId(action.item);
    if (!id) return;

    try {
      if (action.type === "approve") await staffRefundRequestService.approve(id, payload);
      if (action.type === "reject") await staffRefundRequestService.reject(id, payload);
      if (action.type === "complete") await staffRefundRequestService.complete(id, payload);

      showToast({ title: "Refund request updated", variant: "success" });
      setAction(null);
      load();
    } catch (err) {
      showToast({ title: "Could not update refund request", description: getErrorMessage(err), variant: "error" });
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Staff Refund Requests</h1>
            <p className="mt-1 text-sm text-slate-500">Review, approve, reject and complete manual refund requests.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => load()} disabled={loading}>
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </Button>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_180px_160px_160px]">
          <div className="relative">
            <Search className="absolute left-3 top-3 size-5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
              placeholder="Search refund requests..."
            />
          </div>
          <select value={filters.status ?? ""} onChange={(event) => updateFilter("status", event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600">
            <option value="">All statuses</option>
            <option value="pending">pending</option>
            <option value="completed">completed</option>
          </select>
          <input value={filters.booking_id ?? ""} onChange={(event) => updateFilter("booking_id", event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600" placeholder="Booking ID" inputMode="numeric" />
          <input value={filters.payment_id ?? ""} onChange={(event) => updateFilter("payment_id", event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600" placeholder="Payment ID" inputMode="numeric" />
        </div>

        {error ? <div className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</div> : null}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["Request", "Customer", "Booking", "Payment", "Amount", "Status", "Reason", "Actions"].map((head) => <th key={head} className="p-3">{head}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <TableMessage message="Loading refund requests..." /> : null}
              {!loading && rows.length === 0 ? <TableMessage message="No refund requests found." /> : null}
              {!loading && rows.map((item) => {
                const status = item.status ?? "pending";
                const normalizedStatus = status.toLowerCase();
                const isApproved = normalizedStatus === "approved";
                const isCompleted = normalizedStatus === "completed";
                const canReview = normalizedStatus === "pending";
                const canComplete = isApproved && !isCompleted;

                return (
                  <tr key={getStaffRefundRequestId(item)} className="border-t border-slate-100 align-top">
                    <td className="p-3 font-bold"><CircleDollarSign className="mr-2 inline size-4 text-brand-600" />#{getStaffRefundRequestId(item)}</td>
                    <td className="p-3">{getStaffRefundCustomer(item)}</td>
                    <td className="p-3">BK-{getStaffRefundBookingId(item) || "-"}</td>
                    <td className="p-3">{getStaffRefundPaymentCode(item)}</td>
                    <td className="p-3">{formatVnd(getStaffRefundAmount(item))}</td>
                    <td className="p-3"><Status value={status} /></td>
                    <td className="max-w-xs p-3 text-slate-600">{item.reason ?? item.customer_note ?? "-"}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" className="h-9 px-3" onClick={() => setAction({ type: "approve", item })} disabled={!canReview}>
                          <CheckCircle2 size={15} /> Approve
                        </Button>
                        <Button type="button" variant="outline" className="h-9 px-3" onClick={() => setAction({ type: "reject", item })} disabled={!canReview}>
                          <XCircle size={15} /> Reject
                        </Button>
                        <Button type="button" className="h-9 px-3" onClick={() => setAction({ type: "complete", item })} disabled={!canComplete}>
                          <ShieldCheck size={15} /> Complete
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={currentPage} pageCount={pageCount} totalItems={visible.length} pageSize={pageSize} itemLabel="refund requests" onPageChange={setPage} />
      </div>

      {action ? <ActionModal action={action} onClose={() => setAction(null)} onSubmit={runAction} /> : null}
    </>
  );
}

function ActionModal({ action, onClose, onSubmit }: { action: ActionState; onClose: () => void; onSubmit: (payload: { staff_note: string; transaction_code: string }) => void }) {
  const [staffNote, setStaffNote] = useState("");
  const [transactionCode, setTransactionCode] = useState("");

  if (!action) return null;

  const title = action.type === "approve" ? "Approve Refund Request" : action.type === "reject" ? "Reject Refund Request" : "Complete Refund Request";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); onSubmit({ staff_note: staffNote, transaction_code: transactionCode }); }}>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
          Request #{getStaffRefundRequestId(action.item)} for booking BK-{getStaffRefundBookingId(action.item) || "-"}.
        </div>
        <div className="mt-5 grid gap-4">
          {action.type === "complete" ? (
            <Field label="Transaction Code">
              <input value={transactionCode} onChange={(event) => setTransactionCode(event.target.value)} className="input" placeholder="Manual bank transfer code" />
            </Field>
          ) : null}
          <Field label="Staff Note">
            <textarea value={staffNote} onChange={(event) => setStaffNote(event.target.value.slice(0, 1000))} className="input min-h-28 py-3" placeholder="Optional note for this action" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">{action.type === "complete" ? "Mark Completed" : "Save"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3 [&_.input]:text-sm [&_.input]:outline-none focus-within:[&_.input]:border-brand-600">{label}{children}</label>;
}

function TableMessage({ message }: { message: string }) {
  return <tr><td colSpan={8} className="p-8 text-center text-sm font-semibold text-slate-500">{message}</td></tr>;
}

function Status({ value }: { value: string }) {
  const style = value === "completed" || value === "approved" ? "bg-emerald-50 text-emerald-700" : value === "rejected" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>;
}

function formatVnd(value: number | string | undefined | null) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: string; error?: string } } }).response;
    return response?.data?.message ?? response?.data?.error ?? "Request failed";
  }
  return error instanceof Error ? error.message : "Request failed";
}
