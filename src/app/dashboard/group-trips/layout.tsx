"use client";

import { AuthGuard } from "@/components/auth/auth-guard";

export default function GroupTripsLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={["customer"]}>{children}</AuthGuard>;
}
