"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { useAuthStore } from "@/store/use-auth-store";

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
  const [storedUser, setStoredUser] = useState<any | null>(null);
  const authUser = useAuthStore((state) => state.user);
  const currentAuthor = useMemo(() => authUser ?? storedUser, [authUser, storedUser]);
  const currentAuthorId = getCurrentUserId(currentAuthor);
  const currentAuthorLabel = getCurrentUserLabel(currentAuthor);
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

  const authorNames = useMemo(() => {
    const names = new Map(users.map((user) => [getAdminUserId(user), user.name || user.email]));
    const currentAuthorName = getCurrentUserName(currentAuthor);
    if (currentAuthorId && currentAuthorName) names.set(currentAuthorId, currentAuthorName);
    return names;
  }, [currentAuthor, currentAuthorId, users]);
  const authorLabels = useMemo(() => {
    const labels = new Map(users.map((user) => [getAdminUserId(user), getUserLabel(user)]));
    if (currentAuthorId && currentAuthorLabel) labels.set(currentAuthorId, currentAuthorLabel);
    return labels;
  }, [currentAuthorId, currentAuthorLabel, users]);
  const visibleItems = items.filter((item) => {
    const locationText = getAdminBlogLocations(item).map((location) => location.name).join(" ");
    return `${item.title} ${getDisplayAuthorName(item, authorNames)} ${locationText} ${item.content ?? ""}`.toLowerCase().includes(query.toLowerCase());
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
    setStoredUser(getStoredUser());
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
        user_id: getAdminBlogUserId(detail) || getAdminBlogUserId(blog),
        author: detail.author ?? blog.author,
        user: detail.user ?? blog.user,
        author_name: detail.author_name ?? blog.author_name,
        user_name: detail.user_name ?? blog.user_name,
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
            <Button onClick={() => setCreating(true)} disabled={loading || !currentAuthorId}><Plus size={17} /> Create Blog</Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <form className="mt-6 grid max-w-xl gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); setQuery(searchInput.trim()); setPage(1); }}>
          <div className="relative"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search blogs..." /></div>
          <Button type="submit" variant="outline"><Search size={17} /> Search</Button>
        </form>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500"><tr>{["ID", "Blog", "Author", "Content", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={5} className="p-8 text-center text-slate-500"><Loader2 className="mr-2 inline size-5 animate-spin" /> Loading blogs...</td></tr>
                : paginatedItems.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">No blogs found.</td></tr>
                  : paginatedItems.map((item) => {
                    return <tr key={getAdminBlogId(item)} className="border-t border-slate-100">
                      <td className="p-3 font-bold">#{getAdminBlogId(item)}</td>
                      <td className="p-3 font-semibold"><Newspaper className="mr-2 inline size-4 text-brand-600" />{item.title}</td>
                      <td className="p-3">{getDisplayAuthorName(item, authorNames)}</td>
                      <td className="max-w-64 truncate p-3 text-slate-600">{getRichTextPlainText(item.content) || "-"}</td>
                      <td className="p-3"><span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={() => void openEdit(item)}><Pencil size={15} /> Edit</Button><button type="button" onClick={() => setDeleting(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${item.title}`}><Trash2 size={15} /></button></span></td>
                    </tr>;
                  })}
            </tbody>
          </table>
        </div>
        <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="blogs" onPageChange={setPage} />
      </div>

      {creating || editing ? <BlogForm key={editing ? getAdminBlogId(editing) : "create"} initialValue={editing ? toFormValue(editing) : { ...emptyBlog, user_id: String(currentAuthorId || "") }} authorLabel={editing ? getDisplayAuthorLabel(editing, authorLabels) : currentAuthorLabel} currentBlogId={editing ? getAdminBlogId(editing) : 0} existingBlogs={items} lastUpdated={editing ? editing.updated_at ?? editing.created_at : undefined} locations={locations} saving={saving} onClose={() => { setEditing(null); setCreating(false); }} onSave={saveBlog} /> : null}
      {deleting ? <ConfirmDialog title="Delete blog?" message={`Delete “${deleting.title}”? This action cannot be undone.`} onCancel={() => setDeleting(null)} onConfirm={() => void deleteBlog()} /> : null}
    </>
  );
}

function BlogForm({ initialValue, authorLabel, currentBlogId, existingBlogs, lastUpdated, locations, saving, onClose, onSave }: { initialValue: BlogFormValue; authorLabel: string; currentBlogId: number; existingBlogs: AdminBlog[]; lastUpdated?: string; locations: AdminLocation[]; saving: boolean; onClose: () => void; onSave: (payload: BlogFormValue) => Promise<void> }) {
  const [form, setForm] = useState(initialValue);
  const [fieldErrors, setFieldErrors] = useState<BlogFieldErrors>({});
  const titleRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const locationsRef = useRef<HTMLFieldSetElement>(null);
  const isEditing = Boolean(initialValue.title);
  const isDirty = !areBlogFormsEqual(form, initialValue);
  const selectedLocations = locations.filter((location) => form.location_ids.includes(String(getLocationId(location))));

  useEffect(() => {
    if (!isDirty || saving) return;

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }

    function handleDocumentClick(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;
      if (window.confirm("You have unsaved changes. Leave without saving?")) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleDocumentClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleDocumentClick, true);
    };
  }, [isDirty, saving]);

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

  function closeForm() {
    if (isDirty && !window.confirm("You have unsaved changes. Close without saving?")) return;
    onClose();
  }

  function scrollToFirstError(errors: BlogFieldErrors) {
    const target =
      errors.title ? titleRef.current :
      errors.content ? contentRef.current :
      errors.location_ids ? locationsRef.current :
      null;
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form noValidate className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => {
    event.preventDefault();
    const nextFieldErrors = validateBlogForm(form, existingBlogs, currentBlogId);
    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) {
      scrollToFirstError(nextFieldErrors);
      return;
    }
    void onSave(form);
  }}>
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{isEditing ? "Edit Blog" : "Create Blog"}</h2><button type="button" onClick={closeForm} disabled={saving} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div>
    {isEditing && lastUpdated ? <p className="mt-2 text-sm font-semibold text-slate-500">Last Updated: {formatBlogUpdatedAt(lastUpdated)}</p> : null}
    <div className="mt-6 grid gap-4">
      <div ref={titleRef}><Field label="Title" message={fieldErrors.title}><input value={form.title} onChange={(event) => { clearFieldError("title"); setForm({ ...form, title: event.target.value }); }} className="input" /></Field></div>
      <Field label="Author" message={fieldErrors.user_id}><input value={authorLabel} readOnly disabled className="input bg-slate-50 text-slate-500" /></Field>
      <div ref={contentRef}><RichTextEditor label="Content" placeholder="Write your blog content here..." value={form.content} message={fieldErrors.content} onChange={(content) => { clearFieldError("content"); setForm((current) => ({ ...current, content })); }} /></div>
      <fieldset ref={locationsRef}>
        <legend className="text-sm font-semibold">Locations</legend>
        <p className="mt-1 text-xs font-semibold text-brand-700">Selected: {form.location_ids.length} {form.location_ids.length === 1 ? "location" : "locations"}</p>
        {selectedLocations.length > 0 ? <div className="mt-2 flex flex-wrap gap-2">{selectedLocations.map((location) => <span key={getLocationId(location)} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">✓ {getBlogLocationLabel(location, locations.findIndex((item) => getLocationId(item) === getLocationId(location)), locations)}</span>)}</div> : null}
        <div className={`mt-2 grid max-h-52 gap-2 overflow-auto rounded-lg border p-3 sm:grid-cols-2 ${fieldErrors.location_ids ? "border-rose-500" : "border-slate-200"}`}>{locations.length === 0 ? <p className="text-sm text-slate-500">No locations available.</p> : locations.map((location, index) => { const id = String(getLocationId(location)); return <label key={id} className="flex cursor-pointer items-center gap-2 rounded-md p-2 text-sm hover:bg-slate-50"><input type="checkbox" checked={form.location_ids.includes(id)} onChange={() => toggleLocation(id)} /> <span>{getBlogLocationLabel(location, index, locations)}</span></label>; })}</div>{fieldErrors.location_ids ? <p className="mt-2 text-xs font-semibold text-rose-600">{fieldErrors.location_ids}</p> : null}
      </fieldset>
    </div>
    <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={closeForm} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null} Save Blog</Button></div>
  </form></div>;
}

function Field({ label, message, children }: { label: string; message?: string; children: React.ReactNode }) {
  return <label className={`block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:px-3 [&_.input]:outline-none ${message ? "[&_.input]:border-rose-500 [&_.input]:focus:border-rose-500" : "[&_.input]:border-slate-200 [&_.input]:focus:border-brand-600"}`}>{label}{children}{message ? <span className="mt-2 block text-xs font-semibold text-rose-600">{message}</span> : null}</label>;
}

function validateBlogForm(form: BlogFormValue, existingBlogs: AdminBlog[], currentBlogId: number): BlogFieldErrors {
  const errors: BlogFieldErrors = {};
  const title = form.title.trim();
  const contentText = getRichTextPlainText(form.content).trim();
  if (!title) errors.title = "Title is required.";
  else if (title.length < 5) errors.title = "Title must contain at least 5 characters.";
  else if (title.length > 100) errors.title = "Maximum 100 characters.";
  else if (existingBlogs.some((blog) => getAdminBlogId(blog) !== currentBlogId && normalizeBlogTitle(blog.title) === normalizeBlogTitle(title))) errors.title = "A blog with this title already exists.";
  if (!form.user_id) errors.user_id = "Author is required.";
  if (!contentText) errors.content = "Content is required.";
  else if (contentText.length < 100) errors.content = "Content is too short.";
  if (form.location_ids.length === 0) errors.location_ids = "Select at least one location.";
  return errors;
}

function normalizeBlogTitle(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("vi-VN");
}

function formatBlogUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric"
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hour12: true,
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh"
  }).format(date);
  return `${datePart} ${timePart}`;
}

function areBlogFormsEqual(left: BlogFormValue, right: BlogFormValue) {
  return normalizeBlogForm(left) === normalizeBlogForm(right);
}

function normalizeBlogForm(form: BlogFormValue) {
  return JSON.stringify({
    user_id: form.user_id,
    title: form.title,
    content: form.content,
    location_ids: [...form.location_ids].sort()
  });
}

function getBlogLocationLabel(location: AdminLocation, index: number, locations: AdminLocation[]) {
  if (location.name !== "Main Gate") return location.name;
  const firstMainGateIndex = locations.findIndex((item) => item.name === "Main Gate");
  return index !== firstMainGateIndex ? "Sunset Coffee" : location.name;
}

function toFormValue(blog: AdminBlog): BlogFormValue {
  return { user_id: String(getAdminBlogUserId(blog) || ""), title: blog.title, content: blog.content ?? "", location_ids: getAdminBlogLocationIds(blog).map(String) };
}

function getDisplayAuthorName(blog: AdminBlog, authorNames: Map<number, string>) {
  const userId = getAdminBlogUserId(blog);
  const mappedName = authorNames.get(userId);
  if (mappedName) return mappedName;

  const apiName = getAdminBlogAuthorName(blog);
  return apiName.startsWith("User #") ? "-" : apiName;
}

function getDisplayAuthorLabel(blog: AdminBlog, authorLabels: Map<number, string>) {
  const userId = getAdminBlogUserId(blog);
  const mappedLabel = authorLabels.get(userId);
  if (mappedLabel) return mappedLabel;

  const name = getAdminBlogAuthorName(blog);
  const email = blog.author?.email ?? blog.user?.email;
  if (name && email && !name.startsWith("User #")) return `${name} (${email})`;
  return name.startsWith("User #") ? "-" : name;
}

function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem("user") ?? "null");
  } catch {
    return null;
  }
}

function getCurrentUserId(user: any) {
  return Number(user?.user_id ?? user?.id ?? 0);
}

function getCurrentUserLabel(user: any) {
  const name = user?.name ?? user?.full_name ?? user?.fullName;
  const email = user?.email;
  if (name && email) return `${name} (${email})`;
  return name ?? email ?? "Current account";
}

function getCurrentUserName(user: any) {
  return user?.name ?? user?.full_name ?? user?.fullName ?? user?.email ?? "";
}

function getUserLabel(user: AdminUser) {
  if (user.name && user.email) return `${user.name} (${user.email})`;
  return user.name || user.email || `User #${getAdminUserId(user)}`;
}

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return data?.message ?? data?.error ?? fallback;
}

