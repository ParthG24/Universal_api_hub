import { Suspense } from "react";
import LoginPage from "../login/page";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-[75vh] flex items-center justify-center font-mono text-xs">Loading...</div>}>
      <LoginPage />
    </Suspense>
  );
}
