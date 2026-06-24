"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import DashboardProfilePage from "@/app/dashboard/profile/page";

export default function ProfilePage() {
  return (
    <AuthGuard allowedRoles={["admin", "staff", "customer"]}>
      <section className="bg-mist">
        <div className="mx-auto min-h-[720px] max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <DashboardProfilePage />
        </div>
      </section>
    </AuthGuard>
  );
}
