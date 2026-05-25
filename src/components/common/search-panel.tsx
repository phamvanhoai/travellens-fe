import { CalendarDays, MapPin, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SearchPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div className="rounded-lg bg-white p-3 shadow-soft">
      <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_1fr_auto]">
        {[
          { icon: MapPin, label: "Where to?", value: "Search destinations, attractions..." },
          { icon: CalendarDays, label: "Check in - Check out", value: "May 20 - May 27" },
          { icon: Users, label: "Guests", value: "2 Adults, 1 Child" }
        ].map((item) => (
          <label key={item.label} className="rounded-lg border border-slate-100 px-4 py-3">
            <span className="mb-2 block text-xs font-semibold text-slate-500">{item.label}</span>
            <span className="flex items-center gap-2 text-sm font-semibold text-ink">
              <item.icon size={16} className="text-brand-600" />
              {compact ? item.value.split(",")[0] : item.value}
            </span>
          </label>
        ))}
        <Button className="h-full min-h-14">
          <Search size={17} /> Search
        </Button>
      </div>
    </div>
  );
}
