"use client";

import { useState } from "react";
import { CreditCard, Search } from "lucide-react";
import { Pagination } from "@/components/common/pagination";
import { currency } from "@/lib/utils";

type PaymentStatus = "Pending" | "Paid" | "Failed" | "Refunded";

type UserPayment = {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  transactionCode: string;
  currencyCode: string;
};

const payments: UserPayment[] = [
  { id: "PAY-3001", bookingId: "BK-2048", amount: 387, method: "Visa", status: "Paid", transactionCode: "TXN-827391", currencyCode: "USD" },
  { id: "PAY-3002", bookingId: "BK-2052", amount: 398, method: "SePay", status: "Pending", transactionCode: "TVL0002052ABCD", currencyCode: "VND" },
  { id: "PAY-3003", bookingId: "BK-2054", amount: 620, method: "Mastercard", status: "Paid", transactionCode: "TXN-827455", currencyCode: "USD" },
  { id: "PAY-3004", bookingId: "BK-2055", amount: 129, method: "Apple Pay", status: "Paid", transactionCode: "TXN-827461", currencyCode: "USD" },
  { id: "PAY-3005", bookingId: "BK-2060", amount: 450, method: "Visa", status: "Failed", transactionCode: "TXN-827498", currencyCode: "USD" },
  { id: "PAY-2988", bookingId: "BK-1988", amount: 356, method: "Visa", status: "Refunded", transactionCode: "TXN-826910", currencyCode: "USD" }
];

export default function PaymentsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const visibleItems = payments.filter((item) =>
    `${item.id} ${item.bookingId} ${item.method} ${item.status} ${item.transactionCode}`.toLowerCase().includes(query.toLowerCase())
  );
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginatedItems = visibleItems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Payment History</h1>
      <p className="mt-1 text-sm text-slate-500">Search your payment records and transaction details.</p>

      <div className="relative mt-6 max-w-md">
        <Search className="absolute left-3 top-3 size-5 text-slate-400" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-4 text-sm outline-none focus:border-brand-600"
          placeholder="Search payments..."
        />
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>{["Payment ID", "Booking ID", "Amount", "Method", "Status", "Transaction Code"].map((heading) => <th key={heading} className="p-3">{heading}</th>)}</tr>
          </thead>
          <tbody>
            {paginatedItems.map((payment) => (
              <tr key={payment.id} className="border-t border-slate-100">
                <td className="p-3 font-bold"><CreditCard className="mr-2 inline size-4 text-brand-600" />{payment.id}</td>
                <td className="p-3">{payment.bookingId}</td>
                <td className="p-3">{currency(payment.amount)} <span className="text-xs text-slate-500">{payment.currencyCode}</span></td>
                <td className="p-3">{payment.method}</td>
                <td className="p-3"><Status value={payment.status} /></td>
                <td className="p-3 text-slate-600">{payment.transactionCode}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={currentPage} pageCount={pageCount} totalItems={visibleItems.length} pageSize={pageSize} itemLabel="payments" onPageChange={setPage} />
    </div>
  );
}

function Status({ value }: { value: PaymentStatus }) {
  const style = value === "Paid" ? "bg-emerald-50 text-emerald-700" : value === "Failed" ? "bg-rose-50 text-rose-700" : value === "Refunded" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700";
  return <span className={`rounded-full px-3 py-1 text-xs font-bold ${style}`}>{value}</span>;
}
