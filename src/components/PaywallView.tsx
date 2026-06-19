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
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    text: "Log in seconds — type or speak",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
    text: "AI parses Hindi, Hinglish & English",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    text: "Ask your money anything — AI search",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 012-2h4l2 3H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2h-5"/>
      </svg>
    ),
    text: "Multiple spaces — personal, business",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
    text: "Monthly insights & story view",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
      </svg>
    ),
    text: "Private & secure — your data only",
  },
];

export default function PaywallView({ userId, onSuccess, onContinueFree, trialExpired }: PaywallViewProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");

  // New user — start free trial (no payment)
  async function handleStartTrial() {
    setLoading(true);
    try {
      const res = await fetch("/api/subscription/trial", { method: "POST" });
      const result = await res.json();
      if (result.success) onSuccess();
      else alert("Could not start trial. Please try again.");
    } catch {
      alert("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  // Trial expired — pay now via Razorpay
  async function handleSubscribe() {
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { alert("Could not load payment. Check your connection."); setLoading(false); return; }

      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { orderId, amount, currency, keyId, error } = await res.json();
      if (error || !orderId) { alert("Could not create order. Try again."); setLoading(false); return; }

      const options = {
        key: keyId,
        amount,
        currency,
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
              userId,
              plan,
            }),
          });
          const result = await verify.json();
          if (result.success) onSuccess();
          else alert("Payment verified but activation failed. Contact support.");
        },
        prefill: {},
        theme: { color: "#C831FF" },
        modal: { ondismiss: () => setLoading(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar" style={{ background: "var(--md-surface)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>

      {/* Trial expired banner */}
      {trialExpired && (
        <div className="mx-4 mt-5 rounded-[14px] px-4 py-3 text-[13px] text-center font-medium" style={{ background: "rgba(255,107,53,0.08)", color: "#FF6B35" }}>
          Your 7-day free trial has ended — upgrade to keep going
        </div>
      )}

      {/* Hero */}
      <div className="flex flex-col items-center px-6 pt-8 pb-5 text-center">
        <img src="/logo.svg" alt="JustLog" className="h-9 mb-5" />
        <h1 className="text-[22px] font-bold tracking-tight leading-snug mb-2" style={{ color: "var(--md-on-surface)" }}>
          {trialExpired ? "Continue with JustLog Pro" : "Your personal finance journal"}
        </h1>
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
          {trialExpired
            ? "Pick a plan to keep your data and access all features."
            : "Log expenses and income in seconds. Let AI do the analysis."}
        </p>
      </div>

      {/* Features */}
      <div className="mx-4 mb-5 rounded-[16px] px-4 py-2" style={{ background: "var(--md-surface-container-low)" }}>
        {FEATURES.map((f, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5">
            <span className="flex-shrink-0" style={{ color: "var(--md-primary)" }}>{f.icon}</span>
            <span className="text-[13px]" style={{ color: "var(--md-on-surface)" }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Plan toggle — only shown when paying */}
      {trialExpired && (
        <div className="mx-4 mb-4 rounded-[14px] p-1 flex" style={{ background: "var(--md-surface-container-low)" }}>
          <button
            onClick={() => setPlan("monthly")}
            className="flex-1 py-2.5 rounded-[10px] text-[13px] font-medium transition-colors"
            style={{
              background: plan === "monthly" ? "var(--md-surface)" : "transparent",
              color: plan === "monthly" ? "var(--md-on-surface)" : "var(--md-on-surface-variant)",
              boxShadow: plan === "monthly" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
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
              boxShadow: plan === "yearly" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >
            ₹499 / year
            <span className="absolute -top-2 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FF6B35", color: "#fff" }}>
              -15%
            </span>
          </button>
        </div>
      )}

      {/* Trial info — only for new users */}
      {!trialExpired && (
        <div className="mx-4 mb-5 rounded-[14px] px-4 py-3.5 flex items-start gap-3" style={{ background: "rgba(200,49,255,0.05)", border: "1px solid rgba(200,49,255,0.12)" }}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--md-primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div>
            <div className="text-[13px] font-semibold mb-0.5" style={{ color: "var(--md-primary)" }}>7-day free trial — no payment needed</div>
            <div className="text-[12px] leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
              Try all Pro features free. After 7 days, choose a plan or continue with the Free tier.
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mx-4 flex flex-col gap-3">
        <button
          onClick={trialExpired ? handleSubscribe : handleStartTrial}
          disabled={loading}
          className="w-full py-3.5 rounded-[14px] text-[14px] font-semibold flex items-center justify-center gap-2 active:opacity-80"
          style={{ background: "var(--md-primary)", color: "#fff", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" strokeOpacity={0.25}/>
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
              {trialExpired ? "Opening checkout…" : "Starting trial…"}
            </>
          ) : trialExpired
            ? `Subscribe · ${plan === "yearly" ? "₹499/year" : "₹49/month"}`
            : "Start 7-day free trial"}
        </button>

        <p className="text-[11px] text-center" style={{ color: "var(--md-outline)" }}>
          {trialExpired ? "Secured by Razorpay · Cancel anytime" : "No credit card required · Cancel anytime"}
        </p>

        {onContinueFree && (
          <button
            onClick={onContinueFree}
            className="w-full py-3 text-[13px] text-center active:opacity-70"
            style={{ color: "var(--md-on-surface-variant)" }}
          >
            Continue with Free plan
            <span className="block text-[11px] mt-0.5" style={{ color: "var(--md-outline)" }}>
              1 space · 3 months history · No AI search
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
