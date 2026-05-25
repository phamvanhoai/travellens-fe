import { AdminCrudPage } from "@/components/admin/admin-crud-page";

export default function AdminView360Page() {
  return <AdminCrudPage title="View360 Management" noun="360 scenes and images" fields={["Location", "order_index", "Audio"]} />;
}
