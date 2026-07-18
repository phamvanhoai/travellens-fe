"use client";

import axios from "axios";
import { ArrowDown, ArrowUp, Edit3, MapPin, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { MapLocationPicker } from "@/components/admin/map-location-picker";
import { PlaceSearchPicker } from "@/components/group-trips/place-search-picker";
import { Button } from "@/components/ui/button";
import { groupTripService, type GroupTrip, type GroupTripItineraryItem, type GroupTripItineraryPayload } from "@/services/group-trip.service";

type FormState = { itinerary_date: string; start_time: string; title: string; description: string; location_id: string; custom_location: string; order_index: string; latitude: string; longitude: string };

export function ItineraryManager({ trip, canManage, onChanged }: { trip: GroupTrip; canManage: boolean; onChanged: () => Promise<void> | void }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GroupTripItineraryItem | null>(null);
  const [deleting, setDeleting] = useState<GroupTripItineraryItem | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm(trip.start_date));
  const [customPlace, setCustomPlace] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openCreate() { setEditing(null); setForm(emptyForm(trip.start_date)); setCustomPlace(false); setError(""); setFormOpen(true); }
  function openEdit(item: GroupTripItineraryItem) { setEditing(item); setForm(fromItem(item)); setCustomPlace(!item.location_id); setError(""); setFormOpen(true); }
  function closeForm() { if (!saving) { setFormOpen(false); setEditing(null); } }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setError("");
    if (!form.location_id && !form.custom_location.trim()) { setError("Choose a location or enter a custom place."); return; }
    if (!form.location_id && (!validLatitude(form.latitude) || !validLongitude(form.longitude))) { setError("Choose the custom place on the map so its coordinates can be saved."); return; }
    setSaving(true);
    try {
      const payload = toPayload(form);
      if (editing) await groupTripService.updateItinerary(trip.group_trip_id, editing.itinerary_item_id, payload);
      else await groupTripService.addItinerary(trip.group_trip_id, payload);
      setFormOpen(false); setEditing(null); await onChanged();
    } catch (err) { setError(apiError(err, "Cannot save this itinerary item.")); }
    finally { setSaving(false); }
  }

  async function remove() {
    if (!deleting) return; setSaving(true);
    try { await groupTripService.deleteItinerary(trip.group_trip_id, deleting.itinerary_item_id); setDeleting(null); await onChanged(); }
    catch (err) { setError(apiError(err, "Cannot delete this itinerary item.")); setDeleting(null); }
    finally { setSaving(false); }
  }

  async function moveItem(item: GroupTripItineraryItem, direction: -1 | 1) {
    const sameDay = (trip.itinerary ?? [])
      .filter((candidate) => toVietnamDate(candidate.itinerary_date) === toVietnamDate(item.itinerary_date))
      .sort(compareItineraryItems);
    const currentIndex = sameDay.findIndex((candidate) => candidate.itinerary_item_id === item.itinerary_item_id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sameDay.length) return;

    const reordered = [...sameDay];
    [reordered[currentIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[currentIndex]];
    setSaving(true); setError("");
    try {
      await Promise.all(reordered.map((candidate, index) => groupTripService.updateItinerary(
        trip.group_trip_id,
        candidate.itinerary_item_id,
        { order_index: index + 1 }
      )));
      await onChanged();
    } catch (err) { setError(apiError(err, "Cannot reorder the itinerary.")); }
    finally { setSaving(false); }
  }

  function canMove(item: GroupTripItineraryItem, direction: -1 | 1) {
    const sameDay = (trip.itinerary ?? [])
      .filter((candidate) => toVietnamDate(candidate.itinerary_date) === toVietnamDate(item.itinerary_date))
      .sort(compareItineraryItems);
    const index = sameDay.findIndex((candidate) => candidate.itinerary_item_id === item.itinerary_item_id);
    return index >= 0 && index + direction >= 0 && index + direction < sameDay.length;
  }

  return <section className="mt-7"><div className="flex items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Itinerary</h2><p className="mt-1 text-sm text-slate-500">Plan each stop by date and time.</p></div>{canManage && !formOpen ? <Button variant="outline" onClick={openCreate}><Plus size={16} /> Add item</Button> : null}</div>{error && !formOpen ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}{formOpen ? <ItineraryForm trip={trip} form={form} setForm={setForm} customPlace={customPlace} setCustomPlace={setCustomPlace} saving={saving} error={error} editing={Boolean(editing)} onSubmit={save} onCancel={closeForm} /> : null}<div className="mt-4 grid gap-3">{trip.itinerary?.length ? [...trip.itinerary].sort(compareItineraryItems).map((item) => <article key={item.itinerary_item_id} className="rounded-lg border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold text-brand-600">{toVietnamDate(item.itinerary_date)}{item.start_time ? ` • ${toVietnamTime(item.start_time)}` : ""}<span className="ml-2 text-slate-400">Order {item.order_index ?? 1}</span></p><h3 className="mt-1 font-bold">{item.title}</h3>{item.custom_location ? <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} />{item.custom_location}</p> : item.location_id ? <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin size={14} />Location #{item.location_id}</p> : null}{item.description ? <p className="mt-2 text-sm text-slate-600">{item.description}</p> : null}</div>{canManage ? <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={() => void moveItem(item, -1)} disabled={saving || !canMove(item, -1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-30" title="Move up"><ArrowUp size={15} /></button><button type="button" onClick={() => void moveItem(item, 1)} disabled={saving || !canMove(item, 1)} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-30" title="Move down"><ArrowDown size={15} /></button><button type="button" onClick={() => openEdit(item)} disabled={saving} className="grid size-9 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:text-brand-600 disabled:opacity-30" title="Edit itinerary item"><Edit3 size={15} /></button><button type="button" onClick={() => setDeleting(item)} disabled={saving} className="grid size-9 place-items-center rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-30" title="Delete itinerary item"><Trash2 size={15} /></button></div> : null}</div></article>) : <p className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">No itinerary items yet.</p>}</div>{deleting ? <ConfirmDialog title="Delete itinerary item?" message={`Delete “${deleting.title}” from this trip itinerary?`} confirmLabel={saving ? "Deleting..." : "Delete item"} onCancel={() => { if (!saving) setDeleting(null); }} onConfirm={() => void remove()} /> : null}</section>;
}

