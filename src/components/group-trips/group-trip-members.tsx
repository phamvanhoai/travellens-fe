"use client";

import axios from "axios";
import { Crown, Loader2, LogOut, Search, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { Pagination } from "@/components/common/pagination";
import { useToast } from "@/components/common/toast";
import { Button } from "@/components/ui/button";
import { groupTripService, type GroupTrip, type GroupTripMember } from "@/services/group-trip.service";

type PendingAction =
  | { type: "remove"; member: GroupTripMember }
  | { type: "leader"; member: GroupTripMember }
  | { type: "leave" }
  | null;

export function GroupTripMembers({ trip, onChanged }: { trip: GroupTrip; onChanged: () => Promise<void> | void }) {
  const router = useRouter();
  const showToast = useToast();
  const [members, setMembers] = useState<GroupTripMember[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const limit = 10;
  const isLeader = trip.current_member?.status === "active" && trip.current_member?.role === "leader";
  const isMember = trip.current_member?.status === "active";
  const currentUserId = Number(trip.current_member?.user_id ?? 0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await groupTripService.members(trip.group_trip_id, {
        page,
        limit,
        ...(debouncedSearch ? { search: debouncedSearch } : {})
      });
      setMembers(result.items);
      setTotal(result.total);
      setPageCount(result.totalPages);
    } catch (err) {
      setError(apiError(err, "Cannot load trip members."));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, trip.group_trip_id]);

  useEffect(() => { void loadMembers(); }, [loadMembers]);

  async function confirmAction() {
    if (!pendingAction) return;
    setWorking(true);
    setError("");
    try {
      if (pendingAction.type === "leave") {
        await groupTripService.leave(trip.group_trip_id);
        showToast({ variant: "success", title: "Left group trip" });
        router.push("/dashboard/group-trips");
        return;
      }
      if (pendingAction.type === "remove") {
        await groupTripService.removeMember(trip.group_trip_id, pendingAction.member.user_id);
        showToast({ variant: "success", title: "Member removed", description: memberName(pendingAction.member) });
      } else {
        await groupTripService.changeLeader(trip.group_trip_id, pendingAction.member.user_id);
        showToast({ variant: "success", title: "Leader changed", description: `${memberName(pendingAction.member)} is now the trip leader.` });
      }
      setPendingAction(null);
      await Promise.all([loadMembers(), Promise.resolve(onChanged())]);
    } catch (err) {
      setError(apiError(err, "Cannot complete this action."));
      setPendingAction(null);
    } finally {
      setWorking(false);
    }
  }

  return (
    <section className="mt-7 rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold">Members ({total || trip.member_count})</h2>
          <p className="mt-1 text-sm text-slate-500">View and manage active members of this trip.</p>
        </div>
        {isMember && !isLeader ? <Button variant="outline" className="border-rose-200 text-rose-600" onClick={() => setPendingAction({ type: "leave" })}><LogOut size={16} /> Leave Trip</Button> : null}
      </div>

      <label className="relative mt-5 block">
        <Search className="absolute left-3 top-3 size-4 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email or phone" className="h-10 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none focus:border-brand-500" />
      </label>
      {error ? <p className="mt-4 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</p> : null}

      <div className="mt-4 space-y-2">
        {loading ? <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin text-brand-600" /></div> : members.length ? members.map((member) => {
          const canManage = isLeader && member.user_id !== currentUserId && member.role !== "leader" && member.status === "active";
          return (
            <div key={member.group_trip_member_id ?? member.user_id} className="flex flex-col gap-3 rounded-lg border border-slate-100 p-3 sm:flex-row sm:items-center">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-slate-100 font-bold text-slate-600">{initials(member.name)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold">{memberName(member)}</p>{member.role === "leader" ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700"><Crown size={12} /> Leader</span> : null}</div>
                <p className="mt-1 truncate text-sm text-slate-500">{[member.email, member.phone].filter(Boolean).join(" · ") || `User #${member.user_id}`}</p>
              </div>
              {canManage ? <div className="flex gap-2"><Button variant="outline" className="h-9 px-3" onClick={() => setPendingAction({ type: "leader", member })}><ShieldCheck size={15} /> Make Leader</Button><Button variant="outline" className="h-9 border-rose-200 px-3 text-rose-600" onClick={() => setPendingAction({ type: "remove", member })}><Trash2 size={15} /> Remove</Button></div> : null}
            </div>
          );
        }) : <div className="py-10 text-center text-sm text-slate-500"><UserRound className="mx-auto mb-2 size-7" />No active members found.</div>}
      </div>

      {!loading && pageCount > 1 ? <Pagination page={page} pageCount={pageCount} totalItems={total} pageSize={limit} itemLabel="members" onPageChange={setPage} /> : null}
      {pendingAction ? <ConfirmDialog title={dialogTitle(pendingAction)} message={dialogMessage(pendingAction)} confirmLabel={working ? "Processing..." : dialogConfirm(pendingAction)} onCancel={() => { if (!working) setPendingAction(null); }} onConfirm={() => void confirmAction()} /> : null}
    </section>
  );
}

function memberName(member: GroupTripMember) { return member.name?.trim() || `User #${member.user_id}`; }
function initials(name?: string | null) { return name?.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase() || "U"; }
function dialogTitle(action: Exclude<PendingAction, null>) { return action.type === "leave" ? "Leave this trip?" : action.type === "remove" ? "Remove member?" : "Change trip leader?"; }
function dialogMessage(action: Exclude<PendingAction, null>) { return action.type === "leave" ? "You will lose access to this Group Trip. You need a new invitation to join again." : action.type === "remove" ? `${memberName(action.member)} will be removed from this Group Trip.` : `Transfer all leader permissions to ${memberName(action.member)}? You will become a regular member.`; }
function dialogConfirm(action: Exclude<PendingAction, null>) { return action.type === "leave" ? "Leave Trip" : action.type === "remove" ? "Remove" : "Change Leader"; }
function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
