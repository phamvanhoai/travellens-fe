export default function AiPageLoading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-label="Loading AI travel assistant" aria-busy="true">
      <div className="rounded-lg bg-ink p-8 text-white">
        <div className="size-12 animate-pulse rounded-xl bg-white/15" />
        <div className="mt-5 h-10 w-3/5 max-w-lg animate-pulse rounded bg-white/20" />
        <div className="mt-4 max-w-2xl space-y-2">
          <div className="h-3.5 w-full animate-pulse rounded bg-white/10" />
          <div className="h-3.5 w-4/5 animate-pulse rounded bg-white/10" />
        </div>
        <div className="mt-6 flex max-w-2xl gap-3">
          <div className="h-12 min-w-0 flex-1 animate-pulse rounded-lg bg-white/10" />
          <div className="h-12 w-28 animate-pulse rounded-lg bg-brand-500/50" />
        </div>
      </div>

      <div className="mt-10 h-7 w-56 animate-pulse rounded bg-slate-200" />
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" aria-hidden="true">
            <div className="relative h-52 animate-pulse bg-slate-200"><div className="absolute right-3 top-3 size-9 rounded-full bg-white/70" /></div>
            <div className="p-4">
              <div className="flex justify-between gap-4">
                <div className="min-w-0 flex-1 space-y-2"><div className="h-4 w-4/5 animate-pulse rounded bg-slate-200" /><div className="h-3 w-3/5 animate-pulse rounded bg-slate-100" /></div>
                <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
              </div>
              <div className="mt-4 h-4 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
