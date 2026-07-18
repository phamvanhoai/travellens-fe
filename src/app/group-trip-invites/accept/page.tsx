import { AcceptGroupTripInvite } from "@/components/group-trips/accept-group-trip-invite";

export default async function AcceptGroupTripInvitePage({
  searchParams
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;

  return <AcceptGroupTripInvite token={token?.trim() ?? ""} />;
}
