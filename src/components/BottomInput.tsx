"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import type { Transaction } from "@/types";

interface BottomInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  transactions?: Transaction[];
}

function getSmartSuggestions(transactions: Transaction[]): string[] {
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const recent = transactions.filter(tx => new Date(tx.created_at).getTime() > cutoff);
  const freq = new Map<string, { count: number; amount: number; type: string }>();
  for (const tx of recent) {
    const key = tx.description.toLowerCase();
    const existing = freq.get(key);
    if (existing) { existing.count++; }
    else { freq.set(key, { count: 1, amount: tx.amount, type: tx.type }); }
  }
  return [...freq.entries()]
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([desc, v]) => `${v.amount} ${desc}`);
}

type SpeechRecognitionType = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionType) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionType; webkitSpeechRecognition?: new () => SpeechRecognitionType };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function BottomInput({ value, onChange, onSend, disabled, transactions = [] }: BottomInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [popping, setPopping] = useState(false);
  const [listening, setListening] = useState(false);
  const [ripple, setRipple] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const suggestions = useMemo(() => getSmartSuggestions(transactions), [transactions]);

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
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
    if (e.key === "Enter" && e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function handleSend() {
    if (!value.trim()) return;
    setPopping(true);
    setTimeout(() => setPopping(false), 300);
    onSend();
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function fillSuggestion(text: string) {
    onChange(text);
    const el = textareaRef.current;
    if (el) { el.focus(); requestAnimationFrame(() => autoGrow(el)); }
  }

  function toggleVoice() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SR = getSpeechRecognition();
    if (!SR) { alert("Voice input not supported on this browser."); return; }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";

    const finalRef = { text: "" };

    rec.onresult = (e) => {
      let full = "";
      let interim = "";
      const results = e.results as unknown as { [k: number]: { isFinal?: boolean; [k: number]: { transcript: string } }; length?: number };
      const len = results.length ?? Object.keys(results).length;
      for (let i = 0; i < len; i++) {
        const transcript = results[i][0].transcript;
        if (results[i].isFinal) { full += transcript + " "; }
        else { interim = transcript; }
      }
      finalRef.text = full.trim();
      onChange((full + interim).trim());
      const el = textareaRef.current;
      if (el) requestAnimationFrame(() => autoGrow(el));
    };

    rec.onerror = (e) => {
      console.error("Speech error:", e.error);
      setListening(false);
    };

    rec.onend = () => {
      setListening(false);
      if (finalRef.text.trim()) {
        setTimeout(() => {
          setPopping(true);
          setTimeout(() => setPopping(false), 300);
          onSend();
          if (textareaRef.current) textareaRef.current.style.height = "auto";
        }, 400);
      }
    };

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
  }

  return (
    <div
      className="flex-shrink-0 px-3 pt-2"
      style={{ background: "#fff", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
    >
      {/* Smart suggestion chips */}
      {value.trim().length < 4 && suggestions.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 no-scrollbar">
          {suggestions.map((s, i) => (
            <button
              key={s}
              onClick={() => fillSuggestion(s)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap animate-fade-up"
              style={{ background: "rgba(200,49,255,0.05)", color: "var(--md-primary)", animationDelay: `${i * 0.04}s` }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2">
        {/* Pill input */}
        <div
          className="flex-1 flex items-end gap-2 px-4 py-2.5 rounded-[22px]"
          style={{ background: "var(--md-surface-container-low)", border: `1.5px solid ${listening ? "var(--md-primary)" : "var(--md-outline-variant)"}`, transition: "border-color 0.2s" }}
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={listening ? "Listening…" : "Just type what you spent or earned..."}
            autoComplete="off"
            autoCorrect="off"
            disabled={disabled}
            className="flex-1 border-none outline-none bg-transparent text-[15px] resize-none leading-[1.5] max-h-[120px] overflow-y-auto no-scrollbar"
            style={{ color: "var(--md-on-surface)" }}
          />

          {/* Mic button — inside the pill */}
          <button
            onClick={toggleVoice}
            disabled={disabled}
            className="flex-shrink-0 mb-0.5"
            style={{ color: listening ? "var(--md-primary)" : "var(--md-on-surface-variant)", position: "relative" }}
          >
            {/* Ripple ring when listening */}
            {listening && (
              <span
                className="absolute inset-0 rounded-full"
                style={{
                  background: "var(--md-primary)",
                  opacity: ripple ? 0.2 : 0,
                  transform: ripple ? "scale(2.5)" : "scale(1)",
                  transition: "transform 0.6s ease-out, opacity 0.6s ease-out",
                  animation: "mic-pulse 1.5s ease-in-out infinite",
                }}
              />
            )}
            {listening ? (
              /* Stop icon */
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              /* Mic icon */
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
        </div>

        {/* Send button */}
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

      <style>{`
        @keyframes mic-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1.8); }
          50% { opacity: 0.3; transform: scale(2.4); }
        }
      `}</style>
    </div>
  );
}
