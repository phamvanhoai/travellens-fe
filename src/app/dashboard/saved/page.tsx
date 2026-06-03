"use client";

import { useState } from "react";
import { DestinationCard } from "@/components/cards/destination-card";
import { TourCard } from "@/components/cards/tour-card";
import { Pagination } from "@/components/common/pagination";
import { destinations, tours } from "@/lib/data";

const savedItems = [
  ...destinations.slice(0, 6).map((item) => ({ type: "destination" as const, item })),
  ...tours.slice(0, 6).map((item) => ({ type: "tour" as const, item }))
];

export default function SavedPage() {
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(savedItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = savedItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      <h1 className="text-2xl font-bold">Saved Tours & Destinations</h1>
      <p className="mt-1 text-sm text-slate-500">Browse your saved tours and destinations.</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {paginatedItems.map((entry) =>
          entry.type === "destination"
            ? <DestinationCard key={`destination-${entry.item.id}`} destination={entry.item} />
            : <TourCard key={`tour-${entry.item.id}`} tour={entry.item} />
        )}
      </div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={savedItems.length} pageSize={pageSize} itemLabel="saved items" onPageChange={setPage} />
    </div>
  );
}
