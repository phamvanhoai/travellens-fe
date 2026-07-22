export default function AiPageLoading() {
  return (
    <div aria-label="Loading AI travel assistant" aria-busy="true">
      <section className="bg-ink px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto h-10 w-3/5 max-w-lg animate-pulse rounded-xl bg-white/20" />
          <div className="mx-auto mt-4 h-4 w-2/5 animate-pulse rounded bg-white/10" />
          <div className="mx-auto mt-8 max-w-4xl rounded-2xl bg-white p-3 shadow-2xl">
            <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
            <div className="mt-3 flex justify-end border-t border-slate-100 pt-3"><div className="h-12 w-36 animate-pulse rounded-xl bg-brand-200" /></div>
          </div>
        </div>
      </section>
      <section className="bg-gradient-to-b from-slate-50 to-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-4 w-40 animate-pulse rounded bg-brand-100" />
          <div className="mt-3 h-7 w-64 animate-pulse rounded bg-slate-200" />
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="min-h-[430px] animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-hidden="true">
                <div className="h-56 bg-slate-200" />
                <div className="space-y-3 p-5"><div className="h-4 w-full rounded bg-slate-100" /><div className="h-4 w-5/6 rounded bg-slate-100" /><div className="h-4 w-2/3 rounded bg-slate-100" /></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
