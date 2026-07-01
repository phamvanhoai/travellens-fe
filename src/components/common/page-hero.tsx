import { SearchPanel } from "@/components/common/search-panel";
import type { ReactNode } from "react";

export function PageHero({
  title,
  subtitle,
  image,
  search = true,
  searchContent
}: {
  title: string;
  subtitle: string;
  image: string;
  search?: boolean;
  searchContent?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="hero-overlay absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-3 text-lg text-white/85">{subtitle}</p>
        </div>
        {search ? <div className="mt-8 max-w-5xl">{searchContent ?? <SearchPanel compact />}</div> : null}
      </div>
    </section>
  );
}
