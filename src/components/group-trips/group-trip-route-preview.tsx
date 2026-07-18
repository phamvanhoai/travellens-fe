"use client";

import dynamic from "next/dynamic";
import { LoaderCircle, Map } from "lucide-react";
import type { GroupTrip } from "@/services/group-trip.service";

const RouteMap = dynamic(() => import("./group-trip-route-map"), {
  ssr: false,
  loading: () => <div className="grid h-[420px] place-items-center bg-slate-50 text-sm font-semibold text-slate-500"><LoaderCircle className="animate-spin" size={20} /> Loading route map...</div>
});

export function GroupTripRoutePreview({ trip }: { trip: GroupTrip }) {
  return <section className="mt-7"><div className="mb-3"><h2 className="flex items-center gap-2 text-lg font-bold"><Map size={19} className="text-brand-600" /> Route preview</h2><p className="mt-1 text-sm text-slate-500">Stops are numbered by date and itinerary order.</p></div><div className="overflow-hidden rounded-lg border border-slate-200"><RouteMap trip={trip} /></div></section>;
}
