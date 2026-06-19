"use client";

import { useState, useEffect } from "react";

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin + "jl-pin-salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface PinPadProps {
  mode: "set" | "verify";
  spaceName: string;
  storedHash?: string;
  onConfirm: (pinHash: string) => void;
  onClose: () => void;
}

const KEYS = ["1","2","3","4","5","6","7","8","9","","0","⌫"];

export default function PinPad({ mode, spaceName, storedHash, onConfirm, onClose }: PinPadProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "confirm">("enter");
  const [shake, setShake] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { setPin(""); setConfirmPin(""); setStep("enter"); setError(""); }, []);

  async function handleKey(key: string) {
    if (key === "⌫") {
      if (step === "confirm") setConfirmPin((p) => p.slice(0, -1));
      else setPin((p) => p.slice(0, -1));
      setError("");
      return;
    }

    if (step === "enter") {
      const next = pin + key;
      setPin(next);
      if (next.length === 4) {
        if (mode === "verify") {
          const hash = await hashPin(next);
          if (hash === storedHash) {
            onConfirm(hash);
          } else {
            triggerShake();
            setTimeout(() => setPin(""), 500);
            setError("Wrong PIN. Try again.");
          }
        } else {
          // set mode — go to confirm step
          setTimeout(() => setStep("confirm"), 150);
        }
      }
    } else {
      const next = confirmPin + key;
      setConfirmPin(next);
      if (next.length === 4) {
        if (next === pin) {
          const hash = await hashPin(next);
          onConfirm(hash);
        } else {
          triggerShake();
          setTimeout(() => { setConfirmPin(""); setPin(""); setStep("enter"); }, 500);
          setError("PINs don't match. Start again.");
        }
      }
    }
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  const currentPin = step === "confirm" ? confirmPin : pin;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[800]" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[900] max-w-[430px] mx-auto rounded-t-[28px]"
        style={{ background: "var(--md-surface)", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-5">
          <div className="w-9 h-1 rounded-full" style={{ background: "var(--md-outline-variant)" }} />
        </div>

        {/* Header */}
        <div className="text-center px-6 mb-6">
          <div className="text-[17px] font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>
            {mode === "verify" ? `Unlock "${spaceName}"` : step === "confirm" ? "Confirm PIN" : `Set PIN for "${spaceName}"`}
          </div>
          <div className="text-[13px]" style={{ color: "var(--md-on-surface-variant)" }}>
            {mode === "verify" ? "Enter your 4-digit PIN" : step === "confirm" ? "Enter the same PIN again" : "Choose a 4-digit PIN"}
          </div>
        </div>

        {/* Dots */}
        <div className={`flex justify-center gap-4 mb-2 ${shake ? "animate-shake" : ""}`}>
          {[0,1,2,3].map((i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 rounded-full transition-all duration-150"
              style={{
                background: i < currentPin.length ? "var(--md-primary)" : "var(--md-surface-container-high)",
                transform: i < currentPin.length ? "scale(1.15)" : "scale(1)",
              }}
            />
          ))}
        </div>

        {/* Error */}
        <div className="text-center h-6 mb-4">
          {error && <span className="text-[12px]" style={{ color: "var(--md-error)" }}>{error}</span>}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2 px-8">
          {KEYS.map((key, i) => (
            key === "" ? (
              <div key={i} />
            ) : (
              <button
                key={i}
                onClick={() => key !== "" && handleKey(key)}
                className="aspect-square rounded-full flex items-center justify-center text-[22px] font-medium active:scale-95 transition-transform"
                style={{
                  background: key === "⌫" ? "transparent" : "var(--md-surface-container-low)",
                  color: "var(--md-on-surface)",
                  fontSize: key === "⌫" ? "18px" : undefined,
                }}
              >
                {key === "⌫" ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/><line x1="18" y1="9" x2="12" y2="15"/><line x1="12" y1="9" x2="18" y2="15"/>
                  </svg>
                ) : key}
              </button>
            )
          ))}
        </div>

        {/* Cancel */}
        <div className="text-center mt-4">
          <button onClick={onClose} className="text-[13px] py-2 px-6 active:opacity-60" style={{ color: "var(--md-on-surface-variant)" }}>
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        .animate-shake { animation: shake 0.4s ease; }
      `}</style>
    </>
  );
}
