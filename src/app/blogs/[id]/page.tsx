"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Loader2, MapPin, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import {
  blogService,
  getCustomerBlogAuthor,
  getCustomerBlogExcerpt,
  getCustomerBlogImage,
  getCustomerBlogLocations,
  type CustomerBlog
} from "@/services/blog.service";

export default function BlogDetailPage() {
  const params = useParams<{ id: string }>();
  const [blog, setBlog] = useState<CustomerBlog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBlog() {
      if (!params.id) return;
      setLoading(true);
      setError("");
      try {
        setBlog(await blogService.detail(params.id));
      } catch {
        setError("Cannot load this travel story from API.");
      } finally {
        setLoading(false);
      }
    }

    void loadBlog();
  }, [params.id]);

  if (loading) {
    return (
      <section className="mx-auto grid min-h-[520px] max-w-4xl place-items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-sm font-semibold text-slate-500"><Loader2 className="mr-2 inline size-5 animate-spin text-brand-600" />Loading story...</div>
      </section>
    );
  }

  if (error || !blog) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold">Story not available</h1>
        <p className="mt-3 text-slate-600">{error || "This blog could not be found."}</p>
        <Button href="/blogs" className="mt-8">Back to Blogs</Button>
      </section>
    );
  }

  const locations = getCustomerBlogLocations(blog);
  const content = blog.content?.trim();

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-5 text-sm font-semibold text-slate-500">
        <Link href="/" className="hover:text-brand-600">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/blogs" className="hover:text-brand-600">Blogs</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">Story Detail</span>
      </nav>
      <img src={getCustomerBlogImage(blog, images.balloons)} alt={blog.title} className="h-[460px] w-full rounded-lg object-cover" />
      <p className="mt-8 text-sm font-bold uppercase tracking-wide text-brand-600">Travel story</p>
      <h1 className="mt-3 text-4xl font-bold">{blog.title}</h1>
      <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-slate-500">
        <span className="inline-flex items-center gap-2"><UserRound size={16} /> {getCustomerBlogAuthor(blog)}</span>
        {blog.created_at ? <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> {formatDate(blog.created_at)}</span> : null}
        {locations.map((location, index) => (
          <Link key={`${location.location_id ?? location.id ?? location.name}-${index}`} href={location.location_id || location.id ? `/locations/${location.location_id ?? location.id}` : "/destinations"} className="inline-flex items-center gap-2 text-brand-600">
            <MapPin size={16} /> {location.name}
          </Link>
        ))}
      </div>

      {content ? (
        <div className="prose prose-slate mt-8 max-w-none leading-8" dangerouslySetInnerHTML={{ __html: content }} />
      ) : (
        <p className="mt-8 text-lg leading-8 text-slate-600">{getCustomerBlogExcerpt(blog, 1200) || "No content has been added for this story yet."}</p>
      )}
      <div className="mt-10 border-t border-slate-200 pt-6">
        <Button href="/blogs" variant="outline">Back to Blogs</Button>
      </div>
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(date);
}
