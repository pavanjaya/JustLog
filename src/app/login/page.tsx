"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div className="flex flex-col h-screen max-w-[430px] mx-auto items-center justify-center bg-surface px-8">
      <div className="w-full flex flex-col items-center gap-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-16 bg-blue rounded-2xl flex items-center justify-center text-3xl shadow-shadow-sm">
            📓
          </div>
          <div className="text-2xl font-bold tracking-tight mt-1">JustLog</div>
          <div className="text-sm text-text-secondary text-center leading-relaxed">
            The fastest way to remember your money.
          </div>
        </div>

        {/* Login card */}
        <div className="w-full bg-white rounded-radius-md p-6 shadow-shadow-sm flex flex-col gap-4">
          <div className="text-center text-[13px] text-text-secondary">Sign in to continue</div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex items-center justify-center gap-3 w-full border border-border rounded-radius-md py-3 px-4 text-sm font-medium text-text-primary bg-white transition-colors hover:bg-surface disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            {loading ? "Signing in…" : "Continue with Google"}
          </button>
        </div>

        <div className="text-xs text-text-tertiary text-center">
          Your data is private and only visible to you.
        </div>
      </div>
    </div>
  );
}
