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
      className="flex-shrink-0 px-3 pt-2 pb-4"
      style={{ background: "#fff" }}
    >
      {/* Suggestion chips — scrollable row */}
      {!value && (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => fillSuggestion(s)}
              className="flex-shrink-0 px-3 py-1 text-xs font-medium rounded-full border md-ripple whitespace-nowrap"
              style={{
                borderColor: "var(--md-outline-variant)",
                color: "var(--md-on-surface-variant)",
                background: "var(--md-surface-container-low)",
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
            placeholder="Type anything… 500 coffee, 25k salary"
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
          className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 md-ripple transition-all active:scale-95 disabled:opacity-30"
          style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M2 12L22 2L12 22L10 14L2 12Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
