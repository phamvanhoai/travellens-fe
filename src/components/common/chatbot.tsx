"use client";

import { useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const messages = [
    { from: "ai", text: "Hi, I can suggest destinations, compare tours or help with a booking." },
    { from: "user", text: "I want a beach trip with cultural activities." },
    { from: "ai", text: "Santorini and Bali are great fits. Bali is better value; Santorini has stronger 360 previews." }
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-brand-600 text-white shadow-soft"
        aria-label="Open AI assistant"
      >
        <Bot size={24} />
      </button>
      {open ? (
        <div className="fixed bottom-24 right-5 z-50 w-[calc(100vw-40px)] max-w-sm overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft">
          <div className="flex items-center justify-between bg-ink px-4 py-3 text-white">
            <div className="flex items-center gap-2 font-bold"><Sparkles size={17} /> AI Travel Assistant</div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant">
              <X size={18} />
            </button>
          </div>
          <div className="space-y-3 p-4">
            {messages.map((message, index) => (
              <div key={index} className={message.from === "ai" ? "mr-8 rounded-lg bg-slate-100 p-3 text-sm" : "ml-8 rounded-lg bg-brand-600 p-3 text-sm text-white"}>
                {message.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-slate-100 p-3">
            <input className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand-500" placeholder="Ask about your trip..." />
            <Button className="size-11 p-0" aria-label="Send message"><Send size={17} /></Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
