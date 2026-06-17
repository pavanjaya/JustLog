"use client";

import { useRef } from "react";

interface BottomInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

const SUGGESTIONS = ["500 coffee", "25000 salary", "1200 petrol", "17000 school fees", "3000 grocery"];

export default function BottomInput({ value, onChange, onSend, disabled }: BottomInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoGrow(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    autoGrow(e.target);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleSend() {
    onSend();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function fillSuggestion(text: string) {
    onChange(text);
    const el = textareaRef.current;
    if (el) { el.focus(); requestAnimationFrame(() => autoGrow(el)); }
  }

  return (
    <div
      className="flex-shrink-0 px-4 pt-3 pb-2"
      style={{ background: "var(--md-surface-container-low)", borderTop: "1px solid var(--md-outline-variant)" }}
    >
      {/* MD3 Assist chips / Suggestion chips */}
      <div className="flex gap-2 overflow-x-auto pb-2.5 no-scrollbar">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => fillSuggestion(s)}
            className="flex-shrink-0 px-4 py-1.5 text-xs font-medium rounded-full border md-ripple transition-colors whitespace-nowrap"
            style={{
              borderColor: "var(--md-outline)",
              color: "var(--md-on-surface-variant)",
              background: "transparent",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-3">
        {/* MD3 Filled Text Field */}
        <div
          className="flex-1 flex items-end gap-2 px-4 py-3 rounded-t-[var(--md-shape-xs)] rounded-b-none"
          style={{
            background: "var(--md-surface-container-highest)",
            borderBottom: `2px solid var(--md-primary)`,
          }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="500 coffee · 1200 petrol · 25000 salary"
            autoComplete="off"
            autoCorrect="off"
            disabled={disabled}
            className="flex-1 border-none outline-none bg-transparent text-[15px] resize-none leading-[1.5] max-h-[120px] overflow-y-auto no-scrollbar"
            style={{ color: "var(--md-on-surface)" }}
          />
        </div>

        {/* MD3 FAB - Small */}
        <button
          onClick={handleSend}
          disabled={disabled}
          className="w-14 h-14 rounded-[var(--md-shape-lg)] flex items-center justify-center flex-shrink-0 md-ripple transition-all active:scale-95 disabled:opacity-40"
          style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-container)" }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M2 12L22 2L12 22L10 14L2 12Z" />
          </svg>
        </button>
      </div>

      <div className="text-center text-[11px] mt-1.5" style={{ color: "var(--md-on-surface-variant)" }}>
        Enter to log · Shift+Enter for new line
      </div>
    </div>
  );
}
