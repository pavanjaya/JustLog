"use client";

import { useState } from "react";
import type { Transaction } from "@/types";
import { getCategoryMeta, fmtCompact, fmtFull } from "@/lib/format";
import CategoryIcon from "@/components/CategoryIcon";

interface StoryViewProps {
  transactions: Transaction[];
}

export default function StoryView({ transactions }: StoryViewProps) {
  const now = new Date();
  const [offset, setOffset] = useState(0); // 0 = current month, -1 = last month, etc.

  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const monthLabel = target.toLocaleString("en-IN", { month: "long", year: "numeric" });
  const isCurrentMonth = offset === 0;

  const filtered = transactions.filter((tx) => {
    const d = new Date(tx.created_at);
    return d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear();
  });

  let income = 0;
  let expense = 0;
  const catTotals: Record<string, number> = {};

  filtered.forEach((tx) => {
    if (tx.type === "income") { income += tx.amount; }
    else { expense += tx.amount; catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount; }
  });

  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const topCats = sortedCats.slice(0, 6);
  const maxAmt = topCats[0]?.[1] || 1;

  let narrative: string;
  if (filtered.length === 0) {
    narrative = "No transactions logged for this month.";
  } else {
    let t = `You received ${fmtFull(income)}.`;
    if (expense > 0) t += ` You spent ${fmtFull(expense)}.`;
    if (sortedCats.length > 0) t += ` Your biggest expense was ${sortedCats[0][0]} (${fmtFull(sortedCats[0][1])}).`;
    if (income > expense) t += ` You saved ${fmtFull(income - expense)}.`;
    else if (expense > income) t += ` You overspent by ${fmtFull(expense - income)}.`;
    narrative = t;
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-5">
      {/* Month selector */}
      <div className="flex items-center justify-between px-4 pb-4 pt-1">
        <div>
          <div className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>{monthLabel}</div>
          {!isCurrentMonth && (
            <button
              onClick={() => setOffset(0)}
              className="text-xs mt-0.5 md-ripple px-0"
              style={{ color: "var(--md-primary)" }}
            >
              Back to current
            </button>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="w-9 h-9 rounded-full flex items-center justify-center md-ripple"
            style={{ color: "var(--md-on-surface-variant)", background: "var(--md-surface-container)" }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            disabled={isCurrentMonth}
            className="w-9 h-9 rounded-full flex items-center justify-center md-ripple disabled:opacity-30"
            style={{ color: "var(--md-on-surface-variant)", background: "var(--md-surface-container)" }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <div className="rounded-[var(--md-shape-xl)] p-4 text-center" style={{ background: "var(--md-tertiary-container)" }}>
          <div className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--md-on-tertiary-container)", opacity: 0.7 }}>Income</div>
          <div className="text-base font-semibold" style={{ color: "var(--md-on-tertiary-container)" }}>{fmtCompact(income)}</div>
        </div>
        <div className="rounded-[var(--md-shape-xl)] p-4 text-center" style={{ background: "var(--md-error-container)" }}>
          <div className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--md-on-error-container)", opacity: 0.7 }}>Spent</div>
          <div className="text-base font-semibold" style={{ color: "var(--md-on-error-container)" }}>{fmtCompact(expense)}</div>
        </div>
        <div className="rounded-[var(--md-shape-xl)] p-4 text-center" style={{ background: "var(--md-primary-container)" }}>
          <div className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--md-on-primary-container)", opacity: 0.7 }}>Saved</div>
          <div className="text-base font-semibold" style={{ color: "var(--md-on-primary-container)" }}>{fmtCompact(income - expense)}</div>
        </div>
      </div>

      {/* Narrative */}
      <div
        className="mx-4 mb-4 p-4 rounded-[var(--md-shape-xl)]"
        style={{ background: "var(--md-surface-container-low)", border: "1px solid var(--md-outline-variant)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-primary)" }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--md-primary)" }}>Your Monthly Story</span>
        </div>
        <p className="text-sm leading-[1.75]" style={{ color: "var(--md-on-surface)" }}>{narrative}</p>
      </div>

      {/* Top categories */}
      <div className="px-4 pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--md-on-surface-variant)" }}>Top Categories</span>
      </div>

      {topCats.length > 0 ? (
        <div className="px-4 flex flex-col gap-2">
          {topCats.map(([category, amount]) => {
            const meta = getCategoryMeta(category);
            const pct = Math.round((amount / maxAmt) * 100);
            return (
              <div key={category} className="flex items-center gap-3 p-3 rounded-[var(--md-shape-xl)]" style={{ background: "var(--md-surface-container-low)" }}>
                <div className="w-10 h-10 rounded-[var(--md-shape-md)] flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                  <CategoryIcon icon={meta.icon} size={16} color="#5a5a6e" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium mb-1.5" style={{ color: "var(--md-on-surface)" }}>{category}</div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--md-surface-container-highest)" }}>
                    <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: "var(--md-primary)" }} />
                  </div>
                </div>
                <div className="text-sm font-semibold flex-shrink-0" style={{ color: "var(--md-on-surface)" }}>{fmtFull(amount)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-8 text-center text-sm" style={{ color: "var(--md-outline)" }}>
          No expenses logged for this month.
        </div>
      )}
    </div>
  );
}
