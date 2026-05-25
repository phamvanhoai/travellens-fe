import { MapPin, Star } from "lucide-react";
import { DestinationCard } from "@/components/cards/destination-card";
import { Button } from "@/components/ui/button";
import { destinations } from "@/lib/data";

export default function LocationDetailPage() {
  const place = destinations[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-lg">
          <img src={place.image} alt={place.name} className="h-[480px] w-full object-cover" />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-brand-600">Location detail</p>
          <h1 className="mt-3 text-4xl font-bold">Oia Cliffside Village</h1>
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500"><MapPin size={16} /> Santorini, Greece · <Star className="size-4 fill-amber-400 text-amber-400" /> 4.9</p>
          <p className="mt-5 leading-7 text-slate-600">A scenic village location with whitewashed lanes, sunset terraces, local boutiques, nearby restaurants and immersive 360 galleries.</p>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {["Map section", "360 gallery", "Reviews"].map((item) => <span key={item} className="rounded-lg bg-brand-50 p-4 text-center text-sm font-bold text-brand-600">{item}</span>)}
          </div>
          <Button href="/view360" className="mt-8">Open 360 Gallery</Button>
        </div>
      </div>
      <div className="mt-10 grid gap-7 lg:grid-cols-2">
        <div className="relative min-h-80 overflow-hidden rounded-lg bg-blue-50">
          <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=900&q=85" alt="Map" className="h-full w-full object-cover opacity-75" />
          <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white"><MapPin /></span>
        </div>
        <div className="rounded-lg border border-slate-200 p-6">
          <h2 className="text-xl font-bold">Reviews</h2>
          {["Perfect sunset view and easy walking route.", "The virtual preview matched the real visit."].map((text) => <p key={text} className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">“{text}”</p>)}
        </div>
      </div>
      <h2 className="mt-10 text-2xl font-bold">Related Destinations</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {destinations.slice(1, 5).map((item) => <DestinationCard key={item.id} destination={item} />)}
      </div>
    </section>
  );
}
