import { AdminCrudPage } from "@/components/admin/admin-crud-page";

export default function AdminUsersPage() {
  return <AdminCrudPage title="User Management" noun="users" fields={["Name", "Role", "Status"]} />;
}
