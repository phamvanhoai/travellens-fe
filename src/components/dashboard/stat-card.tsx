import type { LucideIcon } from "lucide-react";

export function StatCard({ label, value, icon: Icon, trend }: { label: string; value: string; icon: LucideIcon; trend?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
        </div>
        <span className="grid size-11 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Icon size={21} />
        </span>
      </div>
      {trend ? <p className="mt-4 text-sm font-semibold text-emerald-600">{trend}</p> : null}
    </div>
  );
}
