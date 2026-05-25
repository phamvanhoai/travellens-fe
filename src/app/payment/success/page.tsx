import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentSuccessPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <CheckCircle2 className="mx-auto size-20 text-emerald-600" />
      <h1 className="mt-6 text-3xl font-bold">Payment Success</h1>
      <p className="mt-3 text-slate-600">Your booking is confirmed. Transaction code: TXN-827391.</p>
      <Button href="/dashboard/bookings" className="mt-8">View Booking Status</Button>
    </section>
  );
}
