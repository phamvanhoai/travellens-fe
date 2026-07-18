"use client";

import axios from "axios";
import { Clock3, Loader2, MailPlus, Search, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { groupTripService, type GroupTripInvitation } from "@/services/group-trip.service";

const statuses = ["all", "pending", "accepted", "declined", "expired", "canceled"] as const;

export function GroupTripInvitations({ tripId }: { tripId: number }) {
  const showToast = useToast();
  const [items, setItems] = useState<GroupTripInvitation[]>([]);
  const [email, setEmail] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [canceling, setCanceling] = useState<GroupTripInvitation | null>(null);
  const limit = 10;

  useEffect(() => {
    const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await groupTripService.sentInvites(tripId, { page, limit, ...(status !== "all" ? { status } : {}), ...(debouncedSearch ? { search: debouncedSearch } : {}) });
      setItems(result.items);
      setTotal(result.total);
      setPageCount(result.totalPages);
    } catch (err) {
      setError(apiError(err, "Cannot load trip invitations."));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, status, tripId]);

  useEffect(() => { void load(); }, [load]);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setWorking(true);
    setError("");
    try {
      const result = await groupTripService.invite(tripId, email.trim());
      setEmail("");
      showToast({ variant: result.email_sent ? "success" : "info", title: result.email_sent ? "Invitation sent" : "Invitation created", description: result.email_sent ? `An invitation was sent to ${result.invited_email}.` : "The invitation was created, but email delivery failed." });
      setStatus("pending");
      setPage(1);
      await load();
    } catch (err) {
      setError(apiError(err, "Cannot invite this customer."));
    } finally {
      setWorking(false);
    }
  }

  async function cancelInvite() {
    if (!canceling) return;
    setWorking(true);
    try {
      await groupTripService.cancelInvite(tripId, inviteId(canceling));
      showToast({ variant: "success", title: "Invitation canceled", description: inviteEmail(canceling) });
      setCanceling(null);
      await load();
    } catch (err) {
      setError(apiError(err, "Cannot cancel this invitation."));
      setCanceling(null);
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="mt-7 rounded-lg border border-slate-200 bg-white p-5">
      <div><h2 className="text-lg font-bold">Invitations ({total})</h2><p className="mt-1 text-sm text-slate-500">Invite customers and review invitation history.</p></div>
      <form onSubmit={invite} className="mt-5 flex flex-col gap-2 rounded-lg bg-brand-50 p-4 sm:flex-row">
        <label className="relative min-w-0 flex-1"><MailPlus className="absolute left-3 top-3.5 size-4 text-slate-400" /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="customer@example.com" className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-500" /></label>
        <Button type="submit" disabled={working || !email.trim()}>{working ? <Loader2 className="size-4 animate-spin" /> : <MailPlus size={16} />} Invite Member</Button>
      </form>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px]">
        <label className="relative"><Search className="absolute left-3 top-3 size-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-brand-500" /></label>
        <select value={status} onChange={(event) => { setStatus(event.target.value as typeof status); setPage(1); }} className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm capitalize outline-none focus:border-brand-500">{statuses.map((value) => <option key={value} value={value}>{value === "all" ? "All statuses" : value}</option>)}</select>
      </div>
      {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}
      <div className="mt-4 space-y-2">
        {loading ? <div className="flex justify-center py-8"><Loader2 className="size-6 animate-spin text-brand-600" /></div> : items.length ? items.map((invite) => <div key={inviteId(invite)} className="flex flex-col gap-3 rounded-lg border border-slate-100 p-4 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold">{invite.invited_user?.name || inviteEmail(invite)}</p><StatusBadge status={invite.status} /></div><p className="mt-1 truncate text-sm text-slate-500">{inviteEmail(invite)}</p>{invite.expires_at ? <p className="mt-1 flex items-center gap-1 text-xs text-slate-400"><Clock3 size={12} /> Expires {formatDate(invite.expires_at)}</p> : null}</div>{invite.status === "pending" ? <Button variant="outline" className="h-9 border-rose-200 px-3 text-rose-600" onClick={() => setCanceling(invite)}><Undo2 size={15} /> Cancel invite</Button> : null}</div>) : <p className="py-8 text-center text-sm text-slate-500">No invitations found.</p>}
      </div>
      {!loading && pageCount > 1 ? <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={limit} itemLabel="invitations" onPageChange={setPage} /> : null}
      {canceling ? <ConfirmDialog title="Cancel invitation?" message={`The pending invitation for ${inviteEmail(canceling)} will be canceled.`} confirmLabel={working ? "Canceling..." : "Cancel invitation"} onCancel={() => { if (!working) setCanceling(null); }} onConfirm={() => void cancelInvite()} /> : null}
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) { const colors: Record<string, string> = { pending: "bg-amber-50 text-amber-700", accepted: "bg-emerald-50 text-emerald-700", declined: "bg-rose-50 text-rose-700", expired: "bg-slate-100 text-slate-600", canceled: "bg-slate-100 text-slate-600" }; return <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${colors[status] ?? "bg-slate-100 text-slate-600"}`}>{status}</span>; }
export function inviteId(invite: GroupTripInvitation) { return Number(invite.group_trip_invite_id ?? invite.invite_id); }
function inviteEmail(invite: GroupTripInvitation) { return invite.invited_email || invite.invited_user?.email || "Unknown customer"; }
function formatDate(value: string) { return new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(value)); }
function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
