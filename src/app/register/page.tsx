"use client";

import Link from "next/link";
import { Eye, EyeOff, Globe2, Loader2, ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/use-auth-store";
import { getDefaultRouteForRole } from "@/lib/auth";

declare global {
  interface Window {
    google?: any;
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
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
        router.push(getDefaultRouteForRole(user?.role));
      } else {
        setError(res.data.message || "Google login failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isVerifying) return;
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

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [googleClientId, handleGoogleResponse, isVerifying]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("Please agree to the Terms & Conditions and Privacy Policy");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setLoading(true);
    setError("");

    try {
      const response = await authService.register({ 
        name, 
        email, 
        password,
        confirm_password: confirmPassword
      });
      
      if (response.data.success) {
        setSuccessMsg(response.data.message || "Registration successful! Please check your email for the OTP.");
        setIsVerifying(true);
      } else {
        setError(response.data.message || "Registration failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during registration. Please try again.");
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
        // OTP verified successfully. Redirect to login
        router.push("/login");
      } else {
        setError(response.data.message || "Verification failed");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP or an error occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <AuthShell title="Verify Email" subtitle="We've sent a verification code to your email.">
        <div className="mb-8 flex justify-end">
          <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold">
            <Globe2 size={16} /> EN
          </button>
        </div>
        <button 
          onClick={() => setIsVerifying(false)}
          className="mb-4 inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="mr-1 size-4" /> Back to Register
        </button>
        <h1 className="text-3xl font-bold">Verify Your Email</h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter the 6-digit OTP sent to <span className="font-semibold text-slate-700">{email}</span>
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
            Verification Code (OTP)
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
            Verify Email
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create Account" subtitle="Join Travel360 and start exploring amazing places around the world.">
      <div className="mb-8 flex justify-end">
        <button className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold">
          <Globe2 size={16} /> EN
        </button>
      </div>
      <h1 className="text-3xl font-bold">Create Your Account</h1>
      <p className="mt-2 text-sm text-slate-500">Sign up to get started</p>
      
      <form onSubmit={handleRegister} className="mt-8 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}
        
        <label className="block text-sm font-semibold">
          Full Name
          <input 
            className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 outline-none focus:border-brand-600" 
            placeholder="Enter your full name" 
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        
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
              placeholder="Password" 
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
        
        <label className="block text-sm font-semibold">
          Confirm Password
          <span className="relative mt-2 block">
            <input 
              className="h-12 w-full rounded-lg border border-slate-200 px-4 pr-11 outline-none focus:border-brand-600" 
              placeholder="Confirm Password" 
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
        
        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input 
            type="checkbox" 
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1"
          /> 
          <span>I agree to the <a href="/terms-of-use" target="_blank" className="font-semibold text-brand-700 hover:underline">Terms of Use</a> and <a href="/privacy-policy" target="_blank" className="font-semibold text-brand-700 hover:underline">Privacy Policy</a>.</span>
        </label>
        
        <Button className="w-full" type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign Up
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
        Already have an account? <Link href="/login" className="font-bold text-brand-600">Sign in</Link>
      </p>
    </AuthShell>
  );
}
