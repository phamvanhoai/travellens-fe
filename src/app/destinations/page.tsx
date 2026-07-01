"use client";

import { useState, useEffect } from "react";
import { Filter, Loader2, Search } from "lucide-react";
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
        searchContent={
          <form onSubmit={submitSearch} className="rounded-lg bg-white p-3 text-ink shadow-soft">
            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <label className="rounded-lg border border-slate-100 px-4 py-3">
                <span className="mb-2 block text-xs font-semibold text-slate-500">Where to?</span>
                <span className="flex items-center gap-2">
                  <Search size={16} className="text-brand-600" />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-ink outline-none placeholder:text-slate-400"
                    placeholder="Search destinations..."
                  />
                </span>
              </label>
              <button type="submit" className="inline-flex h-full min-h-14 items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 text-sm font-semibold text-white transition hover:bg-brand-700">
                <Search size={17} /> Search
              </button>
            </div>
          </form>
        }
      />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => selectCategory("")}
            className={!selectedCategoryId ? "rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white" : "rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold hover:border-brand-600 hover:text-brand-600"}
          >
            All Destinations
          </button>
          {categories.map((category) => {
            const id = String(category.destination_category_id ?? category.id ?? "");
            return (
              <button
                key={id || category.name}
                type="button"
                onClick={() => selectCategory(id)}
                className={selectedCategoryId === id ? "rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white" : "rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold hover:border-brand-600 hover:text-brand-600"}
              >
                {category.name}
              </button>
            );
          })}
          <label className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">
            <Filter size={16} />
            <select value={sortIndex} onChange={(event) => changeSort(event.target.value)} className="bg-transparent outline-none">
              {sortOptions.map((option, index) => (
                <option key={option.label} value={index}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
        <p className="mb-4 text-sm text-slate-500">
          {search ? `Showing destinations for "${search}"` : "Showing travel destinations"}
        </p>
        
        {error ? (
          <div className="mb-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div>
        ) : null}

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
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
