"use client";

import { useState } from "react";
import type { Transaction } from "@/types";
import TxItem from "@/components/TxItem";

interface SearchViewProps {
  transactions: Transaction[];
}

const ic = { width: 15, height: 15, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const SEARCH_CHIPS: { icon: React.ReactNode; label: string; query: string }[] = [
  { icon: <svg {...ic}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>, label: "Monthly spend", query: "How much did I spend this month?" },
  { icon: <svg {...ic}><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></svg>, label: "Food", query: "Show food expenses" },
  { icon: <svg {...ic}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, label: "Income", query: "Income this month" },
  { icon: <svg {...ic}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>, label: "All entries", query: "Show all transactions" },
  { icon: <svg {...ic}><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, label: "Transport", query: "Transport this month" },
  { icon: <svg {...ic}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>, label: "Top expense", query: "Biggest expense" },
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
              <span className="flex-shrink-0 flex items-center" style={{ color: "var(--md-primary)" }}>{chip.icon}</span>
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
