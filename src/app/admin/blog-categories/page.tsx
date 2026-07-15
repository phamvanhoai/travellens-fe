"use client";

import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, RefreshCw, Search, Tag, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import { adminBlogCategoryService, getBlogCategoryId, type BlogCategory, type BlogCategoryPayload } from "@/services/blog-category.service";

const pageSize = 8;

export default function AdminBlogCategoriesPage() {
  const [items, setItems] = useState<BlogCategory[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<BlogCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<BlogCategory | null>(null);
  const showToast = useToast();

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await adminBlogCategoryService.list());
    } catch (err) {
      const message = getApiError(err, "Cannot load blog categories from API.");
      setError(message);
      showToast({ variant: "error", title: "Load failed", description: message });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadCategories(); }, [loadCategories]);

  const visibleItems = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? items.filter((item) => `${item.name} ${item.description ?? ""}`.toLowerCase().includes(search)) : items;
  }, [items, query]);
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function saveCategory(payload: BlogCategoryPayload) {
    setSaving(true);
    setError("");
    try {
      if (editing) await adminBlogCategoryService.update(getBlogCategoryId(editing), payload);
      else await adminBlogCategoryService.create(payload);
      showToast({ variant: "success", title: editing ? "Category updated" : "Category created", description: payload.name });
      setEditing(null);
      setCreating(false);
      await loadCategories();
    } catch (err) {
      const message = getApiError(err, "Cannot save blog category.");
      setError(message);
      showToast({ variant: "error", title: "Save failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory() {
    if (!deleting) return;
    setSaving(true);
    try {
      await adminBlogCategoryService.remove(getBlogCategoryId(deleting));
      showToast({ variant: "success", title: "Category deleted", description: deleting.name });
      setDeleting(null);
      await loadCategories();
    } catch (err) {
      const message = getApiError(err, "This category cannot be deleted while it has linked blogs.");
      setError(message);
      showToast({ variant: "error", title: "Delete failed", description: message });
    } finally {
      setSaving(false);
    }
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><h1 className="text-2xl font-bold">Blog Category Management</h1><p className="mt-1 text-sm text-slate-500">Organize travel stories into clear, reusable categories.</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => void loadCategories()} disabled={loading}><RefreshCw size={17} className={loading ? "animate-spin" : ""} /> Refresh</Button><Button onClick={() => setCreating(true)}><Plus size={17} /> Create Category</Button></div>
      </div>
      {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}
      <div className="relative mt-6 max-w-md"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600" placeholder="Search blog categories..." /></div>
      <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["ID", "Category", "Description", "Blogs", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
        {loading ? <AdminTableSkeleton columns={5} rows={8} /> : paginatedItems.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-500">No blog categories found.</td></tr> : paginatedItems.map((item) => <tr key={getBlogCategoryId(item)} className="border-t border-slate-100"><td className="p-3 font-bold">#{getBlogCategoryId(item)}</td><td className="p-3 font-semibold"><Tag className="mr-2 inline size-4 text-brand-600" />{item.name}</td><td className="max-w-sm p-3 text-slate-600">{item.description || "-"}</td><td className="p-3">{item.blog_count ?? "-"}</td><td className="p-3"><span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}><Pencil size={15} /> Edit</Button><button type="button" onClick={() => setDeleting(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${item.name}`}><Trash2 size={15} /></button></span></td></tr>)}
      </tbody></table></div>
      <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="categories" onPageChange={setPage} />
    </div>
    {creating || editing ? <CategoryForm initialValue={{ name: editing?.name ?? "", description: editing?.description ?? "" }} saving={saving} onClose={() => { setCreating(false); setEditing(null); }} onSave={saveCategory} /> : null}
    {deleting ? <ConfirmDialog title="Delete Blog Category" message={`Are you sure you want to delete "${deleting.name}"?`} onCancel={() => setDeleting(null)} onConfirm={() => void deleteCategory()} /> : null}
  </>;
}

function CategoryForm({ initialValue, saving, onClose, onSave }: { initialValue: BlogCategoryPayload; saving: boolean; onClose: () => void; onSave: (payload: BlogCategoryPayload) => Promise<void> }) {
  const [form, setForm] = useState(initialValue);
  const [nameError, setNameError] = useState("");
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form noValidate className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-soft" onSubmit={(event) => { event.preventDefault(); if (!form.name.trim()) { setNameError("Category name is required."); return; } void onSave({ name: form.name.trim(), description: form.description.trim() }); }}>
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{initialValue.name ? "Edit Blog Category" : "Create Blog Category"}</h2><button type="button" onClick={onClose} disabled={saving} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div>
    <div className="mt-6 grid gap-4"><label className="text-sm font-semibold">Name<input value={form.name} onChange={(event) => { setNameError(""); setForm({ ...form, name: event.target.value }); }} className={`mt-2 h-11 w-full rounded-lg border px-3 outline-none ${nameError ? "border-rose-500" : "border-slate-200 focus:border-brand-600"}`} placeholder="Travel Guide" />{nameError ? <span className="mt-2 block text-xs font-semibold text-rose-600">{nameError}</span> : null}</label><label className="text-sm font-semibold">Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-2 min-h-28 w-full rounded-lg border border-slate-200 px-3 py-3 outline-none focus:border-brand-600" placeholder="Category description" /></label></div>
    <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose} disabled={saving}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null} Save Category</Button></div>
  </form></div>;
}

function getApiError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;
  const data = error.response?.data as { message?: string; error?: string } | undefined;
  return data?.message ?? data?.error ?? fallback;
}
