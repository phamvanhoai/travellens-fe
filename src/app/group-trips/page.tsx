"use client";

import axios from "axios";
import { ArrowUpRight, CalendarDays, MapPin, Search, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageHero } from "@/components/common/page-hero";
import { Pagination } from "@/components/common/pagination";
import { GroupTripListSkeleton } from "@/components/group-trips/group-trip-skeleton";
import { images } from "@/lib/data";
import { groupTripService, type GroupTrip } from "@/services/group-trip.service";

const pageSize = 12;

export default function PublicGroupTripsPage() {
  const [items, setItems] = useState<GroupTrip[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await groupTripService.publicList({ page, limit: pageSize, ...(search ? { search } : {}) });
      setItems(result.items);
      setTotal(result.total);
      setPageCount(result.totalPages);
    } catch (requestError) {
      setError(apiError(requestError, "Cannot load public group trips."));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { void load(); }, [load]);

  const searchForm = (
    <form onSubmit={(event) => { event.preventDefault(); setSearch(input.trim()); setPage(1); }} className="flex flex-col gap-3 rounded-2xl border border-white/40 bg-white/95 p-2.5 text-ink shadow-2xl backdrop-blur sm:flex-row sm:items-center">
      <label className="flex min-w-0 flex-1 items-center gap-4 rounded-xl px-3 py-2"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Search size={20} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Find your travel crew</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search trip or destination..." className="mt-0.5 h-7 w-full bg-transparent text-base font-semibold outline-none placeholder:font-normal placeholder:text-slate-400" /></span></label>
      <button type="submit" className="h-14 rounded-xl bg-brand-600 px-7 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700">Explore trips</button>
    </form>
  );

  return (
    <>
      <PageHero title="Travel Better, Together" subtitle="Discover community-planned journeys, meet fellow travelers and share unforgettable experiences." image={images.balloons} searchClassName="w-full" searchContent={searchForm} />
      <section className="bg-gradient-to-b from-slate-50 to-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600"><Sparkles size={14} />Community journeys</span><h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">Public Group Trips</h2><p className="mt-1 text-sm text-slate-500">Open trips you can explore with the Travel360 community.</p></div><span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">{loading ? "Loading..." : `${total} trip${total === 1 ? "" : "s"}`}</span></div>
          {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
          {loading ? <GroupTripListSkeleton /> : items.length ? <div className="grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">{items.map((trip) => <GroupTripCard key={trip.group_trip_id} trip={trip} />)}</div> : <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">No public group trips match your search.</div>}
          {!loading && total > 0 ? <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={pageSize} itemLabel="group trips" onPageChange={setPage} /> : null}
        </div>
      </section>
    </>
  );
}

function GroupTripCard({ trip }: { trip: GroupTrip }) {
  const leader = trip.leader?.name || "Travel360 member";
  const occupancy = trip.max_members ? Math.min(100, Math.round((Number(trip.member_count || 0) / trip.max_members) * 100)) : 0;
  return (
    <Link href={`/group-trips/${trip.group_trip_id}`} className="group flex h-full min-h-[292px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft">
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-500 px-5 py-4 text-white"><div className="absolute -right-8 -top-12 size-32 rounded-full border-[18px] border-white/10" /><div className="relative flex items-center justify-between gap-3"><span className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide backdrop-blur">Open journey</span><span className="grid size-8 place-items-center rounded-full bg-white/15 transition group-hover:bg-white group-hover:text-brand-700"><ArrowUpRight size={15} /></span></div><h3 className="relative mt-4 line-clamp-2 min-h-12 text-lg font-bold leading-6">{trip.name}</h3></div>
      <div className="flex flex-1 flex-col p-5"><p className="line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{trip.description || "A community trip waiting for new memories and fellow travelers."}</p><div className="mt-4 grid grid-cols-2 gap-3"><Info icon={MapPin} label="Destination" value={trip.destination_name || "Flexible"} /><Info icon={CalendarDays} label="Dates" value={`${formatShortDate(trip.start_date)} – ${formatShortDate(trip.end_date)}`} /></div><div className="mt-auto pt-5"><div className="flex items-center justify-between text-xs"><span className="flex min-w-0 items-center gap-2 text-slate-500"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 font-bold text-brand-700">{getInitials(leader)}</span><span className="truncate">Led by <strong className="text-slate-700">{leader}</strong></span></span><span className="ml-2 flex shrink-0 items-center gap-1 font-bold text-slate-600"><Users size={13} />{trip.member_count}{trip.max_members ? `/${trip.max_members}` : ""}</span></div>{trip.max_members ? <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-400" style={{ width: `${occupancy}%` }} /></div> : null}</div></div>
    </Link>
  );
}

function Info({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return <div className="min-w-0 rounded-xl bg-slate-50 p-3"><span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-400"><Icon size={12} className="text-brand-600" />{label}</span><p className="mt-1 truncate text-xs font-bold text-slate-700">{value}</p></div>;
}

function formatShortDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}

function getInitials(name: string) { return name.trim().split(/\s+/).slice(-2).map((part) => part.charAt(0).toUpperCase()).join("") || "T"; }
function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
