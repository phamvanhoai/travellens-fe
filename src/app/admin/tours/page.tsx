import { AdminCrudPage } from "@/components/admin/admin-crud-page";

export default function AdminToursPage() {
  return <AdminCrudPage title="Tour Management" noun="tours" fields={["Title", "Capacity", "Price"]} />;
}
