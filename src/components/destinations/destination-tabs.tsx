"use client";

import { useState } from "react";
import { Camera, Compass, MapPin, MessageSquareText, Play, Route, Star } from "lucide-react";
import { DestinationCard } from "@/components/cards/destination-card";
import { TourCard } from "@/components/cards/tour-card";
import { Button } from "@/components/ui/button";
import type { Destination, Tour } from "@/types";

const tabs = ["Overview", "Things to Do", "Tours", "360 Experience", "Map", "Reviews", "Travel Guide"] as const;

type Tab = (typeof tabs)[number];

export function DestinationTabs({
  destination,
  relatedTours,
  nearbyDestinations
}: {
  destination: Destination;
  relatedTours: Tour[];
  nearbyDestinations: Destination[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <div>
      <nav className="mt-6 flex gap-6 overflow-x-auto border-b border-slate-200 text-sm font-semibold">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={
              activeTab === tab
                ? "whitespace-nowrap border-b-2 border-brand-600 pb-3 text-brand-600"
                : "whitespace-nowrap pb-3 text-slate-600 hover:text-brand-600"
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      <div className="mt-7">
        {activeTab === "Overview" ? <OverviewTab destination={destination} /> : null}
        {activeTab === "Things to Do" ? <ThingsToDoTab destination={destination} /> : null}
        {activeTab === "Tours" ? <ToursTab destination={destination} tours={relatedTours} /> : null}
        {activeTab === "360 Experience" ? <ExperienceTab destination={destination} /> : null}
        {activeTab === "Map" ? <MapTab destination={destination} /> : null}
        {activeTab === "Reviews" ? <ReviewsTab /> : null}
        {activeTab === "Travel Guide" ? <TravelGuideTab destination={destination} nearbyDestinations={nearbyDestinations} /> : null}
      </div>
    </div>
  );
}

function OverviewTab({ destination }: { destination: Destination }) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div>
        <h2 className="text-xl font-bold">About {destination.name}</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {destination.description} Enjoy curated itineraries, expert guides, local dining recommendations and immersive previews before you book.
        </p>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center text-xs font-semibold text-brand-600">
          {["Stunning Views", "Rich Culture", "Local Cuisine"].map((item) => (
            <span key={item} className="rounded-lg bg-brand-50 p-3">{item}</span>
          ))}
        </div>
        <h3 className="mt-7 font-bold">Top Highlights</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {["Watch the world-famous sunset", "Explore historic streets and landmarks", "Taste local wines and signature food", "Take a scenic boat or walking tour"].map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      </div>
      <MapPreview />
    </div>
  );
}

function ThingsToDoTab({ destination }: { destination: Destination }) {
  const activities = [
    ["Sunset viewpoints", "Reserve an evening route for the best golden-hour photos."],
    ["Local food walk", "Try small family-run restaurants and regional specialties."],
    ["Culture route", "Visit historic streets, museums, temples or landmark neighborhoods."],
    ["Water experience", "Choose a boat, beach or lagoon activity when weather is clear."]
  ];

  return (
    <div>
      <h2 className="text-xl font-bold">Things to Do in {destination.name}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {activities.map(([title, text], index) => (
          <div key={title} className="rounded-lg border border-slate-200 bg-white p-5">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <Compass size={18} />
            </span>
            <h3 className="mt-4 font-bold">{index + 1}. {title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ToursTab({ destination, tours }: { destination: Destination; tours: Tour[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold">Popular Tours in {destination.name}</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {tours.map((tour) => <TourCard key={tour.id} tour={tour} />)}
      </div>
    </div>
  );
}

function ExperienceTab({ destination }: { destination: Destination }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="relative min-h-[360px] overflow-hidden rounded-lg text-white">
        <img src={destination.image} alt={destination.name} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative flex min-h-[360px] flex-col justify-end p-6">
          <span className="grid size-16 place-items-center rounded-full bg-white text-brand-600">
            <Play fill="currentColor" />
          </span>
          <h2 className="mt-6 text-3xl font-bold">Explore {destination.name} in 360</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/82">Preview viewpoints, routes and scene navigation before booking your trip.</p>
          <Button href="/view360" className="mt-5 w-fit">Open 360 Viewer</Button>
        </div>
      </div>
      <div className="space-y-3">
        {["Cliffside View", "Old Town Walk", "Harbor Route"].map((scene, index) => (
          <button key={scene} className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left">
            <span className="grid size-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><Camera size={17} /></span>
            <span><span className="block font-bold">{scene}</span><span className="text-xs text-slate-500">order_index: {index + 1}</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}

function MapTab({ destination }: { destination: Destination }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{destination.name} Map</h2>
      <p className="mt-2 text-sm text-slate-600">Preview routes, nearby landmarks and map file attachment for this location.</p>
      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_280px]">
        <MapPreview />
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <h3 className="font-bold">Map Points</h3>
          {["Main viewpoint", "Historic center", "Harbor pickup", "Recommended stay area"].map((item) => (
            <p key={item} className="mt-4 flex items-center gap-2 text-sm text-slate-600"><MapPin size={16} className="text-brand-600" /> {item}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewsTab() {
  const reviews = [
    ["Emma Johnson", "The 360 preview helped us choose the perfect route.", 5],
    ["David Lee", "Smooth booking and excellent local guide.", 5],
    ["Sophie Martin", "Beautiful destination page and clear travel tips.", 4.9]
  ] as const;

  return (
    <div>
      <h2 className="text-xl font-bold">Traveler Reviews</h2>
      <div className="mt-5 grid gap-4">
        {reviews.map(([name, quote, rating]) => (
          <div key={name} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="font-bold">{name}</p>
              <span className="flex items-center gap-1 text-sm font-bold"><Star className="size-4 fill-amber-400 text-amber-400" /> {rating}</span>
            </div>
            <p className="mt-3 flex gap-2 text-sm leading-6 text-slate-600"><MessageSquareText size={17} className="mt-0.5 text-brand-600" /> {quote}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TravelGuideTab({ destination, nearbyDestinations }: { destination: Destination; nearbyDestinations: Destination[] }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{destination.name} Travel Guide</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {["How to Get There", "Where to Stay", "Food & Dining", "Travel Tips"].map((item) => (
          <div key={item} className="rounded-lg border border-slate-200 bg-white p-5">
            <Route className="size-7 text-brand-600" />
            <h3 className="mt-3 font-bold">{item}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">Helpful local guidance for planning {destination.name} with fewer surprises.</p>
          </div>
        ))}
      </div>
      <h3 className="mt-8 font-bold">Nearby Destinations</h3>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {nearbyDestinations.map((item) => <DestinationCard key={item.id} destination={item} />)}
      </div>
    </div>
  );
}

function MapPreview() {
  return (
    <div className="relative min-h-72 overflow-hidden rounded-lg bg-blue-50">
      <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=900&q=85" alt="Map preview" className="h-full w-full object-cover opacity-75" />
      <span className="absolute left-1/2 top-1/2 grid size-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand-600 text-white"><MapPin /></span>
      <Button className="absolute right-4 top-4 h-9">Open in Map</Button>
    </div>
  );
}
