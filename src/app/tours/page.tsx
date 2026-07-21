"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, Calendar, ChevronRight, RefreshCw, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { TourCard } from "@/components/cards/tour-card";
import { Pagination } from "@/components/common/pagination";
import { PageHero } from "@/components/common/page-hero";
import { images } from "@/lib/data";
import { getPublicTourId, getPublicTourName, tourService, type PublicTour, type PublicTourCategory } from "@/services/tour.service";
import type { Tour } from "@/types";

type Filters = {
  categoryId: string;
  minPrice: string;
  maxPrice: string;
  tourType: string;
  duration: string;
  rating: string;
  language: string;
};

const emptyFilters: Filters = { categoryId: "", minPrice: "", maxPrice: "", tourType: "", duration: "", rating: "", language: "" };
const pageSize = 6;

export default function ToursPage() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PublicTour[]>([]);
  const [categories, setCategories] = useState<PublicTourCategory[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    tourService.categories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    async function fetchTours() {
      setIsLoading(true);
      setError("");
      try {
        const duration = getDurationParams(filters.duration);
        const result = await tourService.listPaginated({
          page,
          limit: pageSize,
          search: search || undefined,
          tour_category_id: filters.categoryId ? Number(filters.categoryId) : undefined,
          min_price: filters.minPrice ? Number(filters.minPrice) : undefined,
          max_price: filters.maxPrice ? Number(filters.maxPrice) : undefined,
          tour_type: (filters.tourType || undefined) as "group" | "private" | "self_guided" | undefined,
          min_duration: duration.min,
          max_duration: duration.max,
          min_rating: filters.rating ? Number(filters.rating) : undefined,
          language: filters.language || undefined
        });
        if (!active) return;
        setItems(result.items);
        setTotalItems(result.total);
        setPageCount(result.totalPages);
      } catch {
        if (!active) return;
        setItems([]);
        setTotalItems(0);
        setPageCount(1);
        setError("Unable to load tours. Please try again.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void fetchTours();
    return () => { active = false; };
  }, [page, search, filters, reloadKey]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function updateFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setPage(1);
    setSearchInput("");
    setSearch("");
    setFilters(emptyFilters);
  }

  const hasFilters = Boolean(search || Object.values(filters).some(Boolean));

  function commitBudget(minValue: string, maxValue: string) {
    setPage(1);
    setFilters((current) => ({ ...current, minPrice: minValue, maxPrice: maxValue }));
  }

  return (
    <>
      <PageHero
        title="Explore Amazing Tours"
        subtitle="Find the perfect tour for your next adventure"
        image={images.swiss}
        searchClassName="w-full"
        searchContent={(
        <form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-2xl border border-white/40 bg-white/95 p-2.5 text-ink shadow-2xl backdrop-blur sm:flex-row sm:items-center">
          <label className="flex min-w-0 flex-1 items-center gap-4 rounded-xl px-3 py-2">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Search size={20} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Find your next journey</span>
              <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Where would you like to explore?" className="mt-0.5 h-7 w-full bg-transparent text-base font-semibold text-ink outline-none placeholder:font-normal placeholder:text-slate-400" />
            </span>
          </label>
          <button type="submit" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700">Explore tours <ChevronRight size={17} /></button>
        </form>
        )}
      />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="h-fit overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-24">
          <div className="flex items-center justify-between bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-4 text-white">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Refine results</p><h2 className="mt-0.5 font-bold">Filters</h2></div>
            <span className="grid size-9 place-items-center rounded-xl bg-white/15"><SlidersHorizontal size={17} /></span>
          </div>
          <div className="p-5">
            <BudgetRange
              minValue={filters.minPrice}
              maxValue={filters.maxPrice}
              onCommit={commitBudget}
            />
            <FilterOptions label="Tour type" value={filters.tourType} onChange={(value) => updateFilter("tourType", value)} options={[["", "All"], ["group", "Group"], ["private", "Private"], ["self_guided", "Self-guided"]]} />
            <FilterOptions label="Duration" value={filters.duration} onChange={(value) => updateFilter("duration", value)} options={[["", "Any"], ["1", "1 day"], ["2-3", "2–3 days"], ["4-7", "4–7 days"], ["8+", "8+ days"]]} />
            <FilterOptions label="Minimum rating" value={filters.rating} onChange={(value) => updateFilter("rating", value)} options={[["", "Any"], ["4", "★ 4+"], ["3", "★ 3+"], ["2", "★ 2+"]]} />
            <FilterOptions label="Language" value={filters.language} onChange={(value) => updateFilter("language", value)} options={[["", "Any"], ["vi", "VI"], ["en", "EN"], ["fr", "FR"], ["zh", "ZH"]]} />
            {hasFilters ? <button type="button" onClick={clearFilters} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"><X size={15} /> Clear all filters</button> : null}
          </div>
        </aside>
        <div className="min-w-0">
          <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><div className="flex gap-2 overflow-x-auto">
            <CategoryButton active={!filters.categoryId} onClick={() => updateFilter("categoryId", "")}><Calendar className="size-4" />All Tours</CategoryButton>
            {categories.map((category) => {
              const id = String(category.tour_category_id ?? category.id ?? "");
              return <CategoryButton key={id} active={filters.categoryId === id} onClick={() => updateFilter("categoryId", id)}>{category.name}</CategoryButton>;
            })}
          </div></div>
          <div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{isLoading ? "Finding tours..." : `${totalItems} tour${totalItems === 1 ? "" : "s"} found`}</p>{hasFilters ? <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600"><Sparkles size={12} />Filtered</span> : null}</div>
          {isLoading ? <ToursSkeleton count={pageSize} /> : error ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-rose-800"><div className="flex gap-3"><AlertCircle className="mt-0.5 size-5 shrink-0" /><div><h2 className="font-bold">Cannot load tours</h2><p className="mt-1 text-sm">{error}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-white px-4 text-sm font-bold text-rose-700 shadow-sm"><RefreshCw size={15} /> Retry</button></div></div></div>
          ) : items.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50"><p className="text-slate-500">No tours match your search and filters.</p>{hasFilters ? <button onClick={clearFilters} className="mt-3 text-sm font-bold text-brand-600">Clear filters</button> : null}</div>
          ) : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{items.map((tour) => <TourCard key={getPublicTourId(tour)} tour={toTourCard(tour)} />)}</div>}
          {!isLoading && totalItems > 0 ? <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="tours" onPageChange={setPage} /> : null}
        </div>
      </section>
    </>
  );
}

function FilterOptions({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) {
  return <fieldset className="border-b border-slate-100 pb-5 pt-1 [&+&]:pt-5"><legend className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{label}</legend><div className="flex flex-wrap gap-2">{options.map(([optionValue, text]) => <button type="button" key={optionValue} onClick={() => onChange(optionValue)} aria-pressed={value === optionValue} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${value === optionValue ? "border-brand-600 bg-brand-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-600"}`}>{text}</button>)}</div></fieldset>;
}

const maximumBudget = 20_000_000;

function BudgetRange({ minValue, maxValue, onCommit }: { minValue: string; maxValue: string; onCommit: (minValue: string, maxValue: string) => void }) {
  const [draftMinimum, setDraftMinimum] = useState(minValue ? Number(minValue) : 0);
  const [draftMaximum, setDraftMaximum] = useState(maxValue ? Number(maxValue) : maximumBudget);
  const minimum = draftMinimum;
  const maximum = draftMaximum;
  const minProgress = (minimum / maximumBudget) * 100;
  const maxProgress = (maximum / maximumBudget) * 100;
  const sliderClass = "pointer-events-none absolute inset-x-0 top-0 h-5 w-full appearance-none bg-transparent [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-brand-600 [&::-moz-range-thumb]:shadow-md [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-brand-600 [&::-webkit-slider-thumb]:shadow-md";

  useEffect(() => { setDraftMinimum(minValue ? Number(minValue) : 0); }, [minValue]);
  useEffect(() => { setDraftMaximum(maxValue ? Number(maxValue) : maximumBudget); }, [maxValue]);

  function commit() {
    onCommit(minimum === 0 ? "" : String(minimum), maximum === maximumBudget ? "" : String(maximum));
  }

  return (
    <fieldset className="border-b border-slate-100 pb-5 pt-1">
      <div className="mb-3 flex items-center justify-between gap-3">
        <legend className="text-xs font-bold uppercase tracking-wide text-slate-500">Budget</legend>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
          {minimum === 0 && maximum === maximumBudget ? "Any budget" : `${formatCompactVnd(minimum)} – ${maximum === maximumBudget ? "20M+ ₫" : formatCompactVnd(maximum)}`}
        </span>
      </div>
      <div className="relative h-5 py-1.5">
        <div className="absolute inset-x-0 top-1.5 h-2 rounded-full bg-slate-200" />
        <div className="absolute top-1.5 h-2 rounded-full bg-brand-600" style={{ left: `${minProgress}%`, right: `${100 - maxProgress}%` }} />
        <input type="range" min="0" max={maximumBudget} step="500000" value={minimum} onChange={(event) => setDraftMinimum(Math.min(Number(event.target.value), maximum - 500_000))} onPointerUp={commit} onKeyUp={commit} aria-label="Minimum tour budget" className={sliderClass} style={{ zIndex: minimum > maximumBudget * 0.8 ? 5 : 3 }} />
        <input type="range" min="0" max={maximumBudget} step="500000" value={maximum} onChange={(event) => setDraftMaximum(Math.max(Number(event.target.value), minimum + 500_000))} onPointerUp={commit} onKeyUp={commit} aria-label="Maximum tour budget" className={sliderClass} style={{ zIndex: 4 }} />
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-semibold text-slate-400"><span>0 ₫</span><span>20M+ ₫</span></div>
    </fieldset>
  );
}

function formatCompactVnd(amount: number) {
  if (amount >= 1_000_000) return `${Number((amount / 1_000_000).toFixed(1))}M ₫`;
  return `${Math.round(amount / 1_000)}K ₫`;
}


function CategoryButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${active ? "bg-brand-600 text-white shadow-md shadow-brand-600/20" : "text-slate-600 hover:bg-slate-50 hover:text-brand-600"}`}>{children}</button>;
}

function getDurationParams(value: string) {
  if (value === "1") return { min: 0, max: 1 };
  if (value === "2-3") return { min: 2, max: 3 };
  if (value === "4-7") return { min: 4, max: 7 };
  if (value === "8+") return { min: 8, max: undefined };
  return { min: undefined, max: undefined };
}

function toTourCard(tour: PublicTour): Tour {
  const category = typeof tour.tour_category === "object" ? tour.tour_category.name : tour.tour_category;
  return { id: String(getPublicTourId(tour)), title: getPublicTourName(tour), destination: getDestinationNames(tour), image: tour.thumbnail_url || tour.thumbnail || images.swiss, rating: Number(tour.average_rating ?? 0), reviews: String(tour.review_count ?? 0), duration: formatTourDuration(tour), price: Number(tour.price ?? 0), currency: tour.currency ?? "VND", category: category || "Tour", capacity: `Max ${tour.capacity || 0} people` };
}

function getDestinationNames(tour: PublicTour) {
  const destinations = tour.destinations ?? tour.travel_destinations ?? tour.tour_destinations ?? [];
  return destinations.map((destination) => destination.name || destination.destination_name || destination.travel_destination_name).filter(Boolean).join(" · ") || tour.destination_name || "Various Locations";
}

function formatTourDuration(tour: PublicTour) {
  const days = Number(tour.duration_days ?? 0), nights = Number(tour.duration_nights ?? 0);
  return days || nights ? [days ? `${days}d` : "", nights ? `${nights}n` : ""].filter(Boolean).join(" ") : tour.schedule || "Schedule pending";
}

function ToursSkeleton({ count }: { count: number }) {
  return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading tours" aria-busy="true">{Array.from({ length: count }, (_, index) => <div key={index} className="min-h-[344px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="h-44 animate-pulse bg-slate-200" /><div className="space-y-3 p-4"><div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" /><div className="h-3 w-2/5 animate-pulse rounded bg-slate-100" /><div className="h-3 w-3/5 animate-pulse rounded bg-slate-100" /><div className="h-5 w-full animate-pulse rounded bg-slate-100" /></div></div>)}</div>;
}
