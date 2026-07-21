"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, Headphones, LockKeyhole, MapPin, Play, Quote, Search, Sparkles, Star } from "lucide-react";
import { DestinationCard } from "@/components/cards/destination-card";
import { TourCard } from "@/components/cards/tour-card";
import { SectionHeading } from "@/components/common/section-heading";
import { Button } from "@/components/ui/button";
import { images } from "@/lib/data";
import { currency } from "@/lib/utils";
import { destinationService, toDestinationCardModel, type PublicTravelDestination } from "@/services/destination.service";
import { reviewService, type CustomerReview } from "@/services/review.service";
import { getPublicTourId, getPublicTourName, tourService, type PublicTour } from "@/services/tour.service";
import { view360Service, type View360Experience } from "@/services/view360.service";
import type { Destination, Tour } from "@/types";

export default function HomePage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [tours, setTours] = useState<Tour[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [experiences, setExperiences] = useState<View360Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function loadHome() {
      const [destinationResult, tourResult, reviewResult, view360Result] = await Promise.allSettled([
        destinationService.list({ page: 1, limit: 8, sortBy: "created_at", sortOrder: "DESC" }),
        tourService.listPaginated({ page: 1, limit: 6 }),
        reviewService.list(),
        view360Service.list()
      ]);
      if (!active) return;
      if (destinationResult.status === "fulfilled") setDestinations(destinationResult.value.items.map((item) => toDestinationCardModel(item, images.santorini)));
      if (tourResult.status === "fulfilled") setTours(tourResult.value.items.map(toTourCard));
      if (reviewResult.status === "fulfilled") setReviews(reviewResult.value.slice(0, 4));
      if (view360Result.status === "fulfilled") setExperiences(view360Result.value.slice(0, 4));
      setLoading(false);
    }
    void loadHome();
    return () => { active = false; };
  }, []);

  return (
    <>
      <section className="relative min-h-[680px] overflow-hidden">
        <img src={images.hero} alt="Mountain lake travel landscape" className="absolute inset-0 h-full w-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-20 text-white sm:px-6 lg:grid-cols-[1fr_220px] lg:px-8">
          <div className="max-w-3xl pt-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide"><Sparkles size={14} /> Explore the world</span>
            <h1 className="mt-6 max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">Discover Places Beyond Imagination</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/86 sm:text-lg sm:leading-8">Book tours, explore 360 experiences, get AI travel recommendations and plan your perfect trip.</p>
            <HomeSearch />
            <div className="mt-7 grid max-w-3xl gap-4 text-sm font-semibold text-white/90 sm:grid-cols-3">
              {[[BadgeCheck, "Best Price Guarantee"], [Headphones, "24/7 Customer Support"], [LockKeyhole, "Secure Booking"]].map(([Icon, text]) => <div key={String(text)} className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-white/15"><Icon size={18} /></span>{text as string}</div>)}
            </div>
          </div>
          <div className="hidden space-y-4 self-center lg:block">
            {(loading ? [] : destinations.slice(0, 3)).map((item, index) => <a href={`/destinations/${item.id}`} key={item.id} className="relative block h-32 overflow-hidden rounded-lg border border-white/25"><img src={item.image} alt={item.name} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><p className="absolute bottom-3 left-3 text-sm font-bold">{item.name}, {item.country}</p>{index === 0 ? <span className="absolute right-3 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-600"><Play size={16} fill="currentColor" /></span> : null}</a>)}
          </div>
        </div>
      </section>

      <HomeSection title="Featured Destinations" href="/destinations" loading={loading} empty={!destinations.length} columns="sm:grid-cols-2 lg:grid-cols-4">
        {destinations.slice(0, 4).map((item) => <DestinationCard key={item.id} destination={item} />)}
      </HomeSection>

      <HomeSection title="Popular Tours" href="/tours" loading={loading} empty={!tours.length} columns="sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((item) => <TourCard key={item.id} tour={item} />)}
      </HomeSection>

      <HomeSection title="Recommended Destinations" subtitle="Fresh places to inspire your next journey." href="/destinations" loading={loading} empty={destinations.length < 5} columns="sm:grid-cols-2 lg:grid-cols-4">
        {destinations.slice(4, 8).map((item) => <a href={`/destinations/${item.id}`} key={item.id} className="group relative h-44 overflow-hidden rounded-xl"><img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" /><span className="absolute left-3 top-3 rounded-full bg-brand-600 px-2.5 py-1 text-[11px] font-bold text-white">{item.category}</span><div className="absolute bottom-3 left-3 right-3 text-white"><h3 className="line-clamp-1 text-sm font-bold">{item.name}, {item.country}</h3>{item.priceFrom > 0 ? <p className="text-xs text-white/80">from {currency(item.priceFrom, item.currency)}</p> : null}</div></a>)}
      </HomeSection>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 rounded-xl bg-ink p-7 text-white md:grid-cols-[1fr_2fr] md:items-center">
          <div><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">360° Virtual Experiences</h2><p className="mt-3 text-sm leading-6 text-white/75 sm:text-base">Step into amazing places with immersive 360° tours.</p><Button href="/view360" variant="secondary" className="mt-6">Explore 360 <ArrowRight size={16} /></Button></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {experiences.map((item) => <a href={`/view360?scene=${item.id}`} key={item.id} className="group relative h-36 overflow-hidden rounded-lg border border-white/20"><img src={item.images[0]?.src} alt={item.title} className="h-full w-full object-cover transition group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" /><p className="absolute bottom-3 left-3 right-3 line-clamp-1 text-xs font-bold">{item.title}</p></a>)}
            {!loading && !experiences.length ? <p className="col-span-full py-10 text-center text-sm text-white/60">No 360 experiences available yet.</p> : null}
          </div>
        </div>
      </section>

      <TestimonialsSection reviews={reviews} loading={loading} />

      <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8"><div className="relative overflow-hidden rounded-xl p-8 text-white md:p-12"><img src={images.balloons} alt="Hot air balloons" className="absolute inset-0 h-full w-full object-cover" /><div className="absolute inset-0 bg-brand-950/55" /><div className="relative"><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to Start Your Journey?</h2><p className="mt-2 text-sm leading-6 text-white/85 sm:text-base">Explore Vietnam and create your next unforgettable trip with Travel360.</p><Button href="/destinations" className="mt-6">Start Exploring <ArrowRight size={16} /></Button></div></div></section>
    </>
  );
}

function HomeSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  function submit(event: FormEvent) { event.preventDefault(); const value = query.trim(); router.push(value ? `/destinations?search=${encodeURIComponent(value)}` : "/destinations"); }
  return <form onSubmit={submit} className="mt-8 flex max-w-4xl flex-col gap-2 rounded-2xl border border-white/40 bg-white/95 p-2.5 text-ink shadow-2xl backdrop-blur sm:flex-row"><label className="flex min-w-0 flex-1 items-center gap-4 rounded-xl px-3 py-2"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Search size={20} /></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Where do you want to go?</span><input value={query} onChange={(event) => setQuery(event.target.value)} className="mt-0.5 h-7 w-full bg-transparent text-base font-semibold outline-none placeholder:font-normal placeholder:text-slate-400" placeholder="Search destinations..." /></span></label><button className="h-14 rounded-xl bg-brand-600 px-7 text-sm font-bold text-white transition hover:bg-brand-700">Search</button></form>;
}

function HomeSection({ title, subtitle, href, loading, empty, columns, children }: { title: string; subtitle?: string; href?: string; loading: boolean; empty: boolean; columns: string; children: React.ReactNode }) {
  return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><SectionHeading title={title} subtitle={subtitle} href={href} />{loading ? <div className={`grid auto-rows-fr gap-5 ${columns}`}>{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[344px] animate-pulse rounded-xl bg-slate-100" />)}</div> : empty ? <div className="grid h-36 place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">No data available yet.</div> : <div className={`grid auto-rows-fr gap-5 ${columns}`}>{children}</div>}</section>;
}

function TestimonialsSection({ reviews, loading }: { reviews: CustomerReview[]; loading: boolean }) {
  return (
    <section className="my-8 bg-gradient-to-b from-brand-50/70 to-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div><span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-600"><Sparkles size={14} /> Real experiences</span><h2 className="mt-2 text-2xl font-bold tracking-tight text-ink">What Travelers Say</h2><p className="mt-1 text-sm text-slate-500">Stories and ratings shared by the Travel360 community.</p></div>
          <a href="/dashboard/reviews" className="inline-flex items-center gap-2 text-sm font-bold text-brand-600">View all reviews <ArrowRight size={16} /></a>
        </div>
        {loading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />)}</div> : reviews.length ? (
          <div className="grid auto-rows-fr gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {reviews.map((review) => {
              const name = review.user_name ?? review.user?.name ?? "Traveler";
              const location = review.location_name ?? review.location?.name ?? "Travel360 destination";
              const rating = Math.max(0, Math.min(5, Math.round(Number(review.rating) || 0)));
              return (
                <article key={review.review_id ?? review.id} className="group relative flex min-h-64 flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-soft">
                  <Quote className="absolute -right-2 -top-3 size-20 rotate-6 text-brand-50 transition group-hover:text-brand-100" fill="currentColor" />
                  <div className="relative flex gap-1" aria-label={`${rating} out of 5 stars`}>{Array.from({ length: 5 }, (_, index) => <Star key={index} className={`size-4 ${index < rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-200"}`} />)}</div>
                  <blockquote className="relative mt-4 line-clamp-5 text-sm leading-6 text-slate-600">“{review.comment || "A memorable travel experience with thoughtful service and wonderful places to explore."}”</blockquote>
                  <footer className="relative mt-auto flex items-center gap-3 border-t border-slate-100 pt-4">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-sm">{getInitials(name)}</span>
                    <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-ink">{name}</strong><span className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-400"><MapPin size={11} className="shrink-0" />{location}</span></span>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">{Number(review.rating).toFixed(1)}</span>
                  </footer>
                </article>
              );
            })}
          </div>
        ) : <div className="grid h-36 place-items-center rounded-2xl border border-dashed border-brand-200 bg-white/70 text-sm text-slate-500">No traveler reviews available yet.</div>}
      </div>
    </section>
  );
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(-2).map((part) => part.charAt(0).toUpperCase()).join("") || "T";
}

function toTourCard(tour: PublicTour): Tour {
  const destinations = tour.destinations ?? tour.travel_destinations ?? tour.tour_destinations ?? [];
  const destination = destinations.map((item) => item.name ?? item.destination_name ?? item.travel_destination_name).filter(Boolean).join(" · ") || tour.destination_name || "Various locations";
  const days = Number(tour.duration_days ?? 0), nights = Number(tour.duration_nights ?? 0);
  const category = typeof tour.tour_category === "object" ? tour.tour_category.name : tour.tour_category;
  return { id: String(getPublicTourId(tour)), title: getPublicTourName(tour), destination, image: tour.thumbnail_url ?? tour.thumbnail ?? images.swiss, rating: Number(tour.average_rating ?? 0), reviews: String(tour.review_count ?? 0), duration: days || nights ? `${days ? `${days}d` : ""}${days && nights ? " " : ""}${nights ? `${nights}n` : ""}` : tour.schedule ?? "Schedule pending", price: Number(tour.price ?? 0), currency: tour.currency ?? "VND", category: category ?? "Tour", capacity: `Max ${tour.capacity ?? 0} people` };
}
