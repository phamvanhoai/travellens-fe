"use client";

import axios from "axios";
import { ArrowLeft, CalendarDays, Edit3, MapPin, Trash2, Users } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { GroupTripForm, toGroupTripPayload, type TripFormState } from "@/components/group-trips/group-trip-form";
import { ItineraryManager } from "@/components/group-trips/itinerary-manager";
import { GroupTripRoutePreview } from "@/components/group-trips/group-trip-route-preview";
import { Button } from "@/components/ui/button";
import { groupTripService, type GroupTrip } from "@/services/group-trip.service";

export default function GroupTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [trip, setTrip] = useState<GroupTrip | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<TripFormState>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { const data = await groupTripService.detail(id); setTrip(data); setForm(fromTrip(data)); }
    catch (err) { setError(apiError(err, "Cannot load this group trip.")); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);
  const leader = trip?.current_member?.role === "leader";

  async function update(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try { const data = await groupTripService.update(id, toGroupTripPayload(form)); setTrip(data); setForm(fromTrip(data)); setEditing(false); }
    catch (err) { setError(apiError(err, "Cannot update this group trip.")); }
    finally { setSaving(false); }
  }

  async function remove() {
    setSaving(true);
    try { await groupTripService.remove(id); router.push("/dashboard/group-trips"); }
    catch (err) { setError(apiError(err, "Cannot delete this group trip.")); setConfirmDelete(false); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="h-80 animate-pulse rounded-lg bg-slate-100" />;

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <Button href="/dashboard/group-trips" variant="ghost" className="mb-3 h-9 px-0 hover:bg-transparent"><ArrowLeft size={17} /> Back to trips</Button>
      {error ? <p className="mb-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p> : null}
      {trip ? editing ? <>
        <h1 className="text-2xl font-bold">Edit Group Trip</h1>
        <GroupTripForm form={form} setForm={setForm} submit={update} saving={saving} submitLabel="Save changes" />
        <Button variant="ghost" className="mt-3" onClick={() => { setEditing(false); setForm(fromTrip(trip)); }}>Cancel</Button>
      </> : <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><div className="flex gap-2"><span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold capitalize text-brand-700">{trip.visibility}</span>{leader ? <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">Leader</span> : null}</div><h1 className="mt-3 text-2xl font-bold">{trip.name}</h1><p className="mt-2 text-slate-600">{trip.description || "No description"}</p></div>
          {leader ? <div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(true)}><Edit3 size={16} /> Edit</Button><Button variant="outline" className="border-rose-200 text-rose-600" onClick={() => setConfirmDelete(true)}><Trash2 size={16} /> Delete</Button></div> : null}
        </div>
        <div className="mt-6 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-3"><span className="flex items-center gap-2"><MapPin size={16} />{trip.destination_name || `Destination #${trip.destination_id}`}</span><span className="flex items-center gap-2"><CalendarDays size={16} />{trip.start_date} — {trip.end_date}</span><span className="flex items-center gap-2"><Users size={16} />{trip.member_count}{trip.max_members ? ` / ${trip.max_members}` : ""} members</span></div>
        <GroupTripRoutePreview trip={trip} />
        <ItineraryManager trip={trip} canManage={leader} onChanged={load} />
        <section className="mt-7"><h2 className="text-lg font-bold">Members ({trip.member_count})</h2><div className="mt-3 flex flex-wrap gap-2">{trip.members?.length ? trip.members.map((member) => <span key={member.user_id} className="rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold">{member.name || `User #${member.user_id}`}{member.role === "leader" ? " • Leader" : ""}</span>) : <span className="text-sm text-slate-500">Member details are not available.</span>}</div></section>
      </> : null}
    </div>
    {confirmDelete && trip ? <ConfirmDialog title="Delete group trip?" message={`Archive “${trip.name}”? Pending invitations will be canceled.`} confirmLabel={saving ? "Deleting..." : "Delete trip"} onCancel={() => { if (!saving) setConfirmDelete(false); }} onConfirm={() => void remove()} /> : null}
  </>;
}

function emptyForm(): TripFormState { return { name: "", description: "", destination_id: "", destination_name: "", start_date: "", end_date: "", max_members: "", visibility: "private" }; }
function fromTrip(trip: GroupTrip): TripFormState { return { name: trip.name, description: trip.description ?? "", destination_id: trip.destination_id ? String(trip.destination_id) : "", destination_name: trip.destination_name ?? "", start_date: trip.start_date, end_date: trip.end_date, max_members: trip.max_members ? String(trip.max_members) : "", visibility: trip.visibility }; }
function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
