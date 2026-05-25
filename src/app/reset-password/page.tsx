import { Eye } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Almost There!" subtitle="Enter your new password and you're all set.">
      <h1 className="text-3xl font-bold">Create New Password</h1>
      <form className="mt-8 space-y-5">
        {["New Password", "Confirm New Password"].map((label) => (
          <label key={label} className="block text-sm font-semibold">{label}<span className="relative mt-2 block"><input className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-11" placeholder={label} type="password" /><Eye className="absolute right-4 top-3.5 size-5 text-slate-400" /></span></label>
        ))}
        <ul className="space-y-2 text-sm text-emerald-600">
          <li>✓ At least 8 characters</li>
          <li>✓ Include uppercase and lowercase letters</li>
          <li>✓ Include a number or symbol</li>
        </ul>
        <Button className="w-full">Reset Password</Button>
      </form>
    </AuthShell>
  );
}
