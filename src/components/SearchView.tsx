"use client";

import { useState } from "react";
import type { Transaction } from "@/types";
import TxItem from "@/components/TxItem";

interface SearchViewProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

const ic = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const SEARCH_CHIPS = [
  { icon: <svg {...ic}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>, label: "Monthly spend", query: "How much did I spend this month?" },
  { icon: <svg {...ic}><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></svg>, label: "Food", query: "Show food expenses" },
  { icon: <svg {...ic}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, label: "Income", query: "Income this month" },
  { icon: <svg {...ic}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, label: "Top expense", query: "Biggest expense" },
  { icon: <svg {...ic}><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, label: "Transport", query: "Transport this month" },
  { icon: <svg {...ic}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>, label: "All entries", query: "Show all transactions" },
];

export default function SearchView({ transactions, onDeleteTransaction }: SearchViewProps) {
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
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#fff" }}>
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "var(--md-surface-container-low)", border: "1px solid var(--md-outline-variant)" }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline)" }}>
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
            <button onClick={() => runSearch(query)} className="flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" style={{ color: "var(--md-primary)" }}>
                <path d="M2 12L22 2L12 22L10 14L2 12Z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-4">
        {/* AI result */}
        {result !== null && (
          <div className="mx-4 mb-3 p-4 rounded-2xl animate-fade-up" style={{ background: "rgba(200,49,255,0.05)" }}>
            {loading ? (
              <div className="flex gap-1.5 items-center py-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: "var(--md-primary)" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot [animation-delay:0.2s]" style={{ background: "var(--md-primary)" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot [animation-delay:0.4s]" style={{ background: "var(--md-primary)" }} />
              </div>
            ) : (
              <p className="text-sm leading-[1.7]" style={{ color: "var(--md-on-surface)" }}>{result}</p>
            )}
          </div>
        )}

        {/* Suggestion chips grid */}
        {!result && (
          <div className="grid grid-cols-2 gap-2 px-4 mb-4">
            {SEARCH_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => runSearch(chip.query)}
                className="flex items-center gap-2.5 px-4 py-3 rounded-2xl text-left"
                style={{
                  background: "var(--md-surface-container-low)",
                  color: "var(--md-on-surface)",
                }}
              >
                <span className="flex-shrink-0" style={{ color: "var(--md-on-surface-variant)" }}>{chip.icon}</span>
                <span className="text-xs font-medium">{chip.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* All entries */}
        <div className="px-4 pb-2 flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>All Entries</span>
          <span className="text-xs" style={{ color: "var(--md-outline)" }}>{allTx.length} transactions</span>
        </div>

        {allTx.length > 0 ? (
          <div className="px-3 flex flex-col">
            {allTx.map((tx, i) => (
              <TxItem key={tx.id} tx={tx} index={i} showDate onDelete={onDeleteTransaction} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-10 text-center text-sm" style={{ color: "var(--md-outline)" }}>
            No transactions yet
          </div>
        )}
      </div>
    </div>
  );
}
