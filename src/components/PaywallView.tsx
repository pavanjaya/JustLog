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

const PRO_FEATURES = [
  "Unlimited history & all spaces",
  "AI search — ask anything",
  "Voice input in Hindi & Hinglish",
  "Monthly insights & story view",
  "Export to CSV",
];

const FREE_FEATURES = [
  "1 space · 3 months history",
  "Basic logging only",
  "No AI search or voice",
];

export default function PaywallView({ userId, onSuccess, onContinueFree, trialExpired }: PaywallViewProps) {
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"monthly" | "yearly">("yearly");
  const [view, setView] = useState<"main" | "subscribe" | "free">("main");

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

      new window.Razorpay(options).open();
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
        paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
        paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
      }}
    >
      {/* Back button for sub-views */}
      {view !== "main" && (
        <button
          onClick={() => { setView("main"); setLoading(false); }}
          className="mx-4 mb-2 w-10 h-10 flex items-center justify-center rounded-full self-start active:opacity-70"
          style={{ color: "var(--md-on-surface)" }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
      )}

      {/* ── MAIN VIEW ── */}
      {view === "main" && (
        <>
          {/* Trial expired notice */}
          {trialExpired && (
            <div className="mx-4 mb-4 rounded-[14px] px-4 py-3 flex items-center gap-2.5" style={{ background: "rgba(255,107,53,0.08)" }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#FF6B35" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="text-[13px] font-medium" style={{ color: "#FF6B35" }}>Your 7-day Pro trial has ended</span>
            </div>
          )}

          {/* Hero */}
          <div className="px-5 pt-6 pb-7">
            <img src="/logo.svg" alt="JustLog" className="h-8 mb-6" />
            <h1 className="text-[26px] font-bold tracking-tight leading-tight mb-2.5" style={{ color: "var(--md-on-surface)" }}>
              Log money the<br />way you talk
            </h1>
            <p className="text-[14px] leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
              Hindi, Hinglish, or English — just say what happened. AI does the rest.
            </p>
          </div>

          {/* 3 option cards */}
          <div className="px-4 flex flex-col gap-3">

            {/* Option 1: Pro Trial */}
            {!trialExpired && (
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="w-full text-left rounded-[18px] p-4 active:opacity-80 transition-opacity"
                style={{ background: "var(--md-primary)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-[11px] font-bold tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.6)" }}>RECOMMENDED</div>
                    <div className="text-[18px] font-bold" style={{ color: "#fff" }}>Try Pro free — 7 days</div>
                    <div className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.75)" }}>No card needed · Then ₹49/month</div>
                  </div>
                  {loading ? (
                    <svg className="animate-spin w-5 h-5 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                      <circle cx="12" cy="12" r="10" strokeOpacity={0.25}/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-1">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRO_FEATURES.map((f) => (
                    <span key={f} className="text-[11px] px-2 py-0.5 rounded-full font-medium" style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)" }}>
                      {f}
                    </span>
                  ))}
                </div>
              </button>
            )}

            {/* Option 2: Subscribe now */}
            <button
              onClick={() => setView("subscribe")}
              className="w-full text-left rounded-[18px] p-4 active:opacity-80"
              style={{ background: "var(--md-surface-container-low)", border: trialExpired ? "2px solid var(--md-primary)" : "1px solid var(--md-outline-variant)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  {trialExpired && <div className="text-[11px] font-bold tracking-widest mb-1" style={{ color: "var(--md-primary)" }}>RECOMMENDED</div>}
                  <div className="text-[16px] font-semibold" style={{ color: "var(--md-on-surface)" }}>Subscribe to Pro</div>
                  <div className="text-[13px] mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>
                    ₹49/month · or ₹499/year (save 15%)
                  </div>
                </div>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--md-on-surface-variant)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </button>

            {/* Option 3: Free plan */}
            {onContinueFree && (
              <button
                onClick={() => setView("free")}
                className="w-full text-left rounded-[18px] p-4 active:opacity-80"
                style={{ background: "var(--md-surface-container-low)", border: "1px solid var(--md-outline-variant)" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[16px] font-semibold" style={{ color: "var(--md-on-surface)" }}>Use Free plan</div>
                    <div className="text-[13px] mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>
                      Limited features · Always free
                    </div>
                  </div>
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--md-on-surface-variant)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </button>
            )}
          </div>

          <p className="text-[11px] text-center mt-5 px-5" style={{ color: "var(--md-outline)" }}>
            Payments secured by Razorpay · Hueness Design Pvt. Ltd.
          </p>
        </>
      )}

      {/* ── SUBSCRIBE VIEW ── */}
      {view === "subscribe" && (
        <div className="px-4 flex flex-col gap-4 pt-2">
          <div>
            <div className="text-[20px] font-bold mb-1" style={{ color: "var(--md-on-surface)" }}>Choose a plan</div>
            <div className="text-[13px]" style={{ color: "var(--md-on-surface-variant)" }}>Full Pro access, cancel anytime.</div>
          </div>

          {/* Plan toggle */}
          <div className="rounded-[14px] p-1 flex" style={{ background: "var(--md-surface-container-low)" }}>
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
                Save 15%
              </span>
            </button>
          </div>

          {/* What's included */}
          <div className="rounded-[16px] px-4 py-3" style={{ background: "var(--md-surface-container-low)" }}>
            <div className="text-[11px] font-bold tracking-widest mb-2.5" style={{ color: "var(--md-on-surface-variant)" }}>WHAT YOU GET</div>
            {PRO_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5 py-1.5">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#2E7D32" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-[13px]" style={{ color: "var(--md-on-surface)" }}>{f}</span>
              </div>
            ))}
          </div>

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
            Secured by Razorpay · Hueness Design Pvt. Ltd.
          </p>
        </div>
      )}

      {/* ── FREE PLAN VIEW ── */}
      {view === "free" && (
        <div className="px-4 flex flex-col gap-4 pt-2">
          <div>
            <div className="text-[20px] font-bold mb-1" style={{ color: "var(--md-on-surface)" }}>Free plan</div>
            <div className="text-[13px]" style={{ color: "var(--md-on-surface-variant)" }}>Always free. Upgrade anytime.</div>
          </div>

          {/* What's not included */}
          <div className="rounded-[16px] px-4 py-3" style={{ background: "var(--md-surface-container-low)" }}>
            <div className="text-[11px] font-bold tracking-widest mb-2.5" style={{ color: "var(--md-on-surface-variant)" }}>LIMITATIONS</div>
            {FREE_FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2.5 py-1.5">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--md-outline)" strokeWidth={2.5} strokeLinecap="round" className="flex-shrink-0">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                <span className="text-[13px]" style={{ color: "var(--md-on-surface-variant)" }}>{f}</span>
              </div>
            ))}
          </div>

          <div className="rounded-[16px] px-4 py-3.5 flex items-center gap-3" style={{ background: "rgba(200,49,255,0.05)", border: "1px solid rgba(200,49,255,0.12)" }}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--md-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span className="text-[12px]" style={{ color: "var(--md-on-surface-variant)" }}>
              You can upgrade to Pro anytime from Settings.
            </span>
          </div>

          <button
            onClick={onContinueFree}
            className="w-full py-4 rounded-[16px] text-[15px] font-semibold active:opacity-80"
            style={{ background: "var(--md-surface-container-highest)", color: "var(--md-on-surface)" }}
          >
            Continue with Free plan
          </button>
        </div>
      )}
    </div>
  );
}
