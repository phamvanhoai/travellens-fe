import Link from "next/link";
import { BarChart3, CalendarCheck, CreditCard, Images, Map, MessageSquareText, Newspaper, Plane, Users, Video } from "lucide-react";

const links = [
  [BarChart3, "Overview", "/admin"],
  [Plane, "Destinations", "/admin/travel-destinations"],
  [Plane, "Tours", "/admin/tours"],
  [Map, "Locations", "/admin/locations"],
  [Video, "View360", "/admin/view360"],
  [Images, "Maps", "/admin/maps"],
  [CalendarCheck, "Bookings", "/admin/bookings"],
  [CreditCard, "Payments", "/admin/payments"],
  [Newspaper, "Blogs", "/admin/blogs"],
  [MessageSquareText, "Reviews", "/admin/reviews"],
  [Users, "Users", "/admin/users"],
  [BarChart3, "Statistics", "/admin/statistics"]
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-mist">
      <div className="mx-auto grid min-h-[760px] max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="px-3 pb-3 text-lg font-bold">Admin Dashboard</h2>
          <nav className="grid gap-1">
            {links.map(([Icon, label, href]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-600"><Icon size={16} /> {label}</Link>)}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </section>
  );
}
