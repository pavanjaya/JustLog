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
  { icon: "💰", label: "Income received", query: "Income this month" },
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

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") runSearch(query);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search input */}
      <div className="px-4 py-3 bg-white border-b border-border flex-shrink-0">
        <div className="bg-surface border-[1.5px] border-transparent rounded-radius-xl px-4 py-2.5 pr-1 flex items-center gap-2 transition-colors focus-within:border-blue focus-within:bg-white">
          <div className="text-text-tertiary flex items-center flex-shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            type="text"
            placeholder="How much did I spend this month?"
            autoComplete="off"
            className="flex-1 border-none outline-none bg-transparent text-sm text-text-primary placeholder:text-text-tertiary"
          />
          <button
            onClick={() => runSearch(query)}
            className="w-[34px] h-[34px] bg-blue rounded-full flex items-center justify-center flex-shrink-0 transition-colors hover:bg-[#1565C0]"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
              <path d="M2 12L22 2L12 22L10 14L2 12Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-3 pb-5">
        {/* Result */}
        {result !== null && (
          <div className="mx-4 mb-3 bg-white rounded-radius-md p-4 shadow-shadow-sm border-l-[3px] border-blue animate-fade-up">
            {loading ? (
              <div className="flex gap-1 items-center py-0.5">
                <span className="w-1.5 h-1.5 bg-blue rounded-full animate-pulse-dot" />
                <span className="w-1.5 h-1.5 bg-blue rounded-full animate-pulse-dot [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-blue rounded-full animate-pulse-dot [animation-delay:0.4s]" />
              </div>
            ) : (
              <div className="text-sm leading-[1.7]">{result}</div>
            )}
          </div>
        )}

        {/* Suggestion chips */}
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          {SEARCH_CHIPS.map((chip) => (
            <div
              key={chip.label}
              onClick={() => runSearch(chip.query)}
              className="bg-white border border-border rounded-radius-md p-[11px_13px] text-xs text-text-secondary cursor-pointer shadow-shadow-sm transition-colors hover:border-blue hover:text-blue hover:bg-blue-light flex items-center gap-[7px]"
            >
              <span className="text-[15px] flex-shrink-0">{chip.icon}</span>
              {chip.label}
            </div>
          ))}
        </div>

        {/* All entries */}
        <div className="px-4 pb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">All Entries</span>
        </div>

        {allTx.length > 0 ? (
          <div className="px-4 flex flex-col gap-2">
            {allTx.map((tx, i) => (
              <TxItem key={tx.id} tx={tx} index={i} showDate />
            ))}
          </div>
        ) : (
          <div className="px-6 py-6 text-center text-text-tertiary text-[13px]">No transactions yet</div>
        )}
      </div>
    </div>
  );
}
