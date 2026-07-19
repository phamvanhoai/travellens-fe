"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Clock3, Clipboard, Loader2, QrCode, RefreshCw, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import {
  bookingService,
  getCustomerBookingAmount,
  getCustomerBookingPaymentStatus
} from "@/services/booking.service";
import {
  getCustomerPaymentCode,
  getCustomerPaymentId,
  paymentService,
  type CustomerPayment,
  type CustomerPaymentStatus
} from "@/services/payment.service";

const paymentCreationRequests = new Map<string, Promise<CustomerPayment>>();

export default function PaymentCheckoutPage() {
  return (
    <AuthGuard allowedRoles={["admin", "staff", "customer"]} fallback={<PaymentCheckoutSkeleton />}>
      <PaymentCheckoutContent />
    </AuthGuard>
  );
}

function PaymentCheckoutContent() {
  const router = useRouter();
  const [bookingId, setBookingId] = useState("");
  const [payment, setPayment] = useState<CustomerPayment | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [bookingProcessed, setBookingProcessed] = useState(false);
  const [noPaymentRequired, setNoPaymentRequired] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const showToast = useToast();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const id = searchParams.get("bookingId") ?? "";
    const queryPaymentId = searchParams.get("paymentId") ?? "";
    setBookingId(id);

    if (!id) {
      setError("Missing bookingId. Please create or select a booking before payment.");
      setLoading(false);
      return;
    }

    async function loadPayment() {
      setLoading(true);
      setError("");
      setBookingProcessed(false);
      setNoPaymentRequired(false);
      try {
        const booking = await bookingService.detail(Number(id)).catch(() => null);
        if (booking) {
          const amount = getCustomerBookingAmount(booking);
          const paymentStatus = (getCustomerBookingPaymentStatus(booking) ?? "").toLowerCase();
          const bookingStatus = (booking.status ?? "").toLowerCase();
          if (amount <= 0 || ["paid", "completed"].includes(paymentStatus) || ["confirmed", "completed"].includes(bookingStatus)) {
            setNoPaymentRequired(amount <= 0);
            setBookingProcessed(amount > 0);
            setError("");
            return;
          }
        }

        const existingPaymentId = Number(queryPaymentId) || getStoredPaymentId(id);
        if (existingPaymentId) {
          const existingPayment = await paymentService.detail(existingPaymentId);
          setPayment(existingPayment);
          storePaymentId(id, getCustomerPaymentId(existingPayment) || existingPaymentId);
          setLoading(false);
          if (!queryPaymentId) {
            router.replace(`/payment/checkout?bookingId=${encodeURIComponent(id)}&paymentId=${existingPaymentId}`);
          }
          return;
        }

        const result = await getOrCreatePayment(id);
        const nextPaymentId = getCustomerPaymentId(result);
        storePaymentId(id, nextPaymentId);
        setPayment(result);
        if (nextPaymentId) {
          router.replace(`/payment/checkout?bookingId=${encodeURIComponent(id)}&paymentId=${nextPaymentId}`);
        }
      } catch (err) {
        const message = getApiError(err, "Cannot create payment for this booking.");
        if (isBookingNotPendingError(err)) {
          setBookingProcessed(true);
          setError("");
          return;
        }
        setError(message);
        showToast({ variant: "error", title: "Payment failed", description: message });
      } finally {
        setLoading(false);
      }
    }

    void loadPayment();
  }, [router, showToast]);

  useEffect(() => {
    const paymentId = payment ? getCustomerPaymentId(payment) : 0;
    if (!payment || !paymentId || payment.status !== "pending") return;

    const timer = window.setInterval(() => {
      void refreshStatus(false);
    }, 8000);

    return () => window.clearInterval(timer);
  }, [payment]);

  useEffect(() => {
    if (!payment?.expired_at || payment.status !== "pending") return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [payment?.expired_at, payment?.status]);

  const status = payment?.status ?? "pending";
  const paymentId = payment ? getCustomerPaymentId(payment) : 0;
  const paymentCode = payment ? getCustomerPaymentCode(payment) : "";
  const expiredAt = useMemo(() => payment?.expired_at ? formatDateTime(payment.expired_at) : "", [payment?.expired_at]);
  const expiryTime = payment?.expired_at ? new Date(payment.expired_at).getTime() : Number.NaN;
  const remainingMs = Number.isFinite(expiryTime) ? Math.max(0, expiryTime - now) : null;
  const displayedStatus = status === "pending" && remainingMs === 0 ? "expired" : status;

  async function refreshStatus(showSuccessToast = true) {
    if (!paymentId) return;
    setChecking(true);
    try {
      const result = await paymentService.status(paymentId);
      const nextStatus = result.status;
      setPayment((current) => current ? { ...current, ...result, status: nextStatus ?? current.status } : current);
      if (showSuccessToast) showToast({ variant: "success", title: "Status updated", description: `Payment is ${nextStatus ?? payment?.status ?? "pending"}.` });
    } catch (err) {
      const message = getApiError(err, "Cannot check payment status.");
      showToast({ variant: "error", title: "Status check failed", description: message });
    } finally {
      setChecking(false);
    }
  }

  async function copy(value: string, label: string) {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    showToast({ variant: "success", title: "Copied", description: label });
  }

  if (loading) {
    return <PaymentCheckoutSkeleton />;
  }

  if (error || !payment) {
    if (noPaymentRequired) {
      return (
        <section className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <CheckCircle2 className="mx-auto size-16 text-emerald-600" />
          <h1 className="mt-5 text-3xl font-bold">No Payment Required</h1>
          <p className="mt-3 text-slate-600">This booking total is 0 VND, so no payment checkout is needed.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button href="/dashboard/bookings" variant="outline">My Bookings</Button>
          </div>
        </section>
      );
    }

    if (bookingProcessed) {
      return (
        <section className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <CheckCircle2 className="mx-auto size-16 text-emerald-600" />
          <h1 className="mt-5 text-3xl font-bold">Booking Already Processed</h1>
          <p className="mt-3 text-slate-600">This booking is no longer pending. It may already be paid and confirmed.</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button href="/dashboard/bookings" variant="outline">My Bookings</Button>
            <Button href="/dashboard/payments">Payment History</Button>
          </div>
        </section>
      );
    }

    return (
      <section className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <XCircle className="mx-auto size-16 text-rose-600" />
        <h1 className="mt-5 text-3xl font-bold">Payment Unavailable</h1>
        <p className="mt-3 text-slate-600">{error || "Cannot load payment information."}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button href="/dashboard/bookings" variant="outline">My Bookings</Button>
          {bookingId ? <Button href={`/payment/checkout?bookingId=${bookingId}`}>Try Again</Button> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Checkout</h1>
          <p className="mt-2 text-slate-500">Scan the QR code or transfer manually with the exact content below.</p>
        </div>
        <PaymentStatusBadge status={displayedStatus} />
      </div>

      {status === "paid" ? (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          <CheckCircle2 className="mr-2 inline size-5" />
          Payment completed. Your booking is being confirmed.
        </div>
      ) : null}

      <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid aspect-square place-items-center rounded-lg bg-slate-50">
            {payment.qr_url ? (
              <img src={payment.qr_url} alt="SePay payment QR code" className="h-full w-full rounded-lg object-contain p-3" />
            ) : (
              <div className="text-center text-slate-500">
                <QrCode className="mx-auto size-16" />
                <p className="mt-3 text-sm font-semibold">QR code unavailable</p>
              </div>
            )}
          </div>
          {status === "pending" && remainingMs !== null ? (
            <div className={`mt-4 rounded-lg border p-4 text-center ${remainingMs > 0 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-rose-200 bg-rose-50 text-rose-700"}`}>
              <p className="flex items-center justify-center gap-2 text-sm font-semibold">
                <Clock3 className="size-4" />
                {remainingMs > 0 ? "QR code expires in" : "QR code has expired"}
              </p>
              <strong className="mt-2 block font-mono text-3xl tabular-nums">{formatCountdown(remainingMs)}</strong>
            </div>
          ) : null}
          <Button type="button" className="mt-5 w-full" onClick={() => void refreshStatus()} disabled={checking}>
            {checking ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw size={16} />}
            Check Payment Status
          </Button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Transfer Information</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoRow label="Booking ID" value={String(payment.booking_id ?? bookingId)} />
            <InfoRow label="Payment ID" value={paymentId ? `#${paymentId}` : "-"} />
            <InfoRow label="Amount" value={formatMoney(Number(payment.amount ?? 0), payment.currency ?? "VND")} strong />
            <InfoRow label="Status" value={displayedStatus} />
            <InfoRow label="Bank" value={payment.bank_name || "-"} />
            <CopyRow label="Bank Account" value={payment.bank_account || ""} onCopy={copy} />
            <CopyRow label="Payment Code" value={paymentCode} onCopy={copy} />
            <CopyRow label="Transfer Content" value={payment.transfer_content || paymentCode} onCopy={copy} />
            {expiredAt ? <InfoRow label="Expires At" value={expiredAt} /> : null}
          </div>
          <p className="mt-5 rounded-lg bg-amber-50 p-4 text-sm font-semibold text-amber-700">
            Please transfer the exact amount and transfer content so the system can match the payment automatically.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/dashboard/payments" variant="outline">Payment History</Button>
            <Button href="/dashboard/bookings" variant="outline">My Bookings</Button>
            {status === "paid" ? <Button href={`/payment/success?paymentId=${paymentId}&bookingId=${bookingId}`}>Continue</Button> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function PaymentCheckoutSkeleton() {
  return <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-label="Loading payment checkout" aria-busy="true">
    <div className="animate-pulse">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="h-9 w-64 rounded-lg bg-slate-200" /><div className="mt-3 h-4 w-full max-w-md rounded bg-slate-100" /></div><div className="h-8 w-24 rounded-full bg-slate-200" /></div>
      <div className="mt-8 grid min-w-0 gap-6 lg:grid-cols-[400px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><div className="aspect-square rounded-lg bg-slate-100"><div className="mx-auto grid h-full w-full place-items-center"><div className="size-36 rounded-lg bg-slate-200" /></div></div><div className="mt-4 h-24 rounded-lg bg-slate-100" /><div className="mt-5 h-11 rounded-lg bg-slate-200" /></div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><div className="h-6 w-48 rounded bg-slate-200" /><div className="mt-5 grid gap-3 sm:grid-cols-2">{Array.from({ length: 8 }, (_, index) => <div key={index} className="rounded-lg bg-slate-50 p-4"><div className="h-3 w-20 rounded bg-slate-200" /><div className="mt-3 h-5 w-3/4 rounded bg-slate-200" /></div>)}</div><div className="mt-5 h-20 rounded-lg bg-slate-100" /><div className="mt-6 flex gap-3"><div className="h-11 w-36 rounded-lg bg-slate-200" /><div className="h-11 w-32 rounded-lg bg-slate-200" /></div></div>
      </div>
    </div>
  </section>;
}

function InfoRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className={`mt-1 break-words ${strong ? "text-lg font-bold text-brand-600" : "font-semibold text-ink"}`}>{value || "-"}</p>
    </div>
  );
}

function CopyRow({ label, value, onCopy }: { label: string; value: string; onCopy: (value: string, label: string) => Promise<void> }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p className="min-w-0 flex-1 break-words font-semibold text-ink">{value || "-"}</p>
        {value ? (
          <button type="button" onClick={() => void onCopy(value, label)} className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-slate-600 hover:text-brand-600" aria-label={`Copy ${label}`}>
            <Clipboard size={15} />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function PaymentStatusBadge({ status }: { status: CustomerPaymentStatus }) {
  const style = status === "paid"
    ? "bg-emerald-50 text-emerald-700"
    : status === "failed" || status === "expired"
      ? "bg-rose-50 text-rose-700"
      : status === "refunded"
        ? "bg-blue-50 text-blue-700"
        : "bg-amber-50 text-amber-700";

  return <span className={`w-fit rounded-full px-4 py-2 text-sm font-bold capitalize ${style}`}>{status}</span>;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: currency || "VND" }).format(value || 0);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value));
}

function formatCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  if (error.response?.status === 401) return "Please sign in before creating a payment.";
  if (error.response?.status === 403) return "You do not have permission to pay for this booking.";
  if (error.response?.status === 404) return "Booking or payment was not found.";
  return data?.message ?? data?.error ?? fallback;
}

function readPaymentMap() {
  try {
    return JSON.parse(localStorage.getItem("travel360_payment_by_booking") ?? "{}") as Record<string, number>;
  } catch {
    return {};
  }
}

function getStoredPaymentId(bookingId: string) {
  if (typeof window === "undefined") return 0;
  return readPaymentMap()[bookingId] ?? 0;
}

function storePaymentId(bookingId: string, paymentId: number) {
  if (typeof window === "undefined" || !paymentId) return;
  const paymentMap = readPaymentMap();
  paymentMap[bookingId] = paymentId;
  localStorage.setItem("travel360_payment_by_booking", JSON.stringify(paymentMap));
}

function getOrCreatePayment(bookingId: string) {
  const existingRequest = paymentCreationRequests.get(bookingId);
  if (existingRequest) return existingRequest;

  const request = paymentService.create(bookingId).finally(() => {
    paymentCreationRequests.delete(bookingId);
  });
  paymentCreationRequests.set(bookingId, request);
  return request;
}

function isBookingNotPendingError(error: unknown) {
  if (!axios.isAxiosError(error)) return false;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  const message = `${data?.message ?? ""} ${data?.error ?? ""}`.toLowerCase();
  return message.includes("booking is not pending") || message.includes("not pending");
}
