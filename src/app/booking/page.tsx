import { Minus, Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tours } from "@/lib/data";
import { currency } from "@/lib/utils";

export default function BookingPage() {
  const tour = tours[0];
  const passengers = [
    ["Adult", 2, tour.price],
    ["Child", 1, Math.round(tour.price * 0.65)],
    ["Infant", 0, 0]
  ] as const;
  const total = passengers.reduce((sum, [, count, price]) => sum + count * price, 0);

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
      <div>
        <h1 className="text-3xl font-bold">Create Booking</h1>
        <p className="mt-2 text-slate-500">Select passengers, add requests and continue to payment.</p>
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Passenger List</h2>
          <div className="mt-5 space-y-4">
            {passengers.map(([type, count, price]) => (
              <div key={type} className="flex items-center justify-between rounded-lg bg-slate-50 p-4">
                <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-white text-brand-600"><UserRound size={18} /></span><div><p className="font-bold">{type}</p><p className="text-sm text-slate-500">{currency(price)} each</p></div></div>
                <div className="flex items-center gap-3"><button className="grid size-8 place-items-center rounded-full border"><Minus size={14} /></button><span className="font-bold">{count}</span><button className="grid size-8 place-items-center rounded-full border"><Plus size={14} /></button></div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <input className="h-12 rounded-lg border border-slate-200 px-4" placeholder="passenger_name" />
            <select className="h-12 rounded-lg border border-slate-200 px-4"><option>age_category: adult</option><option>child</option><option>infant</option></select>
            <input className="h-12 rounded-lg border border-slate-200 px-4" placeholder="seat_number optional" />
            <input className="h-12 rounded-lg border border-slate-200 px-4" placeholder="special_request optional" />
          </div>
        </div>
      </div>
      <aside className="h-fit rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <img src={tour.image} alt={tour.title} className="h-44 w-full rounded-lg object-cover" />
        <h2 className="mt-4 text-xl font-bold">{tour.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{tour.destination}</p>
        <div className="mt-5 space-y-3 text-sm">
          {passengers.map(([type, count, price]) => <p key={type} className="flex justify-between"><span>{type} x {count}</span><span>{currency(count * price)}</span></p>)}
          <p className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{currency(total)}</span></p>
        </div>
        <Button href="/payment/checkout" className="mt-6 w-full">Submit Booking</Button>
      </aside>
    </section>
  );
}
