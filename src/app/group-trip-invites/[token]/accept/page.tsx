"use client";

import { useParams } from "next/navigation";
import { AcceptGroupTripInvite } from "@/components/group-trips/accept-group-trip-invite";

export default function LegacyGroupTripInvitePage() {
  const { token } = useParams<{ token: string }>();
  return <AcceptGroupTripInvite token={token} />;
}
