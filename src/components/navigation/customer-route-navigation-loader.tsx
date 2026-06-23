"use client";

import dynamic from "next/dynamic";

const CustomerRouteNavigation = dynamic(
  () => import("@/components/navigation/customer-route-navigation").then((module) => module.CustomerRouteNavigation),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[420px] place-items-center rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-500">
        Loading route navigation...
      </div>
    )
  }
);

export function CustomerRouteNavigationLoader({ tourId }: { tourId: string }) {
  return <CustomerRouteNavigation tourId={tourId} />;
}
