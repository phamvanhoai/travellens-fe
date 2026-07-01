"use client";

import { useState, useEffect } from "react";
import { Filter, Loader2 } from "lucide-react";
import { DestinationCard } from "@/components/cards/destination-card";
import { Pagination } from "@/components/common/pagination";
import { PageHero } from "@/components/common/page-hero";
import { images } from "@/lib/data";
import { api } from "@/services/api";

const categories = ["All Destinations", "Beach", "Mountain", "City", "Culture", "Adventure", "Nature"];

export default function DestinationsPage() {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const pageSize = 8;

  useEffect(() => {
    const fetchDestinations = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get("/travel-destinations", {
          params: { page, limit: pageSize }
        });
        const items = data?.data?.items || [];
        setItems(items);
        setTotalItems(data?.data?.pagination?.total || 0);
        setPageCount(data?.data?.pagination?.totalPages || Math.ceil((data?.data?.pagination?.total || 0) / pageSize) || 1);
      } catch (error) {
        console.error("Failed to fetch destinations:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDestinations();
  }, [page]);

  return (
    <>
      <PageHero title="Explore Destinations" subtitle="Find your next adventure from around the world" image={images.santorini} />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {categories.map((category, index) => (
            <button key={category} className={index === 0 ? "rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white" : "rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold hover:border-brand-600 hover:text-brand-600"}>
              {category}
            </button>
          ))}
          <button className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">
            <Filter size={16} /> Popular
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">Showing travel destinations</p>
        
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
              const mappedDest = {
                id: item.destination_id,
                name: item.name,
                country: item.country || "Vietnam",
                category: item.destination_category || "Destination",
                region: item.region || "Various",
                image: item.thumbnail || images.santorini,
                rating: 4.8,
                reviews: "20",
                priceFrom: 0,
                description: item.description || "",
                bestTime: ""
              };
              return <DestinationCard key={mappedDest.id} destination={mappedDest as any} />;
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
