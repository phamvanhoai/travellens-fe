import { ArrowRight, BadgeCheck, Headphones, LockKeyhole, Play, Sparkles, Star } from "lucide-react";
import { DestinationCard } from "@/components/cards/destination-card";
import { TourCard } from "@/components/cards/tour-card";
import { SearchPanel } from "@/components/common/search-panel";
import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { destinations, images, reviews, tours } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      <section className="relative min-h-[680px] overflow-hidden">
        <img src={images.hero} alt="Mountain lake travel landscape" className="absolute inset-0 h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-20 text-white sm:px-6 lg:grid-cols-[1fr_220px] lg:px-8">
          <div className="max-w-3xl pt-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <Sparkles size={14} /> Explore the world
            </span>
            <h1 className="mt-6 max-w-2xl text-5xl font-bold tracking-tight text-balance md:text-7xl">
              Discover Places Beyond Imagination
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/86">
              Book tours, explore 360 experiences, get AI travel recommendations and plan your perfect trip.
            </p>
            <div className="mt-8 max-w-4xl text-ink">
              <SearchPanel />
            </div>
            <div className="mt-7 grid max-w-3xl gap-4 text-sm font-semibold text-white/90 sm:grid-cols-3">
              {[
                [BadgeCheck, "Best Price Guarantee"],
                [Headphones, "24/7 Customer Support"],
                [LockKeyhole, "Secure Booking"]
              ].map(([Icon, text]) => (
                <div key={String(text)} className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-white/15"><Icon size={18} /></span>
                  {text as string}
                </div>
              ))}
            </div>
          </div>
          <div className="hidden space-y-4 self-center lg:block">
            {destinations.slice(0, 3).map((item) => (
              <div key={item.id} className="relative h-32 overflow-hidden rounded-lg border border-white/25">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <p className="absolute bottom-3 left-3 text-sm font-bold">{item.name}, {item.country}</p>
                {item.id === "santorini" ? <span className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-600"><Play size={16} fill="currentColor" /></span> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading title="Featured Destinations" href="/destinations" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.slice(0, 4).map((item) => <DestinationCard key={item.id} destination={item} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeading title="Popular Tours" href="/tours" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tours.slice(0, 6).map((item) => <TourCard key={item.id} tour={item} />)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <SectionHeading title="AI Recommendations for You" subtitle="Personalized picks based on your interests and travel history." />
        <div className="grid gap-5 md:grid-cols-4">
          {destinations.slice(4, 8).map((item) => (
            <div key={item.id} className="relative h-52 overflow-hidden rounded-lg">
              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
              <span className="absolute left-4 top-4 rounded-md bg-brand-600 px-3 py-1 text-xs font-bold text-white">{item.category}</span>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="font-bold">{item.name}, {item.country}</h3>
                <p className="text-sm text-white/80">from ${item.priceFrom}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-lg bg-ink p-7 text-white md:grid-cols-[1fr_2fr] md:items-center">
          <div>
            <h2 className="text-3xl font-bold">360° Virtual Experiences</h2>
            <p className="mt-3 text-white/75">Step into amazing places with immersive 360° tours.</p>
            <Button href="/view360" variant="secondary" className="mt-6">
              Explore 360 <ArrowRight size={16} />
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {destinations.slice(0, 4).map((item) => (
              <div key={item.id} className="relative h-40 overflow-hidden rounded-lg border border-white/20">
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <p className="absolute bottom-3 left-3 text-sm font-bold">{item.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <SectionHeading title="What Travelers Say" href="/dashboard/reviews" />
        <div className="grid gap-5 md:grid-cols-4">
          {reviews.map((review) => (
            <div key={review.name} className="rounded-lg bg-slate-50 p-6">
              <p className="text-sm leading-6 text-slate-700">“{review.quote}”</p>
              <div className="mt-5 flex items-center justify-between">
                <div>
                  <p className="font-bold">{review.name}</p>
                  <p className="text-xs text-slate-500">{review.city}</p>
                </div>
                <span className="flex items-center gap-1 text-sm font-bold"><Star className="size-4 fill-amber-400 text-amber-400" /> {review.rating}.0</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-lg p-8 text-white md:p-12">
          <img src={images.balloons} alt="Hot air balloons" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-brand-950/55" />
          <div className="relative">
            <h2 className="text-3xl font-bold">Ready to Start Your Journey?</h2>
            <p className="mt-2 text-white/85">Join millions of travelers and explore the world with Travel360.</p>
            <Button href="/destinations" className="mt-6">Start Exploring <ArrowRight size={16} /></Button>
          </div>
        </div>
      </section>
    </>
  );
}
