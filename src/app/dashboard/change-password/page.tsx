"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChangePasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPassword ? "text" : "password";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <span className="grid size-12 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <KeyRound size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Change Password</h1>
          <p className="mt-1 text-sm text-slate-500">Update your account password using your current password.</p>
        </div>
      </div>

      <form className="mt-8 max-w-xl space-y-5">
        {[
          ["Current Password", "Enter current password"],
          ["New Password", "Enter new password"],
          ["Confirm New Password", "Confirm new password"]
        ].map(([label, placeholder]) => (
          <label key={label} className="block text-sm font-semibold">
            {label}
            <span className="relative mt-2 block">
              <input className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-11 outline-none focus:border-brand-600" type={inputType} placeholder={placeholder} />
              <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 grid size-6 place-items-center text-slate-400" aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>
        ))}

        <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-700">
          <ShieldCheck className="mr-2 inline size-4" />
          Use at least 8 characters with uppercase, lowercase, number or symbol.
        </div>

        <div className="flex gap-3">
          <Button type="submit">Update Password</Button>
          <Button type="reset" variant="outline">Reset</Button>
        </div>
      </form>
    </div>
  );
}
