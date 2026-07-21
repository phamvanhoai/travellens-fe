export function AdminStatisticsSkeleton() {
  return (
    <div className="grid min-w-0 gap-6 animate-pulse" aria-label="Loading statistics" aria-busy="true">
      <div><div className="h-8 w-64 max-w-full rounded bg-slate-200" /><div className="mt-2 h-4 w-96 max-w-full rounded bg-slate-100" /></div>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
        {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-10 rounded-lg bg-slate-200" />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 rounded-xl border border-slate-200 bg-white p-5"><div className="h-3 w-24 rounded bg-slate-200" /><div className="mt-5 h-7 w-16 rounded bg-slate-200" /></div>)}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 2 }, (_, index) => <div key={index} className="h-80 rounded-xl border border-slate-200 bg-white p-6"><div className="h-5 w-36 rounded bg-slate-200" /><div className="mx-auto mt-10 size-48 max-w-full rounded-full bg-slate-100" /></div>)}
      </div>
    </div>
  );
}
