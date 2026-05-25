import Link from "next/link";
import { Eye, Globe2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
  return (
    <AuthShell title="Create Account" subtitle="Join Travel360 and start exploring amazing places around the world.">
      <div className="mb-8 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold"><Globe2 size={16} /> EN</button>
      </div>
      <h1 className="text-3xl font-bold">Create Your Account</h1>
      <p className="mt-2 text-sm text-slate-500">Sign up to get started</p>
      <form className="mt-8 space-y-4">
        {["Full Name", "Email Address"].map((label) => <label key={label} className="block text-sm font-semibold">{label}<input className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-brand-600" placeholder={label === "Full Name" ? "Enter your full name" : "Enter your email"} /></label>)}
        {["Password", "Confirm Password"].map((label) => <label key={label} className="block text-sm font-semibold">{label}<span className="relative mt-2 block"><input className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-11 outline-none focus:border-brand-600" placeholder={label} type="password" /><Eye className="absolute right-4 top-3.5 size-5 text-slate-400" /></span></label>)}
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" /> I agree to the Terms & Conditions and Privacy Policy</label>
        <Button className="w-full">Sign Up</Button>
        <div className="flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200" />or continue with<span className="h-px flex-1 bg-slate-200" /></div>
        <Button variant="outline" className="w-full">G Continue with Google</Button>
      </form>
      <p className="mt-8 text-center text-sm text-slate-600">Already have an account? <Link href="/login" className="font-bold text-brand-600">Sign in</Link></p>
    </AuthShell>
  );
}
