import { BookingChart, RevenueChart } from "@/components/charts/admin-chart";

export default function AdminStatisticsPage() {
  return (
    <div className="grid gap-6">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><h1 className="mb-5 text-2xl font-bold">Revenue Statistics</h1><RevenueChart /></div>
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"><h1 className="mb-5 text-2xl font-bold">Cancellation & Booking Statistics</h1><BookingChart /></div>
    </div>
  );
}
