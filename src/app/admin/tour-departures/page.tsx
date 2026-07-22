"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CalendarDays, CalendarRange, ChevronDown, Loader2, Pencil, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/common/toast";
import { Pagination } from "@/components/common/pagination";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import { adminTourService, getAdminTourId, getAdminTourName, type AdminTour } from "@/services/admin-tour.service";
import { adminTourDepartureService, type AdminTourDeparture, type AdminTourDeparturePayload, type BulkTourDeparturePayload } from "@/services/admin-tour-departure.service";

const emptyForm = { departure_at: "", capacity: "", price: "", child_price: "", infant_price: "0", booking_open_at: "", booking_close_at: "", status: "draft" };

export default function TourDeparturesPage() {
  const toast = useToast();
  const [tours, setTours] = useState<AdminTour[]>([]);
  const [tourId, setTourId] = useState(0);
  const [selectedTour, setSelectedTour] = useState<AdminTour | null>(null);
  const [tourSearch, setTourSearch] = useState("");
  const [tourPage, setTourPage] = useState(1);
  const [tourPages, setTourPages] = useState(1);
  const [tourPickerOpen, setTourPickerOpen] = useState(false);
  const [tourSearchLoading, setTourSearchLoading] = useState(false);
  const [items, setItems] = useState<AdminTourDeparture[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [departureSearch, setDepartureSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<AdminTourDeparture | null | undefined>(undefined);
  const [form, setForm] = useState(emptyForm);
  const searchSequence = useRef(0);

  useEffect(() => {
    const requestedTourId = Number(new URLSearchParams(window.location.search).get("tourId"));
    if (!Number.isInteger(requestedTourId) || requestedTourId < 1) return;
    setTourId(requestedTourId);
    void adminTourService.get(requestedTourId).then((tour) => { setSelectedTour(tour); setTours((current) => uniqueTours([tour, ...current])); }).catch(() => toast({ variant: "error", title: "Tour unavailable", description: `Cannot load tour #${requestedTourId}.` }));
  }, []);
  useEffect(() => {
    const timeout = window.setTimeout(() => void searchTours(1, false), 300);
    return () => window.clearTimeout(timeout);
  }, [tourSearch]);
  useEffect(() => { if (!tourId) return; const timeout = window.setTimeout(() => void load(), departureSearch ? 300 : 0); return () => window.clearTimeout(timeout); }, [tourId, page, departureSearch, statusFilter, dateFrom, dateTo]);
  async function searchTours(page: number, append: boolean) {
    const sequence = ++searchSequence.current;
    setTourSearchLoading(true);
    try {
      const result = await adminTourService.list({ page, limit: 20, search: tourSearch.trim() || undefined, sortBy: "name", sortOrder: "ASC" });
      if (sequence !== searchSequence.current) return;
      setTours((current) => append ? uniqueTours([...current, ...(result.data ?? [])]) : uniqueTours(result.data ?? []));
      setTourPage(page);
      setTourPages(result.pagination?.totalPages ?? Math.max(1, Math.ceil((result.pagination?.total ?? 0) / 20)));
    } catch {
      if (sequence === searchSequence.current) toast({ variant: "error", title: "Search failed", description: "Cannot search tours." });
    } finally {
      if (sequence === searchSequence.current) { setTourSearchLoading(false); setLoading(false); }
    }
  }
  async function load() { setLoading(true); try { const result = await adminTourDepartureService.list(tourId, { page, limit: 10, search: departureSearch.trim() || undefined, status: statusFilter || undefined, date_from: dateFrom || undefined, date_to: dateTo || undefined }); setItems(result.data); setPageCount(result.pagination.totalPages); setTotalItems(result.pagination.total); } catch { toast({ variant: "error", title: "Load failed", description: "Cannot load tour departures." }); } finally { setLoading(false); } }
  function openCreate() { setEditing(null); setForm(emptyForm); }
  function openEdit(item: AdminTourDeparture) { setEditing(item); setForm({ departure_at: localInput(item.departure_at), capacity: String(item.capacity), price: String(item.price), child_price: String(item.child_price), infant_price: String(item.infant_price), booking_open_at: localInput(item.booking_open_at), booking_close_at: localInput(item.booking_close_at), status: item.status }); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true);
    const payload: AdminTourDeparturePayload = { departure_at: new Date(form.departure_at).toISOString(), capacity: Number(form.capacity), price: form.price ? Number(form.price) : undefined, child_price: form.child_price ? Number(form.child_price) : undefined, infant_price: Number(form.infant_price || 0), currency: "VND", booking_open_at: form.booking_open_at ? new Date(form.booking_open_at).toISOString() : null, booking_close_at: form.booking_close_at ? new Date(form.booking_close_at).toISOString() : null, status: form.status };
    try { if (editing) await adminTourDepartureService.update(tourId, editing.tour_departure_id, payload); else await adminTourDepartureService.create(tourId, payload); toast({ variant: "success", title: editing ? "Departure updated" : "Departure created" }); setEditing(undefined); await load(); }
    catch (error: any) { toast({ variant: "error", title: "Save failed", description: error?.response?.data?.message || "Cannot save departure." }); } finally { setSaving(false); }
  }
  async function remove(item: AdminTourDeparture) { if (!confirm("Delete this departure?")) return; try { await adminTourDepartureService.remove(tourId, item.tour_departure_id); await load(); } catch (error: any) { toast({ variant: "error", title: "Delete failed", description: error?.response?.data?.message || "Cannot delete departure." }); } }

  return <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h1 className="text-2xl font-bold">Tour Departures</h1><p className="mt-1 text-sm text-slate-500">Control sale dates, capacity, prices and booking windows for each tour.</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => void load()} disabled={!tourId || loading}><RefreshCw size={16} className={loading ? "animate-spin" : ""} />Refresh</Button><Button variant="outline" onClick={() => setBulkOpen(true)} disabled={!tourId}><CalendarRange size={16} />Generate Schedule</Button><Button onClick={openCreate} disabled={!tourId}><Plus size={16} />Add Departure</Button></div></div>
    <div className="relative mt-6 max-w-xl text-sm">
      <label className="font-semibold">Tour</label>
      <button type="button" onClick={() => setTourPickerOpen((open) => !open)} className="mt-2 flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left">
        <span className={tourId ? "font-medium text-slate-900" : "text-slate-400"}>{tourId ? selectedTourName(selectedTour, tours, tourId) : "Search and select a tour"}</span><ChevronDown size={17} />
      </button>
      {tourPickerOpen ? <div className="absolute z-30 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="relative border-b border-slate-100 p-3"><Search className="absolute left-6 top-6 text-slate-400" size={16} /><input autoFocus value={tourSearch} onChange={(event) => setTourSearch(event.target.value)} placeholder="Search by tour name or ID..." className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 outline-none focus:border-brand-600" /></div>
        <div className="max-h-72 overflow-y-auto p-2">{tourSearchLoading && !tours.length ? <div className="p-6 text-center"><Loader2 className="mx-auto animate-spin" size={20} /></div> : tours.length ? tours.map((tour) => { const id = getAdminTourId(tour); return <button key={id} type="button" onClick={() => { setTourId(id); setSelectedTour(tour); setTourPickerOpen(false); window.history.replaceState(null, "", `/admin/tour-departures?tourId=${id}`); }} className={`flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left hover:bg-slate-50 ${id === tourId ? "bg-brand-50 text-brand-700" : ""}`}><span className="truncate font-medium">{getAdminTourName(tour)}</span><span className="ml-3 shrink-0 text-xs text-slate-400">#{id}</span></button>; }) : <p className="p-6 text-center text-slate-500">No tours found.</p>}
          {tourPage < tourPages ? <button type="button" disabled={tourSearchLoading} onClick={() => void searchTours(tourPage + 1, true)} className="mt-1 w-full rounded-md px-3 py-2 text-center font-semibold text-brand-700 hover:bg-brand-50">{tourSearchLoading ? "Loading..." : "Load more"}</button> : null}
        </div>
      </div> : null}
    </div>
    <div className="mt-6 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Departure", "Sale window", "Capacity", "Available", "Adult / Child", "Status", "Actions"].map((title) => <th key={title} className="p-3">{title}</th>)}</tr></thead><tbody>{loading ? <tr><td colSpan={7} className="p-10 text-center"><Loader2 className="mx-auto animate-spin text-brand-600" /></td></tr> : items.length ? items.map((item) => <tr key={item.tour_departure_id} className="border-t border-slate-100"><td className="p-3 font-semibold">{dateTime(item.departure_at)}</td><td className="p-3 text-xs text-slate-500">{item.booking_open_at ? dateTime(item.booking_open_at) : "Now"}<br />to {item.booking_close_at ? dateTime(item.booking_close_at) : "Default cutoff"}</td><td className="p-3">{item.capacity}</td><td className="p-3 font-bold text-brand-700">{item.available_slots}</td><td className="p-3">{money(item.price)} / {money(item.child_price)}</td><td className="p-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${item.status === "open" ? "bg-emerald-50 text-emerald-700" : item.status === "cancelled" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{item.status}</span></td><td className="p-3"><div className="flex gap-2"><button onClick={() => openEdit(item)} className="grid size-9 place-items-center rounded-lg border border-slate-200"><Pencil size={15} /></button><button onClick={() => void remove(item)} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600"><Trash2 size={15} /></button></div></td></tr>) : <tr><td colSpan={7} className="p-10 text-center text-slate-500">No departures configured for this tour.</td></tr>}</tbody></table></div>
    {editing !== undefined ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form onSubmit={submit} className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">{editing ? "Edit Departure" : "Add Departure"}</h2><button type="button" onClick={() => setEditing(undefined)}><X /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Departure date & time"><input required type="datetime-local" value={form.departure_at} onChange={(e) => setForm({ ...form, departure_at: e.target.value })} /></Field><Field label="Capacity"><input required min={1} type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field><Field label="Adult price (blank = tour default)"><input min={0} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field><Field label="Child price (blank = tour default)"><input min={0} type="number" value={form.child_price} onChange={(e) => setForm({ ...form, child_price: e.target.value })} /></Field><Field label="Booking opens"><input type="datetime-local" value={form.booking_open_at} onChange={(e) => setForm({ ...form, booking_open_at: e.target.value })} /></Field><Field label="Booking closes"><input type="datetime-local" value={form.booking_close_at} onChange={(e) => setForm({ ...form, booking_close_at: e.target.value })} /></Field><Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>{["draft", "open", "closed", "sold_out", "cancelled", "departed"].map((status) => <option key={status}>{status}</option>)}</select></Field></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setEditing(undefined)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : null}Save</Button></div></form></div> : null}
    {bulkOpen ? <BulkCreateModal tourId={tourId} onClose={() => setBulkOpen(false)} onCreated={async (result) => { setBulkOpen(false); toast({ variant: "success", title: "Schedule generated", description: `${result.created_count} created, ${result.skipped_count} duplicate dates skipped.` }); await load(); }} /> : null}
  </div>;
}

