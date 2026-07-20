"use client";

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
    const isStandaloneInvitation = pathname.startsWith("/group-trip-invites") || pathname.startsWith("/group-trips/invites");

    if (isStandaloneInvitation) {
      return (
        <section className="grid min-h-[560px] place-items-center bg-mist px-4 py-12" aria-label="Loading invitation" aria-busy="true">
          <div className="w-full max-w-lg animate-pulse rounded-xl border border-slate-200 bg-white p-8 text-center shadow-soft">
            <div className="mx-auto size-16 rounded-full bg-slate-200" />
            <div className="mx-auto mt-5 h-8 w-64 max-w-full rounded bg-slate-200" />
            <div className="mx-auto mt-3 h-4 w-80 max-w-full rounded bg-slate-100" />
            <div className="mt-5 rounded-lg bg-slate-50 p-4 text-left">
              <div className="h-5 w-48 rounded bg-slate-200" />
              <div className="mt-3 h-4 w-full rounded bg-slate-100" />
              <div className="mt-2 h-4 w-3/4 rounded bg-slate-100" />
              <div className="mt-5 grid gap-2">
                <div className="h-4 w-44 rounded bg-slate-200" />
                <div className="h-4 w-56 rounded bg-slate-200" />
              </div>
            </div>
            <div className="mx-auto mt-7 flex max-w-xs gap-3">
              <div className="h-11 flex-1 rounded-lg bg-slate-200" />
              <div className="h-11 flex-1 rounded-lg bg-slate-100" />
            </div>
          </div>
        </section>
      );
    }

    const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
    const isAdminOverview = pathname === "/admin";
    const sidebarRows = isAdmin ? 19 : 6;

    return (
      <section className="min-h-[760px] bg-mist" aria-label="Loading account" aria-busy="true">
        <div className="mx-auto grid min-h-[760px] w-full max-w-[1600px] animate-pulse gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
          <aside className="hidden h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm lg:block">
            <div className="h-7 w-44 rounded bg-slate-200" />
            <div className="mt-3 grid gap-1">
              {Array.from({ length: sidebarRows }, (_, index) => <div key={index} className="h-10 rounded-lg bg-slate-100" />)}
            </div>
          </aside>
          {isAdminOverview ? (
            <div className="min-w-0">
              <div className="h-9 w-72 max-w-full rounded bg-slate-200" />
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[126px] rounded-lg border border-slate-200 bg-white shadow-sm" />)}
              </div>
              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                {Array.from({ length: 2 }, (_, index) => <div key={index} className="h-[390px] rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><div className="h-5 w-36 rounded bg-slate-200" /><div className="mt-8 h-[290px] rounded bg-slate-50" /></div>)}
              </div>
            </div>
          ) : (
            <div className="min-h-[680px] min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="h-8 w-64 max-w-full rounded bg-slate-200" />
              <div className="mt-3 h-4 w-96 max-w-full rounded bg-slate-100" />
              <div className="mt-7 h-11 rounded-lg bg-slate-100" />
              <div className="mt-6 grid gap-4"><div className="h-12 rounded bg-slate-100" />{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-16 rounded border-t border-slate-100 bg-slate-50" />)}</div>
            </div>
          )}
        </div>
      </section>
    );
  }

  return <>{children}</>;
}
