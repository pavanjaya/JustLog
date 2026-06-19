"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function isCapacitor() {
  return typeof window !== "undefined" && !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = createClient();

    if (isCapacitor()) {
      try {
        const { GoogleAuth } = await import("@codetrix-studio/capacitor-google-auth");
        await GoogleAuth.initialize({
          clientId: "756989560868-hcod837ib8atuo11dtnkrm3nves8i916.apps.googleusercontent.com",
          scopes: ["profile", "email"],
          grantOfflineAccess: true,
        });
        const googleUser = await GoogleAuth.signIn();
        const idToken = googleUser.authentication.idToken;
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: idToken,
        });
        if (error) console.error("Supabase sign in error:", error);
      } catch (e) {
        console.error("Google sign in error:", e);
        setLoading(false);
      }
    } else {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    }
  }

  return (
    <div
      className="flex flex-col max-w-[430px] mx-auto px-8"
      style={{ minHeight: "100dvh", background: "var(--md-surface)" }}
    >
      {/* Logo area — upper third */}
      <div className="flex flex-col items-center justify-center flex-1 gap-5">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M25.2041 0C39.1236 0.000240543 50.408 11.2846 50.4082 25.2041C50.4081 29.7602 49.193 34.0366 47.0752 37.7275L52.4717 51.3945L38.6543 46.5176C34.7615 48.9792 30.1477 50.4081 25.2041 50.4082C11.2846 50.4079 0.000260373 39.1236 0 25.2041C0.000239379 11.2845 11.2847 0.000263298 25.2041 0ZM25.2041 4.33008C13.6759 4.33034 4.3303 13.6761 4.33008 25.2041C4.33034 36.7322 13.676 46.0779 25.2041 46.0781L26.0322 46.0625C30.1481 45.9019 33.9533 44.549 37.1211 42.3418L38.0322 41.707L44.9551 44.1494L42.251 37.3018L42.8418 36.3711C44.8905 33.1428 46.078 29.3152 46.0781 25.2041C46.0779 13.8564 37.0229 4.62329 25.7441 4.33691L25.2041 4.33008ZM38.4297 19.2061L21.4697 36.165L12.9902 27.6855L15.958 24.7178L21.4697 30.2295L35.4619 16.2383L38.4297 19.2061Z" fill="#B114EB"/>
        </svg>

        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--md-on-surface)", letterSpacing: -0.5, marginBottom: 8 }}>
            JustLog
          </h1>
          <p style={{ fontSize: 15, color: "var(--md-on-surface-variant)", lineHeight: 1.5 }}>
            The fastest way to<br />remember your money.
          </p>
        </div>
      </div>

      {/* Bottom CTA area */}
      <div className="flex flex-col items-center gap-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 48px)" }}>
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            padding: "17px 24px",
            borderRadius: 16,
            border: "1.5px solid var(--md-outline-variant, #e0e0e0)",
            background: "var(--md-surface)",
            color: "var(--md-on-surface)",
            fontSize: 17,
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            opacity: loading ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        <p style={{ fontSize: 12, color: "var(--md-on-surface-variant)", textAlign: "center", lineHeight: 1.6 }}>
          Your data is private and only visible to you.
        </p>

        <p style={{ fontSize: 11, color: "var(--md-outline)", textAlign: "center", lineHeight: 1.6 }}>
          By continuing, you agree to our{" "}
          <a href="/terms" target="_blank" rel="noopener" style={{ color: "var(--md-primary)" }}>Terms of Service</a>
          {" "}and{" "}
          <a href="/privacy" target="_blank" rel="noopener" style={{ color: "var(--md-primary)" }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
