"use client";

import { useEffect, useState } from "react";

interface Props {
  onDone: () => void;
}

const EXAMPLES = [
  {
    input: "500 chai with friends",
    category: "Food & Drinks",
    amount: "₹500",
    type: "expense" as const,
    color: "#F5E6FF",
    icon: "🍵",
  },
  {
    input: "got 25k salary",
    category: "Salary",
    amount: "₹25,000",
    type: "income" as const,
    color: "#E6F7E6",
    icon: "💼",
  },
  {
    input: "loan from Rohit 2L",
    category: "Transfer",
    amount: "₹2,00,000",
    type: "income" as const,
    color: "#F0F0F0",
    icon: "🔄",
  },
];

export default function OnboardingScreen({ onDone }: Props) {
  const [step, setStep] = useState(0); // which example
  const [typed, setTyped] = useState(0); // chars typed in current input
  const [showResult, setShowResult] = useState(false);
  const [visible, setVisible] = useState(true);

  const current = EXAMPLES[step];

  // Typing effect
  useEffect(() => {
    if (typed < current.input.length) {
      const t = setTimeout(() => setTyped((n) => n + 1), 45);
      return () => clearTimeout(t);
    } else {
      // Done typing — show result after short pause
      const t = setTimeout(() => setShowResult(true), 300);
      return () => clearTimeout(t);
    }
  }, [typed, current.input.length]);

  // After result shown, advance to next or finish
  useEffect(() => {
    if (!showResult) return;
    if (step < EXAMPLES.length - 1) {
      const t = setTimeout(() => {
        setShowResult(false);
        setTyped(0);
        setStep((s) => s + 1);
      }, 1200);
      return () => clearTimeout(t);
    }
    // Last example — keep result showing, user taps CTA
  }, [showResult, step]);

  function handleStart() {
    setVisible(false);
    setTimeout(onDone, 400);
  }

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col"
      style={{
        background: "var(--md-surface)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
        maxWidth: 430,
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 16,
            background: "var(--md-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <span style={{ color: "#fff", fontSize: 24, fontWeight: 700 }}>J</span>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--md-on-surface)", marginBottom: 6 }}>
          Just type it
        </h1>
        <p style={{ fontSize: 14, color: "var(--md-on-surface-variant)", textAlign: "center", lineHeight: 1.5 }}>
          No forms. No tapping dropdowns. Just describe what happened.
        </p>
      </div>

      {/* Demo area */}
      <div className="flex-1 flex flex-col justify-center px-6 gap-4">
        {EXAMPLES.map((ex, i) => {
          const isPast = i < step;
          const isCurrent = i === step;
          const isFuture = i > step;

          return (
            <div
              key={i}
              style={{
                opacity: isFuture ? 0.25 : 1,
                transform: isFuture ? "translateY(8px)" : "translateY(0)",
                transition: "opacity 0.4s ease, transform 0.4s ease",
              }}
            >
              {/* Input bubble */}
              <div
                style={{
                  background: "var(--md-surface-container)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  marginBottom: 6,
                  fontSize: 15,
                  color: "var(--md-on-surface)",
                  minHeight: 42,
                  display: "flex",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <span>
                  {isCurrent ? ex.input.slice(0, typed) : ex.input}
                  {isCurrent && typed < ex.input.length && (
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 16,
                        background: "var(--md-primary)",
                        marginLeft: 1,
                        verticalAlign: "middle",
                        animation: "blink 1s step-end infinite",
                      }}
                    />
                  )}
                </span>
              </div>

              {/* Result chip */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  paddingLeft: 4,
                  opacity: (isPast || (isCurrent && showResult)) ? 1 : 0,
                  transform: (isPast || (isCurrent && showResult)) ? "translateY(0)" : "translateY(6px)",
                  transition: "opacity 0.35s ease, transform 0.35s ease",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: ex.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                  }}
                >
                  {ex.icon}
                </div>
                <span style={{ fontSize: 13, color: "var(--md-on-surface-variant)", fontWeight: 500 }}>
                  {ex.category}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 14,
                    fontWeight: 600,
                    color: ex.type === "income" ? "var(--md-tertiary)" : "var(--md-on-surface)",
                  }}
                >
                  {ex.type === "income" ? "+" : "-"}{ex.amount}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <div className="px-6 pb-12">
        <button
          onClick={handleStart}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 14,
            background: "var(--md-primary)",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            opacity: step === EXAMPLES.length - 1 && showResult ? 1 : 0,
            transform: step === EXAMPLES.length - 1 && showResult ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          Start logging
        </button>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
