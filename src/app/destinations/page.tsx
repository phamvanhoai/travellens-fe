"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Compass, Filter, Search, Sparkles } from "lucide-react";
import { DestinationCard } from "@/components/cards/destination-card";
import { Pagination } from "@/components/common/pagination";
import { PageHero } from "@/components/common/page-hero";
import { images } from "@/lib/data";
import {
  destinationService,
  type PublicDestinationCategory,
  type PublicTravelDestination,
  toDestinationCardModel
} from "@/services/destination.service";

const sortOptions = [
  { label: "Newest", sortBy: "created_at", sortOrder: "DESC" },
  { label: "Oldest", sortBy: "created_at", sortOrder: "ASC" },
  { label: "Name A-Z", sortBy: "name", sortOrder: "ASC" },
  { label: "Name Z-A", sortBy: "name", sortOrder: "DESC" }
] as const;

export default function DestinationsPage() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PublicTravelDestination[]>([]);
  const [categories, setCategories] = useState<PublicDestinationCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortIndex, setSortIndex] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const pageSize = 8;

  useEffect(() => {
    const query = new URLSearchParams(window.location.search).get("search")?.trim() ?? "";
    if (query) {
      setSearchInput(query);
      setSearch(query);
    }
  }, []);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setCategories(await destinationService.categories());
      } catch (error) {
        console.error("Failed to fetch destination categories:", error);
      }
    }

    void fetchCategories();
  }, []);

  useEffect(() => {
    const fetchDestinations = async () => {
      setIsLoading(true);
      setError("");
      try {
        const sort = sortOptions[sortIndex];
        const result = await destinationService.list({
          page,
          limit: pageSize,
          search: search || undefined,
          destination_category_id: selectedCategoryId || undefined,
          sortBy: sort.sortBy,
          sortOrder: sort.sortOrder
        });
        setItems(result.items);
        setTotalItems(result.total);
        setPageCount(result.totalPages);
      } catch (error) {
        console.error("Failed to fetch destinations:", error);
        setError("Cannot load travel destinations.");
        setItems([]);
        setTotalItems(0);
        setPageCount(1);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDestinations();
  }, [page, search, selectedCategoryId, sortIndex]);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function selectCategory(categoryId: string) {
    setPage(1);
    setSelectedCategoryId(categoryId);
  }

  function changeSort(value: string) {
    setPage(1);
    setSortIndex(Number(value));
  }

  return (
    <>
      <PageHero
        title="Explore Destinations"
        subtitle="Find your next adventure from around the world"
        image={images.santorini}
        searchClassName="w-full"
        searchContent={
          <form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-2xl border border-white/40 bg-white/95 p-2.5 text-ink shadow-2xl backdrop-blur sm:flex-row sm:items-center">
              <label className="flex min-w-0 flex-1 items-center gap-4 rounded-xl px-3 py-2">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Search size={20} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Discover a destination</span>
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    className="mt-0.5 h-7 w-full bg-transparent text-base font-semibold text-ink outline-none placeholder:font-normal placeholder:text-slate-400"
                    placeholder="Search by name or description..."
                  />
                </span>
              </label>
              <button type="submit" className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700">
                Explore places <ChevronRight size={17} />
              </button>
          </form>
        }
      />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => selectCategory("")}
            className={`relative isolate inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${!selectedCategoryId ? "text-white" : "text-slate-600 hover:bg-slate-50 hover:text-brand-600"}`}
          >
            {!selectedCategoryId ? <motion.span layoutId="destination-category-active" className="absolute inset-0 -z-10 rounded-xl bg-brand-600 shadow-md shadow-brand-600/20" transition={{ type: "spring", stiffness: 420, damping: 34 }} /> : null}
            <Compass size={16} /> All Destinations
          </button>
          {categories.map((category) => {
            const id = String(category.destination_category_id ?? category.id ?? "");
            return (
              <button
                key={id || category.name}
                type="button"
                onClick={() => selectCategory(id)}
                className={`relative isolate shrink-0 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${selectedCategoryId === id ? "text-white" : "text-slate-600 hover:bg-slate-50 hover:text-brand-600"}`}
              >
                {selectedCategoryId === id ? <motion.span layoutId="destination-category-active" className="absolute inset-0 -z-10 rounded-xl bg-brand-600 shadow-md shadow-brand-600/20" transition={{ type: "spring", stiffness: 420, damping: 34 }} /> : null}
                {category.name}
              </button>
            );
          })}
          </div>
          <label className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-slate-50 px-4 py-2.5 text-sm font-bold text-slate-600">
            <Filter size={15} className="text-brand-600" />
            <select value={sortIndex} onChange={(event) => changeSort(event.target.value)} className="cursor-pointer bg-transparent outline-none">
              {sortOptions.map((option, index) => (
                <option key={option.label} value={index}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">{isLoading ? "Finding destinations..." : `${totalItems} destination${totalItems === 1 ? "" : "s"} found`}</p>{search || selectedCategoryId ? <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-600"><Sparkles size={12} />Filtered</span> : null}</div>
        
        {error ? (
          <div className="mb-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>
        ) : null}

        {isLoading ? (
          <DestinationsSkeleton count={pageSize} />
        ) : items.length === 0 ? (
          <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-slate-300">
            <p className="text-slate-500">No destinations found.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => {
              const mappedDestination = toDestinationCardModel(item, images.santorini);
              return <DestinationCard key={mappedDestination.id} destination={mappedDestination} />;
            })}
          </div>
        )}
        
        {!isLoading && totalItems > 0 && (
          <div className="mt-8">
            <Pagination page={page} pageCount={pageCount} totalItems={totalItems} pageSize={pageSize} itemLabel="destinations" onPageChange={setPage} />
          </div>
        )}
      </section>
    </>
  );
}

function DestinationsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading destinations" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="relative h-44 animate-pulse bg-slate-200">
            <span className="absolute right-3 top-3 size-9 rounded-full bg-white/90" />
          </div>
          <div className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-slate-100" />
              </div>
              <div className="w-14 space-y-2">
                <div className="ml-auto h-2.5 w-7 animate-pulse rounded bg-slate-100" />
                <div className="h-3.5 w-full animate-pulse rounded bg-slate-200" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-4 animate-pulse rounded-full bg-amber-200" />
              <div className="h-3.5 w-20 animate-pulse rounded bg-slate-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
