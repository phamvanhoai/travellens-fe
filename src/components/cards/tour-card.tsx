import Link from "next/link";
import { Clock3, Heart, MapPin, Star, Users } from "lucide-react";
import { SaveButton } from "@/components/common/save-button";
import type { Tour } from "@/types";
import { currency } from "@/lib/utils";

export function TourCard({ tour }: { tour: Tour }) {
  return (
    <Link href={`/tours/${tour.id}`} className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
      <div className="relative h-52 overflow-hidden">
        <img src={tour.image} alt={tour.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        {tour.badge ? <span className="absolute left-3 top-3 rounded-md bg-orange-500 px-3 py-1 text-xs font-bold text-white">{tour.badge}</span> : null}
        <SaveButton id={tour.id} type="tour" className="absolute right-3 top-3" />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-ink">{tour.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={13} />{tour.destination}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Clock3 size={13} />{tour.duration}</span>
          <span className="flex items-center gap-1"><Users size={13} />{tour.capacity}</span>
        </div>
        <div className="mt-4 flex items-end justify-between">
          <div className="flex items-center gap-1 text-sm">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="font-semibold">{tour.rating}</span>
            <span className="text-slate-500">({tour.reviews})</span>
          </div>
          <p className="text-xs text-slate-500">from <span className="text-base font-bold text-ink">{currency(tour.price)}</span></p>
        </div>
      </div>
    </Link>
  );
}
