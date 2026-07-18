"use client";

import Link from "next/link";
import { Bot } from "lucide-react";

export function Chatbot() {
  return (
    <Link
      href="/ai"
      className="fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-brand-600 text-white shadow-soft transition hover:scale-105 hover:bg-brand-700"
      aria-label="Open AI Assistant"
      title="Khám phá AI Travel Assistant"
    >
      <Bot size={24} />
    </Link>
  );
}
