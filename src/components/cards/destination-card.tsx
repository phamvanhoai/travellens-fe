import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { SaveButton } from "@/components/common/save-button";
import type { Destination } from "@/types";
import { currency } from "@/lib/utils";

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link href={`/destinations/${destination.id}`} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative h-52 overflow-hidden">
        <img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {destination.badge ? <span className="absolute left-3 top-3 rounded-md bg-brand-600 px-3 py-1 text-xs font-bold text-white">{destination.badge}</span> : null}
        <SaveButton id={destination.id} type="destination" className="absolute right-3 top-3" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-ink">{destination.name}, {destination.country}</h3>
            <p className="mt-1 text-xs text-slate-500">{destination.category} · {destination.region}</p>
          </div>
          <p className="text-right text-xs text-slate-500">from<br /><span className="font-bold text-ink">{currency(destination.priceFrom)}</span></p>
        </div>
        <div className="mt-3 flex items-center gap-1 text-sm">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          <span className="font-semibold">{destination.rating}</span>
          <span className="text-slate-500">({destination.reviews})</span>
        </div>
      </div>
    </Link>
  );
}
