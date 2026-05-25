import { Clock, Globe2, Heart, Languages, MapPin, Play, Share2, Star } from "lucide-react";
import { TourCard } from "@/components/cards/tour-card";
import { Button } from "@/components/ui/button";
import { destinations, tours } from "@/lib/data";

export function generateStaticParams() {
  return destinations.map((destination) => ({ id: destination.id }));
}

export default async function DestinationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const destination = destinations.find((item) => item.id === id) ?? destinations[0];
  const related = tours.slice(0, 4);

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
              <p className="mt-3 flex items-center gap-4 text-sm"><span><Star className="inline size-4 fill-amber-400 text-amber-400" /> {destination.rating} ({destination.reviews} reviews)</span><span><MapPin className="inline size-4" /> {destination.region}</span></p>
              <p className="mt-4 max-w-xl text-white/85">{destination.description}</p>
            </div>
          </div>
          <nav className="mt-6 flex gap-6 overflow-x-auto border-b border-slate-200 text-sm font-semibold">
            {["Overview", "Things to Do", "Tours", "360° Experience", "Map", "Reviews", "Travel Guide"].map((item, index) => (
              <span key={item} className={index === 0 ? "border-b-2 border-brand-600 pb-3 text-brand-600" : "pb-3 text-slate-600"}>{item}</span>
            ))}
          </nav>
          <div className="mt-7 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-xl font-bold">About {destination.name}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{destination.description} Enjoy curated itineraries, expert guides, local dining recommendations and immersive previews before you book.</p>
              <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs font-semibold text-brand-600">
                {["Stunning Views", "Rich Culture", "Local Cuisine"].map((item) => <span key={item} className="rounded-lg bg-brand-50 p-3">{item}</span>)}
              </div>
              <h3 className="mt-7 font-bold">Top Highlights</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {["Watch the world-famous sunset", "Explore historic streets and landmarks", "Taste local wines and signature food", "Take a scenic boat or walking tour"].map((item) => <li key={item}>✓ {item}</li>)}
              </ul>
            </div>
            <div className="relative min-h-72 overflow-hidden rounded-lg bg-blue-50">
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=900&q=85" alt="Map preview" className="h-full w-full object-cover opacity-75" />
              <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white"><MapPin /></span>
              <Button className="absolute right-4 top-4 h-9">Open in Map</Button>
            </div>
          </div>
          <h2 className="mt-10 text-xl font-bold">Popular Tours in {destination.name}</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((tour) => <TourCard key={tour.id} tour={tour} />)}
          </div>
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
              <h3 className="mt-8 text-xl font-bold">360° Experience Preview</h3>
              <p className="mt-2 text-sm text-white/85">Explore {destination.name} in 360°</p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 p-6">
            <h3 className="font-bold">Travel Guide</h3>
            {["How to Get There", "Where to Stay", "Food & Dining", "Travel Tips"].map((item) => <p key={item} className="mt-4 text-sm font-semibold text-slate-700">{item}<span className="block text-xs font-normal text-slate-500">Helpful local guidance</span></p>)}
          </div>
        </aside>
      </div>
    </section>
  );
}
