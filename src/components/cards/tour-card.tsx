import Link from "next/link";
import { ArrowUpRight, Clock3, MapPin, Star, Users } from "lucide-react";
import { SaveButton } from "@/components/common/save-button";
import type { Tour } from "@/types";
import { currency } from "@/lib/utils";

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <Link href={`/tours/${tour.id}`} className="group flex h-full min-h-[344px] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-soft">
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img src={tour.image} alt={tour.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-black/5" />
        <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-white/90 px-3 py-1 text-[11px] font-bold text-brand-700 shadow-sm backdrop-blur">{tour.category || "Tour"}</span>
        <SaveButton id={tour.id} type="tour" className="absolute right-3 top-3" />
        <p className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 text-xs font-semibold text-white"><MapPin size={13} className="shrink-0" /><span className="line-clamp-1">{tour.destination}</span></p>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3"><h3 className="line-clamp-2 min-h-10 flex-1 text-sm font-bold leading-5 text-ink transition group-hover:text-brand-700">{tour.title}</h3><span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-400 transition group-hover:bg-brand-600 group-hover:text-white"><ArrowUpRight size={15} /></span></div>
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500"><span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1.5"><Clock3 size={12} className="text-brand-600" />{tour.duration}</span><span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1.5"><Users size={12} className="shrink-0 text-brand-600" /><span className="truncate">{tour.capacity}</span></span></div>
        <div className="mt-auto flex items-end justify-between border-t border-slate-100 pt-3"><span className="flex items-center gap-1 text-xs font-semibold text-slate-600"><Star className="size-3.5 fill-amber-400 text-amber-400" />{tour.rating} <span className="font-normal text-slate-400">({tour.reviews})</span></span><span className="text-right text-[11px] text-slate-400">from<strong className="block text-sm text-brand-700">{currency(tour.price, tour.currency)}</strong></span></div>
      </div>
    </Link>
  );
}
