"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getDefaultRouteForRole } from "@/lib/auth";
import { useAuthStore } from "@/store/use-auth-store";

export default function GroupTripsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user && user.role !== "customer") {
      router.replace(getDefaultRouteForRole(user.role));
    }
  }, [router, user]);

  if (!user || user.role !== "customer") return null;
  return <>{children}</>;
}
