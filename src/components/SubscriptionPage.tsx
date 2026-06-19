"use client";

import { useState } from "react";

interface SubscriptionPageProps {
  subStatus: "loading" | "active" | "trialing" | "none" | "free";
  validUntil?: Date;
  subPlan?: string;
  onBack: () => void;
  onUpgrade: () => void;
  onSwitchToAnnual: () => void;
}

function daysLeft(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function fmt(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const FEATURES = [
  { label: "Unlimited entries with AI parsing" },
  { label: "Voice input (Hindi, Hinglish, English)" },
  { label: "Multiple spaces (personal, business)" },
  { label: "AI-powered search & analysis" },
  { label: "Full transaction history" },
  { label: "Export to CSV" },
  { label: "Monthly insights & story view" },
];

export default function SubscriptionPage({ subStatus, validUntil, subPlan, onBack, onUpgrade, onSwitchToAnnual }: SubscriptionPageProps) {
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const isPro = subStatus === "active";
  const isTrial = subStatus === "trialing";
  const isFree = subStatus === "free";
  const isMonthly = subPlan === "monthly" || subPlan === "trial";
  const days = validUntil ? daysLeft(validUntil) : 0;
  const trialPct = validUntil && isTrial ? Math.min(1, Math.max(0, (validUntil.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))) : 0;

  return (
    <div className="fixed inset-0 z-[500] flex flex-col max-w-[430px] mx-auto" style={{ background: "#fff", height: "100dvh" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-4" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 56px)", borderBottom: "1px solid var(--md-outline-variant)" }}>
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-full flex-shrink-0" style={{ background: "var(--md-surface-container-low)" }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-on-surface)" }}>
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>Subscription</span>
      </div>

      <div className="overflow-y-auto no-scrollbar px-4 py-5 flex flex-col gap-4" style={{ flex: "1 1 0", minHeight: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}>

        {/* Status hero card */}
        <div className="rounded-3xl p-5" style={{
          background: isPro ? "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)"
            : isTrial ? "linear-gradient(135deg, #6A0080 0%, #C831FF 100%)"
            : "var(--md-surface-container-low)",
        }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-xs font-semibold mb-1 opacity-80" style={{ color: isPro || isTrial ? "rgba(255,255,255,0.8)" : "var(--md-on-surface-variant)" }}>CURRENT PLAN</div>
              <div className="text-2xl font-bold" style={{ color: isPro || isTrial ? "#fff" : "var(--md-on-surface)" }}>
                {isPro ? "JustLog Pro" : isTrial ? "Free Trial" : isFree ? "Free Plan" : "No Plan"}
              </div>
              <div className="text-sm mt-1 opacity-80" style={{ color: isPro || isTrial ? "rgba(255,255,255,0.85)" : "var(--md-on-surface-variant)" }}>
                {isPro && subPlan === "yearly" ? "₹499 / year" : isPro ? "₹49 / month" : isTrial ? `${days} days left` : "Limited access"}
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-full text-xs font-bold" style={{
              background: isPro ? "rgba(255,255,255,0.2)" : isTrial ? "rgba(255,255,255,0.2)" : "var(--md-surface-container-highest)",
              color: isPro || isTrial ? "#fff" : "var(--md-on-surface-variant)",
            }}>
              {isPro ? "ACTIVE" : isTrial ? "TRIAL" : isFree ? "FREE" : "EXPIRED"}
            </div>
          </div>

          {/* Trial progress bar */}
          {isTrial && (
            <div>
              <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: "rgba(255,255,255,0.25)" }}>
                <div className="h-full rounded-full" style={{ width: `${trialPct * 100}%`, background: "#fff" }} />
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                Trial ends {validUntil ? fmt(validUntil) : ""}
              </div>
            </div>
          )}

          {isPro && validUntil && (
            <div className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
              {subPlan === "yearly" ? "Renews" : "Next billing"} {fmt(validUntil)}
            </div>
          )}
        </div>

        {/* Switch to Annual upsell — only for monthly Pro or Trial */}
        {(isPro && isMonthly) && (
          <div className="rounded-2xl p-4" style={{ background: "rgba(255,107,53,0.06)", border: "1.5px solid rgba(255,107,53,0.25)" }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#FF6B35", color: "#fff" }}>SAVE 15%</span>
              <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>Switch to Annual</span>
            </div>
            <div className="text-xs mb-3" style={{ color: "var(--md-on-surface-variant)" }}>
              Pay ₹499/year instead of ₹588/year. Save ₹89 every year.
            </div>
            <button onClick={onSwitchToAnnual} className="w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "#FF6B35", color: "#fff" }}>
              Switch to ₹499/year
            </button>
          </div>
        )}

        {/* Upgrade CTA for non-pro */}
        {(isTrial || isFree || subStatus === "none") && (
          <button onClick={onUpgrade} className="w-full py-4 rounded-2xl text-sm font-semibold" style={{ background: "var(--md-primary)", color: "#fff" }}>
            {isTrial ? "Upgrade Now · ₹49/month" : "Get Pro · ₹49/month"}
          </button>
        )}

        {/* Plan details */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--md-surface-container-low)" }}>
          <div className="px-4 pt-3 pb-1 text-xs font-semibold" style={{ color: "var(--md-on-surface-variant)" }}>PLAN DETAILS</div>
          {[
            { label: "Plan", value: isPro ? (subPlan === "yearly" ? "Pro Annual" : "Pro Monthly") : isTrial ? "Pro Trial" : "Free" },
            { label: "Status", value: isPro ? "Active" : isTrial ? "In Trial" : isFree ? "Free" : "Expired" },
            ...(validUntil && isPro ? [{ label: subPlan === "yearly" ? "Renews on" : "Next billing", value: fmt(validUntil) }] : []),
            ...(validUntil && isTrial ? [{ label: "Trial ends", value: fmt(validUntil) }] : []),
            { label: "Price", value: isPro ? (subPlan === "yearly" ? "₹499/year" : "₹49/month") : isTrial ? "Free for 7 days" : "Free" },
          ].map((row, i, arr) => (
            <div key={row.label} className="flex items-center justify-between px-4 py-3" style={{ borderTop: i > 0 ? "1px solid var(--md-outline-variant)" : "none" }}>
              <span className="text-sm" style={{ color: "var(--md-on-surface-variant)" }}>{row.label}</span>
              <span className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* What's included */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--md-surface-container-low)" }}>
          <div className="px-4 pt-3 pb-1 text-xs font-semibold" style={{ color: "var(--md-on-surface-variant)" }}>WHAT&apos;S INCLUDED</div>
          {FEATURES.map((f, i) => (
            <div key={f.label} className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i > 0 ? "1px solid var(--md-outline-variant)" : "none" }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                stroke={isPro || isTrial ? "#2E7D32" : "var(--md-outline)"}>
                {isPro || isTrial ? <polyline points="20 6 9 17 4 12"/> : <line x1="18" y1="6" x2="6" y2="18"/>}
              </svg>
              <span className="text-sm flex-1" style={{ color: isPro || isTrial ? "var(--md-on-surface)" : "var(--md-on-surface-variant)" }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Cancel */}
        {isPro && (
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid var(--md-outline-variant)" }}>
            {cancelConfirm ? (
              <div className="p-4">
                <div className="text-sm font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Cancel subscription?</div>
                <div className="text-xs mb-4" style={{ color: "var(--md-on-surface-variant)" }}>
                  You'll keep Pro access until {validUntil ? fmt(validUntil) : "your billing date"}. To cancel, email us at support@justlog.in with subject "Cancel subscription".
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setCancelConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-medium" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface)" }}>
                    Keep Plan
                  </button>
                  <a href="mailto:support@justlog.in?subject=Cancel subscription" className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center" style={{ background: "var(--md-error-container)", color: "var(--md-error)" }}>
                    Email Us
                  </a>
                </div>
              </div>
            ) : (
              <button onClick={() => setCancelConfirm(true)} className="w-full py-4 text-sm font-medium" style={{ color: "var(--md-error)" }}>
                Cancel Subscription
              </button>
            )}
          </div>
        )}

        <p className="text-[11px] text-center pb-2" style={{ color: "var(--md-outline)" }}>
          Payments processed securely via Razorpay · Hueness Design Pvt. Ltd.
        </p>
      </div>
    </div>
  );
}
