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
    if (el) {
      el.focus();
      requestAnimationFrame(() => autoGrow(el));
    }
  }

  return (
    <div className="flex-shrink-0 bg-white border-t border-border px-3 pt-2.5 pb-3.5">
      {/* Suggestion chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-2.5 no-scrollbar">
        {SUGGESTIONS.map((s) => (
          <div
            key={s}
            onClick={() => fillSuggestion(s)}
            className="bg-surface border border-border rounded-full px-3.5 py-1.5 text-xs text-text-secondary whitespace-nowrap cursor-pointer transition-colors hover:bg-blue-light hover:border-blue hover:text-blue flex-shrink-0"
          >
            {s}
          </div>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-end gap-2">
        <div className="flex-1 bg-surface border-[1.5px] border-transparent rounded-radius-xl px-4 py-2.5 flex items-end gap-2 transition-colors focus-within:border-blue focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(25,118,210,0.07)]">
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={"500 coffee\n1200 petrol\n25000 salary"}
            autoComplete="off"
            autoCorrect="off"
            disabled={disabled}
            className="flex-1 border-none outline-none bg-transparent text-[15px] text-text-primary resize-none leading-[1.5] max-h-[120px] overflow-y-auto no-scrollbar placeholder:text-text-tertiary"
          />
        </div>
        <button
          onClick={handleSend}
          disabled={disabled}
          className="w-9 h-9 bg-blue rounded-full flex-shrink-0 flex items-center justify-center transition-all hover:bg-[#1565C0] active:scale-[0.91] disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
            <path d="M2 12L22 2L12 22L10 14L2 12Z" />
          </svg>
        </button>
      </div>

      <div className="text-center text-[11px] text-text-tertiary mt-1.5">
        Enter to log · Shift+Enter for new line
      </div>
    </div>
  );
}
