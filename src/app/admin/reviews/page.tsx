import { AdminCrudPage } from "@/components/admin/admin-crud-page";

export default function AdminReviewsPage() {
  return <AdminCrudPage title="Review Management" noun="reviews" fields={["User", "Rating", "Moderation"]} />;
}
