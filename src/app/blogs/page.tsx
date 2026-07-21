"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { PageHero } from "@/components/common/page-hero";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import {
  blogService,
  getCustomerBlogAuthor,
  getCustomerBlogExcerpt,
  getCustomerBlogId,
  getCustomerBlogPath,
  getCustomerBlogImage,
  getCustomerBlogCategoryIds,
  getCustomerBlogCategoryNames,
  getCustomerBlogLocations,
  type CustomerBlog
} from "@/services/blog.service";
import { blogCategoryService, getBlogCategoryId, type BlogCategory } from "@/services/blog-category.service";

const pageSize = 6;

export default function BlogsPage() {
  const [items, setItems] = useState<CustomerBlog[]>([]);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
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

  useEffect(() => {
    blogCategoryService.list({ page: 1, limit: 100 }).then(setCategories).catch(() => setCategories([]));
  }, []);

  const visibleItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((blog) => {
      const matchesCategory = !categoryId || getCustomerBlogCategoryIds(blog).includes(Number(categoryId));
      const matchesSearch = !normalized || `${blog.title} ${getCustomerBlogExcerpt(blog, 300)} ${getCustomerBlogAuthor(blog)} ${getCustomerBlogCategoryNames(blog).join(" ")}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesSearch;
    });
  }, [items, query, categoryId]);
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
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
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
          <select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setPage(1); }} className="h-11 min-w-52 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand-600" aria-label="Filter by blog category">
            <option value="">All categories</option>
            {categories.map((category) => <option key={getBlogCategoryId(category)} value={getBlogCategoryId(category)}>{category.name}</option>)}
          </select>
        </div>

        {error ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h2 className="text-xl font-bold">Blogs unavailable</h2>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <Button href="/" className="mt-5">Back Home</Button>
          </div>
        ) : loading ? (
          <BlogsSkeleton count={pageSize} />
        ) : paginatedBlogs.length === 0 ? (
          <div className="rounded-lg bg-slate-50 p-10 text-center text-sm text-slate-500">No travel stories found.</div>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-3">
              {paginatedBlogs.map((blog) => {
                const id = getCustomerBlogId(blog);
                const locations = getCustomerBlogLocations(blog).map((location) => location.name).filter(Boolean);
                return (
                  <Link key={id || blog.title} href={getCustomerBlogPath(blog)} className="flex h-full min-h-[376px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                    <img src={getCustomerBlogImage(blog, images.balloons)} alt={blog.title} className="h-48 w-full object-cover" />
                    <div className="flex flex-1 flex-col p-4">
                      <p className="line-clamp-1 text-xs font-bold uppercase tracking-wide text-brand-600">{getCustomerBlogCategoryNames(blog).join(" / ") || "Travel guide"}</p>
                      <h2 className="mt-2 line-clamp-2 min-h-12 text-lg font-bold leading-6">{blog.title}</h2>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{getCustomerBlogExcerpt(blog)}</p>
                      <div className="mt-auto min-h-10 pt-4"><p className="truncate text-xs font-semibold text-slate-400">By {getCustomerBlogAuthor(blog)}</p><p className="mt-1 truncate text-xs text-slate-400">{locations[0] || "Travel360"}</p></div>
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

function BlogsSkeleton({ count }: { count: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-3" aria-label="Loading blogs" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <article key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-hidden="true">
          <div className="h-48 animate-pulse bg-slate-200" />
          <div className="p-4">
            <div className="h-3 w-2/5 animate-pulse rounded bg-brand-100" />
            <div className="mt-3 h-5 w-5/6 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-5 w-3/5 animate-pulse rounded bg-slate-200" />
            <div className="mt-4 space-y-2">
              <div className="h-3.5 w-full animate-pulse rounded bg-slate-100" />
              <div className="h-3.5 w-4/5 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="mt-5 h-3 w-28 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-20 animate-pulse rounded bg-slate-100" />
          </div>
        </article>
      ))}
    </div>
  );
}
