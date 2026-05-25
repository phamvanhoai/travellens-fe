import { AdminCrudPage } from "@/components/admin/admin-crud-page";

export default function AdminBlogsPage() {
  return <AdminCrudPage title="Blog Management" noun="blogs" fields={["Title", "Author", "Approval"]} />;
}
