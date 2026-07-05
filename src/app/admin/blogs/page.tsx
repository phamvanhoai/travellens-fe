"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, Loader2, Newspaper, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { getRichTextPlainText, RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import { resolveBackendAssetUrl } from "@/lib/avatar";
import {
  adminBlogService,
  getAdminBlogCategoryIds,
  getAdminBlogCategoryNames,
  getAdminBlogAuthorName,
  getAdminBlogId,
  getAdminBlogPath,
  getAdminBlogLocationIds,
  getAdminBlogLocations,
  type AdminBlog,
  type AdminBlogPayload
} from "@/services/admin-blog.service";
import { adminLocationService, getLocationId, type AdminLocation } from "@/services/admin-location.service";
import { adminBlogCategoryService, getBlogCategoryId, type BlogCategory } from "@/services/blog-category.service";

type BlogFormValue = {
  category_ids: string[];
  title: string;
  slug: string;
  thumbnail: string;
  thumbnail_file: File | null;
  content: string;
  status: "draft" | "published" | "archived";
  published_at: string;
  location_ids: string[];
};

type BlogFieldName = "category_ids" | "title" | "slug" | "thumbnail" | "content" | "status" | "published_at" | "location_ids";
type BlogFieldErrors = Partial<Record<BlogFieldName, string>>;

const emptyBlog: BlogFormValue = { category_ids: [], title: "", slug: "", thumbnail: "", thumbnail_file: null, content: "", status: "published", published_at: "", location_ids: [] };
const pageSize = 5;

