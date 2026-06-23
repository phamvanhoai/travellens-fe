"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Newspaper, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { getRichTextPlainText, RichTextEditor } from "@/components/admin/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
  adminBlogService,
  getAdminBlogAuthorName,
  getAdminBlogId,
  getAdminBlogLocationIds,
  getAdminBlogLocations,
  getAdminBlogUserId,
  type AdminBlog,
  type AdminBlogPayload
} from "@/services/admin-blog.service";
import { adminLocationService, getLocationId, type AdminLocation } from "@/services/admin-location.service";
import { adminUserService, getAdminUserId, type AdminUser } from "@/services/admin-user.service";

type BlogFormValue = {
  user_id: string;
  title: string;
  content: string;
  location_ids: string[];
};

type BlogFieldName = "user_id" | "title" | "content" | "location_ids";
type BlogFieldErrors = Partial<Record<BlogFieldName, string>>;

const emptyBlog: BlogFormValue = { user_id: "", title: "", content: "", location_ids: [] };
const pageSize = 5;

export default function AdminBlogsPage() {
  const [items, setItems] = useState<AdminBlog[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [locations, setLocations] = useState<AdminLocation[]>([]);
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
    return `${item.title} ${getAdminBlogAuthorName(item)} ${locationText} ${item.content ?? ""}`.toLowerCase().includes(query.toLowerCase());
  });
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadBlogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [blogs, userResult, locationResult] = await Promise.all([
        adminBlogService.list(),
        adminUserService.list({ page: 1, limit: 100, status: "active" }),
        adminLocationService.list({ page: 1, limit: 100 })
      ]);
      setItems(blogs);
      setUsers(userResult.data ?? []);
      setLocations(locationResult.data ?? []);
    } catch (err) {
      const message = getApiError(err, "Cannot load blogs from API.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

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
      user_id: Number(form.user_id),
      title: form.title.trim(),
      content: form.content.trim(),
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

        <form className="mt-6 grid max-w-xl gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); setQuery(searchInput.trim()); setPage(1); }}>
          <div className="relative"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search blogs..." /></div>
          <Button type="submit" variant="outline"><Search size={17} /> Search</Button>
        </form>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{["ID", "Blog", "Author", "Locations", "Content", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="p-8 text-center text-slate-500"><Loader2 className="mr-2 inline size-5 animate-spin" /> Loading blogs...</td></tr>
                : paginatedItems.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-500">No blogs found.</td></tr>
                  : paginatedItems.map((item) => {
                    const names = getAdminBlogLocations(item).map((location) => location.name).filter(Boolean);
                    const fallbackNames = getAdminBlogLocationIds(item).map((id) => locationNames.get(id) ?? `#${id}`);
                    return <tr key={getAdminBlogId(item)} className="border-t border-slate-100">
                      <td className="p-3 font-bold">#{getAdminBlogId(item)}</td>
                      <td className="p-3 font-semibold"><Newspaper className="mr-2 inline size-4 text-brand-600" />{item.title}</td>
                      <td className="p-3">{getAdminBlogAuthorName(item)}</td>
                      <td className="max-w-52 p-3 text-slate-600">{(names.length ? names : fallbackNames).join(", ") || "-"}</td>
                      <td className="max-w-64 truncate p-3 text-slate-600">{getRichTextPlainText(item.content) || "-"}</td>
                      <td className="p-3"><span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={() => void openEdit(item)}><Pencil size={15} /> Edit</Button><button type="button" onClick={() => setDeleting(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></span></td>
                    </tr>;
                  })}
            </tbody>
          </table>
        </div>
        <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="blogs" onPageChange={setPage} />
      </div>

      {creating || editing ? <BlogForm key={editing ? getAdminBlogId(editing) : "create"} initialValue={editing ? toFormValue(editing) : emptyBlog} users={users} locations={locations} saving={saving} onClose={() => { setEditing(null); setCreating(false); }} onSave={saveBlog} /> : null}
      {deleting ? <ConfirmDialog title="Delete blog?" message={`Delete “${deleting.title}”? This action cannot be undone.`} onCancel={() => setDeleting(null)} onConfirm={() => void deleteBlog()} /> : null}
    </>
  );
}

function BlogForm({ initialValue, users, locations, saving, onClose, onSave }: { initialValue: BlogFormValue; users: AdminUser[]; locations: AdminLocation[]; saving: boolean; onClose: () => void; onSave: (payload: BlogFormValue) => Promise<void> }) {
  const [form, setForm] = useState(initialValue);
  const [fieldErrors, setFieldErrors] = useState<BlogFieldErrors>({});
  const isEditing = Boolean(initialValue.title);

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

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form noValidate className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => {
    event.preventDefault();
    const nextFieldErrors = validateBlogForm(form);
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;
    void onSave(form);
  }}>
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{isEditing ? "Edit Blog" : "Create Blog"}</h2><button type="button" onClick={onClose} disabled={saving} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div>
    <div className="mt-6 grid gap-4">
      <Field label="Title" message={fieldErrors.title}><input value={form.title} onChange={(event) => { clearFieldError("title"); setForm({ ...form, title: event.target.value }); }} className="input" /></Field>
      <Field label="Author" message={fieldErrors.user_id}><select value={form.user_id} onChange={(event) => { clearFieldError("user_id"); setForm({ ...form, user_id: event.target.value }); }} className="input"><option value="">Select an author</option>{users.map((user) => <option key={getAdminUserId(user)} value={getAdminUserId(user)}>{user.name} ({user.email})</option>)}</select></Field>
      <RichTextEditor label="Content" placeholder="Write your blog content here..." value={form.content} message={fieldErrors.content} onChange={(content) => { clearFieldError("content"); setForm((current) => ({ ...current, content })); }} />
      <fieldset><legend className="text-sm font-semibold">Locations</legend><div className={`mt-2 grid max-h-52 gap-2 overflow-auto rounded-lg border p-3 sm:grid-cols-2 ${fieldErrors.location_ids ? "border-rose-500" : "border-slate-200"}`}>{locations.length === 0 ? <p className="text-sm text-slate-500">No locations available.</p> : locations.map((location, index) => { const id = String(getLocationId(location)); return <label key={id} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-slate-50"><input type="checkbox" checked={form.location_ids.includes(id)} onChange={() => toggleLocation(id)} /> <span>{getBlogLocationLabel(location, index, locations)}</span></label>; })}</div>{fieldErrors.location_ids ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.location_ids}</p> : null}</fieldset>
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
  if (!form.user_id) errors.user_id = "Author is required.";
  if (!getRichTextPlainText(form.content)) errors.content = "Blog content is required.";
  if (form.location_ids.length === 0) errors.location_ids = "Select at least one location.";
  return errors;
}

function getBlogLocationLabel(location: AdminLocation, index: number, locations: AdminLocation[]) {
  if (location.name !== "Main Gate") return location.name;
  const firstMainGateIndex = locations.findIndex((item) => item.name === "Main Gate");
  return index !== firstMainGateIndex ? "Sunset Coffee" : location.name;
}

function toFormValue(blog: AdminBlog): BlogFormValue {
  return { user_id: String(getAdminBlogUserId(blog) || ""), title: blog.title, content: blog.content ?? "", location_ids: getAdminBlogLocationIds(blog).map(String) };
}

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return data?.message ?? data?.error ?? fallback;
}

