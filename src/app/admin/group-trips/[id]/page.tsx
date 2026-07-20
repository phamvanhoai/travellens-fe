"use client";

import axios from "axios";
import { ArrowLeft, CalendarDays, Clock3, Loader2, MapPin, Pencil, Save, Trash2, UserRound, Users, X } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { useToast } from "@/components/common/toast";
import { GroupTripRoutePreview } from "@/components/group-trips/group-trip-route-preview";
import { Button } from "@/components/ui/button";
import { adminGroupTripService } from "@/services/admin-group-trip.service";
import type { GroupTrip, GroupTripMember, GroupTripVisibility } from "@/services/group-trip.service";

type EditForm = { name: string; description: string; start_date: string; end_date: string; max_members: string; visibility: GroupTripVisibility };
type EditErrors = Partial<Record<keyof EditForm, string>>;

export default function AdminGroupTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useToast();
  const [trip, setTrip] = useState<GroupTrip | null>(null);
  const [members, setMembers] = useState<GroupTripMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(searchParams.get("edit") === "1");
  const [form, setForm] = useState<EditForm | null>(null);
  const [fieldErrors, setFieldErrors] = useState<EditErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [detail, memberResult] = await Promise.all([adminGroupTripService.detail(id), adminGroupTripService.members(id, { page: 1, limit: 100 })]);
      setTrip(detail); setMembers(memberResult.items); setForm(toForm(detail));
    } catch (err) { setError(apiError(err, "Cannot load group trip details.")); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!form || !trip) return;
    const nextErrors = validateEditForm(form, Math.max(2, memberCount(trip.member_count)));
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    try {
      const updated = await adminGroupTripService.update(id, { name: form.name.trim(), description: form.description.trim() || null, start_date: form.start_date, end_date: form.end_date, max_members: form.max_members ? Number(form.max_members) : null, visibility: form.visibility });
      setTrip({ ...trip, ...updated }); setForm(toForm({ ...trip, ...updated })); setFieldErrors({}); setEditing(false);
      router.replace(`/admin/group-trips/${id}`);
      showToast({ variant: "success", title: "Group trip updated" });
    } catch (err) { showToast({ variant: "error", title: "Update failed", description: apiError(err, "Cannot update this group trip.") }); }
    finally { setSaving(false); }
  }

  async function remove() {
    setSaving(true);
    try { await adminGroupTripService.remove(id); showToast({ variant: "success", title: "Group trip deleted" }); router.replace("/admin/group-trips"); }
    catch (err) { showToast({ variant: "error", title: "Delete failed", description: apiError(err, "Cannot delete this group trip.") }); setConfirmDelete(false); setSaving(false); }
  }

  function clearFieldError(field: keyof EditForm) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  if (loading) return <AdminGroupTripDetailSkeleton />;
  if (error || !trip) return <div className="rounded-lg border border-slate-200 bg-white p-6"><Button href="/admin/group-trips" variant="ghost" className="mb-4 px-0"><ArrowLeft size={17} /> Group Trips</Button><p className="rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error || "Group trip not found."}</p></div>;

  return <>
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><Button href="/admin/group-trips" variant="ghost" className="mb-3 h-9 px-0 hover:bg-transparent"><ArrowLeft size={17} /> Group Trips</Button><div className="flex flex-wrap items-center gap-2"><Badge value={trip.visibility} /><Badge value={trip.status} /></div><h1 className="mt-3 text-3xl font-bold">{trip.name}</h1><p className="mt-2 max-w-3xl text-slate-600">{trip.description || "No description"}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setEditing(true)}><Pencil size={16} /> Edit</Button><button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex h-11 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-700"><Trash2 size={16} /> Delete</button></div></div>
      <div className="mt-6 grid gap-3 rounded-lg bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><Info icon={<MapPin size={16} />} label="Destination" value={trip.destination_name || (trip.destination_id ? `Destination #${trip.destination_id}` : "Not set")} /><Info icon={<CalendarDays size={16} />} label="Dates" value={`${date(trip.start_date)} – ${date(trip.end_date)}`} /><Info icon={<Users size={16} />} label="Members" value={`${memberCount(trip.member_count)}${trip.max_members ? ` / ${trip.max_members}` : ""}`} /><Info icon={<UserRound size={16} />} label="Leader" value={trip.leader?.name || `User #${trip.leader_id}`} /></div>
      <GroupTripRoutePreview trip={trip} />
      <section className="mt-7"><h2 className="text-lg font-bold">Itinerary</h2><div className="mt-3 space-y-3">{trip.itinerary?.length ? [...trip.itinerary].sort((a, b) => a.itinerary_date.localeCompare(b.itinerary_date) || Number(a.order_index ?? 0) - Number(b.order_index ?? 0)).map((item) => <article key={item.itinerary_item_id} className="rounded-lg border border-slate-200 p-4"><div className="flex gap-3 text-xs font-semibold text-brand-700"><span className="flex items-center gap-1"><CalendarDays size={14} />{date(item.itinerary_date)}</span>{item.start_time ? <span className="flex items-center gap-1"><Clock3 size={14} />{item.start_time.slice(0, 5)}</span> : null}</div><h3 className="mt-2 font-bold">{item.title}</h3>{item.description ? <p className="mt-1 text-sm text-slate-500">{item.description}</p> : null}<p className="mt-2 text-sm text-slate-600"><MapPin className="mr-1 inline" size={14} />{item.custom_location || (item.location_id ? `Location #${item.location_id}` : "No location")}</p></article>) : <p className="rounded-lg border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">No itinerary items.</p>}</div></section>
      <section className="mt-7"><h2 className="text-lg font-bold">Members ({members.length})</h2><div className="mt-3 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["User", "Email", "Phone", "Role", "Joined"].map((value) => <th key={value} className="p-3">{value}</th>)}</tr></thead><tbody>{members.length ? members.map((member) => <tr key={member.group_trip_member_id ?? member.user_id} className="border-t border-slate-100"><td className="p-3 font-semibold">{member.name || `User #${member.user_id}`}</td><td className="p-3">{member.email || "—"}</td><td className="p-3">{member.phone || "—"}</td><td className="p-3 capitalize">{member.role}</td><td className="p-3">{member.joined_at ? date(member.joined_at) : "—"}</td></tr>) : <tr><td colSpan={5} className="p-8 text-center text-slate-500">No active members found.</td></tr>}</tbody></table></div></section>
    </div>
    {editing && form ? <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><form noValidate onSubmit={save} className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-soft"><div className="flex items-center justify-between"><h2 className="text-xl font-bold">Edit Group Trip</h2><button type="button" onClick={() => { setFieldErrors({}); setEditing(false); }} className="grid size-9 place-items-center rounded-full hover:bg-slate-100"><X size={18} /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Name" message={fieldErrors.name}><input value={form.name} onChange={(event) => { setForm({ ...form, name: event.target.value }); clearFieldError("name"); }} className="input" /></Field><Field label="Maximum members" message={fieldErrors.max_members}><input type="number" value={form.max_members} onChange={(event) => { setForm({ ...form, max_members: event.target.value }); clearFieldError("max_members"); }} placeholder="No limit" className="input" /></Field><Field label="Start date" message={fieldErrors.start_date}><input type="date" value={form.start_date} onChange={(event) => { setForm({ ...form, start_date: event.target.value }); clearFieldError("start_date"); }} className="input" /></Field><Field label="End date" message={fieldErrors.end_date}><input type="date" value={form.end_date} onChange={(event) => { setForm({ ...form, end_date: event.target.value }); clearFieldError("end_date"); }} className="input" /></Field><Field label="Visibility" message={fieldErrors.visibility}><select value={form.visibility} onChange={(event) => { setForm({ ...form, visibility: event.target.value as GroupTripVisibility }); clearFieldError("visibility"); }} className="input"><option value="public">Public</option><option value="private">Private</option></select></Field><label className="grid gap-2 text-sm font-semibold sm:col-span-2">Description<textarea rows={4} value={form.description} onChange={(event) => { setForm({ ...form, description: event.target.value }); clearFieldError("description"); }} className="rounded-lg border border-slate-200 p-3 font-normal" />{fieldErrors.description ? <span className="text-xs font-semibold text-rose-600">{fieldErrors.description}</span> : null}</label></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => { setFieldErrors({}); setEditing(false); }}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save changes</Button></div></form></div> : null}
    {confirmDelete ? <ConfirmDialog title="Delete group trip?" message={`“${trip.name}” will be hidden from all Group Trip lists and detail pages. Its members, invitations, itinerary, and linked booking will remain stored.`} confirmLabel={saving ? "Deleting..." : "Delete"} onCancel={() => { if (!saving) setConfirmDelete(false); }} onConfirm={() => void remove()} /> : null}
  </>;
}

