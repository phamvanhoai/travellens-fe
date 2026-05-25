import { Filter } from "lucide-react";
import { DestinationCard } from "@/components/cards/destination-card";
import { PageHero } from "@/components/common/page-hero";
import { destinations, images } from "@/lib/data";

const categories = ["All Destinations", "Beach", "Mountain", "City", "Culture", "Adventure", "Nature"];

export default function DestinationsPage() {
  return (
    <>
      <PageHero title="Explore Destinations" subtitle="Find your next adventure from around the world" image={images.santorini} />
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          {categories.map((category, index) => (
            <button key={category} className={index === 0 ? "rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white" : "rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold hover:border-brand-600 hover:text-brand-600"}>
              {category}
            </button>
          ))}
          <button className="ml-auto inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold">
            <Filter size={16} /> Popular
          </button>
        </div>
        <p className="mb-4 text-sm text-slate-500">Showing 1-12 of 124 destinations</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((item) => <DestinationCard key={item.id} destination={item} />)}
        </div>
        <div className="mt-9 flex justify-center gap-2">
          {["1", "2", "3", "...", "11", "Next"].map((item, index) => (
            <button key={item} className={index === 0 ? "rounded-lg bg-brand-600 px-4 py-2 text-sm font-bold text-white" : "rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold"}>{item}</button>
          ))}
        </div>
      </section>
    </>
  );
}
