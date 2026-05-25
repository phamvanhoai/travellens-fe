import { CreditCard, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentCheckoutPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold">Payment Checkout</h1>
      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          {["booking_id: BK-2048", "amount: $387", "currency: USD", "payment_method: Visa"].map((item) => <div key={item} className="rounded-lg bg-slate-50 p-4 text-sm font-semibold">{item}</div>)}
        </div>
        <label className="mt-6 block text-sm font-semibold">Card Number<div className="relative mt-2"><CreditCard className="absolute left-4 top-3.5 size-5 text-slate-400" /><input className="h-12 w-full rounded-lg border border-slate-200 pl-12 pr-4" placeholder="4242 4242 4242 4242" /></div></label>
        <Button href="/payment/success" className="mt-6 w-full"><LockKeyhole size={16} /> Pay Securely</Button>
      </div>
    </section>
  );
}
