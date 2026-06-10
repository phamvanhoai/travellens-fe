"use client";

import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isVerifying && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isVerifying, countdown]);

  const handleSendResetLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await authService.forgotPassword({ email });
      if (response.data.success) {
        setSuccessMsg(response.data.message || "Reset link sent to your email.");
        setIsVerifying(true);
        setCountdown(15);
      } else {
        setError(response.data.message || "Failed to send reset link");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the verification code");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await authService.verifyResetCode({ email, code: otp });
      if (response.data.success) {
        // Redirect to reset password page with reset_token
        router.push(`/reset-password?token=${response.data.data.reset_token}`);
      } else {
        setError(response.data.message || "Verification failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid code or an error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <AuthShell title="Verify Email" subtitle="We've sent a verification code to your email.">
        <button
          onClick={() => setIsVerifying(false)}
          className="mb-4 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="mr-1 size-4" /> Back
        </button>
        <h1 className="text-3xl font-bold">Verify Your Email</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter the verification code sent to <span className="font-semibold text-slate-700">{email}</span>
        </p>

        <form onSubmit={handleVerifyOTP} className="mt-8 space-y-4">
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

          <label className="block text-sm font-semibold">
            Verification Code
            <input
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 text-center text-xl tracking-widest outline-none focus:border-brand-600"
              placeholder="000000"
              type="text"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
          </label>

          <Button className="mt-4 w-full" type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Verify Code
          </Button>

          <div className="mt-4 text-center text-sm text-slate-600">
            {countdown > 0 ? (
              <p>Resend code in <span className="font-semibold text-brand-600">{countdown}s</span></p>
            ) : (
              <button
                type="button"
                onClick={() => handleSendResetLink()}
                disabled={loading}
                className="font-semibold text-brand-600 hover:underline disabled:opacity-50"
              >
                Gửi lại mã
              </button>
            )}
          </div>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Forgot Password?" subtitle="Enter your email address and we'll send a code to reset your password.">
      <h1 className="text-3xl font-bold">Reset Your Password</h1>
      <p className="mt-2 text-sm text-slate-500">We will send a reset code to your email.</p>

      <form onSubmit={handleSendResetLink} className="mt-8 space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}
        <label className="block text-sm font-semibold">
          Email Address
          <input
            className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-brand-600"
            placeholder="Enter your email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Send Reset Code
        </Button>
        <Button onClick={() => router.push("/login")} variant="outline" className="w-full" type="button">
          Back to Login
        </Button>
      </form>
    </AuthShell>
  );
}
