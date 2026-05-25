import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot Password?" subtitle="Enter your email address and we'll send a link to reset your password.">
      <h1 className="text-3xl font-bold">Reset Your Password</h1>
      <p className="mt-2 text-sm text-slate-500">We will send a reset link to your email.</p>
      <form className="mt-8 space-y-5">
        <label className="block text-sm font-semibold">Email Address<input className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4" placeholder="Enter your email" /></label>
        <Button className="w-full">Send Reset Link</Button>
        <Button href="/login" variant="outline" className="w-full">Back to Login</Button>
      </form>
      <p className="mt-8 text-center text-sm"><Link href="/reset-password" className="font-bold text-brand-600">I have a reset link</Link></p>
    </AuthShell>
  );
}
