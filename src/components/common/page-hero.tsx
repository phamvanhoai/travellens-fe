import { SearchPanel } from "@/components/common/search-panel";
import type { ReactNode } from "react";

export function PageHero({
  title,
  subtitle,
  image,
  search = true,
  searchContent,
  searchClassName = "max-w-5xl"
}: {
  title: string;
  subtitle: string;
  image: string;
  search?: boolean;
  searchContent?: ReactNode;
  searchClassName?: string;
}) {
  return (
    <section className="relative overflow-hidden">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="hero-overlay absolute inset-0" />
      <div className="relative mx-auto max-w-7xl px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-white/85">{subtitle}</p>
        </div>
        {search ? <div className={`mt-8 ${searchClassName}`}>{searchContent ?? <SearchPanel compact />}</div> : null}
      </div>
    </section>
  );
}
