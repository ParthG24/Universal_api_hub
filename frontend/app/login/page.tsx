"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { AlertCircle, CheckCircle2, UserPlus, LogIn } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setMode("signup");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === "signup") {
        await api.signup(email, password);
        setSuccessMsg("Account created successfully! Redirecting to dashboard...");
      } else {
        await api.login(email, password);
      }
      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: any) {
      setError(err.message || (mode === "signup" ? "Registration failed." : "Invalid email or password."));
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setMode("login");
    setEmail("admin@universalhub.dev");
    setPassword("Admin123!");
    setError(null);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-6 py-16 bg-white">
      <div className="w-full max-w-sm space-y-6">
        {/* Top Mode Selector Tabs */}
        <div className="grid grid-cols-2 border border-black bg-neutral-100 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
            }}
            className={`py-3 px-4 flex items-center justify-center gap-2 font-bold uppercase transition-colors ${
              mode === "login"
                ? "bg-black text-white"
                : "text-black hover:bg-neutral-200"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
            className={`py-3 px-4 flex items-center justify-center gap-2 font-bold uppercase transition-colors ${
              mode === "signup"
                ? "bg-black text-white"
                : "text-black hover:bg-neutral-200"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Sign Up
          </button>
        </div>

        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-sans font-black uppercase tracking-tight text-black">
            {mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}
          </h1>
          <p className="font-mono text-xs text-neutral-600">
            {mode === "signup"
              ? "Register your operator account to deploy and monitor AI connectors."
              : "Authenticate to manage AI connectors and view live telemetry."}
          </p>
        </div>

        {/* Demo Credentials Pill (Visible on Login) */}
        {mode === "login" && (
          <div className="border border-neutral-300 bg-neutral-50 p-3.5 flex items-center justify-between font-mono text-xs">
            <div>
              <div className="font-bold text-black uppercase text-[10px]">Demo Evaluator</div>
              <div className="text-neutral-500 text-[11px]">admin@universalhub.dev</div>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-[11px] font-bold uppercase text-[#DE6E4B] hover:text-black transition-colors"
            >
              [Auto-Fill]
            </button>
          </div>
        )}

        {error && (
          <div className="border border-red-600 bg-red-50 p-3 text-xs font-mono text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="border border-green-600 bg-green-50 p-3 text-xs font-mono text-green-700 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="border border-black bg-white p-7 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full surge-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black">
              Password {mode === "signup" && <span className="text-neutral-400 font-normal">(min 6 chars)</span>}
            </label>
            <input
              type="password"
              required
              minLength={mode === "signup" ? 6 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full surge-input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-surge btn-surge-black py-3 text-xs tracking-widest mt-2 uppercase font-mono font-bold"
          >
            {isLoading
              ? mode === "signup"
                ? "Creating Account..."
                : "Authenticating..."
              : mode === "signup"
              ? "Create Account →"
              : "Sign In →"}
          </button>

          <div className="text-center pt-2 border-t border-neutral-100">
            {mode === "login" ? (
              <p className="font-mono text-xs text-neutral-500">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                  }}
                  className="font-bold text-[#DE6E4B] hover:underline"
                >
                  Sign Up
                </button>
              </p>
            ) : (
              <p className="font-mono text-xs text-neutral-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                  }}
                  className="font-bold text-[#DE6E4B] hover:underline"
                >
                  Sign In
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-[75vh] flex items-center justify-center font-mono text-xs">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
