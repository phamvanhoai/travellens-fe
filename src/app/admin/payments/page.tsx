import { AdminCrudPage } from "@/components/admin/admin-crud-page";

export default function AdminPaymentsPage() {
  return <AdminCrudPage title="Payment Management" noun="payments and refunds" fields={["booking_id", "payment_status", "transaction_code"]} />;
}
