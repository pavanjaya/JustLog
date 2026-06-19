"use client";

import { useState } from "react";

interface SwitchPlanSheetProps {
  userId: string;
  onSuccess: () => void;
  onClose: () => void;
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

export default function SwitchPlanSheet({ userId, onSuccess, onClose }: SwitchPlanSheetProps) {
  const [loading, setLoading] = useState(false);

  async function handleSwitch() {
    setLoading(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { alert("Could not load payment. Check your connection."); setLoading(false); return; }

      const res = await fetch("/api/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "yearly" }),
      });
      const { orderId, amount, currency, keyId, error } = await res.json();
      if (error || !orderId) { alert("Could not create order. Try again."); setLoading(false); return; }

      const options = {
        key: keyId,
        amount,
        currency,
        name: "JustLog",
        description: "Pro Annual — ₹499/year",
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
              plan: "yearly",
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
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[600]"
        style={{ background: "rgba(0,0,0,0.4)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[700] max-w-[430px] mx-auto rounded-t-[24px] overflow-hidden"
        style={{ background: "var(--md-surface)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-4">
          <div className="w-9 h-1 rounded-full" style={{ background: "var(--md-outline-variant)" }} />
        </div>

        <div className="px-5 pb-2">
          {/* Title */}
          <div className="text-[18px] font-bold tracking-tight mb-1" style={{ color: "var(--md-on-surface)" }}>
            Switch to Annual
          </div>
          <div className="text-[13px] mb-5" style={{ color: "var(--md-on-surface-variant)" }}>
            Save ₹89 every year compared to monthly billing.
          </div>

          {/* Plan comparison */}
          <div className="flex gap-3 mb-5">
            {/* Current */}
            <div className="flex-1 rounded-[14px] p-3.5" style={{ background: "var(--md-surface-container-low)", border: "1px solid var(--md-outline-variant)" }}>
              <div className="text-[11px] font-semibold mb-1" style={{ color: "var(--md-on-surface-variant)" }}>CURRENT</div>
              <div className="text-[16px] font-bold" style={{ color: "var(--md-on-surface)" }}>₹49</div>
              <div className="text-[11px]" style={{ color: "var(--md-on-surface-variant)" }}>per month</div>
              <div className="text-[11px] mt-1" style={{ color: "var(--md-on-surface-variant)" }}>₹588 / year</div>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--md-on-surface-variant)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </div>

            {/* New */}
            <div className="flex-1 rounded-[14px] p-3.5" style={{ background: "rgba(26,107,31,0.06)", border: "1.5px solid rgba(26,107,31,0.3)" }}>
              <div className="flex items-center gap-1.5 mb-1">
                <div className="text-[11px] font-semibold" style={{ color: "#1a6b1f" }}>ANNUAL</div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FF6B35", color: "#fff" }}>-15%</span>
              </div>
              <div className="text-[16px] font-bold" style={{ color: "#1a6b1f" }}>₹499</div>
              <div className="text-[11px]" style={{ color: "#1a6b1f" }}>per year</div>
              <div className="text-[11px] mt-1 font-semibold" style={{ color: "#1a6b1f" }}>Save ₹89</div>
            </div>
          </div>

          {/* What you get */}
          <div className="rounded-[14px] p-4 mb-5" style={{ background: "var(--md-surface-container-low)" }}>
            {[
              "All Pro features stay the same",
              "Access for 365 days from today",
              "No monthly charges",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5 py-1.5">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#2E7D32" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                <span className="text-[13px]" style={{ color: "var(--md-on-surface)" }}>{item}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleSwitch}
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
                Opening checkout…
              </>
            ) : "Pay ₹499 · Switch to Annual"}
          </button>

          <p className="text-[11px] text-center mt-3" style={{ color: "var(--md-outline)" }}>
            Secured by Razorpay · One-time payment · No auto-renewal
          </p>
        </div>
      </div>
    </>
  );
}
