"use client";

import Link from "next/link";
import axios from "axios";
import { ArrowLeft, Eye, EyeOff, Globe2, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/use-auth-store";
import { canAccessRole, getDefaultRouteForRole, type UserRole } from "@/lib/auth";

declare global {
  interface Window {
    google?: any;
  }
}

const routeRoles: Array<[string, readonly UserRole[]]> = [
  ["/admin", ["admin"]],
  ["/staff", ["staff"]],
  ["/dashboard", ["customer"]]
];

function getPostLoginRoute(role?: string) {
  const redirect = new URLSearchParams(window.location.search).get("redirect");
  if (!redirect?.startsWith("/") || redirect.startsWith("//")) return getDefaultRouteForRole(role);

  const matchedRoute = routeRoles.find(([prefix]) => redirect === prefix || redirect.startsWith(`${prefix}/`));
  if (!matchedRoute) return redirect;

  return canAccessRole(role, matchedRoute[1]) ? redirect : getDefaultRouteForRole(role);
}

export default function LoginPage() {
  const router = useRouter();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const googleBtnRef = useRef<HTMLDivElement>(null);
  const { setUser } = useAuthStore();

  const handleGoogleResponse = useCallback(async (response: any) => {
    setLoading(true);
    setError("");

    try {
      const res = await authService.googleLogin({ id_token: response.credential });
      if (res.data.success) {
        const { token, user } = res.data.data;
        localStorage.setItem("travel360_token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        router.push(getPostLoginRoute(user?.role));
      } else {
        setError(res.data.message || "Google login failed");
      }
    } catch (err: unknown) {
      setError(getLoginError(err, "Google login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!googleClientId) return;

    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
        });
        if (googleBtnRef.current) {
          window.google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            width: "100%",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
          });
        }
      }
    };

    // Google script may already be loaded or not yet
    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      // Wait for the script to load
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [googleClientId, handleGoogleResponse]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await authService.login({ email, password });
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        localStorage.setItem("travel360_token", token);
        localStorage.setItem("user", JSON.stringify(user));
        setUser(user);
        router.push(getPostLoginRoute(user?.role));
      } else {
        setError(response.data.message || "Login failed");
      }
    } catch (err: unknown) {
      if (isEmailVerificationRequired(err)) {
        setOtp("");
        setSuccessMsg("Your account has not been verified. Enter the OTP sent to your email.");
        setIsVerifying(true);
        return;
      }
      setError(getLoginError(err, "An error occurred during login. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await authService.verifyEmail({ email, otp });
      if (response.data.success) {
        setOtp("");
        setIsVerifying(false);
        setSuccessMsg("Email verified successfully. You can now sign in.");
      } else {
        setError(response.data.message || "Verification failed");
      }
    } catch (err: unknown) {
      setError(getLoginError(err, "Invalid OTP or an error occurred."));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await authService.resendVerification({ email });
      setSuccessMsg(response.data.message || "A new verification code has been sent.");
    } catch (err: unknown) {
      setError(getLoginError(err, "Could not resend the verification code."));
    } finally {
      setLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <AuthShell title="Verify Email" subtitle="Enter the verification code to activate your account.">
        <div className="mb-8 flex justify-end">
          <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold">
            <Globe2 size={16} /> EN
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsVerifying(false);
            setOtp("");
            setError("");
            setSuccessMsg("");
          }}
          className="mb-4 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="mr-1 size-4" /> Back to Login
        </button>
        <h1 className="text-3xl font-bold">Verify Your Email</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter the 6-digit OTP sent to <span className="font-semibold text-slate-700">{email}</span>
        </p>

        <form onSubmit={handleVerifyOTP} className="mt-8 space-y-4">
          {successMsg ? <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">{successMsg}</div> : null}
          {error ? <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">{error}</div> : null}
          <label className="block text-sm font-semibold">
            Verification Code (OTP)
            <input
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 text-center text-xl tracking-widest outline-none focus:border-brand-600"
              placeholder="000000"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              pattern="[0-9]{6}"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            />
          </label>
          <Button className="w-full" type="submit" disabled={loading || otp.length !== 6}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Verify Email
          </Button>
          <button
            className="w-full text-sm font-semibold text-brand-600 disabled:opacity-50"
            type="button"
            disabled={loading}
            onClick={() => void handleResendOTP()}
          >
            Resend verification code
          </button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Welcome Back" subtitle="Log in to your Travel360 account and continue your journey around the world.">
      <div className="mb-8 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold">
          <Globe2 size={16} /> EN
        </button>
      </div>
      <h1 className="text-3xl font-bold">Welcome Back</h1>
      <p className="mt-2 text-sm text-slate-500">Please login to your account</p>
      
      <form onSubmit={handleLogin} className="mt-8 space-y-5">
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
        
        <label className="block text-sm font-semibold">
          Password
          <span className="relative mt-2 block">
            <input 
              className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-11 outline-none focus:border-brand-600" 
              placeholder="Enter your password" 
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
        
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-600">
            <input type="checkbox" /> Remember me
          </label>
          <Link href="/forgot-password" className="font-semibold text-brand-600">Forgot password?</Link>
        </div>
        
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign In
        </Button>
        
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" />or continue with<span className="h-px flex-1 bg-slate-200" />
        </div>
        
        {googleClientId ? (
          <div ref={googleBtnRef} className="flex justify-center [&>div]:w-full" />
        ) : (
          <div className="rounded-lg bg-amber-50 p-3 text-center text-sm font-semibold text-amber-700">
            Google login is not configured.
          </div>
        )}
      </form>
      
      <p className="mt-8 text-center text-sm text-slate-600">
        No account yet? <Link href="/register" className="font-bold text-brand-600">Sign up</Link>
      </p>
    </AuthShell>
  );
}

function getLoginError(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return fallback;

  const data = error.response?.data as { message?: string; error?: string } | undefined;
  if (data?.message || data?.error) return data.message ?? data.error ?? fallback;
  if (error.response?.status === 404) return "Login API was not found. Please check NEXT_PUBLIC_API_URL.";
  if (error.response?.status) return `Login failed with status ${error.response.status}.`;
  if (error.code === "ERR_NETWORK") return "Cannot connect to the API server. Please check if backend is running.";

  return fallback;
}

function isEmailVerificationRequired(error: unknown) {
  if (!axios.isAxiosError(error) || error.response?.status !== 403) return false;

  const data = error.response.data as {
    details?: { code?: string };
  } | undefined;

  return data?.details?.code === "EMAIL_NOT_VERIFIED";
}
