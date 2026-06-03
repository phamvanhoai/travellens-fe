"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Search, Tag, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { Button } from "@/components/ui/button";
import { adminDestinationCategoryService, type AdminDestinationCategory } from "@/services/admin-destination-category.service";

type CategoryFormValue = {
  name: string;
  description: string;
};

function getCategoryId(category: AdminDestinationCategory) {
  return category.destination_category_id ?? category.id ?? 0;
}

function normalizeCategories(items: AdminDestinationCategory[]) {
  return items.map((item) => ({
    ...item,
    description: item.description ?? ""
  }));
}

export default function DestinationCategoriesPage() {
  const [items, setItems] = useState<AdminDestinationCategory[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminDestinationCategory | null>(null);
  const [deleting, setDeleting] = useState<AdminDestinationCategory | null>(null);
  const pageSize = 5;

  const visibleItems = items.filter((item) =>
    `${item.name} ${item.description ?? ""}`.toLowerCase().includes(query.toLowerCase())
  );
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function loadCategories() {
    setLoading(true);
    setError("");
    try {
      const data = await adminDestinationCategoryService.list();
      setItems(normalizeCategories(Array.isArray(data) ? data : []));
    } catch (err) {
      setError("Cannot load destination categories from API.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadCategories();
  }, []);

  async function saveCategory(payload: CategoryFormValue) {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        const id = getCategoryId(editing);
        await adminDestinationCategoryService.update(id, payload);
      } else {
        await adminDestinationCategoryService.create(payload);
      }
      setCreating(false);
      setEditing(null);
      await loadCategories();
    } catch (err) {
      setError("Cannot save destination category. Please check the API or your permission.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCategory() {
    if (!deleting) return;

    setSaving(true);
    setError("");
    try {
      await adminDestinationCategoryService.remove(getCategoryId(deleting));
      setDeleting(null);
      await loadCategories();
    } catch (err) {
      setError("Cannot delete destination category. It may still be used by destinations.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">DestinationCategory Management</h1>
            <p className="mt-1 text-sm text-slate-500">Manage destination categories using `/admin/destination-categories` API.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadCategories} disabled={loading}>
              <RefreshCw size={17} /> Refresh
            </Button>
            <Button onClick={() => setCreating(true)}><Plus size={17} /> Create Category</Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-3 size-5 text-slate-400" />
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
            placeholder="Search categories..."
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>{["ID", "Category", "Description", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-6 text-center text-slate-500" colSpan={4}>Loading destination categories...</td></tr>
              ) : paginatedItems.length === 0 ? (
                <tr><td className="p-6 text-center text-slate-500" colSpan={4}>No destination categories found.</td></tr>
              ) : paginatedItems.map((item) => (
                <tr key={getCategoryId(item)} className="border-t border-slate-100">
                  <td className="p-3 font-bold">#{getCategoryId(item)}</td>
                  <td className="p-3 font-semibold"><Tag className="mr-2 inline size-4 text-brand-600" />{item.name}</td>
                  <td className="p-3 text-slate-600">{item.description || "-"}</td>
                  <td className="p-3">
                    <span className="flex gap-2">
                      <Button variant="outline" className="h-9 px-3" onClick={() => setEditing(item)}>
                        <Pencil size={15} /> Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => setDeleting(item)}
                        className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                        aria-label={`Delete ${item.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="categories" onPageChange={setPage} />
      </div>

      {creating || editing ? (
        <DestinationCategoryForm
          title={editing ? "Edit Destination Category" : "Create Destination Category"}
          initialValue={{ name: editing?.name ?? "", description: editing?.description ?? "" }}
          saving={saving}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={saveCategory}
        />
      ) : null}

      {deleting ? (
        <ConfirmDialog
          title="Delete Destination Category"
          message={`Are you sure you want to delete "${deleting.name}"?`}
          onCancel={() => setDeleting(null)}
          onConfirm={deleteCategory}
        />
      ) : null}
    </>
  );
}

function DestinationCategoryForm({
  title,
  initialValue,
  saving,
  onClose,
  onSave
}: {
  title: string;
  initialValue: CategoryFormValue;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: CategoryFormValue) => void;
}) {
  const [form, setForm] = useState(initialValue);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          onSave(form);
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 grid gap-4">
          <Field label="Name">
            <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="input" placeholder="Historical" />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="input min-h-24 py-3" placeholder="Destination category description" />
          </Field>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Category"}</Button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">
      {label}
      {children}
    </label>
  );
}
