export default function TourDetailLoading() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" aria-label="Loading tour" aria-busy="true">
      <div className="flex gap-2">
        {Array.from({ length: 5 }, (_, index) => <div key={index} className={`h-3.5 animate-pulse rounded bg-slate-100 ${index % 2 ? "w-3" : "w-20"}`} />)}
      </div>
      <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="relative h-[460px] overflow-hidden rounded-lg bg-slate-200">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100/30 via-transparent to-slate-400/30" />
            <div className="absolute left-5 top-5 h-6 w-20 animate-pulse rounded-md bg-orange-200" />
            <div className="absolute bottom-5 left-1/2 size-14 -translate-x-1/2 animate-pulse rounded-full bg-white/60" />
          </div>
          <div className="mt-5 flex gap-3 overflow-hidden border-b border-slate-200 pb-3">
            {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-9 w-24 shrink-0 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
          <div className="mt-7 grid gap-8 lg:grid-cols-2">
            <div>
              <div className="h-8 w-4/5 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 space-y-2">{Array.from({ length: 4 }, (_, index) => <div key={index} className={`h-3.5 animate-pulse rounded bg-slate-100 ${index === 3 ? "w-2/3" : "w-full"}`} />)}</div>
              <div className="mt-5 grid grid-cols-2 gap-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-11 animate-pulse rounded-lg bg-brand-50" />)}</div>
              <div className="mt-7 h-5 w-24 animate-pulse rounded bg-slate-200" />
              <div className="mt-4 space-y-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />)}</div>
            </div>
            <div className="h-52 animate-pulse rounded-lg border border-slate-200 bg-white p-6"><div className="h-5 w-36 rounded bg-slate-200" /><div className="mt-5 space-y-3"><div className="h-3.5 w-full rounded bg-slate-100" /><div className="h-3.5 w-5/6 rounded bg-slate-100" /><div className="h-3.5 w-2/3 rounded bg-slate-100" /></div></div>
          </div>
          <div className="mt-10 h-80 animate-pulse rounded-lg border border-slate-200 bg-slate-100" />
          <div className="mt-10 grid gap-5 sm:grid-cols-2">{Array.from({ length: 2 }, (_, index) => <div key={index} className="h-48 animate-pulse rounded-lg bg-slate-100" />)}</div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-7 w-4/5 animate-pulse rounded bg-slate-200" />
            <div className="mt-3 h-3.5 w-3/5 animate-pulse rounded bg-slate-100" />
            <div className="mt-6 grid grid-cols-2 gap-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-4 w-24 animate-pulse rounded bg-slate-200" />)}</div>
            <div className="mt-7 h-3 w-12 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-8 w-40 animate-pulse rounded bg-slate-200" />
            <div className="mt-5 h-11 w-full animate-pulse rounded-lg bg-brand-100" />
            <div className="mt-3 h-11 w-full animate-pulse rounded-lg bg-slate-100" />
          </div>
          <div className="rounded-lg border border-slate-200 p-6">
            <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
            <div className="mt-5 h-3.5 w-12 animate-pulse rounded bg-slate-100" /><div className="mt-2 h-11 w-full animate-pulse rounded-lg bg-slate-100" />
            <div className="mt-5 h-3.5 w-14 animate-pulse rounded bg-slate-100" /><div className="mt-2 h-11 w-full animate-pulse rounded-lg bg-slate-100" />
            <div className="mt-5 h-11 w-full animate-pulse rounded-lg bg-brand-100" />
          </div>
        </aside>
      </div>
    </section>
  );
}
