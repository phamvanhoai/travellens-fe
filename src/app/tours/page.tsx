"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Bike, Building2, Calendar, Mountain, RefreshCw, Ship, SlidersHorizontal, Umbrella, Waves } from "lucide-react";
import { TourCard } from "@/components/cards/tour-card";
import { Pagination } from "@/components/common/pagination";
import { PageHero } from "@/components/common/page-hero";
import { images } from "@/lib/data";
import { api } from "@/services/api";

export default function ToursPage() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const pageSize = 6;

  useEffect(() => {
    const fetchTours = async () => {
      setIsLoading(true);
      setError("");
      try {
        const { data } = await api.get("/tours", {
          params: { page, limit: pageSize }
        });
        const nextItems = data?.data?.items ?? data?.data ?? data?.items ?? [];
        const pagination = data?.pagination ?? data?.data?.pagination;
        setItems(Array.isArray(nextItems) ? nextItems : []);
        setTotalItems(Number(pagination?.total ?? (Array.isArray(nextItems) ? nextItems.length : 0)));
        const calculatedPageCount = Math.ceil(Number(pagination?.total ?? nextItems.length) / pageSize);
        setPageCount(Number(pagination?.totalPages ?? calculatedPageCount) || 1);
      } catch {
        setItems([]);
        setTotalItems(0);
        setPageCount(1);
        setError("The tours API is temporarily unavailable (HTTP 500). Please try again after the backend is ready.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchTours();
  }, [page, reloadKey]);

  return (
    <>
      <PageHero title="Explore Amazing Tours" subtitle="Find the perfect tour for your next adventure" image={images.swiss} />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold">Filters</h2>
            <SlidersHorizontal size={18} className="text-brand-600" />
          </div>
          {["Price Range", "Tour Type", "Duration", "Rating", "Language"].map((group) => (
            <div key={group} className="border-t border-slate-100 py-5">
              <h3 className="mb-3 text-sm font-bold">{group}</h3>
              <div className="space-y-3 text-sm text-slate-600">
                {["Group Tour", "Private Tour", "Family Tour", "Custom Tour"].slice(0, group === "Price Range" ? 1 : 4).map((item) => (
                  <label key={item} className="flex items-center gap-2"><input type="checkbox" /> {item}</label>
                ))}
                {group === "Price Range" ? <div className="h-1 rounded bg-brand-600" /> : null}
              </div>
            </div>
          ))}
        </aside>
        <div>
          <div className="mb-7 flex flex-wrap gap-4">
            {[
              [Calendar, "All Tours"], [Mountain, "Adventure"], [Building2, "Cultural"], [Umbrella, "Beach"], [Waves, "Nature"], [Bike, "Hiking"], [Ship, "Cruise"]
            ].map(([Icon, label], index) => (
              <button key={String(label)} className={index === 0 ? "rounded-lg bg-brand-50 px-4 py-3 text-sm font-bold text-brand-600" : "rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"}>
                <Icon className="mr-2 inline size-4" />{label as string}
              </button>
            ))}
          </div>
          <p className="mb-4 text-sm text-slate-500">Showing available tours</p>
          
          {isLoading ? (
            <ToursSkeleton count={pageSize} />
          ) : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 size-5 shrink-0" />
                <div>
                  <h2 className="font-bold">Cannot load tours</h2>
                  <p className="mt-1 text-sm leading-6">{error}</p>
                  <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-rose-700 shadow-sm">
                    <RefreshCw size={15} /> Retry
                  </button>
                </div>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
              <p className="text-slate-500">No tours found.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((tour) => {
                const mappedTour = {
                  id: tour.tour_id || tour.id,
                  title: tour.name || tour.title,
                  destination: getDestinationNames(tour),
                  image: tour.thumbnail_url || tour.thumbnail || images.swiss,
                  rating: Number(tour.average_rating ?? 0),
                  reviews: String(tour.review_count ?? 0),
                  duration: formatTourDuration(tour),
                  price: tour.price || 0,
                  category: typeof tour.tour_category === "object" ? tour.tour_category?.name || "Tour" : tour.tour_category || "Tour",
                  capacity: `Max ${tour.capacity || 0} people`,
                  badge: ""
                };
                return <TourCard key={mappedTour.id} tour={mappedTour as any} />;
              })}
            </div>
          )}
          
          {!isLoading && totalItems > 0 && (
            <div className="mt-8">
              <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="tours" onPageChange={setPage} />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function getDestinationNames(tour: any) {
  if (Array.isArray(tour.destinations) && tour.destinations.length) {
    return tour.destinations.map((destination: any) => destination.name || destination.destination_name).filter(Boolean).join(" · ");
  }
  return tour.destination_name || "Various Locations";
}

function formatTourDuration(tour: any) {
  const days = Number(tour.duration_days ?? 0);
  const nights = Number(tour.duration_nights ?? 0);
  if (days || nights) return [days ? `${days}d` : "", nights ? `${nights}n` : ""].filter(Boolean).join(" ");
  return tour.schedule || "Schedule pending";
}

function ToursSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading tours" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-hidden="true">
          <div className="relative h-52 animate-pulse bg-slate-200">
            <span className="absolute right-3 top-3 size-9 rounded-full bg-white/90" />
          </div>
          <div className="p-4">
            <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 flex items-center gap-2">
              <div className="size-3 animate-pulse rounded-full bg-slate-200" />
              <div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="mt-4 flex gap-5">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="size-4 animate-pulse rounded-full bg-amber-200" />
                <div className="h-3.5 w-16 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="space-y-2">
                <div className="ml-auto h-2.5 w-8 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
