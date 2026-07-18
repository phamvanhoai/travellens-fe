"use client";

import axios from "axios";
import { ArrowLeft, MapPinned } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GroupTripForm, toGroupTripPayload, type TripFormState } from "@/components/group-trips/group-trip-form";
import { groupTripService } from "@/services/group-trip.service";

export default function CreateGroupTripPage() {
  const router = useRouter();
  const [form, setForm] = useState<TripFormState>({ name: "", description: "", destination_id: "", destination_name: "", start_date: "", end_date: "", max_members: "", visibility: "private" });
  const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); setError(""); if (!form.destination_id && !form.destination_name.trim()) { setError("Enter a destination ID or destination name."); return; } setSaving(true); try { const trip = await groupTripService.create(toGroupTripPayload(form)); router.push(`/dashboard/group-trips/${trip.group_trip_id}`); } catch (err) { setError(apiError(err, "Cannot create this group trip.")); } finally { setSaving(false); } }
  return <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><Button href="/dashboard/group-trips" variant="ghost" className="mb-3 h-9 px-0 hover:bg-transparent"><ArrowLeft size={17} /> Back</Button><h1 className="flex items-center gap-2 text-2xl font-bold"><MapPinned className="text-brand-600" /> Create Group Trip</h1><p className="mt-1 text-sm text-slate-500">Create an independent trip. You will automatically become its leader.</p>{error ? <p className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p> : null}<GroupTripForm form={form} setForm={setForm} submit={submit} saving={saving} /></div>;
}
function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
