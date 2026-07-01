"use client";

import { useState, useEffect } from "react";
import { DestinationCard } from "@/components/cards/destination-card";
import { TourCard } from "@/components/cards/tour-card";
import { Pagination } from "@/components/common/pagination";
import { savedItemService } from "@/services/saved-item.service";
import { Loader2 } from "lucide-react";
import { useSavedItemsStore } from "@/store/use-saved-items-store";

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<"tours" | "destinations">("tours");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // Re-fetch if items are unsaved globally via the store while on this page
  const { savedTours, savedDestinations } = useSavedItemsStore();

  const pageSize = 6;

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true);
      try {
        if (activeTab === "tours") {
          const data = await savedItemService.getSavedTours({ page, limit: pageSize });
          setItems(data.data.items);
          setTotalItems(data.data.pagination.total);
          setPageCount(data.data.pagination.totalPages);
        } else {
          const data = await savedItemService.getSavedDestinations({ page, limit: pageSize });
          setItems(data.data.items);
          setTotalItems(data.data.pagination.total);
          setPageCount(data.data.pagination.totalPages);
        }
      } catch (error) {
        console.error("Failed to fetch saved items", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchItems();
  }, [activeTab, page]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Saved Items</h1>
      <p className="mt-1 text-sm text-slate-500">Browse your saved tours and destinations.</p>
      
      <div className="mt-6 border-b border-slate-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => { setActiveTab("tours"); setPage(1); }}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === "tours"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            Saved Tours
          </button>
          <button
            onClick={() => { setActiveTab("destinations"); setPage(1); }}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === "destinations"
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            Saved Destinations
          </button>
        </nav>
      </div>

      <div className="mt-6 min-h-[400px]">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
            <p className="text-slate-500">No saved {activeTab} yet.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                if (activeTab === "tours") {
                  const mappedTour = {
                    id: item.tour_id,
                    title: item.name,
                    destination: "Various Locations", // Usually derived from relations
                    image: item.thumbnail,
                    rating: 4.5, // Mocked or backend provided
                    reviews: "10",
                    duration: `${item.duration_days}d ${item.duration_nights}n`,
                    price: item.price,
                    category: "Tour",
                    capacity: `Max ${item.capacity} people`
                  };
                  return <TourCard key={`tour-${item.tour_id}`} tour={mappedTour as any} />;
                } else {
                  const mappedDest = {
                    id: item.destination_id,
                    name: item.name,
                    country: item.country || "Vietnam",
                    category: "Destination",
                    region: item.region || "Various",
                    image: item.thumbnail,
                    rating: 4.8,
                    reviews: "20",
                    priceFrom: 0,
                    description: item.description,
                    bestTime: ""
                  };
                  return <DestinationCard key={`dest-${item.destination_id}`} destination={mappedDest as any} />;
                }
              })}
            </div>
            
            {totalItems > 0 && (
              <div className="mt-8">
                <Pagination 
                  page={page} 
                  pageCount={pageCount} 
                  totalItems={totalItems} 
                  pageSize={pageSize} 
                  itemLabel={`saved ${activeTab}`} 
                  onPageChange={setPage} 
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