export default function AdminBlogsPage() {
  const [items, setItems] = useState<AdminBlog[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminBlog | null>(null);
  const [deleting, setDeleting] = useState<AdminBlog | null>(null);
  const showToast = useToast();

  const locationNames = useMemo(() => new Map(locations.map((location) => [getLocationId(location), location.name])), [locations]);
  const visibleItems = items.filter((item) => {
    const locationText = getAdminBlogLocations(item).map((location) => location.name).join(" ");
    const categoryText = getAdminBlogCategoryNames(item).join(" ");
    return `${item.title} ${getAdminBlogAuthorName(item)} ${categoryText} ${locationText} ${item.content ?? ""}`.toLowerCase().includes(query.toLowerCase());
  });
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [blogs, locationResult, categoryResult] = await Promise.all([
        adminBlogService.list({
          status: statusFilter ? statusFilter as AdminBlogPayload["status"] : undefined,
          blog_category_id: categoryFilter ? Number(categoryFilter) : undefined
        }),
        adminLocationService.list({ page: 1, limit: 100 }),
        adminBlogCategoryService.list()
      ]);
      setItems(blogs);
      setLocations(locationResult.data ?? []);
      setCategories(categoryResult);
    } catch (err) {
      const message = getApiError(err, "Cannot load blogs from API.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [categoryFilter, showToast, statusFilter]);

  useEffect(() => {
    void loadBlogs();
  }, [loadBlogs]);

  async function openEdit(blog: AdminBlog) {
    setError("");
    try {
      const detail = await adminBlogService.detail(getAdminBlogId(blog));
      const listLocationIds = getAdminBlogLocationIds(blog);
      const detailLocationIds = detail ? getAdminBlogLocationIds(detail) : [];
      setEditing(detail ? {
        ...blog,
        ...detail,
        location_ids: detailLocationIds.length > 0 ? detailLocationIds : listLocationIds
      } : blog);
    } catch (err) {
      const message = getApiError(err, "Cannot load blog detail.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    }
  }

  async function saveBlog(form: BlogFormValue) {
    const payload: AdminBlogPayload = {
      category_ids: form.category_ids.map(Number),
      title: form.title.trim(),
      slug: form.slug.trim() || undefined,
      thumbnail: form.thumbnail.trim() || null,
      thumbnail_file: form.thumbnail_file,
      content: form.content.trim(),
      status: form.status,
      published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
      location_ids: form.location_ids.map(Number)
    };

    setSaving(true);
    setError("");
    try {
      if (editing) {
        await adminBlogService.update(getAdminBlogId(editing), payload);
        showToast({ variant: "success", title: "Blog updated", description: payload.title });
      } else {
        await adminBlogService.create(payload);
        showToast({ variant: "success", title: "Blog created", description: payload.title });
      }
      setEditing(null);
      setCreating(false);
      await loadBlogs();
    } catch (err) {
      const message = getApiError(err, "Cannot save blog. Please check the data or your permission.");
      setError(message);
      showToast({ variant: "error", title: "Save failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  async function deleteBlog() {
    if (!deleting) return;
    setSaving(true);
    setError("");
    try {
      await adminBlogService.remove(getAdminBlogId(deleting));
      showToast({ variant: "success", title: "Blog deleted", description: deleting.title });
      setDeleting(null);
      await loadBlogs();
    } catch (err) {
      const message = getApiError(err, "Cannot delete blog.");
      setError(message);
      showToast({ variant: "error", title: "Delete failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Blog Management</h1>
            <p className="mt-1 text-sm text-slate-500">Manage blog authors, content and related locations from the backend.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void loadBlogs()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh</Button>
            <Button onClick={() => setCreating(true)} disabled={loading}><Plus size={17} /> Create Blog</Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
          <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); setQuery(searchInput.trim()); setPage(1); }}>
          <div className="relative"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search blogs..." /></div>
          <Button type="submit" variant="outline"><Search size={17} /> Search</Button>
          </form>
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600"><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select>
          <select value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-600"><option value="">All categories</option>{categories.map((category) => <option key={getBlogCategoryId(category)} value={getBlogCategoryId(category)}>{category.name}</option>)}</select>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{["ID", "Blog", "Status", "Category", "Author", "Locations", "Content", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="p-8 text-center text-slate-500"><Loader2 className="mr-2 inline size-5 animate-spin" /> Loading blogs...</td></tr>
                : paginatedItems.length === 0 ? <tr><td colSpan={8} className="p-8 text-center text-slate-500">No blogs found.</td></tr>
                  : paginatedItems.map((item) => {
                    const names = getAdminBlogLocations(item).map((location) => location.name).filter(Boolean);
                    const fallbackNames = getAdminBlogLocationIds(item).map((id) => locationNames.get(id) ?? `#${id}`);
                    return <tr key={getAdminBlogId(item)} className="border-t border-slate-100">
                      <td className="p-3 font-bold">#{getAdminBlogId(item)}</td>
                      <td className="p-3 font-semibold"><Newspaper className="mr-2 inline size-4 text-brand-600" />{item.title}</td>
                      <td className="p-3"><BlogStatus status={item.status} /></td>
                      <td className="max-w-52 p-3 text-slate-600">{getAdminBlogCategoryNames(item).join(", ") || "Uncategorized"}</td>
                      <td className="p-3">{getAdminBlogAuthorName(item)}</td>
                      <td className="max-w-52 p-3 text-slate-600">{(names.length ? names : fallbackNames).join(", ") || "-"}</td>
                      <td className="max-w-64 truncate p-3 text-slate-600">{getRichTextPlainText(item.content) || "-"}</td>
                      <td className="p-3"><span className="flex gap-2"><Link href={getAdminBlogPath(item)} target="_blank" rel="noopener noreferrer" title="View article" aria-label={`View ${item.title} in a new tab`} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-brand-500 hover:text-brand-600"><Eye size={16} /></Link><button type="button" title="Edit article" aria-label={`Edit ${item.title}`} onClick={() => void openEdit(item)} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-brand-500 hover:text-brand-600"><Pencil size={15} /></button><button type="button" title="Delete article" onClick={() => setDeleting(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></span></td>
                    </tr>;
                  })}
            </tbody>
          </table>
        </div>
        <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="blogs" onPageChange={setPage} />
      </div>

      {creating || editing ? <BlogForm key={editing ? getAdminBlogId(editing) : "create"} initialValue={editing ? toFormValue(editing) : emptyBlog} locations={locations} categories={categories} saving={saving} onClose={() => { setEditing(null); setCreating(false); }} onSave={saveBlog} /> : null}
      {deleting ? <ConfirmDialog title="Delete blog?" message={`Delete “${deleting.title}”? This action cannot be undone.`} onCancel={() => setDeleting(null)} onConfirm={() => void deleteBlog()} /> : null}
    </>
  );
}

function BlogForm({ initialValue, locations, categories, saving, onClose, onSave }: { initialValue: BlogFormValue; locations: AdminLocation[]; categories: BlogCategory[]; saving: boolean; onClose: () => void; onSave: (payload: BlogFormValue) => Promise<void> }) {
  const [form, setForm] = useState(initialValue);
  const [slugEdited, setSlugEdited] = useState(Boolean(initialValue.slug));
  const [fieldErrors, setFieldErrors] = useState<BlogFieldErrors>({});
  const isEditing = Boolean(initialValue.title);
  const uploadedThumbnailPreview = useMemo(() => form.thumbnail_file ? URL.createObjectURL(form.thumbnail_file) : "", [form.thumbnail_file]);

  useEffect(() => () => {
    if (uploadedThumbnailPreview) URL.revokeObjectURL(uploadedThumbnailPreview);
  }, [uploadedThumbnailPreview]);

  function clearFieldError(field: BlogFieldName) {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function toggleLocation(id: string) {
    clearFieldError("location_ids");
    setForm((current) => ({ ...current, location_ids: current.location_ids.includes(id) ? current.location_ids.filter((item) => item !== id) : [...current.location_ids, id] }));
  }

  function toggleCategory(id: string) {
    clearFieldError("category_ids");
    setForm((current) => ({ ...current, category_ids: current.category_ids.includes(id) ? current.category_ids.filter((item) => item !== id) : [...current.category_ids, id] }));
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form noValidate className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => {
    event.preventDefault();
    const nextFieldErrors = validateBlogForm(form);
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;
    void onSave(form);
  }}>
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{isEditing ? "Edit Blog" : "Create Blog"}</h2><button type="button" onClick={onClose} disabled={saving} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div>
    <div className="mt-6 grid gap-4">
      <Field label="Title" message={fieldErrors.title}><input value={form.title} onChange={(event) => { const title = event.target.value; clearFieldError("title"); setForm((current) => ({ ...current, title, slug: slugEdited ? current.slug : createSlug(title) })); }} className="input" /></Field>
      <Field label="Slug (automatically generated, editable)" message={fieldErrors.slug}><input value={form.slug} onChange={(event) => { const slug = createSlug(event.target.value); clearFieldError("slug"); setSlugEdited(Boolean(slug)); setForm({ ...form, slug }); }} className="input" placeholder="mot-ngay-tai-dinh-doc-lap" /></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Status" message={fieldErrors.status}><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BlogFormValue["status"] })} className="input"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></Field><Field label="Publish at (optional)" message={fieldErrors.published_at}><input type="datetime-local" value={form.published_at} onChange={(event) => setForm({ ...form, published_at: event.target.value })} className="input" /></Field></div>
      <label className="text-sm font-semibold">Thumbnail <span className="font-normal text-slate-400">(optional)</span><input type="file" accept="image/*" onChange={(event) => setForm({ ...form, thumbnail_file: event.target.files?.[0] ?? null })} className="mt-2 block w-full rounded-lg border border-slate-200 p-2 text-sm" /></label>
      {uploadedThumbnailPreview || form.thumbnail ? <Image src={uploadedThumbnailPreview || resolveBackendAssetUrl(form.thumbnail)} alt="Thumbnail preview" width={720} height={320} unoptimized className="h-40 w-full rounded-lg border border-slate-200 object-cover" /> : null}
      <fieldset><legend className="text-sm font-semibold">Categories <span className="font-normal text-slate-400">(optional)</span></legend><div className={`mt-2 grid max-h-40 gap-2 overflow-auto rounded-lg border p-3 sm:grid-cols-2 ${fieldErrors.category_ids ? "border-rose-500" : "border-slate-200"}`}>{categories.length === 0 ? <p className="text-sm text-slate-500">No categories available.</p> : categories.map((category) => { const id = String(getBlogCategoryId(category)); return <label key={id} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-slate-50"><input type="checkbox" checked={form.category_ids.includes(id)} onChange={() => toggleCategory(id)} /><span>{category.name}</span></label>; })}</div>{fieldErrors.category_ids ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.category_ids}</p> : null}</fieldset>
      <RichTextEditor label="Content" placeholder="Write your blog content here..." value={form.content} message={fieldErrors.content} onChange={(content) => { clearFieldError("content"); setForm((current) => ({ ...current, content })); }} />
      <fieldset><legend className="text-sm font-semibold">Locations <span className="font-normal text-slate-400">(optional)</span></legend><div className={`mt-2 grid max-h-52 gap-2 overflow-auto rounded-lg border p-3 sm:grid-cols-2 ${fieldErrors.location_ids ? "border-rose-500" : "border-slate-200"}`}>{locations.length === 0 ? <p className="text-sm text-slate-500">No locations available.</p> : locations.map((location, index) => { const id = String(getLocationId(location)); return <label key={id} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-slate-50"><input type="checkbox" checked={form.location_ids.includes(id)} onChange={() => toggleLocation(id)} /> <span>{getBlogLocationLabel(location, index, locations)}</span></label>; })}</div>{fieldErrors.location_ids ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.location_ids}</p> : null}</fieldset>
    </div>
    <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null} Save Blog</Button></div>
  </form></div>;
}

function Field({ label, message, children }: { label: string; message?: string; children: React.ReactNode }) {
  return <label className={`block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:px-3 [&_.input]:outline-none ${message ? "[&_.input]:border-rose-500 [&_.input]:focus:border-rose-500" : "[&_.input]:border-slate-200 [&_.input]:focus:border-brand-600"}`}>{label}{children}{message ? <span className="mt-2 block text-xs font-semibold text-rose-600">{message}</span> : null}</label>;
}

function validateBlogForm(form: BlogFormValue): BlogFieldErrors {
  const errors: BlogFieldErrors = {};
  if (!form.title.trim()) errors.title = "Blog title is required.";
  if (form.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) errors.slug = "Use lowercase letters, numbers and single hyphens only.";
  return errors;
}

function getBlogLocationLabel(location: AdminLocation, index: number, locations: AdminLocation[]) {
  if (location.name !== "Main Gate") return location.name;
  const firstMainGateIndex = locations.findIndex((item) => item.name === "Main Gate");
  return index !== firstMainGateIndex ? "Sunset Coffee" : location.name;
}

function toFormValue(blog: AdminBlog): BlogFormValue {
  return { category_ids: getAdminBlogCategoryIds(blog).map(String), title: blog.title, slug: blog.slug ?? "", thumbnail: blog.thumbnail_url ?? blog.thumbnail ?? "", thumbnail_file: null, content: blog.content ?? "", status: blog.status ?? "published", published_at: toDateTimeLocal(blog.published_at), location_ids: getAdminBlogLocationIds(blog).map(String) };
}

function BlogStatus({ status = "published" }: { status?: AdminBlog["status"] }) {
  const colors = status === "published" ? "bg-emerald-50 text-emerald-700" : status === "archived" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${colors}`}>{status}</span>;
}

function toDateTimeLocal(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return data?.message ?? data?.error ?? fallback;
}

