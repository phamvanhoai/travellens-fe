import { destinations } from "@/lib/data";

export default async function BlogDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = destinations.find((destination) => destination.id === id) ?? destinations[0];

  return (
    <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <img src={item.image} alt={item.name} className="h-[460px] w-full rounded-lg object-cover" />
      <p className="mt-8 text-sm font-bold uppercase tracking-wide text-brand-600">Travel guide</p>
      <h1 className="mt-3 text-4xl font-bold">A first-timer guide to {item.name}, {item.country}</h1>
      <p className="mt-5 text-lg leading-8 text-slate-600">{item.description} This guide covers the best season to visit, suggested tours, local dining, 360 previews and booking tips for a smoother trip.</p>
      <h2 className="mt-8 text-2xl font-bold">What to plan</h2>
      <p className="mt-3 leading-7 text-slate-600">Start with a flexible tour, keep one free afternoon for walking, and use the virtual tour page to compare viewpoints before deciding where to stay.</p>
    </article>
  );
}
