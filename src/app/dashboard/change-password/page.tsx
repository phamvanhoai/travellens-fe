"use client";

import { useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/auth.service";

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyForm: PasswordForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

function getBackendErrorMessage(err: any, fallback: string) {
  const data = err?.response?.data;
  const bodyDetails = data?.details?.body;

  if (Array.isArray(bodyDetails) && bodyDetails.length > 0) {
    return bodyDetails.join("\n");
  }

  if (typeof bodyDetails === "string") {
    return bodyDetails;
  }

  if (Array.isArray(data?.details) && data.details.length > 0) {
    return data.details.join("\n");
  }

  if (typeof data?.details === "string") {
    return data.details;
  }

  return data?.message || err?.message || fallback;
}

export default function ChangePasswordPage() {
  const [form, setForm] = useState<PasswordForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputType = showPassword ? "text" : "password";

  const updateField = (field: keyof PasswordForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleReset = () => {
    setForm(emptyForm);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.newPassword !== form.confirmPassword) {
      setError("Confirm password does not match the new password.");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.changePassword(form);
      setForm(emptyForm);
      setSuccess(response.data?.message || "Password updated successfully.");
    } catch (err: any) {
      setError(getBackendErrorMessage(err, "Unable to update password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

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

      <form onSubmit={handleSubmit} onReset={handleReset} className="mt-8 max-w-xl space-y-5">
        {error ? <div className="whitespace-pre-line rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-600">{error}</div> : null}
        {success ? <div className="rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">{success}</div> : null}

        <label className="block text-sm font-semibold">
          Current Password
          <span className="relative mt-2 block">
            <input
              className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-11 outline-none focus:border-brand-600"
              type={inputType}
              placeholder="Enter current password"
              value={form.currentPassword}
              onChange={(event) => updateField("currentPassword", event.target.value)}
              disabled={loading}
              required
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 grid size-6 place-items-center text-slate-400" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>

        <label className="block text-sm font-semibold">
          New Password
          <span className="relative mt-2 block">
            <input
              className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-11 outline-none focus:border-brand-600"
              type={inputType}
              placeholder="Enter new password"
              value={form.newPassword}
              onChange={(event) => updateField("newPassword", event.target.value)}
              disabled={loading}
              minLength={8}
              required
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 grid size-6 place-items-center text-slate-400" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>

        <label className="block text-sm font-semibold">
          Confirm New Password
          <span className="relative mt-2 block">
            <input
              className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-11 outline-none focus:border-brand-600"
              type={inputType}
              placeholder="Confirm new password"
              value={form.confirmPassword}
              onChange={(event) => updateField("confirmPassword", event.target.value)}
              disabled={loading}
              minLength={8}
              required
            />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 grid size-6 place-items-center text-slate-400" aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </span>
        </label>

        <div className="rounded-lg bg-brand-50 p-4 text-sm text-brand-700">
          <ShieldCheck className="mr-2 inline size-4" />
          Use at least 8 characters with uppercase, lowercase, number or symbol.
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Update Password
          </Button>
          <Button type="reset" variant="outline" disabled={loading}>
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
