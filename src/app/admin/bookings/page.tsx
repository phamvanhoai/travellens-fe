import { AdminCrudPage } from "@/components/admin/admin-crud-page";

export default function AdminBookingsPage() {
  return <AdminCrudPage title="Booking Management" noun="bookings" fields={["User", "Tour", "Booking Status"]} />;
}
