import { PageHero } from "@/components/common/page-hero";
import { destinations, images } from "@/lib/data";

export default function BlogsPage() {
  return (
    <>
      <PageHero title="Travel Stories & Guides" subtitle="Ideas, destination guides and traveler reviews" image={images.balloons} search={false} />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {destinations.slice(0, 6).map((item) => (
            <a key={item.id} href={`/blogs/${item.id}`} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <img src={item.image} alt={item.name} className="h-56 w-full object-cover" />
              <div className="p-5">
                <p className="text-xs font-bold uppercase tracking-wide text-brand-600">{item.category}</p>
                <h2 className="mt-2 text-xl font-bold">A first-timer guide to {item.name}</h2>
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">{item.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </>
  );
}