function toForm(trip: GroupTrip): EditForm { return { name: trip.name, description: trip.description ?? "", start_date: date(trip.start_date), end_date: date(trip.end_date), max_members: trip.max_members ? String(trip.max_members) : "", visibility: trip.visibility }; }
function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div><p className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">{icon}{label}</p><p className="mt-1 font-semibold text-slate-700">{value}</p></div>; }
function Field({ label, children, message }: { label: string; children: React.ReactNode; message?: string }) { return <label className="block text-sm font-semibold [&_.input]:mt-2 [&_.input]:h-11 [&_.input]:w-full [&_.input]:rounded-lg [&_.input]:border [&_.input]:border-slate-200 [&_.input]:px-3">{label}{children}{message ? <span className="mt-2 block text-xs font-semibold text-rose-600">{message}</span> : null}</label>; }
function Badge({ value }: { value: string }) { const good = value === "active" || value === "public"; return <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${good ? "bg-emerald-50 text-emerald-700" : value === "archived" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{value}</span>; }
function date(value: string) { return value ? value.slice(0, 10) : ""; }
function memberCount(value: unknown) { const count = Number(value); return Number.isFinite(count) && count >= 0 ? count : 0; }
function validateEditForm(form: EditForm, minimumMembers: number): EditErrors { const errors: EditErrors = {}; const name = form.name.trim(); if (!name) errors.name = "Group trip name is required."; else if (name.length < 2) errors.name = "Group trip name must contain at least 2 characters."; else if (name.length > 150) errors.name = "Group trip name cannot exceed 150 characters."; if (!form.start_date) errors.start_date = "Start date is required."; if (!form.end_date) errors.end_date = "End date is required."; else if (form.start_date && form.end_date < form.start_date) errors.end_date = "End date cannot be before start date."; if (form.max_members) { const maximum = Number(form.max_members); if (!Number.isInteger(maximum)) errors.max_members = "Maximum members must be a whole number."; else if (maximum < minimumMembers) errors.max_members = `Maximum members cannot be lower than ${minimumMembers}.`; else if (maximum > 500) errors.max_members = "Maximum members cannot exceed 500."; } if (form.description.length > 5000) errors.description = "Description cannot exceed 5,000 characters."; return errors; }
function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }

function AdminGroupTripDetailSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-6 shadow-sm" aria-label="Loading group trip details" aria-busy="true">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="h-9 w-32 rounded-lg bg-slate-100" />
          <div className="mt-3 flex gap-2"><div className="h-6 w-16 rounded-full bg-slate-200" /><div className="h-6 w-16 rounded-full bg-slate-100" /></div>
          <div className="mt-4 h-9 w-80 max-w-full rounded bg-slate-200" />
          <div className="mt-3 h-4 w-full max-w-3xl rounded bg-slate-100" />
          <div className="mt-2 h-4 w-2/3 max-w-2xl rounded bg-slate-100" />
        </div>
        <div className="flex gap-2"><div className="h-11 w-24 rounded-lg bg-slate-100" /><div className="h-11 w-24 rounded-lg bg-slate-200" /></div>
      </div>

      <div className="mt-6 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index}><div className="h-3 w-24 rounded bg-slate-200" /><div className="mt-2 h-4 w-32 max-w-full rounded bg-slate-200" /></div>)}
      </div>

      <section className="mt-7">
        <div className="h-6 w-36 rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 max-w-full rounded bg-slate-100" />
        <div className="mt-3 h-[420px] rounded-lg border border-slate-200 bg-slate-100" />
      </section>

      <section className="mt-7">
        <div className="h-6 w-24 rounded bg-slate-200" />
        <div className="mt-3 grid gap-3">
          {Array.from({ length: 2 }, (_, index) => <div key={index} className="rounded-lg border border-slate-200 p-4"><div className="flex gap-3"><div className="h-3 w-24 rounded bg-slate-200" /><div className="h-3 w-14 rounded bg-slate-100" /></div><div className="mt-3 h-5 w-64 max-w-full rounded bg-slate-200" /><div className="mt-2 h-4 w-3/4 rounded bg-slate-100" /><div className="mt-3 h-4 w-40 rounded bg-slate-100" /></div>)}
        </div>
      </section>

      <section className="mt-7">
        <div className="h-6 w-32 rounded bg-slate-200" />
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-100">
          <div className="h-11 bg-slate-100" />
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="grid h-14 grid-cols-5 items-center gap-4 border-t border-slate-100 px-3"><div className="h-4 w-28 rounded bg-slate-200" /><div className="h-4 w-32 rounded bg-slate-100" /><div className="h-4 w-24 rounded bg-slate-100" /><div className="h-4 w-16 rounded bg-slate-200" /><div className="h-4 w-20 rounded bg-slate-100" /></div>)}
        </div>
      </section>
    </div>
  );
}
