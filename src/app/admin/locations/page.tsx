import { AdminCrudPage } from "@/components/admin/admin-crud-page";

export default function AdminLocationsPage() {
  return <AdminCrudPage title="Location Management" noun="locations" fields={["Name", "Destination", "Map"]} />;
}
