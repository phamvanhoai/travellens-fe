"use client";

import { Check, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { destinationService, getPublicDestinationId } from "@/services/destination.service";
import { getPublicLocationId, locationService } from "@/services/location.service";

type Result = { id: number; name: string };

export function PlaceSearchPicker({ kind, value, selectedLabel, onSelect }: { kind: "destination" | "location"; value: string; selectedLabel?: string; onSelect: (id: string, name: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const keyword = query.trim();
    if (keyword.length < 2) { setResults([]); setLoading(false); return; }
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const items = kind === "destination"
          ? (await destinationService.list({ page: 1, limit: 8, search: keyword, sortBy: "name", sortOrder: "ASC" })).items.map((item) => ({ id: getPublicDestinationId(item), name: item.name ?? item.title ?? `Destination #${getPublicDestinationId(item)}` }))
          : (await locationService.list({ page: 1, limit: 8, search: keyword, sortBy: "name", sortOrder: "ASC" })).map((item) => ({ id: getPublicLocationId(item), name: item.name ?? item.title ?? `Location #${getPublicLocationId(item)}` }));
        if (active) setResults(items.filter((item) => item.id));
      } catch { if (active) setResults([]); }
      finally { if (active) setLoading(false); }
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [kind, query]);

  if (value) return <div className="flex h-11 items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm"><span className="flex min-w-0 items-center gap-2 font-semibold text-emerald-800"><Check size={16} /><span className="truncate">{selectedLabel || `${kind === "destination" ? "Destination" : "Location"} #${value}`}</span></span><button type="button" onClick={() => { onSelect("", ""); setQuery(""); }} className="text-emerald-700" aria-label="Clear selected place"><X size={17} /></button></div>;

  return <div className="relative"><Search className="absolute left-3 top-3 size-5 text-slate-400" /><input value={query} onChange={(event) => { setQuery(event.target.value); setOpen(true); }} onFocus={() => setOpen(true)} className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 outline-none focus:border-brand-600" placeholder={`Type at least 2 characters to search ${kind}s`} />{open && query.trim().length >= 2 ? <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg">{loading ? <p className="p-3 text-sm text-slate-500">Searching...</p> : results.length ? results.map((item) => <button key={item.id} type="button" onClick={() => { onSelect(String(item.id), item.name); setOpen(false); setQuery(""); }} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-brand-50">{item.name}</button>) : <p className="p-3 text-sm text-slate-500">No matching {kind}s found.</p>}</div> : null}</div>;
}
