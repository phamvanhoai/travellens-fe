"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Globe2, Heart, Menu, Moon, ShieldCheck, Sparkles, Sun, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getDefaultRouteForRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { destinations, tours } from "@/lib/data";
import { useAuthStore } from "@/store/use-auth-store";
import { getAvatarImageSrc } from "@/lib/avatar";
import { useSavedItemsStore } from "@/store/use-saved-items-store";
import { authService } from "@/services/auth.service";
import { HeaderWishlistDropdown } from "./header-wishlist-dropdown";

const nav = [
  { href: "/", label: "Home" },
  { href: "/destinations", label: "Destinations" },
  { href: "/tours", label: "Tours" },
  { href: "/group-trips", label: "Group Trips" },
  { href: "/maps/travel", label: "Travel Map" },
  { href: "/travel-feed", label: "Travel Feed" },
  { href: "/blogs", label: "Blogs" },
  { href: "/ai", label: "AI Assistant" }
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [language, setLanguage] = useState("EN");
  const [languageOpen, setLanguageOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const languageRef = useRef<HTMLDivElement>(null);
  const wishlistRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const { user, setUser, logout } = useAuthStore();
  const avatarSrc = getAvatarImageSrc(user?.avatar_url);
  const adminDashboardTarget = pathname.startsWith("/admin") ? { href: "/staff", label: "Staff Dashboard" } : { href: "/admin", label: "Admin Dashboard" };
  const dashboardTarget = user?.role === "admin"
    ? adminDashboardTarget
    : user?.role === "staff"
      ? { href: "/staff", label: "Staff Workspace" }
      : { href: getDefaultRouteForRole(user?.role), label: "User Dashboard" };

  const { init, initialized } = useSavedItemsStore();

  useEffect(() => {
    if (user && !initialized) {
      init();
    }
  }, [user, initialized, init]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("travel360-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");

    let active = true;

    async function restoreAuthenticatedUser() {
      const token = localStorage.getItem("travel360_token") ?? localStorage.getItem("token");
      if (!token) {
        localStorage.removeItem("user");
        if (active) {
          setUser(null);
          setAuthChecking(false);
        }
        return;
      }

      try {
        const response = await authService.getProfile();
        if (!active) return;

        const responseData = response.data as any;
        const candidates = [responseData?.data?.user, responseData?.data, responseData?.user, responseData];
        const authenticatedUser = candidates.find((candidate) => (
          candidate && typeof candidate === "object" && ("user_id" in candidate || "email" in candidate || "role" in candidate)
        ));

        if (!authenticatedUser) throw new Error("Invalid profile response");
        localStorage.setItem("user", JSON.stringify(authenticatedUser));
        setUser(authenticatedUser);
      } catch {
        if (!active) return;
        logout();
      } finally {
        if (active) setAuthChecking(false);
      }
    }

    function handleUnauthorized() {
      if (active) {
        setUser(null);
        setAuthChecking(false);
      }
    }

    window.addEventListener("travel360:unauthorized", handleUnauthorized);
    void restoreAuthenticatedUser();

    return () => {
      active = false;
      window.removeEventListener("travel360:unauthorized", handleUnauthorized);
    };
  }, [logout, setUser]);

  useEffect(() => {
    function closeDropdowns(event: MouseEvent) {
      const target = event.target as Node;

      if (!languageRef.current?.contains(target)) setLanguageOpen(false);
      if (!wishlistRef.current?.contains(target)) setWishlistOpen(false);
      if (!userMenuRef.current?.contains(target)) setUserMenuOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setLanguageOpen(false);
      setWishlistOpen(false);
      setUserMenuOpen(false);
    }

    document.addEventListener("mousedown", closeDropdowns);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeDropdowns);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";

    setTheme(nextTheme);
    localStorage.setItem("travel360-theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  }

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-[#07111f]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8 xl:grid xl:h-28 xl:grid-cols-[auto_1fr_auto] xl:grid-rows-[64px_48px]">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-xl font-bold xl:col-start-1 xl:row-start-1">
          <span className="grid size-9 place-items-center rounded-full bg-brand-600 text-white">
            <ShieldCheck size={20} />
          </span>
          Travel<span className="text-brand-600">360</span>
        </Link>
        <nav className="hidden min-w-0 items-center gap-8 border-t border-slate-100 text-sm font-semibold dark:border-slate-700 xl:col-span-3 xl:col-start-1 xl:row-start-2 xl:flex xl:h-12 xl:justify-center">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-12 items-center text-slate-700 hover:text-brand-600 dark:text-slate-200",
                isNavActive(pathname, item.href) && "text-brand-600 dark:text-brand-400"
              )}
            >
              <span className={cn("inline-flex items-center border-b-2 border-transparent px-0.5 pb-1 leading-none", isNavActive(pathname, item.href) && "border-brand-600 dark:border-brand-400")}>{item.label}{item.href === "/ai" ? <Sparkles className="ml-1 inline size-3 text-amber-400" /> : null}</span>
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2 xl:col-start-3 xl:row-start-1">
          <div ref={languageRef} className="relative hidden xl:block">
            <button
              onClick={() => setLanguageOpen((open) => !open)}
              className="flex h-10 items-center gap-2 rounded-full border border-slate-200 px-3 text-sm font-semibold text-slate-700"
              aria-label="Select language"
              aria-expanded={languageOpen}
            >
              <Globe2 size={17} />
              {language}
              <ChevronDown size={14} className={cn("transition", languageOpen && "rotate-180")} />
            </button>
            {languageOpen ? (
              <div className="absolute right-0 top-12 z-50 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-soft">
                {[
                  ["EN", "English"],
                  ["VI", "Tiếng Việt"],
                  ["JP", "Japanese"]
                ].map(([code, label]) => (
                  <button
                    key={code}
                    onClick={() => {
                      setLanguage(code);
                      setLanguageOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-600"
                  >
                    <span>{label}</span>
                    {language === code ? <Check size={15} /> : null}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button
            onClick={toggleTheme}
            className="hidden size-10 place-items-center rounded-full border border-slate-200 text-slate-700 xl:grid"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <div ref={wishlistRef} className="relative hidden md:block">
            <button
              onClick={() => setWishlistOpen((open) => !open)}
              className="relative grid size-10 place-items-center rounded-full border border-slate-200 text-slate-700"
              aria-label="Open wishlist"
              aria-expanded={wishlistOpen}
            >
              <Heart size={17} />
              {(useSavedItemsStore.getState().savedTours.length + useSavedItemsStore.getState().savedDestinations.length) > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                  {useSavedItemsStore.getState().savedTours.length + useSavedItemsStore.getState().savedDestinations.length}
                </span>
              )}
            </button>
            {wishlistOpen ? <HeaderWishlistDropdown onClose={() => setWishlistOpen(false)} /> : null}
          </div>
          
          {authChecking ? (
            <div className="flex h-10 items-center gap-2 rounded-full border border-slate-200 px-2 pr-4" aria-label="Restoring signed-in session">
              <span className="size-8 animate-pulse rounded-full bg-slate-200" />
              <span className="hidden h-3 w-20 animate-pulse rounded bg-slate-200 sm:block" />
            </div>
          ) : user ? (
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex h-10 items-center gap-2 rounded-full border border-slate-200 p-1 pr-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user.name} className="size-8 rounded-full object-cover" />
                ) : (
                  <div className="grid size-8 place-items-center rounded-full bg-brand-100 font-bold text-brand-600">
                    {user.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <span className="hidden max-w-[120px] truncate xl:inline-block">{user.name}</span>
                <ChevronDown size={14} className={cn("transition", userMenuOpen && "rotate-180")} />
              </button>
              
              {userMenuOpen ? (
                <div className="absolute right-0 top-12 z-50 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-soft">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="truncate text-sm font-bold text-ink">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Link
                    href={dashboardTarget.href}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    {dashboardTarget.label}
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-600"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <div className="my-1 h-px bg-slate-100"></div>
                  <button
                    onClick={handleLogout}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <Button href="/login" variant="outline" className="hidden h-10 px-4 md:inline-flex">
                Sign In
              </Button>
              <Button href="/register" className="hidden h-10 px-4 md:inline-flex">
                Sign Up
              </Button>
            </>
          )}
          <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} className="grid size-10 place-items-center rounded-full border border-slate-200 text-slate-700 xl:hidden" aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileMenuOpen}>{mobileMenuOpen ? <X size={19} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {mobileMenuOpen ? <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg dark:border-slate-700 dark:bg-[#07111f] xl:hidden"><div className="mx-auto max-w-7xl"><nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-4">{nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)} className={cn("flex h-11 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-600 dark:text-slate-200", pathname === item.href && "bg-brand-50 text-brand-600")}>{item.label}{item.href === "/ai" ? <Sparkles className="ml-1 size-3 text-amber-400" /> : null}</Link>)}</nav><div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-700"><button type="button" onClick={toggleTheme} className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 dark:text-slate-200">{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}{theme === "dark" ? "Light mode" : "Dark mode"}</button><div className="flex rounded-lg border border-slate-200 p-1">{["EN", "VI", "JP"].map((code) => <button key={code} type="button" onClick={() => setLanguage(code)} className={cn("h-8 rounded-md px-3 text-xs font-bold", language === code ? "bg-brand-600 text-white" : "text-slate-600 dark:text-slate-300")}>{code}</button>)}</div>{!authChecking && !user ? <div className="ml-auto flex gap-2"><Button href="/login" variant="outline" className="h-10">Sign In</Button><Button href="/register" className="h-10">Sign Up</Button></div> : null}</div></div></div> : null}
    </header>
  );
}

function isNavActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));
}
