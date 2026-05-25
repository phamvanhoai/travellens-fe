import { Bus, CalendarDays, CheckCircle2, Clock3, MapPin, Play, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tours } from "@/lib/data";
import { currency } from "@/lib/utils";

export function generateStaticParams() {
  return tours.map((tour) => ({ id: tour.id }));
}

export default async function TourDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tour = tours.find((item) => item.id === id) ?? tours[0];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 text-sm text-slate-500">Home / Tours / {tour.destination} / {tour.title}</div>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="relative h-[460px] overflow-hidden rounded-lg">
            <img src={tour.image} alt={tour.title} className="h-full w-full object-cover" />
            <span className="absolute left-5 top-5 rounded-md bg-orange-500 px-3 py-1 text-xs font-bold text-white">{tour.badge ?? "Featured"}</span>
            <span className="absolute bottom-5 left-5 grid size-14 place-items-center rounded-full bg-white text-brand-600"><Play fill="currentColor" /></span>
          </div>
          <nav className="mt-6 flex gap-6 overflow-x-auto border-b border-slate-200 text-sm font-semibold">
            {["Overview", "Itinerary", "Inclusions", "Exclusions", "Reviews", "FAQs"].map((item, index) => (
              <span key={item} className={index === 0 ? "border-b-2 border-brand-600 pb-3 text-brand-600" : "pb-3 text-slate-600"}>{item}</span>
            ))}
          </nav>
          <div className="mt-7 grid gap-8 lg:grid-cols-2">
            <div>
              <h1 className="text-3xl font-bold">{tour.title}</h1>
              <p className="mt-3 text-sm leading-7 text-slate-600">Join an unforgettable experience in {tour.destination}. This curated route combines expert guidance, local experiences, scenic stops and flexible booking support.</p>
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-brand-600">
                {["Stunning Views", "Local Guide", "Hotel Pick-up", "Wine Tasting"].map((item) => <span key={item} className="rounded-lg bg-brand-50 p-3 font-semibold">{item}</span>)}
              </div>
              <h2 className="mt-7 font-bold">Highlights</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                {["Visit iconic viewpoints", "Explore hidden local spots", "Taste regional food and drinks", "Enjoy stress-free transport"].map((item) => <li key={item}>✓ {item}</li>)}
              </ul>
            </div>
            <div className="relative min-h-72 overflow-hidden rounded-lg bg-blue-50">
              <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=900&q=85" alt="Route map" className="h-full w-full object-cover opacity-75" />
              {[["35%","28%"],["58%","50%"],["42%","72%"]].map(([left, top]) => <span key={left} className="absolute grid size-9 place-items-center rounded-full bg-brand-600 text-white" style={{ left, top }}><MapPin size={18} /></span>)}
            </div>
          </div>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-bold">Itinerary</h2>
              {["Hotel Pick-up", "Old Village", "Sunset Viewing", "Wine Tasting", "Return to Hotel"].map((item, index) => (
                <div key={item} className="mt-4 flex gap-4">
                  <span className="grid size-9 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">{index + 1}</span>
                  <div><p className="font-semibold">{item}</p><p className="text-sm text-slate-500">Carefully timed stop with local guidance.</p></div>
                </div>
              ))}
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div><h2 className="font-bold">Included</h2>{["Hotel pick-up", "Professional local guide", "Wine tasting", "All taxes and fees"].map((item) => <p key={item} className="mt-3 text-sm text-slate-600"><CheckCircle2 className="mr-2 inline size-4 text-emerald-600" />{item}</p>)}</div>
              <div><h2 className="font-bold">Not Included</h2>{["Meals and drinks", "Personal expenses", "Tips"].map((item) => <p key={item} className="mt-3 text-sm text-slate-600">× {item}</p>)}</div>
            </div>
          </div>
        </div>
        <aside className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold">{tour.title}</h2>
            <p className="mt-2 text-sm text-slate-500"><Star className="inline size-4 fill-amber-400 text-amber-400" /> {tour.rating} ({tour.reviews} reviews) · {tour.destination}</p>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
              <span><Clock3 className="mr-2 inline size-4" />{tour.duration}</span>
              <span><Users className="mr-2 inline size-4" />{tour.capacity}</span>
              <span><Bus className="mr-2 inline size-4" />Pick-up</span>
              <span><CheckCircle2 className="mr-2 inline size-4" />Instant</span>
            </div>
            <p className="mt-6 text-sm text-slate-500">From</p>
            <p className="text-3xl font-bold">{currency(tour.price)} <span className="text-sm font-normal text-slate-500">/ person</span></p>
            <Button href="/booking" className="mt-5 w-full">Check Availability</Button>
            <Button variant="outline" className="mt-3 w-full">Add to Wishlist</Button>
          </div>
          <div className="rounded-lg border border-slate-200 p-6">
            <h3 className="font-bold">Check Availability</h3>
            <label className="mt-4 block text-sm font-semibold">Date<input className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3" type="date" /></label>
            <label className="mt-4 block text-sm font-semibold">Guests<select className="mt-2 h-11 w-full rounded-lg border border-slate-200 px-3"><option>2 Adults</option><option>2 Adults, 1 Child</option></select></label>
            <Button href="/booking" className="mt-5 w-full"><CalendarDays size={16} /> Check Availability</Button>
          </div>
        </aside>
      </div>
    </section>
  );
}
