import { ShieldCheck } from "lucide-react";
import { images } from "@/lib/data";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="min-h-[calc(100vh-80px)] bg-[#031121] p-4">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg bg-white shadow-soft lg:grid-cols-[1.15fr_1fr]">
        <div className="relative hidden min-h-[640px] p-9 text-white lg:block">
          <img src={images.santorini} alt="Santorini" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-brand-950/62" />
          <div className="relative">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <ShieldCheck /> Travel<span className="text-brand-400">360</span>
            </div>
            <h1 className="mt-24 max-w-sm text-4xl font-bold">{title}</h1>
            <p className="mt-4 max-w-sm leading-7 text-white/86">{subtitle}</p>
            <div className="mt-10 space-y-5">
              {["Exclusive deals", "Personalized trips", "Manage bookings"].map((item) => (
                <div key={item} className="rounded-lg bg-white/10 p-4">
                  <p className="font-bold">{item}</p>
                  <p className="text-sm text-white/75">Everything you need for a smoother travel journey.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center p-6 md:p-12">
          <div className="w-full">{children}</div>
        </div>
      </div>
    </section>
  );
}
