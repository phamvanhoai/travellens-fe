"use client";

import Link from "next/link";
import { Eye, EyeOff, Globe2, Loader2 } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
    } catch (err: any) {
      setError(err.response?.data?.message || "Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
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
  }, [handleGoogleResponse]);

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
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
        
        <div ref={googleBtnRef} className="flex justify-center [&>div]:w-full" />
      </form>
      
      <p className="mt-8 text-center text-sm text-slate-600">
        No account yet? <Link href="/register" className="font-bold text-brand-600">Sign up</Link>
      </p>
    </AuthShell>
  );
}

