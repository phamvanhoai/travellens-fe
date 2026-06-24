"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, ChevronDown, Globe2, Heart, Moon, ShieldCheck, Sparkles, Sun, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { getDefaultRouteForRole } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { destinations, tours } from "@/lib/data";
import { useAuthStore } from "@/store/use-auth-store";
import { getAvatarImageSrc } from "@/lib/avatar";

const nav = [
  { href: "/", label: "Home" },
  { href: "/destinations", label: "Destinations" },
  { href: "/tours", label: "Tours" },
  { href: "/maps/travel", label: "Travel Map" },
  { href: "/view360", label: "360 Experience" },
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

  useEffect(() => {
    const savedTheme = localStorage.getItem("travel360-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextTheme = savedTheme === "dark" || (!savedTheme && prefersDark) ? "dark" : "light";

    setTheme(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");

    // Load user from localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user", e);
      }
    }
  }, []);

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
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span className="grid size-9 place-items-center rounded-full bg-brand-600 text-white">
            <ShieldCheck size={20} />
          </span>
          Travel<span className="text-brand-600">360</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-semibold lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative py-7 text-slate-700 hover:text-brand-600",
                pathname === item.href && "text-brand-600 after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand-600"
              )}
            >
              {item.label}
              {item.href === "/ai" ? <Sparkles className="ml-1 inline size-3 text-amber-400" /> : null}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <div ref={languageRef} className="relative hidden sm:block">
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
            className="hidden size-10 place-items-center rounded-full border border-slate-200 text-slate-700 sm:grid"
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
              <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">3</span>
            </button>
            {wishlistOpen ? (
              <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <div>
                    <p className="font-bold text-ink">Wishlist</p>
                    <p className="text-xs text-slate-500">Saved trips and tours</p>
                  </div>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-600">3 saved</span>
                </div>
                <div className="max-h-80 overflow-auto p-2">
                  {[
                    { title: `${destinations[0].name}, ${destinations[0].country}`, image: destinations[0].image, meta: "Destination" },
                    { title: tours[0].title, image: tours[0].image, meta: "Tour" },
                    { title: `${destinations[2].name}, ${destinations[2].country}`, image: destinations[2].image, meta: "Destination" }
                  ].map((item) => (
                    <div key={item.title} className="flex items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                      <img src={item.image} alt="" className="size-14 rounded-md object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-ink">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.meta}</p>
                      </div>
                      <button className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-white hover:text-rose-500" aria-label="Remove from wishlist">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-100 p-3">
                  <Button href="/dashboard/saved" className="w-full" onClick={() => setWishlistOpen(false)}>
                    View Saved
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
          
          {user ? (
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
                <span className="hidden max-w-[120px] truncate sm:inline-block">{user.name}</span>
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
              <Button href="/register" className="h-10 px-4">
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
