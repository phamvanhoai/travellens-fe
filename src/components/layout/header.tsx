"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2, Heart, ShieldCheck, Sparkles, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home" },
  { href: "/destinations", label: "Destinations" },
  { href: "/tours", label: "Tours" },
  { href: "/view360", label: "360 Experience" },
  { href: "/blogs", label: "Blogs" },
  { href: "/ai", label: "AI Assistant" }
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/92 backdrop-blur">
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
          <button className="hidden size-10 place-items-center rounded-full border border-slate-200 text-slate-700 sm:grid" aria-label="Language">
            <Globe2 size={17} />
          </button>
          <button className="hidden size-10 place-items-center rounded-full border border-slate-200 text-slate-700 sm:grid" aria-label="Theme">
            <Sun size={17} />
          </button>
          <button className="hidden size-10 place-items-center rounded-full border border-slate-200 text-slate-700 md:grid" aria-label="Wishlist">
            <Heart size={17} />
          </button>
          <Button href="/login" variant="outline" className="hidden h-10 px-4 md:inline-flex">
            Sign In
          </Button>
          <Button href="/register" className="h-10 px-4">
            Sign Up
          </Button>
        </div>
      </div>
    </header>
  );
}
