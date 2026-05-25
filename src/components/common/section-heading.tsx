import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ title, subtitle, href }: { title: string; subtitle?: string; href?: string }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-2xl font-bold text-ink md:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="inline-flex items-center gap-2 text-sm font-bold text-brand-600">
          View all <ArrowRight size={16} />
        </Link>
      ) : null}
    </div>
  );
}
