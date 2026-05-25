import { Bike, Building2, Calendar, Mountain, Ship, SlidersHorizontal, Umbrella, Waves } from "lucide-react";
import { TourCard } from "@/components/cards/tour-card";
import { PageHero } from "@/components/common/page-hero";
import { images, tours } from "@/lib/data";

export default function ToursPage() {
  return (
    <>
      <PageHero title="Explore Amazing Tours" subtitle="Find the perfect tour for your next adventure" image={images.swiss} />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-bold">Filters</h2>
            <SlidersHorizontal size={18} className="text-brand-600" />
          </div>
          {["Price Range", "Tour Type", "Duration", "Rating", "Language"].map((group) => (
            <div key={group} className="border-t border-slate-100 py-5">
              <h3 className="mb-3 text-sm font-bold">{group}</h3>
              <div className="space-y-3 text-sm text-slate-600">
                {["Group Tour", "Private Tour", "Family Tour", "Custom Tour"].slice(0, group === "Price Range" ? 1 : 4).map((item) => (
                  <label key={item} className="flex items-center gap-2"><input type="checkbox" /> {item}</label>
                ))}
                {group === "Price Range" ? <div className="h-1 rounded bg-brand-600" /> : null}
              </div>
            </div>
          ))}
        </aside>
        <div>
          <div className="mb-7 flex flex-wrap gap-4">
            {[
              [Calendar, "All Tours"], [Mountain, "Adventure"], [Building2, "Cultural"], [Umbrella, "Beach"], [Waves, "Nature"], [Bike, "Hiking"], [Ship, "Cruise"]
            ].map(([Icon, label], index) => (
              <button key={String(label)} className={index === 0 ? "rounded-lg bg-brand-50 px-4 py-3 text-sm font-bold text-brand-600" : "rounded-lg border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"}>
                <Icon className="mr-2 inline size-4" />{label as string}
              </button>
            ))}
          </div>
          <p className="mb-4 text-sm text-slate-500">Showing 1-12 of 1234 tours</p>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {tours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
          </div>
        </div>
      </section>
    </>
  );
}
