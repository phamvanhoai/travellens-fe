import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PaymentFailedPage() {
  return (
    <section className="mx-auto max-w-xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <XCircle className="mx-auto size-20 text-rose-600" />
      <h1 className="mt-6 text-3xl font-bold">Payment Failed</h1>
      <p className="mt-3 text-slate-600">The transaction could not be completed. You can retry or choose another method.</p>
      <Button href="/payment/checkout" className="mt-8">Try Again</Button>
    </section>
  );
}
