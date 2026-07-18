"use client";

import axios from "axios";
import { CalendarDays, Check, Clock3, Loader2, Mail, MapPin, MapPinned, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { StatusBadge, inviteId } from "@/components/group-trips/group-trip-invitations";
import { Button } from "@/components/ui/button";
import { groupTripService, type GroupTripInvitation } from "@/services/group-trip.service";

const filters = ["pending", "accepted", "declined", "expired", "canceled", "all"] as const;
type Action = { type: "accept" | "decline"; invite: GroupTripInvitation } | null;

export default function GroupTripInvitationsPage() {
  const showToast = useToast();
  const [items, setItems] = useState<GroupTripInvitation[]>([]);
  const [status, setStatus] = useState<(typeof filters)[number]>("pending");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [action, setAction] = useState<Action>(null);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await groupTripService.receivedInvites({ page, limit, ...(status !== "all" ? { status } : {}) });
      setItems(result.items);
      setTotal(result.total);
      setPageCount(result.totalPages);
    } catch (err) {
      setError(apiError(err, "Cannot load your Group Trip invitations."));
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { void load(); }, [load]);

  async function submitAction() {
    if (!action) return;
    setWorking(true);
    setError("");
    try {
      if (action.type === "accept") await groupTripService.acceptReceivedInvite(inviteId(action.invite));
      else await groupTripService.declineReceivedInvite(inviteId(action.invite));
      showToast({ variant: "success", title: action.type === "accept" ? "Invitation accepted" : "Invitation declined", description: tripName(action.invite) });
      setAction(null);
      await load();
    } catch (err) {
      setError(apiError(err, `Cannot ${action.type} this invitation.`));
      setAction(null);
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Mail className="text-brand-600" /> Group Trip Invitations</h1><p className="mt-1 text-sm text-slate-500">Review invitations sent to your customer account.</p></div>
      <div className="mt-6 flex gap-2 border-b border-slate-200"><Link href="/dashboard/group-trips" className="px-4 py-3 text-sm font-semibold text-slate-500 hover:text-brand-600"><MapPinned className="mr-2 inline size-4" />My Trips</Link><Link href="/dashboard/group-trips/invitations" className="border-b-2 border-brand-600 px-4 py-3 text-sm font-bold text-brand-700"><Mail className="mr-2 inline size-4" />Invitations</Link></div>
      <div className="mt-6 flex flex-wrap gap-2">{filters.map((value) => <button type="button" key={value} onClick={() => { setStatus(value); setPage(1); }} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${status === value ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-700"}`}>{value}</button>)}</div>
      {error ? <p className="mt-5 rounded-lg bg-rose-50 p-4 text-sm font-semibold text-rose-700">{error}</p> : null}
      {loading ? <div className="flex justify-center py-16"><Loader2 className="size-7 animate-spin text-brand-600" /></div> : <div className="mt-6 space-y-4">{items.length ? items.map((invite) => {
        const trip = invite.group_trip ?? invite.trip;
        return <article key={inviteId(invite)} className="rounded-lg border border-slate-200 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-bold">{tripName(invite)}</h2><StatusBadge status={invite.status} /></div><p className="mt-2 text-sm text-slate-500">Invited by {inviterName(invite)}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">{trip?.destination_name ? <span className="flex items-center gap-1.5"><MapPin size={15} />{trip.destination_name}</span> : null}{trip?.start_date ? <span className="flex items-center gap-1.5"><CalendarDays size={15} />{trip.start_date}{trip.end_date ? ` — ${trip.end_date}` : ""}</span> : null}{invite.expires_at ? <span className="flex items-center gap-1.5"><Clock3 size={15} />Expires {formatDate(invite.expires_at)}</span> : null}</div></div>{invite.status === "pending" ? <div className="flex shrink-0 gap-2"><Button onClick={() => setAction({ type: "accept", invite })}><Check size={16} /> Accept</Button><Button variant="outline" className="border-rose-200 text-rose-600" onClick={() => setAction({ type: "decline", invite })}><X size={16} /> Decline</Button></div> : invite.status === "accepted" ? <Button href={`/dashboard/group-trips/${invite.group_trip_id}`} variant="outline">View Trip</Button> : null}</div></article>;
      }) : <div className="rounded-lg border border-dashed border-slate-200 py-14 text-center text-sm text-slate-500"><Mail className="mx-auto mb-3 size-8 text-slate-300" />No {status === "all" ? "" : status} invitations found.</div>}</div>}
      {!loading && pageCount > 1 ? <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={limit} itemLabel="invitations" onPageChange={setPage} /> : null}
      {action ? <ConfirmDialog title={action.type === "accept" ? "Accept invitation?" : "Decline invitation?"} message={action.type === "accept" ? `Join ${tripName(action.invite)} as a member?` : `Decline the invitation to ${tripName(action.invite)}?`} confirmLabel={working ? "Processing..." : action.type === "accept" ? "Accept" : "Decline"} onCancel={() => { if (!working) setAction(null); }} onConfirm={() => void submitAction()} /> : null}
    </div>
  );
}

function tripName(invite: GroupTripInvitation) { return invite.group_trip?.name || invite.trip?.name || invite.group_trip_name || `Group Trip #${invite.group_trip_id}`; }
function inviterName(invite: GroupTripInvitation) { return invite.inviter?.name || invite.invited_by_user?.name || invite.inviter_name || "Trip leader"; }
function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)); }
function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
