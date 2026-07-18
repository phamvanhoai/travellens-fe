"use client";

import axios from "axios";
import { CalendarDays, MapPinned, Plus, Search, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { GroupTripListSkeleton } from "@/components/group-trips/group-trip-skeleton";
import { groupTripService, type GroupTrip } from "@/services/group-trip.service";

const pageSize = 20;

export default function GroupTripsPage() {
  const [trips, setTrips] = useState<GroupTrip[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTrips = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const result = await groupTripService.list({ page, limit: pageSize, search: search || undefined });
      setTrips(result.items); setTotal(result.total); setPageCount(result.totalPages);
    } catch (err) { setError(apiError(err, "Cannot load your group trips.")); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { void loadTrips(); }, [loadTrips]);

  return <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><MapPinned className="text-brand-600" /> Group Trips</h1><p className="mt-1 text-sm text-slate-500">Plan independent trips with your travel group.</p></div><Button href="/dashboard/group-trips/new"><Plus size={17} /> Create trip</Button></div>
    {error ? <p className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p> : null}
    <form className="mt-6 flex gap-3" onSubmit={(event) => { event.preventDefault(); setSearch(searchInput.trim()); setPage(1); }}><div className="relative flex-1"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 outline-none focus:border-brand-600" placeholder="Search by trip or destination" /></div><Button type="submit" variant="outline">Search</Button></form>
    {loading ? <GroupTripListSkeleton /> : <div className="mt-6 grid gap-4 md:grid-cols-2">{trips.length === 0 ? <div className="col-span-full rounded-lg border border-dashed border-slate-200 p-10 text-center text-slate-500">No active group trips found.</div> : trips.map((trip) => <a key={trip.group_trip_id} href={`/dashboard/group-trips/${trip.group_trip_id}`} className="rounded-lg border border-slate-200 p-5 transition hover:border-brand-500 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-ink">{trip.name}</h2><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold capitalize text-brand-700">{trip.visibility}</span></div><p className="mt-2 line-clamp-2 text-sm text-slate-500">{trip.description || "No description"}</p><div className="mt-4 grid gap-2 text-sm text-slate-600"><span className="flex items-center gap-2"><MapPinned size={15} />{trip.destination_name || `Destination #${trip.destination_id}`}</span><span className="flex items-center gap-2"><CalendarDays size={15} />{trip.start_date} — {trip.end_date}</span><span className="flex items-center gap-2"><Users size={15} />{trip.member_count}{trip.max_members ? ` / ${trip.max_members}` : ""} members</span></div></a>)}</div>}
    <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={pageSize} itemLabel="group trips" onPageChange={setPage} />
  </div>;
}

function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
