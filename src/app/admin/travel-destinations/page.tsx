import { AdminCrudPage } from "@/components/admin/admin-crud-page";

export default function AdminDestinationsPage() {
  return <AdminCrudPage title="TravelDestination Management" noun="destinations" fields={["Name", "Category", "Price From"]} />;
}
