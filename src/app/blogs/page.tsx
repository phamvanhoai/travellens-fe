"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, CalendarDays, MapPin, Search, Sparkles } from "lucide-react";
import { PageHero } from "@/components/common/page-hero";
import { Pagination } from "@/components/common/pagination";
import { images } from "@/lib/data";
import { blogCategoryService, getBlogCategoryId, type BlogCategory } from "@/services/blog-category.service";
import { blogService, getCustomerBlogAuthor, getCustomerBlogCategoryIds, getCustomerBlogCategoryNames, getCustomerBlogExcerpt, getCustomerBlogId, getCustomerBlogImage, getCustomerBlogLocations, getCustomerBlogPath, type CustomerBlog } from "@/services/blog.service";

const pageSize = 6;

export default function BlogsPage() {
  const [items, setItems] = useState<CustomerBlog[]>([]);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([blogService.list(), blogCategoryService.list({ page: 1, limit: 100 })]).then(([blogs, categoryList]) => {
      if (!active) return;
      if (blogs.status === "fulfilled") setItems(blogs.value); else setError("Cannot load travel stories from API.");
      if (categoryList.status === "fulfilled") setCategories(categoryList.value);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const visibleItems = useMemo(() => {
    const normalized = normalizeText(query);
    return items.filter((blog) => {
      const matchesCategory = !categoryId || getCustomerBlogCategoryIds(blog).includes(Number(categoryId));
      const haystack = `${blog.title} ${getCustomerBlogExcerpt(blog, 300)} ${getCustomerBlogAuthor(blog)} ${getCustomerBlogCategoryNames(blog).join(" ")}`;
      return matchesCategory && (!normalized || normalizeText(haystack).includes(normalized));
    });
  }, [items, query, categoryId]);

  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedBlogs = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  function submitSearch(event: FormEvent) { event.preventDefault(); setQuery(input.trim()); setPage(1); }

  const searchForm = <form onSubmit={submitSearch} className="flex flex-col gap-3 rounded-2xl border border-white/40 bg-white/95 p-2.5 text-ink shadow-2xl backdrop-blur sm:flex-row sm:items-center"><label className="flex min-w-0 flex-1 items-center gap-4 rounded-xl px-3 py-2"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Search size={20} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Stories, guides & inspiration</span><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="What would you like to read?" className="mt-0.5 h-7 w-full bg-transparent text-base font-semibold outline-none placeholder:font-normal placeholder:text-slate-400" /></span></label><button type="submit" className="h-14 rounded-xl bg-brand-600 px-7 text-sm font-bold text-white shadow-lg shadow-brand-600/20 transition hover:-translate-y-0.5 hover:bg-brand-700">Explore stories</button></form>;

  return (
    <>
      <PageHero title="Stories That Inspire the Next Journey" subtitle="Practical guides, local discoveries and memorable experiences shared by travelers." image={images.balloons} searchClassName="w-full" searchContent={searchForm} />
      <section className="bg-gradient-to-b from-slate-50 to-white py-10"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600"><Sparkles size={14} />Travel journal</span><h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">Latest Stories & Guides</h2><p className="mt-1 text-sm text-slate-500">Discover useful ideas before planning your next adventure.</p></div><span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500">{loading ? "Loading..." : `${visibleItems.length} article${visibleItems.length === 1 ? "" : "s"}`}</span></div>
          <div className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-sm"><CategoryButton active={!categoryId} onClick={() => { setCategoryId(""); setPage(1); }}><BookOpen size={15} />All stories</CategoryButton>{categories.map((category) => { const id = String(getBlogCategoryId(category)); return <CategoryButton key={id} active={categoryId === id} onClick={() => { setCategoryId(id); setPage(1); }}>{category.name}</CategoryButton>; })}</div>
        </div>
        {error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm font-semibold text-rose-700">{error}</div> : loading ? <BlogsSkeleton /> : paginatedBlogs.length ? <div className="grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">{paginatedBlogs.map((blog) => <BlogCard key={getCustomerBlogId(blog) || blog.title} blog={blog} />)}</div> : <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">No stories match your search.</div>}
        {!loading && visibleItems.length > 0 ? <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="blogs" onPageChange={setPage} /> : null}
      </div></section>
    </>
  );
}

function BlogCard({ blog }: { blog: CustomerBlog }) {
  const author = getCustomerBlogAuthor(blog);
  const category = getCustomerBlogCategoryNames(blog)[0] || "Travel guide";
  const location = getCustomerBlogLocations(blog).map((item) => item.name).find(Boolean) || "Travel360";
  return <Link href={getCustomerBlogPath(blog)} className="group flex h-full min-h-[390px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft"><div className="relative h-48 overflow-hidden bg-slate-100"><img src={getCustomerBlogImage(blog, images.balloons)} alt={blog.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/5" /><span className="absolute left-3 top-3 rounded-full border border-white/30 bg-white/90 px-3 py-1 text-[11px] font-bold text-brand-700 shadow-sm backdrop-blur">{category}</span><span className="absolute bottom-3 left-3 flex max-w-[75%] items-center gap-1.5 text-xs font-semibold text-white"><MapPin size={13} className="shrink-0" /><span className="truncate">{location}</span></span><span className="absolute bottom-3 right-3 grid size-8 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition group-hover:bg-white group-hover:text-brand-700"><ArrowUpRight size={15} /></span></div><div className="flex flex-1 flex-col p-5"><h3 className="line-clamp-2 min-h-12 text-lg font-bold leading-6 text-ink transition group-hover:text-brand-700">{blog.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">{getCustomerBlogExcerpt(blog) || "Discover travel ideas, helpful tips and inspiring places."}</p><footer className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4"><span className="flex min-w-0 items-center gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{getInitials(author)}</span><span className="truncate text-xs font-bold text-slate-600">{author}</span></span><span className="flex shrink-0 items-center gap-1 text-[11px] text-slate-400"><CalendarDays size={12} />{formatDate(blog.created_at)}</span></footer></div></Link>;
}

function CategoryButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition ${active ? "bg-brand-600 text-white shadow-md shadow-brand-600/20" : "text-slate-600 hover:bg-slate-50 hover:text-brand-600"}`}>{children}</button>; }
function BlogsSkeleton() { return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div key={index} className="min-h-[390px] animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="h-48 bg-slate-200" /><div className="space-y-3 p-5"><div className="h-5 w-5/6 rounded bg-slate-200" /><div className="h-5 w-3/5 rounded bg-slate-200" /><div className="h-3 w-full rounded bg-slate-100" /><div className="h-3 w-4/5 rounded bg-slate-100" /></div></div>)}</div>; }
function normalizeText(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase(); }
function getInitials(name: string) { return name.trim().split(/\s+/).slice(-2).map((part) => part.charAt(0).toUpperCase()).join("") || "T"; }
function formatDate(value?: string) { if (!value) return "Recently"; const date = new Date(value); return Number.isNaN(date.getTime()) ? "Recently" : new Intl.DateTimeFormat("en", { day: "2-digit", month: "short", year: "numeric" }).format(date); }
