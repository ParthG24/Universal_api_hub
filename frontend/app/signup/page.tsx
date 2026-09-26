"use client";

import { Suspense } from "react";
import { LoginForm } from "../login/page";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[75vh] flex items-center justify-center font-mono text-xs">Loading...</div>}>
      <LoginForm defaultMode="signup" />
    </Suspense>
  );
}
