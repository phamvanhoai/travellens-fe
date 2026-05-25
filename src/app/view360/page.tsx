"use client";

import { ArrowLeft, Headphones, Maximize, Pause, Play, Volume2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { destinations } from "@/lib/data";

export default function View360Page() {
  const [scene, setScene] = useState(destinations[0]);

  return (
    <section className="relative min-h-[calc(100vh-80px)] overflow-hidden bg-ink text-white">
      <img src={scene.image} alt={scene.name} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/35" />
      <div className="relative flex min-h-[calc(100vh-80px)] flex-col justify-between p-5 md:p-8">
        <div className="flex items-center justify-between">
          <Link href="/destinations" className="inline-flex items-center gap-2 rounded-lg bg-black/45 px-4 py-2 text-sm font-bold"><ArrowLeft size={17} /> Back</Link>
          <div className="flex gap-2">
            {[Headphones, Volume2, Maximize].map((Icon) => <button key={Icon.displayName} className="grid size-11 place-items-center rounded-lg bg-black/45"><Icon size={18} /></button>)}
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Scene 01 · order_index</span>
            <h1 className="mt-4 text-5xl font-bold">{scene.name}, {scene.country}</h1>
            <p className="mt-3 max-w-2xl text-white/82">{scene.description}</p>
            <button className="mt-6 inline-flex size-16 items-center justify-center rounded-full bg-white text-brand-600"><Play fill="currentColor" /></button>
          </div>
          <aside className="rounded-lg bg-black/45 p-5 backdrop-blur">
            <h2 className="text-lg font-bold">Scene Navigation</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {destinations.slice(0, 6).map((item) => (
                <button key={item.id} onClick={() => setScene(item)} className="overflow-hidden rounded-lg text-left">
                  <img src={item.image} alt={item.name} className="h-24 w-full object-cover" />
                  <span className="block bg-white/10 p-2 text-xs font-bold">{item.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 flex items-center justify-between rounded-lg bg-white/10 p-3 text-sm">
              <span>Audio narration</span>
              <Pause size={17} />
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
