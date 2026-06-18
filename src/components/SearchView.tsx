"use client";

import { useState } from "react";
import type { Transaction } from "@/types";
import TxItem from "@/components/TxItem";
import { apiUrl } from "@/lib/api";

interface SearchViewProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (id: string, updates: Partial<Transaction>) => void;
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

function groupByMonthAndDate(transactions: Transaction[]) {
  // newest first
  const sorted = [...transactions].reverse();

  // month key → date key → transactions
  const months: { monthKey: string; monthLabel: string; days: { dateKey: string; dateLabel: string; txs: Transaction[] }[] }[] = [];
  const monthMap = new Map<string, Map<string, Transaction[]>>();

  for (const tx of sorted) {
    const d = new Date(tx.created_at);
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    if (!monthMap.has(monthKey)) monthMap.set(monthKey, new Map());
    const dayMap = monthMap.get(monthKey)!;
    if (!dayMap.has(dateKey)) dayMap.set(dateKey, []);
    dayMap.get(dateKey)!.push(tx);
  }

  for (const [monthKey, dayMap] of monthMap) {
    const [year, month] = monthKey.split("-").map(Number);
    const monthLabel = new Date(year, month, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
    const days: { dateKey: string; dateLabel: string; txs: Transaction[] }[] = [];

    for (const [dateKey, txs] of dayMap) {
      const [y, m, day] = dateKey.split("-").map(Number);
      const d = new Date(y, m, day);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const isYesterday = d.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString();
      const dateLabel = isToday ? "Today" : isYesterday ? "Yesterday" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      days.push({ dateKey, dateLabel, txs });
    }

    months.push({ monthKey, monthLabel, days });
  }

  return months;
}

export default function SearchView({ transactions, onDeleteTransaction, onEditTransaction }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "this_month" | "last_month">("all");

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`;

  const filtered = transactions.filter(tx => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (timeFilter !== "all") {
      const d = new Date(tx.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (timeFilter === "this_month" && key !== thisMonthKey) return false;
      if (timeFilter === "last_month" && key !== lastMonthKey) return false;
    }
    return true;
  });

  const grouped = groupByMonthAndDate(filtered);

  async function runSearch(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setResult("");

    try {
      const res = await fetch(apiUrl("/api/search"), {
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
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => { if (!query) setSearchFocused(false); }}
            type="text"
            placeholder="Ask about your money..."
            autoComplete="off"
            className="flex-1 border-none outline-none bg-transparent text-sm"
            style={{ color: "var(--md-on-surface)" }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setResult(null); setSearchFocused(false); }} className="flex-shrink-0">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ color: "var(--md-outline)" }}>
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Filters — hidden when search is active */}
      {!searchFocused && !result && <div className="flex-shrink-0 px-4 pb-3 flex flex-col gap-2">
        {/* Type filter */}
        <div className="flex gap-2">
          {(["all", "income", "expense"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: typeFilter === t ? "var(--md-on-surface)" : "var(--md-surface-container-low)",
                color: typeFilter === t ? "#fff" : "var(--md-on-surface-variant)",
              }}
            >
              {t === "all" ? "All" : t === "income" ? "Income" : "Expense"}
            </button>
          ))}
        </div>
        {/* Time filter */}
        <div className="flex gap-2">
          {(["all", "this_month", "last_month"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: timeFilter === t ? "var(--md-primary)" : "var(--md-surface-container-low)",
                color: timeFilter === t ? "#fff" : "var(--md-on-surface-variant)",
              }}
            >
              {t === "all" ? "All time" : t === "this_month" ? "This month" : "Last month"}
            </button>
          ))}
        </div>
      </div>}

      <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
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
            <button onClick={() => runSearch(query)} className="mt-2 text-xs font-medium" style={{ color: "var(--md-primary)" }}>
              Ask again
            </button>
          </div>
        )}

        {/* Suggestion chips — horizontal scroll, only when search focused */}
        {!result && searchFocused && (
          <div className="flex gap-2 px-4 mb-3 overflow-x-auto no-scrollbar">
            {SEARCH_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => runSearch(chip.query)}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-left flex-shrink-0"
                style={{ background: "var(--md-surface-container-low)" }}
              >
                <span className="flex-shrink-0" style={{ color: "var(--md-on-surface-variant)" }}>{chip.icon}</span>
                <span className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--md-on-surface)" }}>{chip.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Grouped entries */}
        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm" style={{ color: "var(--md-outline)" }}>No transactions found</div>
        ) : (
          grouped.map(({ monthKey, monthLabel, days }) => (
            <div key={monthKey}>
              {/* Month header */}
              <div className="px-4 pt-2 pb-1 flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: "var(--md-on-surface-variant)" }}>{monthLabel}</span>
                <span className="text-[10px]" style={{ color: "var(--md-outline)" }}>
                  {days.reduce((s, d) => s + d.txs.length, 0)} entries
                </span>
              </div>

              {/* Days */}
              {days.map(({ dateKey, dateLabel, txs }) => (
                <div key={dateKey}>
                  {/* Date label */}
                  <div className="px-4 py-1">
                    <span className="text-[11px] font-medium" style={{ color: "var(--md-outline)" }}>{dateLabel}</span>
                  </div>
                  {/* Transactions */}
                  <div className="px-3">
                    {txs.map((tx, i) => (
                      <TxItem key={tx.id} tx={tx} index={i} onDelete={onDeleteTransaction} onEdit={onEditTransaction} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
