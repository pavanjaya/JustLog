"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function isCapacitor() {
  return typeof window !== "undefined" && !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
}

type Step = "home" | "phone" | "otp";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("home");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const supabase = createClient();

  async function handleGoogleLogin() {
    setLoading(true);
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
        const { error } = await supabase.auth.signInWithIdToken({ provider: "google", token: idToken });
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

  async function handleSendOtp() {
    const cleaned = phone.trim().replace(/\s/g, "");
    if (!cleaned || cleaned.length < 10) { setError("Enter a valid phone number"); return; }
    setLoading(true); setError("");
    const fullPhone = cleaned.startsWith("+") ? cleaned : `+91${cleaned}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: fullPhone });
    if (error) { setError(error.message); setLoading(false); return; }
    setStep("otp");
    setLoading(false);
  }

  async function handleVerifyOtp() {
    const cleaned = phone.trim().replace(/\s/g, "");
    const fullPhone = cleaned.startsWith("+") ? cleaned : `+91${cleaned}`;
    if (otp.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    setLoading(true); setError("");
    const { error } = await supabase.auth.verifyOtp({ phone: fullPhone, token: otp, type: "sms" });
    if (error) { setError("Wrong OTP. Try again."); setLoading(false); return; }
    window.location.href = "/";
  }

  return (
    <div
      className="flex flex-col max-w-[430px] mx-auto px-8"
      style={{ minHeight: "100dvh", background: "var(--md-surface)" }}
    >
      {/* Logo area */}
      <div className="flex flex-col items-center justify-center flex-1 gap-5">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <path d="M25.2041 0C39.1236 0.000240543 50.408 11.2846 50.4082 25.2041C50.4081 29.7602 49.193 34.0366 47.0752 37.7275L52.4717 51.3945L38.6543 46.5176C34.7615 48.9792 30.1477 50.4081 25.2041 50.4082C11.2846 50.4079 0.000260373 39.1236 0 25.2041C0.000239379 11.2845 11.2847 0.000263298 25.2041 0ZM25.2041 4.33008C13.6759 4.33034 4.3303 13.6761 4.33008 25.2041C4.33034 36.7322 13.676 46.0779 25.2041 46.0781L26.0322 46.0625C30.1481 45.9019 33.9533 44.549 37.1211 42.3418L38.0322 41.707L44.9551 44.1494L42.251 37.3018L42.8418 36.3711C44.8905 33.1428 46.078 29.3152 46.0781 25.2041C46.0779 13.8564 37.0229 4.62329 25.7441 4.33691L25.2041 4.33008ZM38.4297 19.2061L21.4697 36.165L12.9902 27.6855L15.958 24.7178L21.4697 30.2295L35.4619 16.2383L38.4297 19.2061Z" fill="#B114EB"/>
        </svg>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--md-on-surface)", letterSpacing: -0.5, marginBottom: 8 }}>JustLog</h1>
          <p style={{ fontSize: 15, color: "var(--md-on-surface-variant)", lineHeight: 1.5 }}>
            The fastest way to<br />remember your money.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="flex flex-col gap-3" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 48px)" }}>

        {step === "home" && (
          <>
            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-[16px] text-[16px] font-semibold active:opacity-80"
              style={{ border: "1.5px solid var(--md-outline-variant)", background: "var(--md-surface)", color: "var(--md-on-surface)", opacity: loading ? 0.6 : 1 }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" style={{ flexShrink: 0 }}>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px" style={{ background: "var(--md-outline-variant)" }} />
              <span className="text-[12px]" style={{ color: "var(--md-outline)" }}>or</span>
              <div className="flex-1 h-px" style={{ background: "var(--md-outline-variant)" }} />
            </div>

            {/* Phone */}
            <button
              onClick={() => setStep("phone")}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-[16px] text-[16px] font-semibold active:opacity-80"
              style={{ background: "var(--md-primary)", color: "#fff" }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.7A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
              </svg>
              Continue with Phone
            </button>
          </>
        )}

        {step === "phone" && (
          <>
            <button onClick={() => { setStep("home"); setError(""); setPhone(""); }} className="flex items-center gap-2 mb-2 active:opacity-60" style={{ color: "var(--md-on-surface-variant)" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              <span className="text-[14px]">Back</span>
            </button>

            <div className="mb-1">
              <div className="text-[17px] font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Enter your number</div>
              <div className="text-[13px]" style={{ color: "var(--md-on-surface-variant)" }}>We'll send an OTP to verify</div>
            </div>

            <div className="flex gap-2">
              <div className="flex items-center px-3 rounded-[14px] text-[15px] font-medium flex-shrink-0" style={{ background: "var(--md-surface-container-low)", border: "1.5px solid var(--md-outline-variant)", color: "var(--md-on-surface)" }}>
                🇮🇳 +91
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="98765 43210"
                value={phone}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                autoFocus
                className="flex-1 px-4 py-3.5 rounded-[14px] text-[15px] outline-none"
                style={{ background: "var(--md-surface-container-low)", border: `1.5px solid ${error ? "var(--md-error)" : "var(--md-outline-variant)"}`, color: "var(--md-on-surface)" }}
              />
            </div>

            {error && <div className="text-[12px]" style={{ color: "var(--md-error)" }}>{error}</div>}

            <button
              onClick={handleSendOtp}
              disabled={loading || phone.length < 10}
              className="w-full py-4 rounded-[16px] text-[15px] font-semibold active:opacity-80"
              style={{ background: phone.length === 10 ? "var(--md-primary)" : "var(--md-surface-container-high)", color: phone.length === 10 ? "#fff" : "var(--md-outline)", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Sending…" : "Send OTP"}
            </button>
          </>
        )}

        {step === "otp" && (
          <>
            <button onClick={() => { setStep("phone"); setError(""); setOtp(""); }} className="flex items-center gap-2 mb-2 active:opacity-60" style={{ color: "var(--md-on-surface-variant)" }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              <span className="text-[14px]">Back</span>
            </button>

            <div className="mb-1">
              <div className="text-[17px] font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Enter OTP</div>
              <div className="text-[13px]" style={{ color: "var(--md-on-surface-variant)" }}>
                Sent to +91 {phone}
              </div>
            </div>

            {/* 6 OTP boxes */}
            <div className="flex gap-2 justify-between relative">
              {[0,1,2,3,4,5].map((i) => (
                <div key={i} className="flex-1 aspect-square rounded-[14px] flex items-center justify-center text-[20px] font-bold"
                  style={{ background: "var(--md-surface-container-low)", border: `1.5px solid ${error ? "var(--md-error)" : i < otp.length ? "var(--md-primary)" : "var(--md-outline-variant)"}`, color: "var(--md-on-surface)" }}>
                  {otp[i] ?? ""}
                </div>
              ))}
              <input
                type="tel" inputMode="numeric" maxLength={6}
                value={otp}
                onChange={(e) => { setOtp(e.target.value.replace(/\D/g,"").slice(0,6)); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                autoFocus
                className="absolute inset-0 opacity-0 w-full"
              />
            </div>

            {error && <div className="text-[12px]" style={{ color: "var(--md-error)" }}>{error}</div>}

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className="w-full py-4 rounded-[16px] text-[15px] font-semibold active:opacity-80"
              style={{ background: otp.length === 6 ? "var(--md-primary)" : "var(--md-surface-container-high)", color: otp.length === 6 ? "#fff" : "var(--md-outline)", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Verifying…" : "Verify & Login"}
            </button>

            <button onClick={handleSendOtp} className="text-[13px] text-center py-1 active:opacity-60" style={{ color: "var(--md-on-surface-variant)" }}>
              Resend OTP
            </button>
          </>
        )}

        <p style={{ fontSize: 11, color: "var(--md-outline)", textAlign: "center", lineHeight: 1.6, marginTop: 4 }}>
          By continuing, you agree to our{" "}
          <a href="/terms" target="_blank" rel="noopener" style={{ color: "var(--md-primary)" }}>Terms</a>
          {" "}and{" "}
          <a href="/privacy" target="_blank" rel="noopener" style={{ color: "var(--md-primary)" }}>Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
