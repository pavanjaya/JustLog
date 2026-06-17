"use client";

import { useState } from "react";
import type { Transaction } from "@/types";
import TxItem from "@/components/TxItem";

interface SearchViewProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
}

const SEARCH_CHIPS = [
  { label: "Monthly spend", query: "How much did I spend this month?" },
  { label: "Food expenses", query: "Show food expenses" },
  { label: "Income", query: "Income this month" },
  { label: "Top expense", query: "Biggest expense" },
  { label: "Transport", query: "Transport this month" },
  { label: "All entries", query: "Show all transactions" },
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

        {/* Suggestion chips — horizontal scroll rows */}
        {!result && (
          <div className="px-4 mb-4 flex flex-wrap gap-2">
            {SEARCH_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => runSearch(chip.query)}
                className="px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(200,49,255,0.05)",
                  color: "var(--md-primary)",
                }}
              >
                {chip.label}
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
