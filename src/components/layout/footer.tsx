import { Facebook, Instagram, Send, Twitter, Youtube } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="bg-[#031121] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <div className="mb-5 text-2xl font-bold">Travel<span className="text-brand-500">Lens</span></div>
          <p className="max-w-sm text-sm leading-6 text-slate-300">
            Your all-in-one travel companion for bookings, 360 experiences and smart AI recommendations.
          </p>
          <div className="mt-6 flex gap-3 text-slate-300">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon) => (
              <span key={Icon.displayName} className="grid size-9 place-items-center rounded-full bg-white/10">
                <Icon size={16} />
              </span>
            ))}
          </div>
        </div>
        {[
          { title: "Company", items: [{ label: "About Us" }, { label: "Careers" }, { label: "Press" }, { label: "Contact Us" }] },
          { title: "Support", items: [{ label: "Help Center" }, { label: "Terms & Conditions", href: "/terms-of-use" }, { label: "Privacy Policy", href: "/privacy-policy" }, { label: "FAQ" }] },
          { title: "Top Destinations", items: [{ label: "Vietnam", href: "/destinations" }, { label: "Tours", href: "/tours" }, { label: "Travel Feed", href: "/travel-feed" }, { label: "AI Assistant", href: "/ai" }] }
        ].map(({ title, items }) => (
          <div key={title}>
            <h3 className="mb-4 text-sm font-bold">{title}</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              {items.map((item) => <li key={item.label}>{item.href ? <Link href={item.href} className="transition hover:text-white">{item.label}</Link> : item.label}</li>)}
            </ul>
          </div>
        ))}
        <div className="md:col-span-2 lg:col-span-1">
          <h3 className="mb-4 text-sm font-bold">Newsletter</h3>
          <p className="mb-4 text-sm text-slate-300">Subscribe for offers and travel inspiration.</p>
          <div className="flex rounded-lg border border-white/15 bg-white/5 p-1">
            <input className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none placeholder:text-slate-500" placeholder="Enter your email" />
            <Button className="size-9 p-0" aria-label="Send">
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-white/10 px-4 py-6 text-xs text-slate-400 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p>© 2026 TravelLens. All rights reserved.</p>
        <p>VISA · Mastercard · PayPal · Apple Pay</p>
      </div>
    </footer>
  );
}
