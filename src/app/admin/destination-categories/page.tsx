"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Search, Tag, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { adminDestinationCategoryService, type AdminDestinationCategory } from "@/services/admin-destination-category.service";

type CategoryFormValue = {
  name: string;
  description: string;
};

type CategoryFieldName = "name" | "description";
type CategoryFieldErrors = Partial<Record<CategoryFieldName, string>>;

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
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<CategoryFieldErrors>({});
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminDestinationCategory | null>(null);
  const [deleting, setDeleting] = useState<AdminDestinationCategory | null>(null);
  const showToast = useToast();
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
      showToast({ variant: "error", title: "Load failed", description: "Cannot load destination categories from API." });
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
    setFieldErrors({});
    try {
      if (editing) {
        const id = getCategoryId(editing);
        await adminDestinationCategoryService.update(id, payload);
        showToast({ variant: "success", title: "Category updated", description: payload.name });
      } else {
        await adminDestinationCategoryService.create(payload);
        showToast({ variant: "success", title: "Category created", description: payload.name });
      }
      setCreating(false);
      setEditing(null);
      setFieldErrors({});
      await loadCategories();
    } catch (err) {
      const message = getBackendErrorMessage(err, "Cannot save destination category. Please check the API, duplicate name, or your permission.");
      const nextFieldErrors = getBackendFieldErrors(err);
      setError(message);
      setFieldErrors(nextFieldErrors);
      showToast({ variant: "error", title: "Save failed", description: message });
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
      showToast({ variant: "success", title: "Category deleted", description: deleting.name });
      setDeleting(null);
      await loadCategories();
    } catch (err) {
      setError("Cannot delete destination category. It may still be used by destinations.");
      showToast({ variant: "error", title: "Delete failed", description: "This category may still be used by destinations." });
    } finally {
      setSaving(false);
    }
  }

  function handleSearch() {
    setQuery(searchInput.trim());
    setPage(1);
  }

  return (
    <>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">DestinationCategory Management</h1>
            <p className="mt-1 text-sm text-slate-500">Create and update categories used to classify travel destinations.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadCategories} disabled={loading}>
              <RefreshCw size={17} /> Refresh
            </Button>
            <Button onClick={() => {
              setFieldErrors({});
              setCreating(true);
            }}><Plus size={17} /> Create Category</Button>
          </div>
        </div>

        {error ? <div className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</div> : null}

        <form className="mt-6 grid max-w-xl gap-3 sm:grid-cols-[minmax(0,1fr)_auto]" onSubmit={(event) => { event.preventDefault(); handleSearch(); }}>
          <div className="relative">
            <Search className="absolute left-3 top-3 size-5 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
              placeholder="Search categories..."
            />
          </div>
          <Button type="submit" disabled={loading} className="h-11 justify-center"><Search size={17} /> Search</Button>
        </form>

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
                      <Button variant="outline" className="h-9 px-3" onClick={() => {
                        setFieldErrors({});
                        setEditing(item);
                      }}>
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
          fieldErrors={fieldErrors}
          onSetFieldErrors={setFieldErrors}
          onClearFieldError={(field) => setFieldErrors((current) => {
            const next = { ...current };
            delete next[field];
            return next;
          })}
          onClose={() => {
            setCreating(false);
            setEditing(null);
            setFieldErrors({});
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
  fieldErrors,
  onSetFieldErrors,
  onClearFieldError,
  onClose,
  onSave
}: {
  title: string;
  initialValue: CategoryFormValue;
  saving: boolean;
  fieldErrors: CategoryFieldErrors;
  onSetFieldErrors: (errors: CategoryFieldErrors) => void;
  onClearFieldError: (field: CategoryFieldName) => void;
  onClose: () => void;
  onSave: (payload: CategoryFormValue) => void;
}) {
  const [form, setForm] = useState(initialValue);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
      <form
        noValidate
        className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-soft"
        onSubmit={(event) => {
          event.preventDefault();
          const nextFieldErrors = validateCategoryForm(form);
          onSetFieldErrors(nextFieldErrors);
          if (Object.keys(nextFieldErrors).length > 0) return;
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
          <Field label="Name" message={fieldErrors.name} tone={fieldErrors.name ? "invalid" : "neutral"}>
            <input value={form.name} onChange={(event) => {
              onClearFieldError("name");
              setForm({ ...form, name: event.target.value });
            }} className="input" placeholder="Historical" />
          </Field>
          <Field label="Description" message={fieldErrors.description} tone={fieldErrors.description ? "invalid" : "neutral"}>
            <textarea value={form.description} onChange={(event) => {
              onClearFieldError("description");
              setForm({ ...form, description: event.target.value });
            }} className="input min-h-24 py-3" placeholder="Destination category description" />
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

function Field({
  label,
  children,
  message,
  tone = "neutral"
}: {
  label: string;
  children: React.ReactNode;
  message?: string;
  tone?: "neutral" | "invalid";
}) {
  return (
    <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">
      {label}
      {children}
      {message ? <span className={tone === "invalid" ? "mt-2 block text-xs font-semibold text-rose-600" : "mt-2 block text-xs font-medium text-slate-500"}>{message}</span> : null}
    </label>
  );
}

function validateCategoryForm(form: CategoryFormValue): CategoryFieldErrors {
  const errors: CategoryFieldErrors = {};

  if (!form.name.trim()) {
    errors.name = "Category name is required.";
  }

  return errors;
}

function getBackendErrorMessage(err: unknown, fallback: string) {
  const messages = getBackendValidationMessages(err);
  if (messages.length > 0) return messages.join("\n");

  const error = err as {
    response?: {
      data?: {
        message?: string;
        error?: string;
      };
    };
    message?: string;
  };
  const data = error.response?.data;
  return data?.message || data?.error || error.message || fallback;
}

function getBackendFieldErrors(err: unknown): CategoryFieldErrors {
  const errors: CategoryFieldErrors = {};

  for (const message of getBackendValidationMessages(err)) {
    const fieldPath = message.match(/"([^"]+)"/)?.[1] ?? "";
    const field = mapBackendFieldToCategoryField(fieldPath, message);
    if (!field) continue;
    errors[field] = errors[field] ? `${errors[field]}\n${message}` : message;
  }

  return errors;
}

function getBackendValidationMessages(err: unknown) {
  const error = err as {
    response?: {
      data?: {
        details?: {
          body?: string[] | string;
        } | string[] | string;
      };
    };
  };
  const data = error.response?.data;
  const bodyDetails = typeof data?.details === "object" && !Array.isArray(data.details)
    ? data.details.body
    : undefined;

  if (Array.isArray(bodyDetails) && bodyDetails.length > 0) return bodyDetails;
  if (typeof bodyDetails === "string" && bodyDetails) return [bodyDetails];
  if (Array.isArray(data?.details) && data.details.length > 0) return data.details;
  if (typeof data?.details === "string" && data.details) return [data.details];
  return [];
}

function mapBackendFieldToCategoryField(fieldPath: string, message: string): CategoryFieldName | null {
  const normalized = fieldPath.toLowerCase();
  const lowerMessage = message.toLowerCase();

  if (normalized.includes("name") || lowerMessage.includes("duplicate")) return "name";
  if (normalized.includes("description")) return "description";
  return null;
}
