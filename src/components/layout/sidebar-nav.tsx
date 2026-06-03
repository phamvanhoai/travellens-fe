"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SidebarLink = readonly [LucideIcon, string, string];

export function SidebarNav({ title, links }: { title: string; links: readonly SidebarLink[] }) {
  const pathname = usePathname();

  return (
    <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="px-3 pb-3 text-lg font-bold">{title}</h2>
      <nav className="grid gap-1">
        {links.map(([Icon, label, href]) => {
          const active = href === "/admin" || href === "/staff" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                active
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-brand-50 hover:text-brand-600"
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
