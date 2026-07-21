import Link from "next/link";
import { ArrowUpRight, MapPin, Star } from "lucide-react";
import { SaveButton } from "@/components/common/save-button";
import type { Destination } from "@/types";
import { currency } from "@/lib/utils";

export function DestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link href={`/destinations/${destination.id}`} className="group flex h-full min-h-[304px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft">
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-black/5" />
        <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-white/90 px-3 py-1 text-[11px] font-bold text-brand-700 shadow-sm backdrop-blur">{destination.category}</span>
        <SaveButton id={destination.id} type="destination" className="absolute right-3 top-3" />
        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-3 text-white">
          <p className="flex min-w-0 items-center gap-1.5 text-xs font-semibold"><MapPin size={13} className="shrink-0" /><span className="truncate">{destination.region || destination.country}</span></p>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-black/25 px-2 py-1 text-xs font-bold backdrop-blur"><Star className="size-3.5 fill-amber-400 text-amber-400" />{destination.rating}</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1"><h3 className="line-clamp-2 min-h-10 text-sm font-bold leading-5 text-ink transition group-hover:text-brand-700">{destination.name}</h3><p className="mt-1 truncate text-xs text-slate-400">{destination.country} · {destination.reviews} reviews</p></div>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-brand-600 group-hover:text-white"><ArrowUpRight size={15} /></span>
        </div>
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3"><span className="text-xs text-slate-400">Starting from</span><strong className="text-sm text-brand-700">{currency(destination.priceFrom, destination.currency)}</strong></div>
      </div>
    </Link>
  );
}
