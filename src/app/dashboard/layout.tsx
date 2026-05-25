import Link from "next/link";
import { CalendarCheck, CreditCard, Heart, MessageSquareText, UserRound } from "lucide-react";

const links = [
  [UserRound, "Profile", "/dashboard/profile"],
  [CalendarCheck, "Bookings", "/dashboard/bookings"],
  [CreditCard, "Payments", "/dashboard/payments"],
  [MessageSquareText, "Reviews", "/dashboard/reviews"],
  [Heart, "Saved", "/dashboard/saved"]
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="bg-mist">
      <div className="mx-auto grid min-h-[720px] max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="h-fit rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="px-3 pb-3 text-lg font-bold">User Dashboard</h2>
          <nav className="space-y-1">
            {links.map(([Icon, label, href]) => (
              <Link key={href} href={href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-brand-50 hover:text-brand-600">
                <Icon size={17} /> {label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </section>
  );
}
