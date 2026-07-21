"use client";

import { CalendarCheck, CreditCard, MessageSquareText, Percent, RotateCcw } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const links = [
  [Percent, "Coupons", "/staff/coupons"],
  [CalendarCheck, "Bookings", "/staff/bookings"],
  [MessageSquareText, "Reviews", "/staff/reviews"],
  [CreditCard, "Payments", "/staff/payments"],
  [RotateCcw, "Refund Requests", "/staff/refund-requests"]
] as const;

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["admin", "staff"]}>
      <section className="bg-mist">
        <div className="mx-auto grid min-h-[760px] w-full max-w-[1600px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
          <SidebarNav title="Staff Workspace" links={links} />
          <div className="min-w-0">{children}</div>
        </div>
      </section>
    </AuthGuard>
  );
}
