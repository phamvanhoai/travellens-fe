import { Button } from "@/components/ui/button";
import { bookings } from "@/lib/data";
import { currency } from "@/lib/utils";

export default function BookingsPage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Booking History</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500"><tr>{["Booking ID", "Tour", "Date", "Guests", "Status", "Amount", "Action"].map((h) => <th key={h} className="p-3">{h}</th>)}</tr></thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-t border-slate-100">
                <td className="p-3 font-bold">{booking.id}</td><td className="p-3">{booking.tour}</td><td className="p-3">{booking.date}</td><td className="p-3">{booking.guests}</td><td className="p-3">{booking.status}</td><td className="p-3">{currency(booking.amount)}</td><td className="p-3"><Button variant="outline" className="h-9 px-3">Cancel</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
