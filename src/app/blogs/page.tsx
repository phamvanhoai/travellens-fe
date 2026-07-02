"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { PageHero } from "@/components/common/page-hero";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import {
  blogService,
  getCustomerBlogAuthor,
  getCustomerBlogExcerpt,
  getCustomerBlogId,
  getCustomerBlogImage,
  getCustomerBlogLocations,
  type CustomerBlog
} from "@/services/blog.service";

const pageSize = 6;

export default function BlogsPage() {
  const [items, setItems] = useState<CustomerBlog[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBlogs() {
      setLoading(true);
      setError("");
      try {
        setItems(await blogService.list());
      } catch {
        setError("Cannot load travel stories from API.");
      } finally {
        setLoading(false);
      }
    }

    void loadBlogs();
  }, []);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((blog) => `${blog.title} ${getCustomerBlogExcerpt(blog, 300)} ${getCustomerBlogAuthor(blog)}`.toLowerCase().includes(normalized));
  }, [items, query]);
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedBlogs = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <>
      <PageHero title="Travel Stories & Guides" subtitle="Ideas, destination guides and traveler reviews" image={images.balloons} search={false} />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <nav className="mb-5 text-sm font-semibold text-slate-500">
          <Link href="/" className="hover:text-brand-600">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-700">Blogs</span>
        </nav>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-3 size-5 text-slate-400" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
              placeholder="Search stories..."
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h2 className="text-xl font-bold">Blogs unavailable</h2>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <Button href="/" className="mt-5">Back Home</Button>
          </div>
        ) : loading ? (
          <div className="grid min-h-80 place-items-center rounded-lg bg-white text-sm font-semibold text-slate-500">
            <span><Loader2 className="mr-2 inline size-5 animate-spin text-brand-600" />Loading blogs...</span>
          </div>
        ) : paginatedBlogs.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-10 text-center text-sm text-slate-500">No travel stories found.</div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              {paginatedBlogs.map((blog) => {
                const id = getCustomerBlogId(blog);
                const locations = getCustomerBlogLocations(blog).map((location) => location.name).filter(Boolean);
                return (
                  <Link key={id || blog.title} href={`/blogs/${id}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                    <img src={getCustomerBlogImage(blog, images.balloons)} alt={blog.title} className="h-56 w-full object-cover" />
                    <div className="p-5">
                      <p className="text-xs font-bold uppercase tracking-wide text-brand-600">{locations[0] ?? "Travel guide"}</p>
                      <h2 className="mt-2 text-xl font-bold">{blog.title}</h2>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{getCustomerBlogExcerpt(blog)}</p>
                      <p className="mt-4 text-xs font-semibold text-slate-400">By {getCustomerBlogAuthor(blog)}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="blogs" onPageChange={setPage} />
          </>
        )}
      </section>
    </>
  );
}