function ItineraryForm({ trip, form, setForm, customPlace, setCustomPlace, saving, error, editing, onSubmit, onCancel }: { trip: GroupTrip; form: FormState; setForm: React.Dispatch<React.SetStateAction<FormState>>; customPlace: boolean; setCustomPlace: (value: boolean) => void; saving: boolean; error: string; editing: boolean; onSubmit: (event: React.FormEvent) => void; onCancel: () => void }) {
  const field = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((value) => ({ ...value, [key]: event.target.value }));
  function mode(custom: boolean) { setCustomPlace(custom); setForm((value) => ({ ...value, location_id: "", custom_location: "", latitude: "", longitude: "" })); }
  async function chooseOnMap(latitude: string, longitude: string) {
    setForm((value) => ({ ...value, latitude, longitude }));
    try {
      const params = new URLSearchParams({ format: "json", lat: latitude, lon: longitude, zoom: "18", addressdetails: "1" });
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, { headers: { Accept: "application/json" } });
      if (!response.ok) return;
      const result = await response.json() as { display_name?: string; name?: string };
      const place = result.name ?? result.display_name;
      if (place) setForm((value) => value.latitude === latitude && value.longitude === longitude ? ({ ...value, custom_location: place }) : value);
    } catch {
      // The coordinates remain selected; the customer can still enter the place manually.
    }
  }
  return <form onSubmit={onSubmit} className="mt-4 rounded-lg border border-brand-100 bg-brand-50/40 p-4"><div className="flex items-center justify-between"><h3 className="font-bold">{editing ? "Edit itinerary item" : "Add itinerary item"}</h3><button type="button" onClick={onCancel} className="text-slate-500"><X size={18} /></button></div>{error ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}<div className="mt-4 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Date<input required type="date" min={trip.start_date} max={trip.end_date} value={form.itinerary_date} onChange={field("itinerary_date")} className="h-11 rounded-lg border border-slate-200 px-3" /></label><label className="grid gap-2 text-sm font-semibold">Start time<input type="time" value={form.start_time} onChange={field("start_time")} className="h-11 rounded-lg border border-slate-200 px-3" /></label></div><label className="mt-4 grid gap-2 text-sm font-semibold">Title<input required maxLength={200} value={form.title} onChange={field("title")} className="h-11 rounded-lg border border-slate-200 px-3" /></label><label className="mt-4 grid gap-2 text-sm font-semibold">Description<textarea rows={3} value={form.description} onChange={field("description")} className="rounded-lg border border-slate-200 p-3" /></label><div className="mt-4 flex gap-4 text-sm font-semibold"><label className="flex items-center gap-2"><input type="radio" checked={!customPlace} onChange={() => mode(false)} /> Available location</label><label className="flex items-center gap-2"><input type="radio" checked={customPlace} onChange={() => mode(true)} /> Custom place</label></div>{customPlace ? <div className="mt-3 grid gap-4"><label className="grid gap-2 text-sm font-semibold">Place name<input required value={form.custom_location} onChange={field("custom_location")} className="h-11 w-full rounded-lg border border-slate-200 px-3" placeholder="Enter a place or choose it on the map" /></label><MapLocationPicker latitude={form.latitude} longitude={form.longitude} showSavedLocations onPlaceSelect={(name) => setForm((value) => ({ ...value, custom_location: name }))} onChange={(latitude, longitude) => void chooseOnMap(latitude, longitude)} /><p className="text-xs text-slate-500">Saved system locations are shown as markers. Click one to select it, or click anywhere else for a custom place.</p></div> : <div className="mt-3"><PlaceSearchPicker kind="location" value={form.location_id} onSelect={(id) => setForm((value) => ({ ...value, location_id: id, custom_location: "" }))} /></div>}<label className="mt-4 grid gap-2 text-sm font-semibold md:max-w-48">Order<input type="number" min={1} value={form.order_index} onChange={field("order_index")} className="h-11 rounded-lg border border-slate-200 px-3" /></label><div className="mt-4 flex gap-2"><Button type="submit" disabled={saving}>{saving ? "Saving..." : editing ? "Save item" : "Add item"}</Button><Button type="button" variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button></div></form>;
}

