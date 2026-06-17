"use client";

import { useState } from "react";
import type { Transaction } from "@/types";
import TxItem from "@/components/TxItem";

interface SearchViewProps {
  transactions: Transaction[];
}

const SEARCH_CHIPS: { icon: string; label: string; query: string }[] = [
  { icon: "📊", label: "Monthly spend", query: "How much did I spend this month?" },
  { icon: "🍕", label: "Food expenses", query: "Show food expenses" },
  { icon: "💰", label: "Income", query: "Income this month" },
  { icon: "🗂️", label: "All entries", query: "Show all transactions" },
  { icon: "🚗", label: "Transport", query: "Transport this month" },
  { icon: "📈", label: "Biggest expense", query: "Biggest expense" },
];

export default function SearchView({ transactions }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const allTx = transactions.slice().reverse();

  async function runSearch(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setResult("");

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, transactions: transactions.slice(-50) }),
      });
      const data = await res.json();
      setResult(data.answer || "No answer found.");
    } catch {
      setResult("Couldn't process that right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* MD3 Search Bar */}
      <div className="px-4 py-3 flex-shrink-0" style={{ background: "var(--md-surface-container-low)" }}>
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-[var(--md-shape-full)]"
          style={{ background: "var(--md-surface-container-highest)" }}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-on-surface-variant)" }}>
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
            type="text"
            placeholder="Ask about your money..."
            autoComplete="off"
            className="flex-1 border-none outline-none bg-transparent text-sm"
            style={{ color: "var(--md-on-surface)" }}
          />
          {query && (
            <button onClick={() => runSearch(query)} className="md-ripple rounded-full p-1">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" style={{ color: "var(--md-primary)" }}>
                <path d="M2 12L22 2L12 22L10 14L2 12Z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {/* AI Result — MD3 Filled card */}
        {result !== null && (
          <div
            className="mx-4 mt-3 mb-2 p-4 rounded-[var(--md-shape-xl)] animate-fade-up"
            style={{ background: "var(--md-secondary-container)" }}
          >
            {loading ? (
              <div className="flex gap-1.5 items-center py-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: "var(--md-on-secondary-container)" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot [animation-delay:0.2s]" style={{ background: "var(--md-on-secondary-container)" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot [animation-delay:0.4s]" style={{ background: "var(--md-on-secondary-container)" }} />
              </div>
            ) : (
              <p className="text-sm leading-[1.7]" style={{ color: "var(--md-on-secondary-container)" }}>{result}</p>
            )}
          </div>
        )}

        {/* MD3 Suggestion chips */}
        <div className="grid grid-cols-2 gap-2 px-4 pt-3 pb-4">
          {SEARCH_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => runSearch(chip.query)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-[var(--md-shape-sm)] text-left md-ripple border"
              style={{
                background: "var(--md-surface-container-low)",
                borderColor: "var(--md-outline-variant)",
                color: "var(--md-on-surface-variant)",
              }}
            >
              <span className="text-base flex-shrink-0">{chip.icon}</span>
              <span className="text-xs font-medium">{chip.label}</span>
            </button>
          ))}
        </div>

        {/* All entries label */}
        <div className="px-4 pb-2">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--md-on-surface-variant)" }}>
            All Entries
          </span>
        </div>

        {allTx.length > 0 ? (
          <div className="px-4 flex flex-col gap-1">
            {allTx.map((tx, i) => (
              <TxItem key={tx.id} tx={tx} index={i} showDate />
            ))}
          </div>
        ) : (
          <div className="px-6 py-6 text-center text-sm" style={{ color: "var(--md-outline)" }}>
            No transactions yet
          </div>
        )}
      </div>
    </div>
  );
}