const weekdayOptions = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]] as const;
function BulkCreateModal({ tourId, onClose, onCreated }: { tourId: number; onClose: () => void; onCreated: (result: { created_count: number; skipped_count: number }) => Promise<void> }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ start_date: "", end_date: "", weekdays: [1, 2, 3, 4, 5], departure_time: "08:00", capacity: "", price: "", child_price: "", infant_price: "", booking_open_at: "", booking_close_hours_before: "4", status: "draft" as "draft" | "open" | "closed" });
  const count = countGeneratedDates(form.start_date, form.end_date, form.weekdays);
  function toggle(day: number) { setForm((current) => ({ ...current, weekdays: current.weekdays.includes(day) ? current.weekdays.filter((item) => item !== day) : [...current.weekdays, day] })); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.weekdays.length) { toast({ variant: "error", title: "Select weekdays", description: "Choose at least one operating day." }); return; }
    setSaving(true);
    const payload: BulkTourDeparturePayload = { start_date: form.start_date, end_date: form.end_date, weekdays: form.weekdays, departure_time: form.departure_time, status: form.status, currency: "VND",
      capacity: optionalNumber(form.capacity), price: optionalNumber(form.price), child_price: optionalNumber(form.child_price), infant_price: optionalNumber(form.infant_price),
      booking_open_at: form.booking_open_at ? new Date(form.booking_open_at).toISOString() : null, booking_close_hours_before: form.booking_close_hours_before === "" ? null : Number(form.booking_close_hours_before) };
    try { await onCreated(await adminTourDepartureService.bulkCreate(tourId, payload)); }
    catch (error: any) { toast({ variant: "error", title: "Generation failed", description: error?.response?.data?.message || "Cannot generate departures." }); }
    finally { setSaving(false); }
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form onSubmit={submit} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><div><h2 className="text-xl font-bold">Generate Departure Schedule</h2><p className="mt-1 text-sm text-slate-500">Existing dates are skipped automatically.</p></div><button type="button" onClick={onClose}><X /></button></div>
    <div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Start date"><input required type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value, end_date: form.end_date && form.end_date < e.target.value ? e.target.value : form.end_date })} /></Field><Field label="End date"><input required type="date" min={form.start_date} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></Field><Field label="Departure time"><input required type="time" value={form.departure_time} onChange={(e) => setForm({ ...form, departure_time: e.target.value })} /></Field><Field label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}>{["draft", "open", "closed"].map((status) => <option key={status}>{status}</option>)}</select></Field>
      <div className="sm:col-span-2"><p className="text-sm font-semibold">Operating weekdays</p><div className="mt-2 flex flex-wrap gap-2">{weekdayOptions.map(([day, label]) => <button key={day} type="button" onClick={() => toggle(day)} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${form.weekdays.includes(day) ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500"}`}>{label}</button>)}</div></div>
      <Field label="Capacity (blank = tour default)"><input min={1} type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></Field><Field label="Adult price (blank = tour default)"><input min={0} type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field><Field label="Child price (blank = tour default)"><input min={0} type="number" value={form.child_price} onChange={(e) => setForm({ ...form, child_price: e.target.value })} /></Field><Field label="Infant price (blank = tour default)"><input min={0} type="number" value={form.infant_price} onChange={(e) => setForm({ ...form, infant_price: e.target.value })} /></Field><Field label="Booking opens (optional)"><input type="datetime-local" value={form.booking_open_at} onChange={(e) => setForm({ ...form, booking_open_at: e.target.value })} /></Field><Field label="Close booking before departure (hours)"><input min={0} type="number" value={form.booking_close_hours_before} onChange={(e) => setForm({ ...form, booking_close_hours_before: e.target.value })} /></Field>
    </div><div className="mt-5 rounded-lg bg-brand-50 p-4 text-sm font-semibold text-brand-800">{count === null ? "Select a date range to preview." : `${count} departure${count === 1 ? "" : "s"} will be requested. Duplicate dates will be skipped.`}</div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving || count === 0}>{saving ? <Loader2 className="animate-spin" size={16} /> : <CalendarRange size={16} />}Generate</Button></div></form></div>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-sm font-semibold [&_input]:mt-2 [&_input]:h-11 [&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-200 [&_input]:px-3 [&_select]:mt-2 [&_select]:h-11 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-200 [&_select]:px-3">{label}{children}</label>; }
function dateTime(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)); }
function localInput(value?: string | null) { if (!value) return ""; const date = new Date(value); const parts = new Intl.DateTimeFormat("sv-SE", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Ho_Chi_Minh" }).format(date); return parts.replace(" ", "T"); }
function money(value: number | string) { return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value)); }
function uniqueTours(tours: AdminTour[]) { return [...new Map(tours.map((tour) => [getAdminTourId(tour), tour])).values()].filter((tour) => getAdminTourId(tour) > 0); }
function selectedTourName(selected: AdminTour | null, tours: AdminTour[], id: number) { const tour = getAdminTourId(selected ?? {}) === id ? selected : tours.find((item) => getAdminTourId(item) === id); return tour ? `${getAdminTourName(tour)} (#${id})` : `Tour #${id}`; }
function optionalNumber(value: string) { return value === "" ? undefined : Number(value); }
function countGeneratedDates(startValue: string, endValue: string, weekdays: number[]) {
  if (!startValue || !endValue || endValue < startValue) return null;
  const selected = new Set(weekdays); let count = 0;
  const start = new Date(`${startValue}T00:00:00Z`); const end = new Date(`${endValue}T00:00:00Z`);
  if ((end.getTime() - start.getTime()) / 86400000 > 366) return null;
  for (const date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) if (selected.has(date.getUTCDay())) count++;
  return count;
}
