"use client";

import axios from "axios";
import { Eye, Loader2, Pencil, RefreshCw, Save, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { adminGroupTripService } from "@/services/admin-group-trip.service";
import type { GroupTrip, GroupTripVisibility } from "@/services/group-trip.service";

const pageSize = 10;
type EditForm = { name: string; description: string; start_date: string; end_date: string; max_members: string; visibility: GroupTripVisibility };
type EditField = keyof EditForm;
type EditErrors = Partial<Record<EditField, string>>;

export default function AdminGroupTripsPage() {
  const showToast = useToast();
  const [items, setItems] = useState<GroupTrip[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<GroupTrip | null>(null);
  const [editing, setEditing] = useState<GroupTrip | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const result = await adminGroupTripService.list({ page, limit: pageSize, ...(search ? { search } : {}), ...(visibility ? { visibility } : {}), ...(status ? { status } : {}) }); setItems(result.items); setTotal(result.total); setPageCount(result.totalPages); }
    catch (err) { setError(apiError(err, "Cannot load group trips.")); }
    finally { setLoading(false); }
  }, [page, search, status, visibility]);
  useEffect(() => { void load(); }, [load]);

  async function openEdit(trip: GroupTrip) {
    setLoadingEditId(trip.group_trip_id);
    try { const detail = await adminGroupTripService.detail(trip.group_trip_id); setEditing(detail); setEditForm(toEditForm(detail)); }
    catch (err) { showToast({ variant: "error", title: "Cannot open editor", description: apiError(err, "Cannot load group trip details.") }); }
    finally { setLoadingEditId(null); }
  }

  async function saveEdit() {
    if (!editing || !editForm) return;
    if (!editForm.name.trim()) { showToast({ variant: "error", title: "Name is required" }); return; }
    if (editForm.end_date < editForm.start_date) { showToast({ variant: "error", title: "Invalid date range", description: "End date cannot be before start date." }); return; }
    setBusy(true);
    try { await adminGroupTripService.update(editing.group_trip_id, { name: editForm.name.trim(), description: editForm.description.trim() || null, start_date: editForm.start_date, end_date: editForm.end_date, max_members: editForm.max_members ? Number(editForm.max_members) : null, visibility: editForm.visibility }); showToast({ variant: "success", title: "Group trip updated", description: editForm.name.trim() }); setEditing(null); setEditForm(null); await load(); }
    catch (err) { showToast({ variant: "error", title: "Update failed", description: apiError(err, "Cannot update this group trip.") }); }
    finally { setBusy(false); }
  }

  async function remove() {
    if (!deleting) return;
    setBusy(true);
    try { await adminGroupTripService.remove(deleting.group_trip_id); showToast({ variant: "success", title: "Group trip deleted", description: deleting.name }); setDeleting(null); if (items.length === 1 && page > 1) setPage((value) => value - 1); else await load(); }
    catch (err) { showToast({ variant: "error", title: "Delete failed", description: apiError(err, "Cannot delete this group trip.") }); }
    finally { setBusy(false); }
  }

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold">Group Trip Management</h1><p className="mt-1 text-sm text-slate-500">View, edit, and remove customer group trips.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh</Button></div>
      <form onSubmit={(event) => { event.preventDefault(); setPage(1); setSearch(input.trim()); }} className="mt-6 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_180px_auto]"><label className="relative"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={input} onChange={(event) => setInput(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-brand-600" placeholder="Search trip or destination" /></label><select value={visibility} onChange={(event) => { setVisibility(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm"><option value="">All visibility</option><option value="public">Public</option><option value="private">Private</option></select><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-11 rounded-lg border border-slate-200 px-3 text-sm"><option value="">All statuses</option><option value="active">Active</option><option value="archived">Archived</option></select><Button type="submit" variant="outline">Search</Button></form>
      {error ? <p className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p> : null}
      <div className="mt-6 min-h-[681px] overflow-x-auto"><table className="w-full min-w-[1050px] table-fixed text-left text-sm"><colgroup><col className="w-[7%]" /><col className="w-[20%]" /><col className="w-[13%]" /><col className="w-[16%]" /><col className="w-[13%]" /><col className="w-[9%]" /><col className="w-[13%]" /><col className="w-[180px]" /></colgroup><thead className="bg-slate-50 text-slate-500"><tr>{["ID", "Name", "Destination", "Dates", "Leader", "Members", "Visibility / Status", "Actions"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr></thead><tbody>{loading ? <AdminTableSkeleton columns={8} rows={10} /> : items.length ? items.map((trip) => <tr key={trip.group_trip_id} className="h-16 border-t border-slate-100"><td className="p-3 font-bold">#{trip.group_trip_id}</td><td className="max-w-64 p-3"><p className="truncate font-semibold">{trip.name}</p><p className="truncate text-xs text-slate-500">{trip.description || "No description"}</p></td><td className="truncate p-3">{trip.destination_name || (trip.destination_id ? `#${trip.destination_id}` : "—")}</td><td className="whitespace-nowrap p-3">{dateText(trip.start_date)} – {dateText(trip.end_date)}</td><td className="truncate p-3">{trip.leader?.name || `User #${trip.leader_id}`}</td><td className="p-3">{safeCount(trip.member_count)}{trip.max_members ? ` / ${trip.max_members}` : ""}</td><td className="p-3"><div className="flex flex-wrap gap-2"><Badge value={trip.visibility} /><Badge value={trip.status} /></div></td><td className="p-3"><div className="flex gap-2"><Button href={`/admin/group-trips/${trip.group_trip_id}`} variant="outline" className="h-9 px-3"><Eye size={15} /> View</Button><Button type="button" onClick={() => void openEdit(trip)} disabled={loadingEditId !== null} variant="outline" className="h-9 px-3">{loadingEditId === trip.group_trip_id ? <Loader2 className="animate-spin" size={15} /> : <Pencil size={15} />}</Button><button type="button" onClick={() => setDeleting(trip)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50" aria-label={`Delete ${trip.name}`}><Trash2 size={15} /></button></div></td></tr>) : <tr><td colSpan={8} className="h-64 p-12 text-center text-slate-500">No group trips found.</td></tr>}</tbody></table></div>
      {!loading ? <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={pageSize} itemLabel="group trips" onPageChange={setPage} /> : null}
    </div>
    {editing && editForm ? <EditModal trip={editing} form={editForm} setForm={setEditForm} saving={busy} onClose={() => { if (!busy) { setEditing(null); setEditForm(null); } }} onSubmit={saveEdit} /> : null}
    {deleting ? <ConfirmDialog title="Delete group trip?" message={`“${deleting.name}” will be hidden from all Group Trip lists and detail pages. Its members, invitations, itinerary, and linked booking will remain stored.`} confirmLabel={busy ? "Deleting..." : "Delete"} onCancel={() => { if (!busy) setDeleting(null); }} onConfirm={() => void remove()} /> : null}
  </>;
}

function EditModal({ trip, form, setForm, saving, onClose, onSubmit }: { trip: GroupTrip; form: EditForm; setForm: (value: EditForm) => void; saving: boolean; onClose: () => void; onSubmit: () => void }) { const minimum = Math.max(2, safeCount(trip.member_count)); const [errors, setErrors] = useState<EditErrors>({}); const change = (field: EditField, value: string) => { setForm({ ...form, [field]: value }); setErrors((current) => ({ ...current, [field]: undefined })); }; return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form noValidate onSubmit={(event) => { event.preventDefault(); const next = validateEditForm(form, minimum); setErrors(next); if (!Object.keys(next).length) onSubmit(); }} className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-soft"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Edit Group Trip</h2><button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-full hover:bg-slate-100" aria-label="Close"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Name" message={errors.name}><input value={form.name} onChange={(event) => change("name", event.target.value)} className="input" /></Field><Field label="Maximum members" message={errors.max_members}><input type="number" value={form.max_members} onChange={(event) => change("max_members", event.target.value)} placeholder="No limit" className="input" /></Field><Field label="Start date" message={errors.start_date}><input type="date" value={form.start_date} onChange={(event) => change("start_date", event.target.value)} className="input" /></Field><Field label="End date" message={errors.end_date}><input type="date" value={form.end_date} onChange={(event) => change("end_date", event.target.value)} className="input" /></Field><Field label="Visibility" message={errors.visibility}><select value={form.visibility} onChange={(event) => change("visibility", event.target.value)} className="input"><option value="public">Public</option><option value="private">Private</option></select></Field><label className="grid gap-2 text-sm font-semibold sm:col-span-2">Description<textarea rows={4} value={form.description} onChange={(event) => change("description", event.target.value)} className="rounded-lg border border-slate-200 p-3 font-normal" />{errors.description ? <span className="text-xs font-semibold text-rose-600">{errors.description}</span> : null}</label></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save changes</Button></div></form></div>; }
function Field({ label, children, message }: { label: string; children: React.ReactNode; message?: string }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}{message ? <span className="mt-2 block text-xs font-semibold text-rose-600">{message}</span> : null}</label>; }
function validateEditForm(form: EditForm, minimumMembers: number): EditErrors { const errors: EditErrors = {}; const name = form.name.trim(); if (!name) errors.name = "Group trip name is required."; else if (name.length < 2) errors.name = "Group trip name must contain at least 2 characters."; else if (name.length > 150) errors.name = "Group trip name cannot exceed 150 characters."; if (!form.start_date) errors.start_date = "Start date is required."; if (!form.end_date) errors.end_date = "End date is required."; else if (form.start_date && form.end_date < form.start_date) errors.end_date = "End date cannot be before start date."; if (form.max_members) { const maximum = Number(form.max_members); if (!Number.isInteger(maximum)) errors.max_members = "Maximum members must be a whole number."; else if (maximum < minimumMembers) errors.max_members = `Maximum members cannot be lower than ${minimumMembers}.`; else if (maximum > 500) errors.max_members = "Maximum members cannot exceed 500."; } if (form.description.length > 5000) errors.description = "Description cannot exceed 5,000 characters."; return errors; }
function Badge({ value }: { value: string }) { const good = value === "active" || value === "public"; return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${good ? "bg-emerald-50 text-emerald-700" : value === "archived" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{value}</span>; }
function toEditForm(trip: GroupTrip): EditForm { return { name: trip.name ?? "", description: trip.description ?? "", start_date: dateValue(trip.start_date), end_date: dateValue(trip.end_date), max_members: Number.isFinite(Number(trip.max_members)) ? String(trip.max_members) : "", visibility: trip.visibility ?? "private" }; }
function safeCount(value: unknown) { const count = Number(value); return Number.isFinite(count) && count >= 0 ? count : 0; }
function dateValue(value: string) { return value ? value.slice(0, 10) : ""; }
function dateText(value: string) { return dateValue(value) || "—"; }
function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
