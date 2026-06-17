"use client";

import { useState } from "react";

interface PaywallViewProps {
  onSubscribe: () => Promise<void>;
}

const FEATURES = [
  { icon: "💬", text: "Log entries by typing naturally" },
  { icon: "📊", text: "Monthly & all-time story insights" },
  { icon: "🔍", text: "AI-powered search & analysis" },
  { icon: "🗂️", text: "Multiple spaces (personal, business)" },
  { icon: "🔒", text: "Private & secure — your data only" },
];

export default function PaywallView({ onSubscribe }: PaywallViewProps) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await onSubscribe();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto no-scrollbar" style={{ background: "#fff" }}>
      {/* Hero */}
      <div className="flex flex-col items-center pt-14 pb-8 px-6 text-center">
        <img src="/logo.svg" alt="JustLog" className="h-10 mb-6" />
        <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--md-on-surface)" }}>
          Your personal finance journal
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
          Log expenses and income in seconds. Let AI do the analysis.
        </p>
      </div>

      {/* Features */}
      <div className="px-6 pb-6 flex flex-col gap-3">
        {FEATURES.map((f) => (
          <div key={f.text} className="flex items-center gap-3">
            <span className="text-xl w-8 flex-shrink-0 text-center">{f.icon}</span>
            <span className="text-sm" style={{ color: "var(--md-on-surface)" }}>{f.text}</span>
          </div>
        ))}
      </div>

      {/* Pricing card */}
      <div className="mx-6 mb-6 rounded-2xl p-5" style={{ background: "rgba(200,49,255,0.05)", border: "1px solid rgba(200,49,255,0.15)" }}>
        <div className="flex items-end gap-1.5 mb-1">
          <span className="text-3xl font-bold" style={{ color: "var(--md-on-surface)" }}>₹99</span>
          <span className="text-sm pb-1" style={{ color: "var(--md-on-surface-variant)" }}>/month</span>
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
          style={{ background: "rgba(200,49,255,0.12)", color: "var(--md-primary)" }}
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          1 month free trial — no charge today
        </div>
        <p className="text-xs leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
          Cancel anytime before your trial ends and you won't be charged.
        </p>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 flex flex-col gap-3">
        <button
          onClick={handleClick}
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
            "Start free trial"
          )}
        </button>
        <p className="text-[11px] text-center" style={{ color: "var(--md-outline)" }}>
          Secure payment via Stripe · Cancel anytime
        </p>
      </div>
    </div>
  );
}
