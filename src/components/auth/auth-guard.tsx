"use client";

import { Loader2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/use-auth-store";
import { canAccessRole, getDefaultRouteForRole, type UserRole } from "@/lib/auth";

type AuthGuardProps = {
  allowedRoles: readonly UserRole[];
  children: React.ReactNode;
};

function normalizeUser(responseData: any, fallback: any = {}) {
  const candidates = [responseData?.data?.user, responseData?.data, responseData?.user, responseData];
  const user = candidates.find((candidate) => {
    return Boolean(candidate && typeof candidate === "object" && ("user_id" in candidate || "email" in candidate || "role" in candidate));
  });

  return {
    ...fallback,
    ...(user ?? {})
  };
}

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") ?? "{}");
  } catch {
    return {};
  }
}

function clearAuthStorage() {
  localStorage.removeItem("user");
  localStorage.removeItem("travel360_token");
  localStorage.removeItem("token");
}

export function AuthGuard({ allowedRoles, children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;

    async function checkAccount() {
      const token = localStorage.getItem("travel360_token") ?? localStorage.getItem("token");

      if (!token) {
        clearAuthStorage();
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        const response = await authService.getProfile();
        if (!active) return;

        const user = normalizeUser(response.data, getStoredUser());
        if (!canAccessRole(user.role, allowedRoles)) {
          setUser(user);
          localStorage.setItem("user", JSON.stringify(user));
          router.replace(getDefaultRouteForRole(user.role));
          return;
        }

        setUser(user);
        localStorage.setItem("user", JSON.stringify(user));
        setChecking(false);
      } catch {
        if (!active) return;
        clearAuthStorage();
        setUser(null);
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      }
    }

    void checkAccount();

    return () => {
      active = false;
    };
  }, [allowedRoles, pathname, router, setUser]);

  if (checking) {
    return (
      <section className="grid min-h-[520px] place-items-center bg-mist px-4">
        <div className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-sm">
          <Loader2 className="size-5 animate-spin text-brand-600" />
          Checking account access
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
