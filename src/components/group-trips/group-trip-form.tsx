"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlaceSearchPicker } from "@/components/group-trips/place-search-picker";
import type { GroupTripPayload, GroupTripVisibility } from "@/services/group-trip.service";

export type TripFormState = { name: string; description: string; destination_id: string; destination_name: string; start_date: string; end_date: string; max_members: string; visibility: GroupTripVisibility };

export function GroupTripForm({ form, setForm, submit, saving, submitLabel = "Create trip" }: { form: TripFormState; setForm: React.Dispatch<React.SetStateAction<TripFormState>>; submit: (event: React.FormEvent) => void; saving: boolean; submitLabel?: string }) {
  const [destinationMode, setDestinationMode] = useState<"existing" | "custom">(form.destination_id ? "existing" : form.destination_name ? "custom" : "existing");
  const field = (key: keyof TripFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setForm((value) => ({ ...value, [key]: event.target.value }));

  function changeMode(mode: "existing" | "custom") {
    setDestinationMode(mode);
    setForm((value) => ({ ...value, destination_id: "", destination_name: "" }));
  }

  return <form className="mt-6 grid gap-5" onSubmit={submit}><label className="grid gap-2 text-sm font-semibold">Trip name<input required minLength={2} maxLength={150} value={form.name} onChange={field("name")} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-600" /></label><label className="grid gap-2 text-sm font-semibold">Description<textarea maxLength={5000} rows={4} value={form.description} onChange={field("description")} className="rounded-lg border border-slate-200 p-3 outline-none focus:border-brand-600" /></label><fieldset className="rounded-lg border border-slate-200 p-4"><legend className="px-1 text-sm font-semibold">Destination</legend><div className="mb-4 flex flex-wrap gap-4 text-sm"><label className="flex cursor-pointer items-center gap-2 font-semibold"><input type="radio" name="destination_mode" checked={destinationMode === "existing"} onChange={() => changeMode("existing")} /> Choose an available destination</label><label className="flex cursor-pointer items-center gap-2 font-semibold"><input type="radio" name="destination_mode" checked={destinationMode === "custom"} onChange={() => changeMode("custom")} /> Enter another place</label></div>{destinationMode === "existing" ? <label className="grid gap-2 text-sm font-semibold">Search destination<PlaceSearchPicker kind="destination" value={form.destination_id} selectedLabel={form.destination_name} onSelect={(id, name) => setForm((value) => ({ ...value, destination_id: id, destination_name: name }))} /></label> : <label className="grid gap-2 text-sm font-semibold">Place name<input required minLength={2} maxLength={150} value={form.destination_name} onChange={field("destination_name")} className="h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-brand-600" placeholder="Example: Bến Tre – Trà Vinh" /></label>}</fieldset><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Start date<input required type="date" value={form.start_date} onChange={field("start_date")} className="h-11 rounded-lg border border-slate-200 px-3" /></label><label className="grid gap-2 text-sm font-semibold">End date<input required type="date" min={form.start_date} value={form.end_date} onChange={field("end_date")} className="h-11 rounded-lg border border-slate-200 px-3" /></label></div><div className="grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-semibold">Maximum members<input type="number" min={2} max={500} value={form.max_members} onChange={field("max_members")} className="h-11 rounded-lg border border-slate-200 px-3" /></label><label className="grid gap-2 text-sm font-semibold">Visibility<select value={form.visibility} onChange={field("visibility")} className="h-11 rounded-lg border border-slate-200 px-3"><option value="private">Private</option><option value="public">Public</option></select></label></div><div><Button type="submit" disabled={saving}>{saving ? "Saving..." : submitLabel}</Button></div></form>;
}

export function toGroupTripPayload(form: TripFormState): GroupTripPayload {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    ...(form.destination_id
      ? { destination_id: Number(form.destination_id) }
      : { destination_name: form.destination_name.trim() }),
    start_date: form.start_date,
    end_date: form.end_date,
    max_members: form.max_members ? Number(form.max_members) : undefined,
    visibility: form.visibility
  };
}
