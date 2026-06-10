"use client";

import { Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");

  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (tokenFromUrl) {
      setResetToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setError("Reset token is missing. Please request a new password reset.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await authService.resetPassword({ reset_token: resetToken, new_password: newPassword });
      if (response.data.success) {
        setSuccessMsg(response.data.message || "Password reset successfully!");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(response.data.message || "Failed to reset password");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Almost There!" subtitle="Enter your new password and you're all set.">
      <h1 className="text-3xl font-bold">Create New Password</h1>
      
      <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
        {successMsg && (
          <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {!tokenFromUrl && (
           <label className="block text-sm font-semibold">
             Reset Token
             <input 
               className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-brand-600" 
               placeholder="Enter your reset token" 
               type="text"
               required
               value={resetToken}
               onChange={(e) => setResetToken(e.target.value)}
             />
           </label>
        )}

        <label className="block text-sm font-semibold">
          New Password
          <span className="relative mt-2 block">
            <input 
              className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-11 outline-none focus:border-brand-600" 
              placeholder="New Password" 
              type={showPassword ? "text" : "password"}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </span>
        </label>

        <label className="block text-sm font-semibold">
          Confirm New Password
          <span className="relative mt-2 block">
            <input 
              className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-11 outline-none focus:border-brand-600" 
              placeholder="Confirm New Password" 
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button 
              type="button" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </span>
        </label>

        <ul className="space-y-2 text-sm text-emerald-600">
          <li>✓ At least 8 characters</li>
          <li>✓ Include uppercase and lowercase letters</li>
          <li>✓ Include a number or symbol</li>
        </ul>
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Reset Password
        </Button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthShell title="Almost There!" subtitle="Loading...">
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-600" /></div>
      </AuthShell>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
