"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
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

export default function AdminTourContentItemsPage() {
  const showToast = useToast();
  const [items, setItems] = useState<AdminTourContentItem[]>([]);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<AdminTourContentItem | null>(null);
  const [deleting, setDeleting] = useState<AdminTourContentItem | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setItems(await adminTourContentItemService.list()); }
    catch { setError("Cannot load tour content items."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadItems(); }, [loadItems]);
  const filteredItems = useMemo(() => items.filter((item) => (!typeFilter || item.type === typeFilter) && (!query.trim() || item.content.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))), [items, query, typeFilter]);

  async function saveItem(payload: AdminTourContentItemPayload) {
    setSaving(true);
    try {
      if (editing) await adminTourContentItemService.update(getTourContentItemId(editing), payload);
      else await adminTourContentItemService.create(payload);
      showToast({ variant: "success", title: editing ? "Content item updated" : "Content item created", description: labelType(payload.type) });
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
    <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_240px]"><div className="relative"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3" placeholder="Search content..." /></div><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="h-11 rounded-lg border border-slate-200 px-3"><option value="">All content types</option>{contentTypes.map((type) => <option key={type} value={type}>{labelType(type)}</option>)}</select></div>
    <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr>{["ID", "Type", "Content", "Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>
      {loading ? <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="mr-2 inline size-5 animate-spin" />Loading items...</td></tr> : filteredItems.length === 0 ? <tr><td colSpan={5} className="p-10 text-center text-slate-500">No content items found.</td></tr> : filteredItems.map((item) => <tr key={getTourContentItemId(item)} className="border-t border-slate-100"><td className="p-3 font-bold">#{getTourContentItemId(item)}</td><td className="p-3"><TypeBadge type={item.type} /></td><td className="max-w-xl p-3"><p className="line-clamp-3 whitespace-pre-line text-slate-600">{item.content}</p></td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === "inactive" ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>{item.status ?? "active"}</span></td><td className="p-3"><span className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={async () => { try { setEditing(await adminTourContentItemService.detail(getTourContentItemId(item))); } catch { setEditing(item); } }}><Pencil size={15} />Edit</Button><button onClick={() => setDeleting(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600"><Trash2 size={15} /></button></span></td></tr>)}
    </tbody></table></div>
    {creating || editing ? <ItemForm key={editing ? getTourContentItemId(editing) : "create"} initialValue={editing ? { type: editing.type, content: editing.content, status: editing.status === "inactive" ? "inactive" : "active" } : emptyItem} saving={saving} title={editing ? "Edit Content Item" : "Create Content Item"} onClose={() => { setCreating(false); setEditing(null); }} onSave={saveItem} /> : null}
    {deleting ? <ConfirmDialog title="Delete content item?" message="This item will no longer be available for new tours. Existing tour snapshots remain unchanged." onCancel={() => setDeleting(null)} onConfirm={() => void removeItem()} /> : null}
  </div>;
}

function ItemForm({ title, initialValue, saving, onClose, onSave }: { title: string; initialValue: AdminTourContentItemPayload; saving: boolean; onClose: () => void; onSave: (payload: AdminTourContentItemPayload) => void }) {
  const [form, setForm] = useState(initialValue); const [error, setError] = useState("");
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form onSubmit={(event) => { event.preventDefault(); if (!form.content.trim()) { setError("Content is required."); return; } onSave({ ...form, content: form.content.trim() }); }} className="w-full max-w-xl rounded-xl bg-white p-6 shadow-soft"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{title}</h2><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100"><X size={18} /></button></div><div className="mt-6 space-y-5"><label className="block text-sm font-semibold">Content Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as TourContentItemType })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3">{contentTypes.map((type) => <option key={type} value={type}>{labelType(type)}</option>)}</select></label><label className="block text-sm font-semibold">Content<textarea autoFocus value={form.content} onChange={(event) => { setError(""); setForm({ ...form, content: event.target.value }); }} className={`mt-2 min-h-36 w-full rounded-lg border px-3 py-2 ${error ? "border-rose-500" : "border-slate-200"}`} />{error ? <span className="mt-2 block text-xs text-rose-600">{error}</span> : null}</label><label className="block text-sm font-semibold">Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as "active" | "inactive" })} className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3"><option value="active">Active</option><option value="inactive">Inactive</option></select></label></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="size-4 animate-spin" /> : null}Save Item</Button></div></form></div>;
}

function TypeBadge({ type }: { type: TourContentItemType }) { return <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{labelType(type)}</span>; }
function labelType(value: string) { return value.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
function getApiError(error: unknown, fallback: string) { const value = error as { response?: { data?: { message?: string; error?: string } }; message?: string }; return value.response?.data?.message ?? value.response?.data?.error ?? value.message ?? fallback; }
