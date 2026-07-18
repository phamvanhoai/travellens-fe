"use client";

import axios from "axios";
import { CalendarDays, MapPin, Search, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@/components/common/pagination";
import { GroupTripListSkeleton } from "@/components/group-trips/group-trip-skeleton";
import { Button } from "@/components/ui/button";
import { groupTripService, type GroupTrip } from "@/services/group-trip.service";

const pageSize = 20;

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
    setLoading(true); setError("");
    try { const result = await groupTripService.publicList({ page, limit: pageSize, ...(search ? { search } : {}) }); setItems(result.items); setTotal(result.total); setPageCount(result.totalPages); }
    catch (err) { setError(apiError(err, "Cannot load public Group Trips.")); }
    finally { setLoading(false); }
  }, [page, search]);
  useEffect(() => { void load(); }, [load]);

  return <section className="bg-mist py-10"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><div><span className="text-sm font-bold uppercase tracking-wider text-brand-600">Travel together</span><h1 className="mt-2 text-3xl font-bold">Public Group Trips</h1><p className="mt-2 text-slate-500">Explore self-planned trips shared by the Travel360 community.</p></div><form onSubmit={(event) => { event.preventDefault(); setSearch(input.trim()); setPage(1); }} className="mt-6 flex gap-3"><label className="relative min-w-0 flex-1"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Search trip or destination" className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 outline-none focus:border-brand-600" /></label><Button type="submit" variant="outline">Search</Button></form>{error ? <p className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p> : null}{loading ? <GroupTripListSkeleton /> : <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{items.length ? items.map((trip) => <Link key={trip.group_trip_id} href={`/group-trips/${trip.group_trip_id}`} className="rounded-lg border border-slate-200 p-5 transition hover:border-brand-500 hover:shadow-sm"><div className="flex items-start justify-between gap-3"><h2 className="font-bold text-ink">{trip.name}</h2><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Public</span></div><p className="mt-2 line-clamp-2 text-sm text-slate-500">{trip.description || "No description"}</p><div className="mt-4 grid gap-2 text-sm text-slate-600"><span className="flex items-center gap-2"><MapPin size={15} />{trip.destination_name || `Destination #${trip.destination_id}`}</span><span className="flex items-center gap-2"><CalendarDays size={15} />{trip.start_date} — {trip.end_date}</span><span className="flex items-center gap-2"><Users size={15} />{trip.member_count}{trip.max_members ? ` / ${trip.max_members}` : ""} members</span></div>{trip.leader?.name ? <p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">Led by <strong className="text-slate-700">{trip.leader.name}</strong></p> : null}</Link>) : <p className="col-span-full rounded-lg border border-dashed border-slate-200 py-12 text-center text-slate-500">No public Group Trips found.</p>}</div>} {!loading ? <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={pageSize} itemLabel="group trips" onPageChange={setPage} /> : null}</div></div></section>;
}

function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
