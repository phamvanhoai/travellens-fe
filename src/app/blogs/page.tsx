"use client";

import { useState } from "react";
import Link from "next/link";
import { Pagination } from "@/components/common/pagination";
import { PageHero } from "@/components/common/page-hero";
import { destinations, images } from "@/lib/data";

export default function BlogsPage() {
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const pageCount = Math.max(1, Math.ceil(destinations.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedBlogs = destinations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <PageHero title="Travel Stories & Guides" subtitle="Ideas, destination guides and traveler reviews" image={images.balloons} search={false} />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {paginatedBlogs.map((item) => (
            <Link key={item.id} href={`/blogs/${item.id}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <img src={item.image} alt={item.name} className="h-56 w-full object-cover" />
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-600">{item.category}</p>
                <h2 className="mt-2 text-xl font-bold">A first-timer guide to {item.name}</h2>
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
        <Pagination page={currentPage} pageCount={pageCount} totalItems={destinations.length} pageSize={pageSize} itemLabel="blogs" onPageChange={setPage} />
      </section>
    </>
  );
}
