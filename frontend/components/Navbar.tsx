"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(auth.isAuthenticated());
  }, [pathname]);

  const handleLogout = () => {
    auth.clear();
    setIsLoggedIn(false);
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo: exact lowercase Space Mono font, tracking-tight, text-lg/xl */}
        <Link href="/" className="font-mono text-lg md:text-xl font-bold tracking-tight text-black">
          universalhub
        </Link>

        {/* Center / Right Links: exact font-mono text-sm uppercase tracking-wider text-black hover:text-[#e07850] */}
        <nav className="hidden md:flex items-center gap-8 font-mono text-sm uppercase tracking-wider">
          <Link
            href="/#features"
            className="text-black hover:text-[#e07850] transition-colors"
          >
            Features
          </Link>
          <Link
            href="/guide"
            className="text-black hover:text-[#e07850] transition-colors"
          >
            Guide
          </Link>
          <Link
            href="/connectors/card-scanner/docs"
            className="text-black hover:text-[#e07850] transition-colors"
          >
            Docs
          </Link>
          <Link
            href="/dashboard"
            className="text-black hover:text-[#e07850] transition-colors"
          >
            Connectors
          </Link>
          <Link
            href="/connectors/content-rewriter/test"
            className="text-black hover:text-[#e07850] transition-colors"
          >
            Demo
          </Link>
        </nav>

        {/* Right Button: exact SurgeDB GET STARTED button */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="font-mono text-sm uppercase tracking-wider bg-black text-white px-4 py-2 border border-black hover:bg-[#e07850] hover:border-[#e07850] hover:text-black transition-colors"
              >
                Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="font-mono text-xs uppercase tracking-wider text-neutral-500 hover:text-black transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="font-mono text-sm uppercase tracking-wider bg-black text-white px-4 py-2 border border-black hover:bg-[#e07850] hover:border-[#e07850] hover:text-black transition-colors"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
