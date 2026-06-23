"use client";

import dynamic from "next/dynamic";

const CustomerTravelMap = dynamic(() => import("@/components/maps/customer-travel-map"), {
  ssr: false,
  loading: () => (
    <section className="bg-mist">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid min-h-[620px] place-items-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-500">
          Loading travel map...
        </div>
      </div>
    </section>
  )
});

export default function CustomerTravelMapPage() {
  return (
    <section className="bg-mist">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CustomerTravelMap />
      </div>
    </section>
  );
}