function emptyForm(date: string): FormState { return { itinerary_date: date, start_time: "", title: "", description: "", location_id: "", custom_location: "", order_index: "1", latitude: "", longitude: "" }; }
function fromItem(item: GroupTripItineraryItem): FormState { return { itinerary_date: toVietnamDate(item.itinerary_date), start_time: toVietnamTime(item.start_time), title: item.title, description: item.description ?? "", location_id: item.location_id ? String(item.location_id) : "", custom_location: item.custom_location ?? "", order_index: String(item.order_index ?? 1), latitude: item.latitude == null ? "" : String(item.latitude), longitude: item.longitude == null ? "" : String(item.longitude) }; }
function toPayload(form: FormState): GroupTripItineraryPayload {
  return {
    itinerary_date: form.itinerary_date,
    start_time: form.start_time || undefined,
    title: form.title.trim(),
    description: form.description.trim() || undefined,
    ...(form.location_id
      ? { location_id: Number(form.location_id) }
      : { custom_location: form.custom_location.trim(), latitude: Number(form.latitude), longitude: Number(form.longitude) }),
    order_index: form.order_index ? Number(form.order_index) : 1
  };
}

function validLatitude(value: string) { const number = Number(value); return value.trim() !== "" && Number.isFinite(number) && number >= -90 && number <= 90; }
function validLongitude(value: string) { const number = Number(value); return value.trim() !== "" && Number.isFinite(number) && number >= -180 && number <= 180; }
function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }

function toVietnamDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function toVietnamTime(value?: string | null) {
  if (!value) return "";
  if (/^\d{2}:\d{2}(?::\d{2})?$/.test(value)) return value.slice(0, 5);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 5);
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
}

function compareItineraryItems(a: GroupTripItineraryItem, b: GroupTripItineraryItem) {
  const dateComparison = toVietnamDate(a.itinerary_date).localeCompare(toVietnamDate(b.itinerary_date));
  if (dateComparison !== 0) return dateComparison;
  const orderComparison = Number(a.order_index ?? 1) - Number(b.order_index ?? 1);
  if (orderComparison !== 0) return orderComparison;
  return toVietnamTime(a.start_time).localeCompare(toVietnamTime(b.start_time));
}
