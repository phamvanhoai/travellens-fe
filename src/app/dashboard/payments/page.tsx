import { bookings } from "@/lib/data";
import { currency } from "@/lib/utils";

export default function PaymentsPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Payment History</h1>
      <div className="mt-6 grid gap-4">
        {bookings.map((booking) => (
          <div key={booking.id} className="rounded-lg bg-slate-50 p-4">
            <p className="font-bold">Transaction for {booking.id}</p>
            <p className="mt-1 text-sm text-slate-600">payment_status: Paid · payment_method: Visa · transaction_code: TXN-{booking.id.replace("BK-", "")} · amount: {currency(booking.amount)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
