"use client";

import { BarChart3, CalendarCheck, CreditCard, Images, Map, MessageSquareText, Newspaper, Plane, Rss, Tags, Users, Video } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { SidebarNav } from "@/components/layout/sidebar-nav";

const links = [
  [BarChart3, "Overview", "/admin"],
  [Tags, "Destination Categories", "/admin/destination-categories"],
  [Plane, "Destinations", "/admin/travel-destinations"],
  [Tags, "Tour Categories", "/admin/tour-categories"],
  [Plane, "Tours", "/admin/tours"],
  [Map, "Locations", "/admin/locations"],
  [Video, "View360", "/admin/view360"],
  [Images, "Maps", "/admin/maps"],
  [CalendarCheck, "Bookings", "/admin/bookings"],
  [CreditCard, "Payments", "/admin/payments"],
  [Newspaper, "Blogs", "/admin/blogs"],
  [Tags, "Blog Categories", "/admin/blog-categories"],
  [Rss, "Travel Feed", "/admin/travel-feed"],
  [MessageSquareText, "Feed Comments", "/admin/travel-feed/comments"],
  [MessageSquareText, "Reviews", "/admin/reviews"],
  [Users, "Users", "/admin/users"],
  [BarChart3, "Statistics", "/admin/statistics"]
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <section className="bg-mist">
        <div className="mx-auto grid min-h-[760px] w-full max-w-[1600px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8">
          <SidebarNav title="Admin Dashboard" links={links} />
          <div className="min-w-0">{children}</div>
        </div>
      </section>
    </AuthGuard>
  );
}
