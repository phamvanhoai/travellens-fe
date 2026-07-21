"use client";

import dynamic from "next/dynamic";

const CustomerTravelMap = dynamic(() => import("@/components/maps/customer-travel-map"), {
  ssr: false,
  loading: () => <TravelMapSkeleton />
});

export default function CustomerTravelMapPage() {
  return (
    <section className="min-h-screen bg-slate-50 pb-10">
      <div className="bg-gradient-to-br from-[#071d33] via-brand-900 to-brand-700 pb-16 pt-10 text-white">
        <div className="mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8"><span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">Explore visually</span><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Interactive Travel Map</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">Discover destinations, immersive experiences and nearby places across Vietnam.</p></div>
      </div>
      <div className="mx-auto -mt-8 max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <CustomerTravelMap />
      </div>
    </section>
  );
}

function TravelMapSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]" aria-label="Loading travel map" aria-busy="true">
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/5">
        <div className="h-7 w-4/5 animate-pulse rounded bg-slate-200" />
        <div className="mt-3 h-3.5 w-full animate-pulse rounded bg-slate-100" />
        <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-slate-100" />
        <div className="mt-7 space-y-5">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index}>
              <div className="h-3 w-20 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-11 w-full animate-pulse rounded-lg bg-slate-100" />
            </div>
          ))}
          <div className="h-11 w-full animate-pulse rounded-lg bg-brand-100" />
          <div className="h-11 w-full animate-pulse rounded-lg bg-slate-100" />
        </div>
      </aside>
      <div className="relative min-h-[520px] overflow-hidden rounded-2xl border-4 border-white bg-slate-200 shadow-xl shadow-slate-900/10 lg:h-[700px]">
        <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,rgba(255,255,255,.22)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.22)_50%,rgba(255,255,255,.22)_75%,transparent_75%)] bg-[length:48px_48px]" />
        <div className="absolute right-4 top-4 h-24 w-9 rounded-md bg-white/80" />
        <div className="absolute left-[58%] top-[42%] size-7 animate-pulse rounded-full bg-brand-500/70 ring-8 ring-brand-200/60" />
      </div>
    </div>
  );
}
