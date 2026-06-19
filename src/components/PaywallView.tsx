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

const HIGHLIGHTS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
    title: "Just type what happened",
    sub: "\"500 chai with Rahul\" → logged instantly",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    title: "Ask your money anything",
    sub: "\"Kitna spend kiya last month?\" — AI answers",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 7a2 2 0 012-2h4l2 3H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-9a2 2 0 00-2-2h-5"/>
      </svg>
    ),
    title: "Separate spaces, one view",
    sub: "Personal and business — tracked independently",
  },
];

const FREE_LIMITS = [
  "1 space only",
  "Last 3 months of history",
  "No AI search",
];

export default function PaywallView({ userId, onSuccess, onContinueFree, trialExpired }: PaywallViewProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [showFreeInfo, setShowFreeInfo] = useState(false);

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
    <div
      className="flex flex-col h-full overflow-y-auto no-scrollbar"
      style={{
        background: "var(--md-surface)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
      }}
    >
      {/* Trial expired notice */}
      {trialExpired && (
        <div className="mx-4 mt-5 rounded-[14px] px-4 py-3 flex items-center gap-2.5" style={{ background: "rgba(255,107,53,0.08)" }}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#FF6B35" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span className="text-[13px] font-medium" style={{ color: "#FF6B35" }}>
            Your 7-day trial has ended
          </span>
        </div>
      )}

      {/* Hero */}
      <div className="px-5 pt-10 pb-6">
        <img src="/logo.svg" alt="JustLog" className="h-8 mb-6" />
        <h1 className="text-[28px] font-bold tracking-tight leading-tight mb-3" style={{ color: "var(--md-on-surface)" }}>
          {trialExpired
            ? "Keep going with Pro"
            : "Log money the\nway you talk"}
        </h1>
        <p className="text-[14px] leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
          {trialExpired
            ? "Your data is safe. Subscribe to pick up where you left off."
            : "Hindi, Hinglish, or English — just describe what happened. AI handles the rest."}
        </p>
      </div>

      {/* Highlights */}
      {!trialExpired && (
        <div className="px-5 mb-6 flex flex-col gap-4">
          {HIGHLIGHTS.map((h, i) => (
            <div key={i} className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(200,49,255,0.08)", color: "var(--md-primary)" }}>
                {h.icon}
              </div>
              <div>
                <div className="text-[14px] font-semibold leading-snug" style={{ color: "var(--md-on-surface)" }}>{h.title}</div>
                <div className="text-[12px] mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>{h.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="mx-5 mb-5" style={{ height: 1, background: "var(--md-outline-variant)" }} />

      {/* Pricing section */}
      {trialExpired ? (
        /* Plan toggle for expired trial */
        <div className="mx-5 mb-4 rounded-[14px] p-1 flex" style={{ background: "var(--md-surface-container-low)" }}>
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
            <span className="absolute -top-2 right-3 text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FF6B35", color: "#fff" }}>
              -15%
            </span>
          </button>
        </div>
      ) : (
        /* Trial pricing */
        <div className="mx-5 mb-4 flex items-center justify-between">
          <div>
            <div className="text-[15px] font-semibold" style={{ color: "var(--md-on-surface)" }}>7 days free</div>
            <div className="text-[12px] mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>Then ₹49/month or ₹499/year</div>
          </div>
          <div className="px-3 py-1.5 rounded-full text-[12px] font-semibold" style={{ background: "rgba(200,49,255,0.08)", color: "var(--md-primary)" }}>
            No card needed
          </div>
        </div>
      )}

      {/* Primary CTA */}
      <div className="mx-5 mb-3">
        <button
          onClick={trialExpired ? handleSubscribe : handleStartTrial}
          disabled={loading}
          className="w-full py-4 rounded-[16px] text-[15px] font-semibold flex items-center justify-center gap-2 active:opacity-80"
          style={{ background: "var(--md-primary)", color: "#fff", opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <circle cx="12" cy="12" r="10" strokeOpacity={0.25}/>
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
              {trialExpired ? "Opening checkout…" : "Starting…"}
            </>
          ) : trialExpired
            ? `Subscribe · ${plan === "yearly" ? "₹499 / year" : "₹49 / month"}`
            : "Start free trial"}
        </button>
      </div>

      {/* Free plan — proper secondary option */}
      {onContinueFree && (
        <div className="mx-5">
          {!showFreeInfo ? (
            <button
              onClick={() => setShowFreeInfo(true)}
              className="w-full py-3.5 rounded-[16px] text-[14px] font-medium active:opacity-70"
              style={{
                background: "var(--md-surface-container-low)",
                color: "var(--md-on-surface-variant)",
                border: "1px solid var(--md-outline-variant)",
              }}
            >
              Continue with Free plan
            </button>
          ) : (
            <div className="rounded-[16px] overflow-hidden" style={{ border: "1px solid var(--md-outline-variant)" }}>
              <div className="px-4 pt-4 pb-3">
                <div className="text-[13px] font-semibold mb-2" style={{ color: "var(--md-on-surface)" }}>Free plan includes:</div>
                <div className="flex flex-col gap-1.5 mb-3">
                  {FREE_LIMITS.map((l) => (
                    <div key={l} className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--md-outline)" strokeWidth={2.5} strokeLinecap="round" className="flex-shrink-0">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      <span className="text-[12px]" style={{ color: "var(--md-on-surface-variant)" }}>{l}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFreeInfo(false)}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium"
                    style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}
                  >
                    Back
                  </button>
                  <button
                    onClick={onContinueFree}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
                    style={{ background: "var(--md-surface-container-highest)", color: "var(--md-on-surface)" }}
                  >
                    Use Free plan
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-center mt-4 px-5" style={{ color: "var(--md-outline)" }}>
        {trialExpired ? "Payments secured by Razorpay · Hueness Design Pvt. Ltd." : "No credit card required · Cancel anytime after trial"}
      </p>
    </div>
  );
}
