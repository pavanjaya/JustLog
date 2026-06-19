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

export default function PaywallView({ userId, onSuccess, onContinueFree, trialExpired }: PaywallViewProps) {
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<"trial" | "pay" | null>(null);
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [showPlanPicker, setShowPlanPicker] = useState(false);

  async function handleStartTrial() {
    setLoading(true); setLoadingType("trial");
    try {
      const res = await fetch("/api/subscription/trial", { method: "POST" });
      const result = await res.json();
      if (result.success) onSuccess();
      else alert("Could not start trial. Please try again.");
    } catch { alert("Something went wrong. Try again."); }
    finally { setLoading(false); setLoadingType(null); }
  }

  async function handleSubscribe(selectedPlan: "monthly" | "yearly") {
    setLoading(true); setLoadingType("pay");
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { alert("Could not load payment."); setLoading(false); setLoadingType(null); return; }

      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const { orderId, amount, currency, keyId, error } = await res.json();
      if (error || !orderId) { alert("Could not create order. Try again."); setLoading(false); setLoadingType(null); return; }

      new window.Razorpay({
        key: keyId, amount, currency,
        name: "JustLog",
        description: selectedPlan === "yearly" ? "Pro Annual — ₹499/year" : "Pro Monthly — ₹49/month",
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
              userId, plan: selectedPlan,
            }),
          });
          const result = await verify.json();
          if (result.success) onSuccess();
          else alert("Payment verified but activation failed. Contact support.");
        },
        prefill: {},
        theme: { color: "#C831FF" },
        modal: { ondismiss: () => { setLoading(false); setLoadingType(null); } },
      }).open();
    } catch { alert("Something went wrong. Try again."); setLoading(false); setLoadingType(null); }
  }

  return (
    <div
      className="flex flex-col h-full overflow-y-auto no-scrollbar"
      style={{
        background: "var(--md-surface)",
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 28px)",
      }}
    >
      {/* Logo */}
      <div className="px-5 mb-7">
        <img src="/logo.svg" alt="JustLog" className="h-8" />
      </div>

      {/* Hero text */}
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
      <div className="px-5 flex flex-col gap-3 mt-auto">

        {/* Primary — Pro trial (new users only) */}
        {!trialExpired && (
          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full py-4 rounded-[16px] text-[15px] font-semibold flex items-center justify-center gap-2 active:opacity-80"
            style={{ background: "var(--md-primary)", color: "#fff", opacity: loading && loadingType === "trial" ? 0.7 : 1 }}
          >
            {loading && loadingType === "trial" ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <circle cx="12" cy="12" r="10" strokeOpacity={0.25}/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                </svg>
                Starting…
              </>
            ) : "Try Pro free — 7 days"}
          </button>
        )}

        {/* Secondary — Subscribe */}
        {!showPlanPicker ? (
          <button
            onClick={() => { if (trialExpired) setShowPlanPicker(true); else setShowPlanPicker(true); }}
            disabled={loading}
            className="w-full py-3.5 rounded-[16px] text-[14px] font-semibold active:opacity-80"
            style={{
              background: trialExpired ? "var(--md-primary)" : "transparent",
              color: trialExpired ? "#fff" : "var(--md-on-surface)",
              border: trialExpired ? "none" : "1.5px solid var(--md-outline-variant)",
            }}
          >
            {trialExpired ? "Subscribe to Pro" : "Subscribe now · ₹49/month"}
          </button>
        ) : (
          /* Inline plan picker */
          <div className="rounded-[16px] overflow-hidden" style={{ border: "1.5px solid var(--md-outline-variant)" }}>
            <div className="p-1 flex" style={{ background: "var(--md-surface-container-low)" }}>
              <button
                onClick={() => setPlan("monthly")}
                className="flex-1 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors"
                style={{
                  background: plan === "monthly" ? "var(--md-surface)" : "transparent",
                  color: plan === "monthly" ? "var(--md-on-surface)" : "var(--md-on-surface-variant)",
                  boxShadow: plan === "monthly" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                ₹49 / month
              </button>
              <button
                onClick={() => setPlan("yearly")}
                className="flex-1 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors relative"
                style={{
                  background: plan === "yearly" ? "var(--md-surface)" : "transparent",
                  color: plan === "yearly" ? "var(--md-on-surface)" : "var(--md-on-surface-variant)",
                  boxShadow: plan === "yearly" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                ₹499 / year
                <span className="absolute -top-2 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FF6B35", color: "#fff" }}>
                  -15%
                </span>
              </button>
            </div>
            <button
              onClick={() => handleSubscribe(plan)}
              disabled={loading}
              className="w-full py-3.5 text-[14px] font-semibold flex items-center justify-center gap-2 active:opacity-80"
              style={{ background: trialExpired ? "var(--md-primary)" : "var(--md-surface-container-low)", color: trialExpired ? "#fff" : "var(--md-on-surface)", opacity: loading && loadingType === "pay" ? 0.7 : 1 }}
            >
              {loading && loadingType === "pay" ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <circle cx="12" cy="12" r="10" strokeOpacity={0.25}/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                  </svg>
                  Opening checkout…
                </>
              ) : `Pay ${plan === "yearly" ? "₹499 / year" : "₹49 / month"}`}
            </button>
          </div>
        )}

        {/* Tertiary — Free plan */}
        {onContinueFree && (
          <button
            onClick={onContinueFree}
            className="w-full py-2.5 text-[13px] text-center active:opacity-60"
            style={{ color: "var(--md-on-surface-variant)" }}
          >
            Continue with Free plan
          </button>
        )}

        <p className="text-[11px] text-center" style={{ color: "var(--md-outline)" }}>
          {trialExpired ? "Secured by Razorpay · Hueness Design Pvt. Ltd." : "No card required for trial · Cancel anytime"}
        </p>
      </div>
    </div>
  );
}
