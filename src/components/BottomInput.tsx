"use client";

import { useEffect, useRef, useState } from "react";

function getNavBarHeight(): number {
  if (typeof window === "undefined") return 0;
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  if (cap?.getPlatform?.() === "android") return 32;
  return 0;
}

interface BottomInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

const SUGGESTIONS = ["500 coffee", "25000 salary", "1200 petrol", "17000 school fees", "3000 grocery"];

export default function BottomInput({ value, onChange, onSend, disabled }: BottomInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [popping, setPopping] = useState(false);
  const [navBarHeight, setNavBarHeight] = useState(0);

  useEffect(() => {
    setNavBarHeight(getNavBarHeight());
  }, []);

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    autoGrow(e.target);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    if (!value.trim()) return;
    setPopping(true);
    setTimeout(() => setPopping(false), 300);
    onSend();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  function fillSuggestion(text: string) {
    onChange(text);
    const el = textareaRef.current;
    if (el) { el.focus(); requestAnimationFrame(() => autoGrow(el)); }
  }

  return (
    <div
      className="flex-shrink-0 px-3 pt-2"
      style={{ background: "#fff", paddingBottom: `${navBarHeight + 16}px` }}
    >
      {/* Suggestion chips — scrollable row */}
      {value.trim().length < 4 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={s}
              onClick={() => fillSuggestion(s)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap animate-fade-up"
              style={{
                background: "rgba(200,49,255,0.05)",
                color: "var(--md-primary)",
                animationDelay: `${i * 0.04}s`,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Chat-style input row */}
      <div className="flex items-end gap-2">
        {/* Pill input */}
        <div
          className="flex-1 flex items-end gap-2 px-4 py-2.5 rounded-[22px]"
          style={{ background: "var(--md-surface-container-low)", border: "1.5px solid var(--md-outline-variant)" }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Just type what you spent or earned..."
            autoComplete="off"
            autoCorrect="off"
            disabled={disabled}
            className="flex-1 border-none outline-none bg-transparent text-[15px] resize-none leading-[1.5] max-h-[120px] overflow-y-auto no-scrollbar"
            style={{ color: "var(--md-on-surface)" }}
          />
        </div>

        {/* Send button — circular, primary color */}
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 md-ripple ${popping ? "animate-send-pop" : ""}`}
          style={{ background: disabled || !value.trim() ? "var(--md-surface-container-highest)" : "var(--md-primary)", color: disabled || !value.trim() ? "var(--md-on-surface-variant)" : "var(--md-on-primary)" }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
