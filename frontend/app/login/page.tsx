"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.login(email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@universalhub.dev");
    setPassword("Admin123!");
    setError(null);
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-6 py-16 bg-white">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-sans font-black uppercase tracking-tight text-black">
            ADMIN SIGN IN
          </h1>
          <p className="font-mono text-xs text-neutral-600">
            Authenticate to manage AI connectors and view telemetry.
          </p>
        </div>

        {/* Demo Credentials Pill */}
        <div className="border border-neutral-300 bg-neutral-50 p-3.5 flex items-center justify-between font-mono text-xs">
          <div>
            <div className="font-bold text-black uppercase text-[10px]">Demo Credentials</div>
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

        {error && (
          <div className="border border-red-600 bg-red-50 p-3 text-xs font-mono text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="border border-black bg-white p-7 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@universalhub.dev"
              className="w-full surge-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full surge-input"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-surge btn-surge-black py-3 text-xs tracking-widest mt-2"
          >
            {isLoading ? "Authenticating..." : "Sign In &rarr;"}
          </button>
        </form>
      </div>
    </div>
  );
}
