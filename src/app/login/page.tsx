import Link from "next/link";
import { Eye, Globe2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <AuthShell title="Welcome Back" subtitle="Log in to your Travel360 account and continue your journey around the world.">
      <div className="mb-8 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"><Globe2 size={16} /> EN</button>
      </div>
      <h1 className="text-3xl font-bold">Welcome Back</h1>
      <p className="mt-2 text-sm text-slate-500">Please login to your account</p>
      <form className="mt-8 space-y-5">
        <label className="block text-sm font-semibold">Email Address<input className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-brand-600" placeholder="Enter your email" /></label>
        <label className="block text-sm font-semibold">Password<span className="relative mt-2 block"><input className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-11 outline-none focus:border-brand-600" placeholder="Enter your password" type="password" /><Eye className="absolute right-4 top-3.5 size-5 text-slate-400" /></span></label>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600"><input type="checkbox" /> Remember me</label>
          <Link href="/forgot-password" className="font-semibold text-brand-600">Forgot password?</Link>
        </div>
        <Button className="w-full">Sign In</Button>
        <div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />or continue with<span className="h-px flex-1 bg-slate-200" /></div>
        <Button variant="outline" className="w-full">G Continue with Google</Button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-600">No account yet? <Link href="/register" className="font-bold text-brand-600">Sign up</Link></p>
    </AuthShell>
  );
}
