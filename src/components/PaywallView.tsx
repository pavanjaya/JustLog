"use client";

import { useState } from "react";

interface PaywallViewProps {
  userId: string;
  onSuccess: () => void;
  onContinueFree?: () => void;
  trialExpired?: boolean;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const FEATURES = [
  { label: "Log in Hindi, Hinglish or English" },
  { label: "AI search — ask anything about your money" },
  { label: "Multiple spaces — personal & business" },
  { label: "Full history, insights & CSV export" },
];

const TRIAL_UNLOCKS = [
  "AI-powered search is on",
  "All spaces unlocked",
  "Export & full history enabled",
];

type Screen = "main" | "trial-success" | "subscribe";

export default function PaywallView({ userId, onSuccess, onContinueFree, trialExpired }: PaywallViewProps) {
  const [screen, setScreen] = useState<Screen>("main");
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

  async function handleStartTrial() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/trial", { method: "POST" });
      const result = await res.json();
      if (result.success) setScreen("trial-success");
      else alert("Could not start trial. Please try again.");
    } catch { alert("Something went wrong. Try again."); }
    finally { setLoading(false); }
  }

  async function handleSubscribe() {
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { alert("Could not load payment."); setLoading(false); return; }

      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { orderId, amount, currency, keyId, error } = await res.json();
      if (error || !orderId) { alert("Could not create order. Try again."); setLoading(false); return; }

      new window.Razorpay({
        key: keyId, amount, currency,
        name: "JustLog",
        description: plan === "yearly" ? "Pro Annual — ₹499/year" : "Pro Monthly — ₹49/month",
        image: "/logo.svg",
        order_id: orderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verify = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              userId, plan,
            }),
          });
          const result = await verify.json();
          if (result.success) onSuccess();
          else alert("Payment verified but activation failed. Contact support.");
        },
        prefill: {},
        theme: { color: "#C831FF" },
        modal: { ondismiss: () => setLoading(false) },
      }).open();
    } catch { alert("Something went wrong. Try again."); setLoading(false); }
  }

  const safeTop = "calc(env(safe-area-inset-top, 0px) + 16px)";
  const safeBottom = "calc(env(safe-area-inset-bottom, 0px) + 28px)";

  /* ── Trial success / filler screen ── */
  if (screen === "trial-success") {
    return (
      <div
        className="flex flex-col h-full overflow-y-auto no-scrollbar px-6"
        style={{ background: "var(--md-surface)", paddingTop: safeTop, paddingBottom: safeBottom }}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-0">
          {/* Icon */}
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: "rgba(200,49,255,0.08)" }}>
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--md-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>

          <h1 className="text-[26px] font-bold tracking-tight mb-2" style={{ color: "var(--md-on-surface)" }}>
            Pro trial started!
          </h1>
          <p className="text-[14px] mb-2" style={{ color: "var(--md-on-surface-variant)" }}>
            7 days free · No card needed · Cancel anytime
          </p>

          {/* Divider */}
          <div className="w-8 h-px my-6" style={{ background: "var(--md-outline-variant)" }} />

          {/* Unlocks */}
          <p className="text-[12px] font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--md-on-surface-variant)" }}>
            What&apos;s unlocked for you
          </p>
          <div className="flex flex-col gap-3 w-full text-left">
            {TRIAL_UNLOCKS.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(200,49,255,0.1)" }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--md-primary)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <span className="text-[14px]" style={{ color: "var(--md-on-surface)" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 pt-8">
          <button
            onClick={onSuccess}
            className="w-full py-4 rounded-[16px] text-[15px] font-semibold active:opacity-80"
            style={{ background: "var(--md-primary)", color: "#fff" }}
          >
            Start exploring →
          </button>
          <p className="text-[11px] text-center" style={{ color: "var(--md-outline)" }}>
            Trial ends in 7 days. We&apos;ll remind you before it expires.
          </p>
        </div>
      </div>
    );
  }

  /* ── Subscribe screen ── */
  if (screen === "subscribe") {
    return (
      <div
        className="flex flex-col h-full overflow-y-auto no-scrollbar"
        style={{ background: "var(--md-surface)", paddingTop: safeTop, paddingBottom: safeBottom }}
      >
        {/* Back */}
        <button
          onClick={() => setScreen("main")}
          className="flex items-center gap-2 px-4 mb-6 active:opacity-60"
          style={{ color: "var(--md-on-surface-variant)" }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          <span className="text-[14px]">Back</span>
        </button>

        <div className="px-5 flex-1">
          <h2 className="text-[22px] font-bold tracking-tight mb-1" style={{ color: "var(--md-on-surface)" }}>
            Subscribe to Pro
          </h2>
          <p className="text-[13px] mb-6" style={{ color: "var(--md-on-surface-variant)" }}>
            Full access, forever. No trials, no limits.
          </p>

          {/* Plan toggle */}
          <div className="rounded-[14px] p-1 flex mb-6" style={{ background: "var(--md-surface-container-low)" }}>
            <button
              onClick={() => setPlan("monthly")}
              className="flex-1 py-3 rounded-[10px] text-[13px] font-medium transition-colors"
              style={{
                background: plan === "monthly" ? "var(--md-surface)" : "transparent",
                color: plan === "monthly" ? "var(--md-on-surface)" : "var(--md-on-surface-variant)",
                boxShadow: plan === "monthly" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <div className="font-semibold">₹49 / month</div>
              <div className="text-[11px] opacity-60">billed monthly</div>
            </button>
            <button
              onClick={() => setPlan("yearly")}
              className="flex-1 py-3 rounded-[10px] text-[13px] font-medium transition-colors relative"
              style={{
                background: plan === "yearly" ? "var(--md-surface)" : "transparent",
                color: plan === "yearly" ? "var(--md-on-surface)" : "var(--md-on-surface-variant)",
                boxShadow: plan === "yearly" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <span className="absolute -top-2.5 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FF6B35", color: "#fff" }}>
                Save 15%
              </span>
              <div className="font-semibold">₹499 / year</div>
              <div className="text-[11px] opacity-60">₹41.6 / month</div>
            </button>
          </div>

          {/* Features */}
          <div className="flex flex-col gap-3 mb-8">
            {FEATURES.map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--md-primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-[14px]" style={{ color: "var(--md-on-surface)" }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 flex flex-col gap-3">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-4 rounded-[16px] text-[15px] font-semibold flex items-center justify-center gap-2 active:opacity-80"
            style={{ background: "var(--md-primary)", color: "#fff", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="10" strokeOpacity={0.25}/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
                Opening checkout…
              </>
            ) : `Pay ${plan === "yearly" ? "₹499 / year" : "₹49 / month"}`}
          </button>
          <p className="text-[11px] text-center" style={{ color: "var(--md-outline)" }}>
            Secured by Razorpay · One-time payment · No auto-renewal
          </p>
        </div>
      </div>
    );
  }

  /* ── Main paywall screen ── */
  return (
    <div
      className="flex flex-col h-full overflow-y-auto no-scrollbar"
      style={{ background: "var(--md-surface)", paddingTop: safeTop, paddingBottom: safeBottom }}
    >
      {/* Logo */}
      <div className="px-5 mb-7">
        <img src="/logo.svg" alt="JustLog" className="h-8" />
      </div>

      {/* Hero */}
      <div className="px-5 mb-8">
        {trialExpired ? (
          <>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3" style={{ background: "rgba(255,107,53,0.1)" }}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#FF6B35" strokeWidth={2.5} strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="text-[11px] font-semibold" style={{ color: "#FF6B35" }}>Pro trial ended</span>
            </div>
            <h1 className="text-[26px] font-bold tracking-tight leading-tight mb-2" style={{ color: "var(--md-on-surface)" }}>
              Keep going with Pro
            </h1>
            <p className="text-[14px] leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
              Your data is safe. Subscribe to pick up where you left off.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-[28px] font-bold tracking-tight leading-tight mb-2.5" style={{ color: "var(--md-on-surface)" }}>
              Log money the<br />way you talk
            </h1>
            <p className="text-[14px] leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
              Hindi, Hinglish, or English — just say what happened. AI does the rest.
            </p>
          </>
        )}
      </div>

      {/* Features */}
      <div className="px-5 mb-8 flex flex-col gap-3">
        {FEATURES.map((f) => (
          <div key={f.label} className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--md-primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span className="text-[14px]" style={{ color: "var(--md-on-surface)" }}>{f.label}</span>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="px-5 flex flex-col gap-4 mt-auto">

        {/* Primary — trial (new users) or subscribe (trial expired) */}
        {!trialExpired ? (
          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full rounded-[16px] flex flex-col items-center justify-center active:opacity-80"
            style={{ background: "var(--md-primary)", color: "#fff", opacity: loading ? 0.7 : 1, padding: "14px 16px 12px" }}
          >
            {loading ? (
              <div className="flex items-center gap-2 py-1">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="10" strokeOpacity={0.25}/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
                <span className="text-[15px] font-semibold">Starting…</span>
              </div>
            ) : (
              <>
                <span className="text-[15px] font-semibold">Try Pro free — 7 days</span>
                <span className="text-[12px] mt-0.5" style={{ opacity: 0.8 }}>No card needed · Cancel anytime</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setScreen("subscribe")}
            className="w-full py-4 rounded-[16px] text-[15px] font-semibold active:opacity-80"
            style={{ background: "var(--md-primary)", color: "#fff" }}
          >
            Subscribe to Pro
          </button>
        )}

        {/* Secondary — subscribe (new users) */}
        {!trialExpired && (
          <button
            onClick={() => setScreen("subscribe")}
            className="w-full py-1 flex items-center justify-center gap-1.5 active:opacity-60"
            style={{ color: "var(--md-on-surface-variant)" }}
          >
            <span className="text-[13px]">Or subscribe directly · ₹49/month</span>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </button>
        )}

        {/* Tertiary — free plan */}
        {onContinueFree && (
          <button
            onClick={onContinueFree}
            className="w-full py-1 text-[13px] text-center active:opacity-60"
            style={{ color: "var(--md-outline)" }}
          >
            Continue with Free plan
          </button>
        )}
      </div>
    </div>
  );
}
