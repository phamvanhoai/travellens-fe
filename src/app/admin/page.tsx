import { CalendarCheck, DollarSign, Users, XCircle } from "lucide-react";
import { BookingChart, RevenueChart } from "@/components/charts/admin-chart";
import { StatCard } from "@/components/dashboard/stat-card";

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard Overview</h1>
      <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value="24,892" icon={Users} trend="+12.4%" />
        <StatCard label="Total Bookings" value="8,420" icon={CalendarCheck} trend="+8.1%" />
        <StatCard label="Total Revenue" value="$624K" icon={DollarSign} trend="+18.2%" />
        <StatCard label="Cancelled Bookings" value="312" icon={XCircle} trend="-4.8%" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-5 font-bold">Revenue Chart</h2><RevenueChart /></div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><h2 className="mb-5 font-bold">Booking Chart</h2><BookingChart /></div>
      </div>
    </div>
  );
}
