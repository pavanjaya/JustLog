"use client";

import { useState } from "react";

interface SubscriptionPageProps {
  subStatus: "loading" | "active" | "trialing" | "none" | "free";
  validUntil?: Date;
  subPlan?: string;
  onBack: () => void;
  onUpgrade: () => void;
  onSwitchToAnnual: () => void;
  onCancelled?: () => void;
}

function daysLeft(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function fmt(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const FEATURES = [
  "Unlimited entries with AI parsing",
  "Voice input (Hindi, Hinglish, English)",
  "Multiple spaces (personal, business)",
  "AI-powered search & analysis",
  "Full transaction history",
  "Export to CSV",
  "Monthly insights & story view",
];

const CANCEL_REASONS = [
  "Too expensive",
  "Not using it enough",
  "Missing a feature I need",
  "Switching to another app",
  "Just taking a break",
];

function Tick({ active }: { active: boolean }) {
  return active ? (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="#2E7D32" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="var(--md-outline)" strokeWidth={2.5} strokeLinecap="round" className="flex-shrink-0">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

type CancelStep = "idle" | "reasons" | "confirming" | "done";

export default function SubscriptionPage({
  subStatus, validUntil, subPlan, onBack, onUpgrade, onSwitchToAnnual, onCancelled,
}: SubscriptionPageProps) {
  const [cancelStep, setCancelStep] = useState<CancelStep>("idle");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const isPro = subStatus === "active";
  const isTrial = subStatus === "trialing";
  const isFree = subStatus === "free";
  const isMonthly = subPlan !== "yearly";
  const days = validUntil ? daysLeft(validUntil) : 0;
  const trialPct = validUntil && isTrial
    ? Math.min(1, Math.max(0, (validUntil.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)))
    : 0;

  async function handleCancel() {
    if (!cancelReason) return;
    setCancelling(true);
    try {
      await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      setCancelStep("done");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[500] flex flex-col max-w-[430px] mx-auto" style={{ background: "var(--md-surface)", height: "100dvh" }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 flex-shrink-0" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)", paddingBottom: "12px" }}>
        <button onClick={onBack} className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-70" style={{ color: "var(--md-on-surface)" }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="text-[17px] font-semibold tracking-tight" style={{ color: "var(--md-on-surface)" }}>My Subscription</span>
      </div>

      {/* Scrollable body */}
      <div className="overflow-y-auto no-scrollbar" style={{ flex: "1 1 0", minHeight: 0, paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>

        {/* Hero card */}
        <div className="mx-4 mt-2 rounded-[20px] overflow-hidden" style={{
          background: isPro
            ? "linear-gradient(145deg, #1a6b1f 0%, #2d9c35 100%)"
            : isTrial
            ? "linear-gradient(145deg, #5b21b6 0%, #8b5cf6 100%)"
            : "var(--md-surface-container-low)",
          boxShadow: isPro ? "0 4px 24px rgba(26,107,31,0.28)" : isTrial ? "0 4px 24px rgba(91,33,182,0.28)" : "none",
        }}>
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[11px] font-bold tracking-widest mb-1.5" style={{ color: isPro || isTrial ? "rgba(255,255,255,0.55)" : "var(--md-on-surface-variant)" }}>
                  CURRENT PLAN
                </div>
                <div className="text-[26px] font-bold leading-tight tracking-tight" style={{ color: isPro || isTrial ? "#fff" : "var(--md-on-surface)" }}>
                  {isPro ? "JustLog Pro" : isTrial ? "Free Trial" : isFree ? "Free Plan" : "No Active Plan"}
                </div>
                <div className="text-[13px] mt-1 font-medium" style={{ color: isPro || isTrial ? "rgba(255,255,255,0.7)" : "var(--md-on-surface-variant)" }}>
                  {isPro && subPlan === "yearly" ? "₹499 / year" : isPro ? "₹49 / month" : isTrial ? `${days} day${days !== 1 ? "s" : ""} remaining` : "Limited features"}
                </div>
              </div>
              <div className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide mt-0.5" style={{
                background: isPro || isTrial ? "rgba(255,255,255,0.18)" : "var(--md-surface-container)",
                color: isPro || isTrial ? "#fff" : "var(--md-on-surface-variant)",
                border: isPro || isTrial ? "1px solid rgba(255,255,255,0.25)" : "1px solid var(--md-outline-variant)",
              }}>
                {isPro ? "ACTIVE" : isTrial ? "TRIAL" : isFree ? "FREE" : "EXPIRED"}
              </div>
            </div>

            {isTrial && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>Trial progress</span>
                  <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>Ends {validUntil ? fmt(validUntil) : ""}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.2)" }}>
                  <div className="h-full rounded-full" style={{ width: `${trialPct * 100}%`, background: "#fff" }} />
                </div>
              </div>
            )}

            {isPro && validUntil && (
              <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                </svg>
                Access until {fmt(validUntil)}
              </div>
            )}
          </div>
        </div>

        {/* Switch to Annual */}
        {isPro && isMonthly && (
          <div className="mx-4 mt-3 rounded-[16px] p-4" style={{ background: "rgba(255,107,53,0.07)", border: "1.5px solid rgba(255,107,53,0.22)" }}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#FF6B35", color: "#fff" }}>SAVE 15%</span>
              <span className="text-[14px] font-semibold" style={{ color: "var(--md-on-surface)" }}>Switch to Annual</span>
            </div>
            <div className="text-[12px] mb-3 leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
              Pay ₹499/year instead of ₹588/year — save ₹89 every year.
            </div>
            <button onClick={onSwitchToAnnual} className="w-full py-3 rounded-xl text-[13px] font-semibold active:opacity-80" style={{ background: "#FF6B35", color: "#fff" }}>
              Switch to ₹499 / year
            </button>
          </div>
        )}

        {/* Upgrade CTA */}
        {(isTrial || isFree || subStatus === "none") && (
          <div className="mx-4 mt-3">
            <button onClick={onUpgrade} className="w-full py-3.5 rounded-[14px] text-[14px] font-semibold active:opacity-80" style={{ background: "var(--md-primary)", color: "#fff" }}>
              {isTrial ? "Upgrade Now · ₹49 / month" : "Get Pro · ₹49 / month"}
            </button>
          </div>
        )}

        {/* Plan details */}
        <div className="mx-4 mt-5">
          <div className="text-[11px] font-bold tracking-widest mb-2 px-1" style={{ color: "var(--md-on-surface-variant)" }}>PLAN DETAILS</div>
          <div className="rounded-[16px] overflow-hidden" style={{ background: "var(--md-surface-container-low)" }}>
            {[
              { label: "Plan", value: isPro ? (subPlan === "yearly" ? "Pro Annual" : "Pro Monthly") : isTrial ? "Pro Trial" : "Free" },
              { label: "Status", value: isPro ? "Active" : isTrial ? "In Trial" : isFree ? "Free" : "Expired", valueColor: isPro ? "#2E7D32" : isTrial ? "#7c3aed" : undefined },
              ...(validUntil && isPro ? [{ label: "Access until", value: fmt(validUntil) }] : []),
              ...(validUntil && isTrial ? [{ label: "Trial ends", value: fmt(validUntil) }] : []),
              { label: "Price", value: isPro ? (subPlan === "yearly" ? "₹499 / year" : "₹49 / month") : isTrial ? "Free for 7 days" : "Free" },
            ].map((row, i) => (
              <div key={row.label} className="flex items-center justify-between px-4 py-3.5" style={{ borderTop: i > 0 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                <span className="text-[13px]" style={{ color: "var(--md-on-surface-variant)" }}>{row.label}</span>
                <span className="text-[13px] font-semibold" style={{ color: (row as { valueColor?: string }).valueColor ?? "var(--md-on-surface)" }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What's included */}
        <div className="mx-4 mt-5">
          <div className="text-[11px] font-bold tracking-widest mb-2 px-1" style={{ color: "var(--md-on-surface-variant)" }}>WHAT&apos;S INCLUDED</div>
          <div className="rounded-[16px] px-4 py-2" style={{ background: "var(--md-surface-container-low)" }}>
            {FEATURES.map((label) => (
              <div key={label} className="flex items-center gap-3 py-2.5">
                <Tick active={isPro || isTrial} />
                <span className="text-[13px] flex-1 leading-snug" style={{ color: isPro || isTrial ? "var(--md-on-surface)" : "var(--md-on-surface-variant)" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cancel flow */}
        {isPro && (
          <div className="mx-4 mt-5">
            {cancelStep === "idle" && (
              <button
                onClick={() => setCancelStep("reasons")}
                className="w-full py-4 rounded-[16px] text-[13px] font-medium active:opacity-70"
                style={{ color: "var(--md-on-surface-variant)", background: "var(--md-surface-container-low)" }}
              >
                Cancel Subscription
              </button>
            )}

            {cancelStep === "reasons" && (
              <div className="rounded-[16px] p-4" style={{ background: "var(--md-surface-container-low)" }}>
                <div className="text-[14px] font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>
                  Why are you cancelling?
                </div>
                <div className="text-[12px] mb-4" style={{ color: "var(--md-on-surface-variant)" }}>
                  Your feedback helps us improve.
                </div>
                <div className="flex flex-col gap-2 mb-4">
                  {CANCEL_REASONS.map((r) => (
                    <button
                      key={r}
                      onClick={() => setCancelReason(r)}
                      className="flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors active:opacity-70"
                      style={{
                        background: cancelReason === r ? "rgba(200,49,255,0.08)" : "var(--md-surface)",
                        border: cancelReason === r ? "1.5px solid var(--md-primary)" : "1.5px solid var(--md-outline-variant)",
                      }}
                    >
                      <div className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center" style={{
                        border: cancelReason === r ? "none" : "1.5px solid var(--md-outline)",
                        background: cancelReason === r ? "var(--md-primary)" : "transparent",
                      }}>
                        {cancelReason === r && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                      <span className="text-[13px]" style={{ color: "var(--md-on-surface)" }}>{r}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setCancelStep("idle"); setCancelReason(""); }}
                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold"
                    style={{ background: "var(--md-surface)", color: "var(--md-on-surface)", border: "1px solid var(--md-outline-variant)" }}
                  >
                    Keep Plan
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={!cancelReason || cancelling}
                    className="flex-1 py-3 rounded-xl text-[13px] font-semibold transition-opacity active:opacity-70"
                    style={{
                      background: cancelReason ? "rgba(186,26,26,0.1)" : "var(--md-surface-container)",
                      color: cancelReason ? "var(--md-error)" : "var(--md-on-surface-variant)",
                      opacity: cancelling ? 0.6 : 1,
                    }}
                  >
                    {cancelling ? "Cancelling…" : "Confirm Cancel"}
                  </button>
                </div>
              </div>
            )}

            {cancelStep === "done" && (
              <div className="rounded-[16px] p-5 text-center" style={{ background: "var(--md-surface-container-low)" }}>
                <div className="text-[15px] font-semibold mb-1.5" style={{ color: "var(--md-on-surface)" }}>
                  Subscription cancelled
                </div>
                <div className="text-[12px] leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
                  You'll keep Pro access until{" "}
                  <span style={{ color: "var(--md-on-surface)", fontWeight: 600 }}>
                    {validUntil ? fmt(validUntil) : "your billing date"}
                  </span>.
                  After that you'll move to the Free plan.
                </div>
                <button
                  onClick={() => { onCancelled?.(); onBack(); }}
                  className="mt-4 w-full py-3 rounded-xl text-[13px] font-semibold"
                  style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface)" }}
                >
                  Done
                </button>
              </div>
            )}
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
