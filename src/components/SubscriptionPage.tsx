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
  { label: "Unlimited entries with AI parsing", free: false },
  { label: "Voice input (Hindi, Hinglish, English)", free: false },
  { label: "Multiple spaces (personal, business)", free: false },
  { label: "AI-powered search & analysis", free: false },
  { label: "Full transaction history", free: false },
  { label: "Export to CSV", free: false },
  { label: "Monthly insights & story view", free: false },
];

function CheckIcon({ active }: { active: boolean }) {
  return active ? (
    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(46,125,50,0.12)" }}>
      <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="#2E7D32" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    </div>
  ) : (
    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--md-surface-container)" }}>
      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="var(--md-outline)" strokeWidth={2.5} strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </div>
  );
}

export default function SubscriptionPage({ subStatus, validUntil, subPlan, onBack, onUpgrade, onSwitchToAnnual }: SubscriptionPageProps) {
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const isPro = subStatus === "active";
  const isTrial = subStatus === "trialing";
  const isFree = subStatus === "free";
  const isMonthly = subPlan === "monthly" || subPlan === "trial";
  const days = validUntil ? daysLeft(validUntil) : 0;
  const trialPct = validUntil && isTrial
    ? Math.min(1, Math.max(0, (validUntil.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
    : 0;

  const accentColor = isPro ? "#1a6b1f" : isTrial ? "#7c3aed" : "var(--md-on-surface-variant)";

  return (
    <div
      className="fixed inset-0 z-[500] flex flex-col max-w-[430px] mx-auto"
      style={{ background: "var(--md-surface)", height: "100dvh" }}
    >
      {/* Header — minimal, flush to safe area */}
      <div
        className="flex items-center gap-2 px-3"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
          paddingBottom: "12px",
          background: "var(--md-surface)",
          borderBottom: "1px solid var(--md-outline-variant)",
        }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-70"
          style={{ color: "var(--md-on-surface)" }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="text-[17px] font-semibold tracking-tight" style={{ color: "var(--md-on-surface)" }}>
          My Subscription
        </span>
      </div>

      {/* Scrollable body */}
      <div
        className="overflow-y-auto no-scrollbar"
        style={{ flex: "1 1 0", minHeight: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
      >

        {/* Hero status card */}
        <div className="mx-4 mt-4 rounded-[20px] overflow-hidden" style={{
          background: isPro
            ? "linear-gradient(145deg, #1a6b1f 0%, #2d9c35 100%)"
            : isTrial
            ? "linear-gradient(145deg, #5b21b6 0%, #8b5cf6 100%)"
            : "var(--md-surface-container-low)",
          boxShadow: isPro
            ? "0 4px 24px rgba(26,107,31,0.28)"
            : isTrial
            ? "0 4px 24px rgba(91,33,182,0.28)"
            : "none",
        }}>
          <div className="p-5">
            {/* Top row */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div
                  className="text-[11px] font-bold tracking-widest mb-1.5"
                  style={{ color: isPro || isTrial ? "rgba(255,255,255,0.55)" : "var(--md-on-surface-variant)" }}
                >
                  CURRENT PLAN
                </div>
                <div
                  className="text-[26px] font-bold leading-tight tracking-tight"
                  style={{ color: isPro || isTrial ? "#fff" : "var(--md-on-surface)" }}
                >
                  {isPro ? "JustLog Pro" : isTrial ? "Free Trial" : isFree ? "Free Plan" : "No Active Plan"}
                </div>
                <div
                  className="text-[13px] mt-1 font-medium"
                  style={{ color: isPro || isTrial ? "rgba(255,255,255,0.7)" : "var(--md-on-surface-variant)" }}
                >
                  {isPro && subPlan === "yearly"
                    ? "₹499 / year"
                    : isPro
                    ? "₹49 / month"
                    : isTrial
                    ? `${days} day${days !== 1 ? "s" : ""} remaining`
                    : "Limited features"}
                </div>
              </div>
              <div
                className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide mt-0.5"
                style={{
                  background: isPro ? "rgba(255,255,255,0.18)" : isTrial ? "rgba(255,255,255,0.18)" : "var(--md-surface-container)",
                  color: isPro || isTrial ? "#fff" : "var(--md-on-surface-variant)",
                  border: isPro || isTrial ? "1px solid rgba(255,255,255,0.25)" : "1px solid var(--md-outline-variant)",
                }}
              >
                {isPro ? "ACTIVE" : isTrial ? "TRIAL" : isFree ? "FREE" : "EXPIRED"}
              </div>
            </div>

            {/* Trial progress */}
            {isTrial && (
              <div className="mb-1">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>Trial progress</span>
                  <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
                    Ends {validUntil ? fmt(validUntil) : ""}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${trialPct * 100}%`, background: "#fff" }} />
                </div>
              </div>
            )}

            {/* Pro renewal */}
            {isPro && validUntil && (
              <div
                className="flex items-center gap-1.5 text-[12px] font-medium"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                {subPlan === "yearly" ? "Renews" : "Next billing"} {fmt(validUntil)}
              </div>
            )}
          </div>
        </div>

        {/* Switch to Annual upsell */}
        {isPro && isMonthly && (
          <div className="mx-4 mt-3 rounded-[16px] p-4" style={{ background: "rgba(255,107,53,0.07)", border: "1.5px solid rgba(255,107,53,0.22)" }}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FF6B35", color: "#fff" }}>SAVE 15%</span>
                <span className="text-[14px] font-semibold" style={{ color: "var(--md-on-surface)" }}>Switch to Annual</span>
              </div>
            </div>
            <div className="text-[12px] mb-3 leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
              Pay ₹499/year instead of ₹588/year — save ₹89 every year.
            </div>
            <button
              onClick={onSwitchToAnnual}
              className="w-full py-3 rounded-xl text-[13px] font-semibold active:opacity-80"
              style={{ background: "#FF6B35", color: "#fff" }}
            >
              Switch to ₹499 / year
            </button>
          </div>
        )}

        {/* Upgrade CTA for non-pro */}
        {(isTrial || isFree || subStatus === "none") && (
          <div className="mx-4 mt-3">
            <button
              onClick={onUpgrade}
              className="w-full py-3.5 rounded-[14px] text-[14px] font-semibold active:opacity-80"
              style={{ background: "var(--md-primary)", color: "#fff" }}
            >
              {isTrial ? `Upgrade Now · ₹49/month` : "Get Pro · ₹49 / month"}
            </button>
          </div>
        )}

        {/* Plan details */}
        <div className="mx-4 mt-5">
          <div className="text-[11px] font-bold tracking-widest mb-2 px-1" style={{ color: "var(--md-on-surface-variant)" }}>
            PLAN DETAILS
          </div>
          <div className="rounded-[16px] overflow-hidden" style={{ border: "1px solid var(--md-outline-variant)" }}>
            {[
              {
                label: "Plan",
                value: isPro ? (subPlan === "yearly" ? "Pro Annual" : "Pro Monthly") : isTrial ? "Pro Trial" : "Free",
              },
              {
                label: "Status",
                value: isPro ? "Active" : isTrial ? "In Trial" : isFree ? "Free" : "Expired",
                valueColor: isPro ? "#2E7D32" : isTrial ? "#7c3aed" : undefined,
              },
              ...(validUntil && isPro
                ? [{ label: subPlan === "yearly" ? "Renews on" : "Next billing", value: fmt(validUntil) }]
                : []),
              ...(validUntil && isTrial
                ? [{ label: "Trial ends", value: fmt(validUntil) }]
                : []),
              {
                label: "Price",
                value: isPro
                  ? subPlan === "yearly"
                    ? "₹499 / year"
                    : "₹49 / month"
                  : isTrial
                  ? "Free for 7 days"
                  : "Free",
              },
            ].map((row, i) => (
              <div
                key={row.label}
                className="flex items-center justify-between px-4 py-3.5"
                style={{
                  borderTop: i > 0 ? "1px solid var(--md-outline-variant)" : "none",
                  background: "var(--md-surface)",
                }}
              >
                <span className="text-[13px]" style={{ color: "var(--md-on-surface-variant)" }}>{row.label}</span>
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: (row as { valueColor?: string }).valueColor ?? "var(--md-on-surface)" }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* What's included */}
        <div className="mx-4 mt-5">
          <div className="text-[11px] font-bold tracking-widest mb-2 px-1" style={{ color: "var(--md-on-surface-variant)" }}>
            WHAT&apos;S INCLUDED
          </div>
          <div className="rounded-[16px] overflow-hidden" style={{ border: "1px solid var(--md-outline-variant)" }}>
            {FEATURES.map((f, i) => (
              <div
                key={f.label}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{
                  borderTop: i > 0 ? "1px solid var(--md-outline-variant)" : "none",
                  background: "var(--md-surface)",
                }}
              >
                <CheckIcon active={isPro || isTrial} />
                <span
                  className="text-[13px] flex-1 leading-snug"
                  style={{ color: isPro || isTrial ? "var(--md-on-surface)" : "var(--md-on-surface-variant)" }}
                >
                  {f.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel subscription */}
        {isPro && (
          <div className="mx-4 mt-5">
            <div className="rounded-[16px] overflow-hidden" style={{ border: "1px solid var(--md-outline-variant)", background: "var(--md-surface)" }}>
              {cancelConfirm ? (
                <div className="p-4">
                  <div className="text-[14px] font-semibold mb-1.5" style={{ color: "var(--md-on-surface)" }}>
                    Cancel subscription?
                  </div>
                  <div className="text-[12px] leading-relaxed mb-4" style={{ color: "var(--md-on-surface-variant)" }}>
                    You'll keep Pro access until {validUntil ? fmt(validUntil) : "your billing date"}.
                    Email us at{" "}
                    <span style={{ color: "var(--md-primary)" }}>support@justlog.in</span>
                    {" "}with subject "Cancel subscription".
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCancelConfirm(false)}
                      className="flex-1 py-3 rounded-xl text-[13px] font-semibold"
                      style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)", border: "1px solid var(--md-outline-variant)" }}
                    >
                      Keep Plan
                    </button>
                    <a
                      href="mailto:support@justlog.in?subject=Cancel%20subscription"
                      className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-center"
                      style={{ background: "rgba(186,26,26,0.08)", color: "var(--md-error)" }}
                    >
                      Email Us
                    </a>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setCancelConfirm(true)}
                  className="w-full py-4 text-[13px] font-medium active:opacity-70"
                  style={{ color: "var(--md-error)" }}
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mx-4 mt-5 mb-2 flex items-center justify-center gap-1.5">
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline)", flexShrink: 0 }}>
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <p className="text-[11px]" style={{ color: "var(--md-outline)" }}>
            Payments secured by Razorpay · Hueness Design Pvt. Ltd.
          </p>
        </div>
      </div>
    </div>
  );
}
