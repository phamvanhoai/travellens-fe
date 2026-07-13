"use client";

import { useEffect, useState } from "react";
import { Loader2, UserX } from "lucide-react";
import { useToast } from "@/components/common/toast";
import {
  getTravelFeedBlockedUserId,
  getTravelFeedBlockedUserName,
  travelFeedService,
  type TravelFeedBlockedUser
} from "@/services/travel-feed.service";

export default function BlockedUsersPage() {
  const showToast = useToast();
  const [items, setItems] = useState<TravelFeedBlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBlockedUsers() {
      setLoading(true);
      setError("");

      try {
        const users = await travelFeedService.listBlockedUsers({ page: 1, limit: 100 });
        if (active) setItems(users);
      } catch (err) {
        if (!active) return;
        const message = getBlockedUsersError(err);
        setError(message);
        showToast({ variant: "error", title: "Load failed", description: message });
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBlockedUsers();

    return () => {
      active = false;
    };
  }, [showToast]);

  async function unblock(item: TravelFeedBlockedUser) {
    const userId = getTravelFeedBlockedUserId(item);
    if (!userId) return;

    setBusyUserId(userId);
    setError("");

    try {
      await travelFeedService.unblockUser(userId);
      setItems((current) => current.filter((blocked) => getTravelFeedBlockedUserId(blocked) !== userId));
      showToast({ variant: "success", title: "User unblocked", description: `${getTravelFeedBlockedUserName(item)} can appear in your travel feed again.` });
    } catch (err) {
      const message = getUnblockUserError(err);
      setError(message);
      showToast({ variant: "error", title: "Unblock failed", description: message });
    } finally {
      setBusyUserId(null);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blocked Users</h1>
          <p className="mt-1 text-sm text-slate-500">Review and unblock users hidden from your travel feed.</p>
        </div>
        {loading ? (
          <span className="inline-flex h-10 items-center gap-2 text-sm font-semibold text-slate-500">
            <Loader2 className="size-4 animate-spin" /> Loading
          </span>
        ) : null}
      </div>

      {error ? <div className="mt-5 rounded-lg bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div> : null}

      <div className="mt-6">
        {loading ? (
          <div className="grid min-h-64 place-items-center rounded-lg bg-slate-50 text-sm font-semibold text-slate-500">
            <span><Loader2 className="mr-2 inline size-5 animate-spin text-brand-600" />Loading blocked users...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="grid min-h-64 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center">
            <div>
              <UserX className="mx-auto size-8 text-slate-400" />
              <p className="mt-3 font-bold text-ink">No blocked users</p>
              <p className="mt-1 text-sm text-slate-500">Users you block from Travel Feed will appear here.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const userId = getTravelFeedBlockedUserId(item);
              const busy = busyUserId === userId;

              return (
                <div key={userId || getTravelFeedBlockedUserName(item)} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-ink">{getTravelFeedBlockedUserName(item)}</p>
                    {userId ? <p className="mt-1 text-xs font-semibold text-slate-400">User #{userId}</p> : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => void unblock(item)}
                    disabled={busy || !userId}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold transition hover:border-brand-600 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                    Unblock
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getBlockedUsersError(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string; error?: string } } }).response;
    if (response?.status === 401) return "Please sign in with a customer account to view blocked users.";
    if (response?.status === 403) return "Only customer accounts can view blocked users.";
    return response?.data?.message ?? response?.data?.error ?? "Cannot load blocked users.";
  }

  return "Cannot load blocked users.";
}

function getUnblockUserError(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string; error?: string } } }).response;
    if (response?.status === 400) return response.data?.message ?? "You cannot unblock yourself.";
    if (response?.status === 401) return "Please sign in with a customer account to unblock users.";
    if (response?.status === 403) return "Only customer accounts can unblock users.";
    if (response?.status === 404) return "This customer was not found.";
    return response?.data?.message ?? response?.data?.error ?? "Cannot unblock this user.";
  }

  return "Cannot unblock this user.";
}
