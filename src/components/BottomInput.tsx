"use client";

import { useEffect, useMemo, useRef, useState } from "react";


import type { Transaction } from "@/types";

interface BottomInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  transactions?: Transaction[];
}

function getSmartSuggestions(transactions: Transaction[]): string[] {
  // Count frequency of each description in last 90 days
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recent = transactions.filter(tx => new Date(tx.created_at).getTime() > cutoff);

  const freq = new Map<string, { count: number; amount: number; type: string }>();
  for (const tx of recent) {
    const key = tx.description.toLowerCase();
    const existing = freq.get(key);
    if (existing) {
      existing.count++;
    } else {
      freq.set(key, { count: 1, amount: tx.amount, type: tx.type });
    }
  }

  // Keep only entries that appear 2+ times, sort by frequency
  return [...freq.entries()]
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([desc, v]) => `${v.amount} ${desc}`);
}

export default function BottomInput({ value, onChange, onSend, disabled, transactions = [] }: BottomInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [popping, setPopping] = useState(false);
  const suggestions = useMemo(() => getSmartSuggestions(transactions), [transactions]);

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
      style={{ background: "#fff", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
    >
      {/* Smart suggestion chips — scrollable row */}
      {value.trim().length < 4 && suggestions.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {suggestions.map((s, i) => (
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
