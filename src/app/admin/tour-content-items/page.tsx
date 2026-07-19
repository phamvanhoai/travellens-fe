"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import {
  adminTourContentItemService,
  getTourContentItemId,
  type AdminTourContentItem,
  type AdminTourContentItemPayload,
  type TourContentItemType
} from "@/services/admin-tour-content-item.service";

const contentTypes: TourContentItemType[] = ["highlight", "requirement", "inclusion", "exclusion", "booking_policy", "cancellation_policy", "additional_information"];
const emptyItem: AdminTourContentItemPayload = { type: "highlight", content: "", status: "active" };
const pageSize = 20;

export default function AdminTourContentItemsPage() {
  const showToast = useToast();
  const [items, setItems] = useState<AdminTourContentItem[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminTourContentItem | null>(null);
  const [deleting, setDeleting] = useState<AdminTourContentItem | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminTourContentItemService.listPage({
        page,
        limit: pageSize,
        search: query.trim() || undefined,
        type: typeFilter ? typeFilter as TourContentItemType : undefined,
        status: statusFilter || undefined,
        sort: "created_at",
        order: "desc"
      });
      setItems(result.data);
      setTotal(result.meta?.total ?? result.data.length);
      setPageCount(result.meta?.total_pages ?? 1);
    }
    catch { setError("Cannot load tour content items."); }
    finally { setLoading(false); }
  }, [page, query, statusFilter, typeFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadItems(), 300);
    return () => window.clearTimeout(timer);
  }, [loadItems]);

  async function saveItem(payloads: AdminTourContentItemPayload[]) {
    setSaving(true);
    try {
      if (editing) await adminTourContentItemService.update(getTourContentItemId(editing), payloads[0]);
      else if (payloads.length > 1) await adminTourContentItemService.createBulk({
        type: payloads[0].type,
        status: payloads[0].status,
        items: payloads.map((payload) => payload.content)
      });
      else await adminTourContentItemService.create(payloads[0]);
      showToast({ variant: "success", title: editing ? "Content item updated" : `${payloads.length} content item${payloads.length > 1 ? "s" : ""} created`, description: labelType(payloads[0].type) });
      setCreating(false); setEditing(null); await loadItems();
    } catch (err) {
      const message = getApiError(err, "Cannot save this content item.");
      setError(message); showToast({ variant: "error", title: "Save failed", description: message });
    } finally { setSaving(false); }
  }

  async function removeItem() {
    if (!deleting) return;
    setSaving(true);
    try {
      await adminTourContentItemService.remove(getTourContentItemId(deleting));
      showToast({ variant: "success", title: "Content item deleted", description: labelType(deleting.type) });
      setDeleting(null); await loadItems();
    } catch (err) { setError(getApiError(err, "Cannot delete this content item.")); setDeleting(null); }
    finally { setSaving(false); }
  }

  return <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><ClipboardList className="text-brand-600" />Tour Content Items</h1><p className="mt-1 text-sm text-slate-500">Manage individually reusable highlights, inclusions, requirements and policies.</p></div><Button onClick={() => setCreating(true)}><Plus size={17} />Create Item</Button></div>
    {error ? <div className="mt-5 flex items-center justify-between rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700"><span>{error}</span><button onClick={() => void loadItems()} className="inline-flex items-center gap-2"><RefreshCw size={15} />Retry</button></div> : null}
    <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_220px_160px]"><div className="relative"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setPage(1); setQuery(event.target.value); }} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3" placeholder="Search content..." /></div><select value={typeFilter} onChange={(event) => { setPage(1); setTypeFilter(event.target.value); }} className="h-11 rounded-lg border border-slate-200 px-3"><option value="">All content types</option>{contentTypes.map((type) => <option key={type} value={type}>{labelType(type)}</option>)}</select><select value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value); }} className="h-11 rounded-lg border border-slate-200 px-3"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
    <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["ID", "Type", "Content", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
      {loading ? <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="mr-2 inline size-5 animate-spin" />Loading items...</td></tr> : items.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-slate-500">No content items found.</td></tr> : items.map((item) => <tr key={getTourContentItemId(item)} className="border-t border-slate-100"><td className="p-3 font-bold">#{getTourContentItemId(item)}</td><td className="p-3"><TypeBadge type={item.type} /></td><td className="max-w-xl p-3"><p className="line-clamp-3 whitespace-pre-line text-slate-600">{item.content}</p></td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === "inactive" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>{item.status ?? "active"}</span></td><td className="p-3"><span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={async () => { try { setEditing(await adminTourContentItemService.detail(getTourContentItemId(item))); } catch { setEditing(item); } }}><Pencil size={15} />Edit</Button><button onClick={() => setDeleting(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600"><Trash2 size={15} /></button></span></td></tr>)}
    </tbody></table></div>
    <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={pageSize} itemLabel="content items" onPageChange={setPage} />
    {creating || editing ? <ItemForm key={editing ? getTourContentItemId(editing) : "create"} initialValue={editing ? { type: editing.type, content: editing.content, status: editing.status === "inactive" ? "inactive" : "active" } : emptyItem} saving={saving} title={editing ? "Edit Content Item" : "Create Content Item"} onClose={() => { setCreating(false); setEditing(null); }} onSave={saveItem} /> : null}
    {deleting ? <ConfirmDialog title="Delete content item?" message="This item will no longer be available for new tours. Existing tour snapshots remain unchanged." onCancel={() => setDeleting(null)} onConfirm={() => void removeItem()} /> : null}
  </div>;
}

