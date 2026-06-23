"use client";

import { CalendarCheck, CreditCard, MessageSquareText, Percent, ReceiptText } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const links = [
  [Percent, "Coupons", "/staff/coupons"],
  [CalendarCheck, "Bookings", "/staff/bookings"],
  [ReceiptText, "Booking Details", "/staff/booking-details"],
  [MessageSquareText, "Reviews", "/staff/reviews"],
  [CreditCard, "Payments", "/staff/payments"]
] as const;

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["admin", "staff"]}>
      <section className="bg-mist">
        <div className="mx-auto grid min-h-[760px] max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
          <SidebarNav title="Staff Workspace" links={links} />
          <div>{children}</div>
        </div>
      </section>
    </AuthGuard>
  );
}
