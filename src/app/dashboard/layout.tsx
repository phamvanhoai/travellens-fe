"use client";

import { CalendarCheck, CreditCard, Heart, KeyRound, MessageSquareText, Newspaper, UserRound } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const links = [
  [UserRound, "Profile", "/dashboard/profile"],
  [CalendarCheck, "Bookings", "/dashboard/bookings"],
  [CreditCard, "Payments", "/dashboard/payments"],
  [MessageSquareText, "Reviews", "/dashboard/reviews"],
  [Newspaper, "Travel Stories", "/dashboard/blogs"],
  [Heart, "Saved", "/dashboard/saved"],
  [KeyRound, "Change Password", "/dashboard/change-password"]
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["admin", "staff", "customer"]}>
      <section className="bg-mist">
        <div className="mx-auto grid min-h-[720px] max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
          <SidebarNav title="User Dashboard" links={links} />
          <div>{children}</div>
        </div>
      </section>
    </AuthGuard>
  );
}