function ItemForm({ title, initialValue, saving, onClose, onSave }: { title: string; initialValue: AdminTourContentItemPayload; saving: boolean; onClose: () => void; onSave: (payloads: AdminTourContentItemPayload[]) => void }) {
  const [form, setForm] = useState(initialValue);
  const [rows, setRows] = useState([initialValue.content]);
  const [error, setError] = useState("");
  const listType = isListType(form.type);

  function changeType(type: TourContentItemType) {
    setError("");
    setForm({ ...form, type, content: "" });
    setRows([""]);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const contents = listType ? rows.map((row) => row.trim()).filter(Boolean) : [form.content.trim()].filter(Boolean);
    if (!contents.length) { setError("Add at least one content item."); return; }
    onSave(contents.map((content) => ({ type: form.type, content, status: form.status })));
  }

  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-xl bg-white p-6 shadow-soft">
    <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100"><X size={18} /></button></div>
    <div className="mt-6 space-y-5">
      <label className="block text-sm font-semibold">Content Type<select value={form.type} onChange={(event) => changeType(event.target.value as TourContentItemType)} disabled={Boolean(initialValue.content)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3">{contentTypes.map((type) => <option key={type} value={type}>{labelType(type)}</option>)}</select></label>
      {listType ? <div><div className="flex items-center justify-between"><div><p className="text-sm font-semibold">{labelType(form.type)} Items</p><p className="mt-1 text-xs text-slate-500">Each row is saved as one reusable content item.</p></div><button type="button" onClick={() => setRows((current) => [...current, ""])} className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-50 px-3 text-sm font-bold text-brand-700"><Plus size={15} />Add Row</button></div><div className="mt-3 space-y-2">{rows.map((row, index) => <div key={index} className="flex gap-2"><input autoFocus={index === 0} value={row} onChange={(event) => { setError(""); setRows((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item)); }} className={`h-11 min-w-0 flex-1 rounded-lg border px-3 text-sm outline-none ${error && rows.every((item) => !item.trim()) ? "border-rose-500" : "border-slate-200 focus:border-brand-600"}`} placeholder={`Add a tour ${form.type.replace("_", " ")}`} /><button type="button" onClick={() => setRows((current) => current.length === 1 ? [""] : current.filter((_, itemIndex) => itemIndex !== index))} className="grid size-11 shrink-0 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label="Remove row"><Trash2 size={16} /></button></div>)}</div>{rows.every((row) => !row.trim()) ? <p className="mt-3 text-sm text-slate-400">No items added.</p> : null}</div>
        : <label className="block text-sm font-semibold">Content<textarea autoFocus value={form.content} onChange={(event) => { setError(""); setForm({ ...form, content: event.target.value }); }} className={`mt-2 min-h-36 w-full rounded-lg border px-3 py-2 ${error ? "border-rose-500" : "border-slate-200"}`} placeholder={`Enter ${labelType(form.type).toLowerCase()}`} /></label>}
      {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
      <label className="block text-sm font-semibold">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as "active" | "inactive" })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3"><option value="active">Active</option><option value="inactive">Inactive</option></select></label>
    </div>
    <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}{listType && !initialValue.content ? "Save Items" : "Save Item"}</Button></div>
  </form></div>;
}

function isListType(type: TourContentItemType) {
  return type === "highlight" || type === "requirement" || type === "inclusion" || type === "exclusion";
}

function TypeBadge({ type }: { type: TourContentItemType }) { return <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{labelType(type)}</span>; }
function labelType(value: string) { return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function getApiError(error: unknown, fallback: string) {
  const value = error as { response?: { data?: { message?: string; error?: string; errors?: Array<{ index?: number; content?: string; reason?: string }> } }; message?: string };
  const data = value.response?.data;
  const details = data?.errors?.map((item) => `Row ${(item.index ?? 0) + 1}: ${item.content ?? "content"} (${item.reason ?? "invalid"})`).join("; ");
  return details || data?.message || data?.error || value.message || fallback;
}
