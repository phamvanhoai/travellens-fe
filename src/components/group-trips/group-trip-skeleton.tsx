export function GroupTripListSkeleton() {
  return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Loading group trips" aria-busy="true">
    {Array.from({ length: 6 }, (_, index) => <div key={index} className="min-h-[292px] animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="h-28 bg-brand-100" /><div className="p-5"><div className="h-3.5 w-full rounded bg-slate-100" /><div className="mt-2 h-3.5 w-4/5 rounded bg-slate-100" /><div className="mt-5 grid grid-cols-2 gap-3"><div className="h-14 rounded-xl bg-slate-100" /><div className="h-14 rounded-xl bg-slate-100" /></div><div className="mt-5 h-8 rounded bg-slate-100" /></div></div>)}
  </div>;
}

export function GroupTripDetailSkeleton() {
  return <div className="animate-pulse rounded-lg border border-slate-200 bg-white p-6 shadow-sm" aria-label="Loading group trip detail" aria-busy="true">
    <div className="h-9 w-32 rounded bg-slate-100" />
    <div className="mt-5 flex items-start justify-between gap-6"><div className="flex-1"><div className="h-6 w-20 rounded-full bg-slate-100" /><div className="mt-4 h-8 w-2/3 rounded bg-slate-200" /><div className="mt-3 h-4 w-4/5 rounded bg-slate-100" /></div><div className="flex gap-2"><div className="h-11 w-24 rounded-lg bg-slate-100" /><div className="h-11 w-24 rounded-lg bg-slate-100" /></div></div>
    <div className="mt-6 grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-3"><SkeletonLine width="w-3/4" /><SkeletonLine width="w-4/5" /><SkeletonLine width="w-2/3" /></div>
    <div className="mt-7"><div className="h-6 w-36 rounded bg-slate-200" /><div className="mt-3 h-[420px] rounded-lg bg-slate-100" /></div>
    <div className="mt-7"><div className="flex justify-between"><div className="h-6 w-28 rounded bg-slate-200" /><div className="h-10 w-28 rounded-lg bg-slate-100" /></div><div className="mt-4 grid gap-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="rounded-lg border border-slate-100 p-4"><div className="h-3 w-32 rounded bg-slate-100" /><div className="mt-3 h-5 w-1/2 rounded bg-slate-200" /><div className="mt-3 h-3.5 w-2/3 rounded bg-slate-100" /></div>)}</div></div>
    <div className="mt-7"><div className="h-6 w-32 rounded bg-slate-200" /><div className="mt-3 flex gap-2"><div className="h-9 w-28 rounded-full bg-slate-100" /><div className="h-9 w-28 rounded-full bg-slate-100" /></div></div>
  </div>;
}

function SkeletonLine({ width }: { width: string }) { return <div className={`h-4 rounded bg-slate-200 ${width}`} />; }
