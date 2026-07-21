"use client";

import axios from "axios";
import Link from "next/link";
import { ArrowRight, CalendarCheck, CheckCircle2, CreditCard, MessageSquareText, RefreshCw, RotateCcw, WalletCards } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";

type DashboardData = {
  bookings?: Array<{ status?: string; total?: number | string }>;
  revenue?: { total_revenue?: number | string };
  cancellations?: { total_canceled?: number | string };
  reviews?: { total_reviews?: number | string; average_rating?: number | string };
};

const quickLinks = [
  { href: "/staff/bookings", label: "Manage bookings", icon: CalendarCheck, color: "bg-blue-50 text-blue-700" },
  { href: "/staff/payments", label: "Review payments", icon: CreditCard, color: "bg-emerald-50 text-emerald-700" },
  { href: "/staff/refund-requests", label: "Process refunds", icon: RotateCcw, color: "bg-amber-50 text-amber-700" },
  { href: "/staff/reviews", label: "Moderate reviews", icon: MessageSquareText, color: "bg-violet-50 text-violet-700" }
];

export default function StaffDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/staff/dashboard");
      setData(unwrapDashboard(response.data));
    } catch (err) {
      setError(getApiError(err, "Cannot load staff dashboard."));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  const bookingStats = useMemo(() => new Map((data?.bookings ?? []).map((item) => [normalizeStatus(item.status), Number(item.total ?? 0)])), [data]);
  const totalBookings = [...bookingStats.values()].reduce((sum, value) => sum + value, 0);
  const pending = bookingStats.get("pending") ?? 0;
  const confirmed = bookingStats.get("confirmed") ?? 0;
  const completed = bookingStats.get("completed") ?? 0;
  const cancelled = Number(data?.cancellations?.total_canceled ?? bookingStats.get("cancelled") ?? bookingStats.get("canceled") ?? 0);

  return (
    <div className="grid gap-6">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-600">Staff workspace</p><h1 className="mt-2 text-2xl font-bold">Dashboard</h1><p className="mt-1 text-sm text-slate-500">Live operational summary for bookings, payments and customer reviews.</p></div><Button variant="outline" onClick={() => void loadDashboard()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} />Refresh</Button></div>
        {error ? <div className="mt-5 flex items-center justify-between gap-4 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700"><span>{error}</span><button type="button" onClick={() => void loadDashboard()} className="shrink-0">Retry</button></div> : null}
      </section>

      {loading ? <DashboardSkeleton /> : data ? <>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={CalendarCheck} label="Total bookings" value={formatNumber(totalBookings)} tone="blue" />
          <StatCard icon={WalletCards} label="Paid revenue" value={formatVnd(data.revenue?.total_revenue)} tone="emerald" />
          <StatCard icon={RotateCcw} label="Cancellations" value={formatNumber(cancelled)} tone="amber" />
          <StatCard icon={MessageSquareText} label="Customer reviews" value={formatNumber(data.reviews?.total_reviews)} hint={`${Number(data.reviews?.average_rating ?? 0).toFixed(1)} average rating`} tone="violet" />
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Booking pipeline</h2><p className="mt-1 text-sm text-slate-500">Current bookings grouped by operational status.</p></div><Link href="/staff/bookings" className="text-sm font-bold text-brand-600 hover:text-brand-700">View bookings</Link></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><PipelineItem label="Pending" value={pending} total={totalBookings} color="bg-amber-500" /><PipelineItem label="Confirmed" value={confirmed} total={totalBookings} color="bg-blue-500" /><PipelineItem label="Completed" value={completed} total={totalBookings} color="bg-emerald-500" /><PipelineItem label="Cancelled" value={cancelled} total={totalBookings} color="bg-rose-500" /></div></div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-bold">Quick actions</h2><p className="mt-1 text-sm text-slate-500">Open frequently used staff tools.</p><div className="mt-5 grid gap-3">{quickLinks.map(({ href, label, icon: Icon, color }) => <Link key={href} href={href} className="group flex items-center gap-3 rounded-lg border border-slate-200 p-3 transition hover:border-brand-200 hover:shadow-sm"><span className={`grid size-10 place-items-center rounded-lg ${color}`}><Icon size={18} /></span><span className="flex-1 text-sm font-bold text-slate-700">{label}</span><ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" /></Link>)}</div></div>
        </section>
      </> : null}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, hint, tone }: { icon: typeof CheckCircle2; label: string; value: string; hint?: string; tone: "blue" | "emerald" | "amber" | "violet" }) { const colors = { blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", amber: "bg-amber-50 text-amber-700", violet: "bg-violet-50 text-violet-700" }; return <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-ink">{value}</p>{hint ? <p className="mt-1 text-xs text-slate-400">{hint}</p> : null}</div><span className={`grid size-11 place-items-center rounded-xl ${colors[tone]}`}><Icon size={20} /></span></div></article>; }
function PipelineItem({ label, value, total, color }: { label: string; value: number; total: number; color: string }) { const percent = total ? Math.min(100, Math.round(value / total * 100)) : 0; return <div className="rounded-lg bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-600">{label}</span><strong>{formatNumber(value)}</strong></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div><p className="mt-2 text-xs text-slate-400">{percent}% of bookings</p></div>; }
function DashboardSkeleton() { return <div className="grid animate-pulse gap-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 rounded-xl border border-slate-200 bg-white p-5"><div className="h-4 w-28 rounded bg-slate-200" /><div className="mt-5 h-7 w-20 rounded bg-slate-200" /></div>)}</div><div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]"><div className="h-80 rounded-xl border border-slate-200 bg-white" /><div className="h-80 rounded-xl border border-slate-200 bg-white" /></div></div>; }
function unwrapDashboard(value: unknown) { const body = value && typeof value === "object" ? value as { data?: unknown } : {}; return (body.data ?? value) as DashboardData; }
function normalizeStatus(value?: string) { return String(value ?? "unknown").toLowerCase().replace("canceled", "cancelled"); }
function formatNumber(value?: number | string) { return new Intl.NumberFormat("vi-VN").format(Number(value ?? 0)); }
function formatVnd(value?: number | string) { return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Number(value ?? 0))} ₫`; }
function getApiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
