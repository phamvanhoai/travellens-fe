"use client";

import axios from "axios";
import { ArrowLeft, CalendarDays, Clock3, MapPin, Share2, UserRound, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/components/common/toast";
import { GroupTripDetailSkeleton } from "@/components/group-trips/group-trip-skeleton";
import { GroupTripRoutePreview } from "@/components/group-trips/group-trip-route-preview";
import { Button } from "@/components/ui/button";
import { groupTripService, type GroupTrip } from "@/services/group-trip.service";
import { formatDate } from "@/utils/format";

export default function PublicGroupTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const showToast = useToast();
  const [trip, setTrip] = useState<GroupTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setTrip(await groupTripService.publicDetail(id));
    } catch (err) {
      setError(apiError(err, "This public Group Trip does not exist or is no longer available."));
    } finally {
      setLoading(false);
    }
  }, [id]);
  useEffect(() => { void load(); }, [load]);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: trip?.name, text: trip?.description ?? undefined, url });
        return;
      } catch {
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    showToast({ variant: "success", title: "Link copied", description: "Share this link with anyone." });
  }

  if (loading) return <section className="mx-auto max-w-6xl px-4 py-10"><GroupTripDetailSkeleton /></section>;

  return (
    <section className="bg-mist py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <Button href="/group-trips" variant="ghost" className="mb-4 h-9 px-0 hover:bg-transparent"><ArrowLeft size={17} /> Public Group Trips</Button>
          {error ? <div className="rounded-lg bg-rose-50 p-5 text-sm font-semibold text-rose-700">{error}</div> : trip ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Public trip</span><h1 className="mt-3 text-3xl font-bold">{trip.name}</h1><p className="mt-2 max-w-3xl text-slate-600">{trip.description || "No description"}</p></div>
                <Button variant="outline" onClick={() => void share()}><Share2 size={16} /> Share Trip</Button>
              </div>
              <div className="mt-6 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3">
                <span className="flex items-center gap-2"><MapPin size={16} />{trip.destination_name || `Destination #${trip.destination_id}`}</span>
                <span className="flex items-center gap-2"><CalendarDays size={16} />{formatDate(trip.start_date)} — {formatDate(trip.end_date)}</span>
                <span className="flex items-center gap-2"><Users size={16} />{trip.member_count}{trip.max_members ? ` / ${trip.max_members}` : ""} members</span>
              </div>
              {trip.leader ? <div className="mt-5 flex items-center gap-3 rounded-lg border border-slate-100 p-4"><span className="grid size-11 place-items-center rounded-full bg-brand-50 font-bold text-brand-700"><UserRound size={20} /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Trip leader</p><p className="font-bold">{trip.leader.name || `User #${trip.leader.user_id}`}</p></div></div> : null}
              <GroupTripRoutePreview trip={trip} />
              <section className="mt-7">
                <h2 className="text-lg font-bold">Itinerary</h2>
                <p className="mt-1 text-sm text-slate-500">The shared schedule for this trip.</p>
                <div className="mt-4 space-y-3">
                  {trip.itinerary?.length ? [...trip.itinerary].sort((a, b) => a.itinerary_date.localeCompare(b.itinerary_date) || (a.order_index ?? 0) - (b.order_index ?? 0)).map((item) => (
                    <article key={item.itinerary_item_id} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-brand-700"><span className="flex items-center gap-1"><CalendarDays size={14} />{formatDate(item.itinerary_date)}</span>{item.start_time ? <span className="flex items-center gap-1"><Clock3 size={14} />{item.start_time.slice(0, 5)}</span> : null}</div>
                      <h3 className="mt-2 font-bold">{item.title}</h3>
                      {item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}
                      {item.custom_location ? <p className="mt-2 flex items-center gap-1 text-sm text-slate-600"><MapPin size={14} />{item.custom_location}</p> : null}
                    </article>
                  )) : <p className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">No itinerary has been shared yet.</p>}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
