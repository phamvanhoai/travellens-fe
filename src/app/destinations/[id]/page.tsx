import { Clock, Globe2, Heart, Languages, MapPin, Play, Share2, Star } from "lucide-react";
import { DestinationTabs } from "@/components/destinations/destination-tabs";
import { Button } from "@/components/ui/button";
import { destinations, tours } from "@/lib/data";

export function generateStaticParams() {
  return destinations.map((destination) => ({ id: destination.id }));
}

export default async function DestinationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const destination = destinations.find((item) => item.id === id) ?? destinations[0];
  const related = tours.slice(0, 4);
  const nearby = destinations.filter((item) => item.id !== destination.id).slice(0, 4);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 text-sm text-slate-500">Home / Destinations / {destination.region} / {destination.name}</div>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="relative min-h-[430px] overflow-hidden rounded-lg">
            <img src={destination.image} alt={destination.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute right-4 top-4 flex gap-2">
              <button className="rounded-lg bg-black/45 px-4 py-2 text-sm font-semibold text-white"><Share2 className="mr-2 inline size-4" />Share</button>
              <button className="rounded-lg bg-black/45 px-4 py-2 text-sm font-semibold text-white"><Heart className="mr-2 inline size-4" />Save</button>
            </div>
            <div className="absolute bottom-6 left-6 max-w-2xl text-white">
              <span className="rounded-md bg-brand-600 px-3 py-1 text-xs font-bold">Top Destination</span>
              <h1 className="mt-4 text-4xl font-bold">{destination.name}, {destination.country}</h1>
              <p className="mt-3 flex items-center gap-4 text-sm">
                <span><Star className="inline size-4 fill-amber-400 text-amber-400" /> {destination.rating} ({destination.reviews} reviews)</span>
                <span><MapPin className="inline size-4" /> {destination.region}</span>
              </p>
              <p className="mt-4 max-w-xl text-white/85">{destination.description}</p>
            </div>
          </div>

          <DestinationTabs destination={destination} relatedTours={related} nearbyDestinations={nearby} />
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <h2 className="text-2xl font-bold">{destination.name}, {destination.country}</h2>
              <span className="rounded-md bg-brand-600 px-3 py-1 text-xs font-bold text-white">{destination.badge ?? "Top"}</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">{destination.description}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <span><Clock className="mr-2 inline size-4" />{destination.bestTime}</span>
              <span><Languages className="mr-2 inline size-4" />English</span>
              <span><Globe2 className="mr-2 inline size-4" />EUR/USD</span>
              <span><MapPin className="mr-2 inline size-4" />GMT +3</span>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button variant="outline"><Heart size={16} /> Wishlist</Button>
              <Button href="/booking">Book a Tour</Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-lg p-5 text-white">
            <img src={destination.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-black/45" />
            <div className="relative">
              <span className="grid size-14 place-items-center rounded-full bg-white text-brand-600"><Play fill="currentColor" /></span>
              <h3 className="mt-8 text-xl font-bold">360 Experience Preview</h3>
              <p className="mt-2 text-sm text-white/85">Explore {destination.name} in 360</p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 p-6">
            <h3 className="font-bold">Travel Guide</h3>
            {["How to Get There", "Where to Stay", "Food & Dining", "Travel Tips"].map((item) => (
              <p key={item} className="mt-4 text-sm font-semibold text-slate-700">
                {item}
                <span className="block text-xs font-normal text-slate-500">Helpful local guidance</span>
              </p>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
