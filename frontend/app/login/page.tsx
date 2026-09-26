"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { AlertCircle, CheckCircle2, UserPlus, LogIn } from "lucide-react";

export function LoginForm({ defaultMode }: { defaultMode?: "login" | "signup" }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isSignupRoute =
    defaultMode === "signup" ||
    pathname === "/signup" ||
    searchParams.get("mode") === "signup";

  const [mode, setMode] = useState<"login" | "signup">(isSignupRoute ? "signup" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (defaultMode === "signup" || pathname === "/signup" || searchParams.get("mode") === "signup") {
      setMode("signup");
    } else if (defaultMode === "login" || pathname === "/login" || searchParams.get("mode") === "login") {
      setMode("login");
    }
  }, [pathname, searchParams, defaultMode]);

  const switchMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
    if (newMode === "signup") {
      router.replace("/signup", { scroll: false });
    } else {
      router.replace("/login", { scroll: false });
    }
  };

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
        <div className="grid grid-cols-2 border-2 border-black bg-neutral-100 font-mono text-xs shadow-sm">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`py-3.5 px-4 flex items-center justify-center gap-2 font-bold uppercase transition-colors ${
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
            onClick={() => switchMode("signup")}
            className={`py-3.5 px-4 flex items-center justify-center gap-2 font-bold uppercase transition-colors ${
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
              ? "Register a new free operator account to deploy and monitor AI connectors."
              : "Authenticate to manage AI connectors and view live telemetry."}
          </p>
        </div>

        {/* Info Banner depending on mode */}
        {mode === "login" ? (
          <div className="border border-neutral-300 bg-neutral-50 p-3.5 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
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
            <div className="border-t border-neutral-200 pt-2 flex items-center justify-between text-[11px]">
              <span className="text-neutral-600">Need a new account?</span>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className="font-bold text-black hover:text-[#DE6E4B] underline"
              >
                Sign Up Here &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="border border-neutral-300 bg-neutral-50 p-3.5 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-black uppercase text-[10px]">NEW OPERATOR REGISTRATION</div>
                <div className="text-neutral-500 text-[11px]">Instant access to deploy & test AI connectors</div>
              </div>
              <span className="text-[10px] font-mono bg-black text-white px-2 py-0.5 font-bold uppercase">
                Free Tier
              </span>
            </div>
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

          <div className="text-center pt-3 border-t border-neutral-200">
            {mode === "login" ? (
              <p className="font-mono text-xs text-neutral-600">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className="font-bold text-black underline hover:text-[#DE6E4B] transition-colors"
                >
                  Create Account (Sign Up Free) &rarr;
                </button>
              </p>
            ) : (
              <p className="font-mono text-xs text-neutral-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-bold text-black underline hover:text-[#DE6E4B] transition-colors"
                >
                  Sign In Here &rarr;
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
