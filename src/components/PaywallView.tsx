"use client";

import { useState } from "react";

interface PaywallViewProps {
  userId: string;
  onSuccess: (validUntil: string) => void; // trial started
  onPaymentSuccess?: () => void; // direct payment from paywall
  onContinueFree?: () => void;
  trialExpired?: boolean;
  trialStats?: { transactions: number; spaces: number };
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
  { label: "Unlimited AI logging" },
  { label: "Multiple spaces — Personal, Business & Family" },
  { label: "Full history forever" },
  { label: "AI Search — ask anything about your money" },
  { label: "CSV Export" },
  { label: "PIN lock — keep sensitive spaces private" },
  { label: "Priority support" },
];

const TRIAL_UNLOCKS = [
  "AI-powered search is on",
  "All spaces unlocked",
  "Export & full history enabled",
];

type Screen = "main" | "trial-success" | "subscribe" | "downgrade-confirm";

export default function PaywallView({ userId, onSuccess, onPaymentSuccess, onContinueFree, trialExpired, trialStats }: PaywallViewProps) {
  const [screen, setScreen] = useState<Screen>("main");
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState(false);

  async function handleStartTrial() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/trial", { method: "POST" });
      const result = await res.json();
      if (result.success) { onSuccess(result.validUntil); setScreen("trial-success"); }
      else alert("Could not start trial. Please try again.");
    } catch { alert("Something went wrong. Try again."); }
    finally { setLoading(false); }
  }

  async function handleSubscribe(selectedPlan?: "monthly" | "yearly") {
    const p = selectedPlan ?? plan;
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { alert("Could not load payment."); setLoading(false); return; }

      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: p }),
      });
      const { orderId, amount, currency, keyId, error } = await res.json();
      if (error || !orderId) { alert("Could not create order. Try again."); setLoading(false); return; }

      new window.Razorpay({
        key: keyId, amount, currency,
        name: "JustLog",
        description: p === "yearly" ? "JustLog Pro Annual — ₹599/year" : "JustLog Pro Monthly — ₹79/month",
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
              userId, plan: p,
            }),
          });
          const result = await verify.json();
          if (result.success) { if (onPaymentSuccess) onPaymentSuccess(); else onSuccess(result.validUntil ?? new Date(Date.now() + 30 * 86400000).toISOString()); }
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

  /* ── Trial success screen ── */
  if (screen === "trial-success") {
    return (
      <div
        className="flex flex-col h-full w-full overflow-y-auto no-scrollbar px-6"
        style={{ background: "var(--md-surface)", paddingTop: safeTop, paddingBottom: safeBottom }}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-0">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{ background: "rgba(200,49,255,0.08)" }}>
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--md-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h1 className="text-[26px] font-bold tracking-tight mb-2" style={{ color: "var(--md-on-surface)" }}>
            Pro trial started! 🎉
          </h1>
          <p className="text-[14px] mb-2" style={{ color: "var(--md-on-surface-variant)" }}>
            Enjoy 7 days of full access
          </p>
          <div className="flex flex-col gap-2 mb-8 text-left w-full">
            {TRIAL_UNLOCKS.map((u) => (
              <div key={u} className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--md-primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-[13px]" style={{ color: "var(--md-on-surface-variant)" }}>{u}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onSuccess}
              className="w-full py-4 rounded-[16px] text-[15px] font-semibold active:opacity-80 flex items-center justify-center gap-2"
              style={{ background: "var(--md-primary)", color: "#fff" }}
            >
              Start exploring
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <p className="text-[11px] text-center" style={{ color: "var(--md-outline)" }}>
              Trial ends in 7 days. We&apos;ll remind you before it expires.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Downgrade confirmation ── */
  if (screen === "downgrade-confirm") {
    return (
      <div
        className="flex flex-col h-full w-full overflow-y-auto no-scrollbar px-6"
        style={{ background: "var(--md-surface)", paddingTop: safeTop, paddingBottom: safeBottom }}
      >
        <div className="flex-1 flex flex-col justify-center gap-5">
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(255,107,53,0.1)" }}>
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#FF6B35" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 className="text-[22px] font-bold mb-2" style={{ color: "var(--md-on-surface)" }}>You&apos;ll lose access to:</h2>
            <div className="flex flex-col gap-2 mb-4">
              {["Spaces beyond Personal", "Transactions older than 30 days", "AI Search", "CSV Export"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#FF6B35" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  <span className="text-[14px]" style={{ color: "var(--md-on-surface)" }}>{item}</span>
                </div>
              ))}
            </div>
            <p className="text-[14px]" style={{ color: "var(--md-on-surface-variant)" }}>Are you sure you want to downgrade?</p>
          </div>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setScreen("main")}
              className="w-full py-4 rounded-[16px] text-[15px] font-semibold active:opacity-80"
              style={{ background: "var(--md-primary)", color: "#fff" }}
            >
              Keep Pro
            </button>
            <button
              onClick={onContinueFree}
              className="w-full py-3.5 rounded-[16px] text-[14px] font-medium text-center active:opacity-60"
              style={{ border: "1.5px solid var(--md-outline-variant)", color: "var(--md-on-surface-variant)" }}
            >
              Yes, downgrade to Free
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Trial expired screen (undismissable) ── */
  if (trialExpired) {
    return (
      <div
        className="flex flex-col h-full w-full overflow-y-auto no-scrollbar px-6"
        style={{ background: "var(--md-surface)", paddingTop: safeTop, paddingBottom: safeBottom }}
      >
        <div className="flex-1 flex flex-col justify-center gap-6">
          {/* Header */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3" style={{ background: "rgba(255,107,53,0.1)" }}>
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#FF6B35" strokeWidth={2.5} strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="text-[11px] font-semibold" style={{ color: "#FF6B35" }}>Free trial ended</span>
            </div>
            <h1 className="text-[26px] font-bold tracking-tight mb-2" style={{ color: "var(--md-on-surface)" }}>
              Your free trial has ended
            </h1>
            {trialStats && (
              <p className="text-[14px] leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
                You logged <span className="font-semibold" style={{ color: "var(--md-on-surface)" }}>{trialStats.transactions} transactions</span> across{" "}
                <span className="font-semibold" style={{ color: "var(--md-on-surface)" }}>{trialStats.spaces} space{trialStats.spaces !== 1 ? "s" : ""}</span> this week.{" "}
                Don&apos;t lose your progress.
              </p>
            )}
          </div>

          {/* Plan options */}
          <div className="flex flex-col gap-3">
            {/* Monthly */}
            <button
              onClick={() => handleSubscribe("monthly")}
              disabled={loading}
              className="w-full py-4 px-5 rounded-[16px] text-left active:opacity-80"
              style={{ background: "var(--md-primary)", color: "#fff", opacity: loading ? 0.7 : 1 }}
            >
              <div className="text-[15px] font-semibold">Continue Pro — ₹79/month</div>
              <div className="text-[12px] mt-0.5" style={{ opacity: 0.8 }}>Full access, billed monthly</div>
            </button>

            {/* Annual */}
            <button
              onClick={() => handleSubscribe("yearly")}
              disabled={loading}
              className="w-full py-4 px-5 rounded-[16px] text-left active:opacity-80 relative"
              style={{ border: "2px solid var(--md-primary)", color: "var(--md-on-surface)", opacity: loading ? 0.7 : 1 }}
            >
              <span className="absolute -top-3 right-4 text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--md-primary)", color: "#fff" }}>
                ⭐ Best Value
              </span>
              <div className="text-[15px] font-semibold">Best Value — ₹599/year</div>
              <div className="text-[12px] mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>₹49/month · Save 37% · Save ₹360/year</div>
            </button>
          </div>

          {/* Downgrade link */}
          <button
            onClick={() => setScreen("downgrade-confirm")}
            className="text-center text-[13px] active:opacity-60"
            style={{ color: "var(--md-on-surface-variant)" }}
          >
            Downgrade to Free plan →
          </button>
        </div>
      </div>
    );
  }

  /* ── Subscribe screen ── */
  if (screen === "subscribe") {
    return (
      <div
        className="flex flex-col h-full w-full overflow-y-auto no-scrollbar"
        style={{ background: "var(--md-surface)", paddingTop: safeTop, paddingBottom: safeBottom }}
      >
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
              <div className="font-semibold">₹79 / month</div>
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
              <span className="absolute -top-2.5 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "var(--md-primary)", color: "#fff" }}>
                ⭐ Save 37%
              </span>
              <div className="font-semibold">₹599 / year</div>
              <div className="text-[11px] opacity-60">₹49/month · Best Value</div>
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

        <div className="px-5 flex flex-col gap-3">
          <button
            onClick={() => handleSubscribe()}
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
            ) : `Pay ${plan === "yearly" ? "₹599 / year" : "₹79 / month"}`}
          </button>
          <p className="text-[11px] text-center" style={{ color: "var(--md-outline)" }}>
            Cancel anytime · Secured by Razorpay 🔒
          </p>
        </div>
      </div>
    );
  }

  /* ── Main paywall screen ── */
  return (
    <div
      className="flex flex-col h-full w-full overflow-y-auto no-scrollbar"
      style={{ background: "var(--md-surface)", paddingTop: safeTop, paddingBottom: safeBottom }}
    >
      {/* Top row: Logo */}
      <div className="px-5 mb-7">
        <img src="/logo.svg" alt="JustLog" className="h-8" />
      </div>

      {/* Hero */}
      <div className="px-5 mb-8">
        <h1 className="text-[28px] font-bold tracking-tight leading-tight mb-2.5" style={{ color: "var(--md-on-surface)" }}>
          Log money the<br />way you talk
        </h1>
        <p className="text-[14px] leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
          Hindi, Hinglish, or English — just say what happened. AI does the rest.
        </p>
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

      {/* CTAs — only 2 buttons */}
      <div className="px-5 flex flex-col gap-4 mt-auto">
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

        {onContinueFree && (
          <button
            onClick={onContinueFree}
            className="w-full py-3.5 rounded-[16px] text-[14px] font-medium text-center active:opacity-60"
            style={{ border: "1.5px solid var(--md-outline-variant)", color: "var(--md-on-surface-variant)" }}
          >
            Continue with Free plan
          </button>
        )}
      </div>
    </div>
  );
}
