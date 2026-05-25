import { Bot, Sparkles } from "lucide-react";
import { DestinationCard } from "@/components/cards/destination-card";
import { Button } from "@/components/ui/button";
import { destinations } from "@/lib/data";

export default function AiPage() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-lg bg-ink p-8 text-white">
        <Bot className="size-12 text-brand-400" />
        <h1 className="mt-5 text-4xl font-bold">AI Travel Assistant</h1>
        <p className="mt-3 max-w-2xl text-white/75">Ask for destination ideas, compare tours or get personalized recommendations based on budget, dates and travel style.</p>
        <div className="mt-6 flex max-w-2xl gap-3">
          <input className="h-12 min-w-0 flex-1 rounded-lg border border-white/15 bg-white/10 px-4 outline-none placeholder:text-white/50" placeholder="Plan me a 7-day family trip..." />
          <Button><Sparkles size={17} /> Suggest</Button>
        </div>
      </div>
      <h2 className="mt-10 text-2xl font-bold">Recommended for You</h2>
      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {destinations.slice(0, 4).map((item) => <DestinationCard key={item.id} destination={item} />)}
      </div>
    </section>
  );
}
