"use client";

import { useState } from "react";

interface PaywallViewProps {
  userId: string;
  onSuccess: () => void;
  onContinueFree?: () => void;
  trialExpired?: boolean;
}

const FEATURES = [
  { icon: "✍️", text: "Log in seconds — type or speak" },
  { icon: "🤖", text: "AI parses Hindi, Hinglish & English" },
  { icon: "🔍", text: "Ask your money anything — AI search" },
  { icon: "🗂️", text: "Multiple spaces (personal, business)" },
  { icon: "📊", text: "Monthly insights & story view" },
  { icon: "🔒", text: "Private & secure — your data only" },
];

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

export default function PaywallView({ userId, onSuccess, onContinueFree, trialExpired }: PaywallViewProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");

  async function handleSubscribe() {
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { alert("Could not load payment. Check your connection."); return; }

      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const { orderId, amount, currency, keyId, error } = await res.json();
      if (error || !orderId) { alert("Could not create order. Try again."); return; }

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
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar" style={{ background: "#fff" }}>
      {/* Trial expired banner */}
      {trialExpired && (
        <div className="mx-6 mt-6 rounded-2xl px-4 py-3 text-sm text-center font-medium" style={{ background: "rgba(255,107,53,0.1)", color: "#FF6B35" }}>
          Your 7-day free trial has ended — upgrade to keep going
        </div>
      )}

      {/* Hero */}
      <div className="flex flex-col items-center pt-8 pb-6 px-6 text-center">
        <img src="/logo.svg" alt="JustLog" className="h-10 mb-5" />
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--md-on-surface)" }}>
          Your personal finance journal
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
          Log expenses and income in seconds. Let AI do the analysis.
        </p>
      </div>

      {/* Features */}
      <div className="px-6 pb-5 flex flex-col gap-3">
        {FEATURES.map((f) => (
          <div key={f.text} className="flex items-center gap-3">
            <span className="text-xl w-8 flex-shrink-0 text-center">{f.icon}</span>
            <span className="text-sm" style={{ color: "var(--md-on-surface)" }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Plan toggle */}
      <div className="mx-6 mb-4 flex rounded-xl overflow-hidden" style={{ border: "1.5px solid rgba(200,49,255,0.2)" }}>
        <button
          onClick={() => setPlan("monthly")}
          className="flex-1 py-3 text-sm font-medium transition-colors"
          style={{
            background: plan === "monthly" ? "var(--md-primary)" : "transparent",
            color: plan === "monthly" ? "#fff" : "var(--md-on-surface-variant)",
          }}
        >
          ₹49 / month
        </button>
        <button
          onClick={() => setPlan("yearly")}
          className="flex-1 py-3 text-sm font-medium transition-colors relative"
          style={{
            background: plan === "yearly" ? "var(--md-primary)" : "transparent",
            color: plan === "yearly" ? "#fff" : "var(--md-on-surface-variant)",
          }}
        >
          ₹499 / year
          <span
            className="absolute -top-2.5 right-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: "#FF6B35", color: "#fff" }}
          >
            Save 15%
          </span>
        </button>
      </div>

      {/* Trial badge */}
      <div className="mx-6 mb-5 rounded-2xl p-4" style={{ background: "rgba(200,49,255,0.05)", border: "1px solid rgba(200,49,255,0.15)" }}>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2"
          style={{ background: "rgba(200,49,255,0.12)", color: "var(--md-primary)" }}
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          7-day free trial — no charge today
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
          Cancel anytime before your trial ends and you won't be charged.
        </p>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 flex flex-col gap-3">
        <button
          onClick={handleSubscribe}
          disabled={loading}
          className="w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-opacity active:opacity-80"
          style={{ background: "var(--md-primary)", color: "#fff", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" strokeOpacity={0.25}/>
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
              Opening checkout…
            </>
          ) : (
            "Start 7-day free trial"
          )}
        </button>
        <p className="text-[11px] text-center" style={{ color: "var(--md-outline)" }}>
          Secure payment via Razorpay · Cancel anytime
        </p>
        {onContinueFree && (
          <button
            onClick={onContinueFree}
            className="w-full py-3 text-sm text-center"
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
