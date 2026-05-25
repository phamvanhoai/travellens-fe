import { AdminCrudPage } from "@/components/admin/admin-crud-page";

export default function AdminMapsPage() {
  return <AdminCrudPage title="Map Management" noun="map files" fields={["Location", "File URL", "Attached"]} />;
}
