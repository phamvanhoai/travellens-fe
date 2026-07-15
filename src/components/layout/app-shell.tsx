"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeftRight, ExternalLink, LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import { Chatbot } from "@/components/common/chatbot";
import { getAvatarImageSrc } from "@/lib/avatar";
import { useAuthStore } from "@/store/use-auth-store";
import { Footer } from "./footer";
import { Header } from "./header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/staff" || pathname.startsWith("/staff/");

  if (isDashboard) {
    return (
      <>
        <DashboardHeader workspace={pathname === "/admin" || pathname.startsWith("/admin/") ? "Admin" : "Staff"} />
        <main>{children}</main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
      <Chatbot />
    </>
  );
}

function DashboardHeader({ workspace }: { workspace: "Admin" | "Staff" }) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const avatarSrc = getAvatarImageSrc(user?.avatar_url);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("travel360-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("travel360-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-[#07111f]/95">
      <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold text-ink">
            <span className="grid size-9 place-items-center rounded-full bg-brand-600 text-white">
              <ShieldCheck size={19} />
            </span>
            <span className="hidden sm:inline">Travel<span className="text-brand-600">360</span></span>
          </Link>
          <span className="h-7 w-px bg-slate-200" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-800">{workspace} Workspace</p>
            <p className="hidden truncate text-xs text-slate-500 sm:block">Management dashboard</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user?.role === "admin" ? (
            <Link
              href={workspace === "Admin" ? "/staff" : "/admin"}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
            >
              <ArrowLeftRight size={15} />
              <span className="hidden lg:inline">{workspace === "Admin" ? "Staff Workspace" : "Admin Workspace"}</span>
            </Link>
          ) : null}
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
          >
            <ExternalLink size={15} />
            <span className="hidden sm:inline">View website</span>
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-brand-500 hover:text-brand-600"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 md:flex">
            {avatarSrc ? (
              <img src={avatarSrc} alt={user?.name ?? "Account"} className="size-9 rounded-full object-cover" />
            ) : (
              <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {(user?.name ?? user?.email ?? workspace).charAt(0).toUpperCase()}
              </span>
            )}
            <div className="max-w-40">
              <p className="truncate text-sm font-bold text-slate-700">{user?.name ?? user?.email ?? "Checking account"}</p>
              <p className="text-xs capitalize text-slate-500">{user?.role ?? workspace}</p>
            </div>
          </div>
          <button type="button" onClick={handleLogout} className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600" title="Log out" aria-label="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
