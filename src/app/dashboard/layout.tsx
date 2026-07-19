"use client";

import { CalendarCheck, CreditCard, Heart, KeyRound, MapPinned, MessageSquareText, Newspaper, UserRound, UserX } from "lucide-react";
import { ShieldAlert } from "lucide-react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/use-auth-store";

const links = [
  [UserRound, "Profile", "/dashboard/profile"],
  [CalendarCheck, "Bookings", "/dashboard/bookings"],
  [MapPinned, "Group Trips", "/dashboard/group-trips"],
  [CreditCard, "Payments", "/dashboard/payments"],
  [MessageSquareText, "Reviews", "/dashboard/reviews"],
  [Newspaper, "Travel Stories", "/dashboard/travel-stories"],
  [Heart, "Saved", "/dashboard/saved"],
  [UserX, "Blocked Users", "/dashboard/blocked-users"],
  [KeyRound, "Change Password", "/dashboard/change-password"]
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["admin", "staff", "customer"]}>
      <section className="bg-mist">
        <div className="mx-auto grid min-h-[720px] max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
          <SidebarNav title="User Dashboard" links={links} />
          <DashboardRoleGate>{children}</DashboardRoleGate>
        </div>
      </section>
    </AuthGuard>
  );
}

const customerOnlySections: Array<{ path: string; name: string }> = [
  { path: "/dashboard/bookings", name: "Customer Bookings" },
  { path: "/dashboard/payments", name: "Customer Payments" },
  { path: "/dashboard/group-trips", name: "Group Trips" },
  { path: "/dashboard/group-trip-invitations", name: "Group Trip Invitations" },
  { path: "/dashboard/travel-stories", name: "My Travel Stories" },
  { path: "/dashboard/blogs", name: "My Travel Stories" },
  { path: "/dashboard/blocked-users", name: "Blocked Travel Feed Users" }
];

function DashboardRoleGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const role = String(user?.role ?? "").toLowerCase();
  const restricted = customerOnlySections.find((section) => pathname === section.path || pathname.startsWith(`${section.path}/`));

  if (restricted && role && role !== "customer") {
    const workspace = role === "admin" ? "/admin" : "/staff";
    const roleLabel = role === "admin" ? "Admin" : "Staff";
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-8 text-center shadow-sm"><ShieldAlert className="mx-auto size-11 text-amber-600" /><h1 className="mt-4 text-2xl font-bold text-amber-950">Customer-only feature</h1><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-amber-800"><strong>{restricted.name}</strong> is available only to customer accounts. Your {roleLabel.toLowerCase()} account can use the relevant viewing or management tools from the {roleLabel} workspace.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button href={workspace}>Open {roleLabel} Workspace</Button><Button href="/" variant="outline">Back to Home</Button></div></div>;
  }

  return <div>{children}</div>;
}
