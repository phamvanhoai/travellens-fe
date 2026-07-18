"use client";

import axios from "axios";
import { CalendarDays, CheckCircle2, Loader2, MailCheck, MapPin, Users, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { groupTripService, type GroupTripTokenInvitation } from "@/services/group-trip.service";

export function AcceptGroupTripInvite({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "loading" | "success" | "unavailable" | "error">("checking");
  const [message, setMessage] = useState("");
  const [tripId, setTripId] = useState<number | null>(null);
  const [invitation, setInvitation] = useState<GroupTripTokenInvitation | null>(null);

  useEffect(() => {
    let active = true;
    async function checkInvitation() {
      if (!token) {
        setStatus("error");
        setMessage("The invitation token is missing from this link.");
        return;
      }
      setStatus("checking");
      try {
        const result = await groupTripService.inviteByToken(token);
        if (!active) return;
        setInvitation(result);
        setTripId(Number(result.group_trip?.group_trip_id ?? 0) || null);
        if (result.status === "pending" && result.can_accept === true) {
          setStatus("ready");
          setMessage("This invitation is ready to accept.");
        } else {
          setStatus("unavailable");
          setMessage(result.unavailable_reason || `This invitation is ${result.status}.`);
        }
      } catch (error) {
        if (!active) return;
        setStatus("error");
        setMessage(apiError(error, "This invitation does not exist or you do not have access to it."));
      }
    }
    void checkInvitation();
    return () => { active = false; };
  }, [token]);

  async function accept() {
    setStatus("loading");
    setMessage("");
    try {
      const response = await groupTripService.acceptInvite(token);
      const data = response?.data ?? response;
      const id = Number(data?.group_trip_id ?? data?.groupTripId ?? 0) || null;
      setTripId(id);
      setStatus("success");
      setMessage(response?.message ?? "You have joined the Group Trip successfully.");
      if (id) window.setTimeout(() => router.replace(`/dashboard/group-trips/${id}`), 1200);
    } catch (error) {
      setStatus("error");
      setMessage(apiError(error, "This invitation is invalid, expired, or cannot be accepted."));
    }
  }

  return (
    <AuthGuard allowedRoles={["customer"]}>
      <section className="grid min-h-[560px] place-items-center bg-mist px-4 py-12">
        <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
          <span className={`mx-auto grid size-16 place-items-center rounded-full ${status === "error" || status === "unavailable" ? "bg-rose-50 text-rose-600" : status === "success" ? "bg-emerald-50 text-emerald-600" : "bg-brand-50 text-brand-600"}`}>
            {status === "loading" || status === "checking" ? <Loader2 className="size-8 animate-spin" /> : status === "success" ? <CheckCircle2 size={32} /> : status === "error" || status === "unavailable" ? <XCircle size={32} /> : <MailCheck size={32} />}
          </span>
          <h1 className="mt-5 text-2xl font-bold">Group Trip Invitation</h1>
          {status === "checking" ? <p className="mt-3 text-sm leading-6 text-slate-600">Checking invitation status...</p> : <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>}
          {invitation?.group_trip ? <div className="mt-5 rounded-lg bg-slate-50 p-4 text-left"><h2 className="font-bold text-ink">{invitation.group_trip.name || `Group Trip #${invitation.group_trip.group_trip_id}`}</h2>{invitation.group_trip.description ? <p className="mt-1 text-sm text-slate-500">{invitation.group_trip.description}</p> : null}<div className="mt-3 grid gap-2 text-sm text-slate-600">{invitation.group_trip.destination_name ? <span className="flex items-center gap-2"><MapPin size={15} />{invitation.group_trip.destination_name}</span> : null}{invitation.group_trip.start_date ? <span className="flex items-center gap-2"><CalendarDays size={15} />{invitation.group_trip.start_date}{invitation.group_trip.end_date ? ` — ${invitation.group_trip.end_date}` : ""}</span> : null}<span className="flex items-center gap-2"><Users size={15} />{invitation.group_trip.member_count ?? 0}{invitation.group_trip.max_members ? ` / ${invitation.group_trip.max_members}` : ""} members</span></div></div> : null}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {status === "ready" ? <Button onClick={() => void accept()}>Accept Invitation</Button> : null}
            {status === "success" ? <Button onClick={() => router.push(tripId ? `/dashboard/group-trips/${tripId}` : "/dashboard/group-trips")}>View Group Trips</Button> : null}
            <Button href="/dashboard/group-trips" variant="outline">Back to Trips</Button>
          </div>
        </div>
      </section>
    </AuthGuard>
  );
}

function apiError(error: unknown, fallback: string) { if (!axios.isAxiosError(error)) return fallback; const data = error.response?.data as { message?: string; error?: string } | undefined; return data?.message ?? data?.error ?? fallback; }
