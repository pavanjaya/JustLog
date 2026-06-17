"use client";

import type { Transaction } from "@/types";
import { getCategoryMeta, fmtCompact, fmtFull } from "@/lib/format";

interface StoryViewProps {
  transactions: Transaction[];
}

export default function StoryView({ transactions }: StoryViewProps) {
  const now = new Date();
  const monthLabel = now.toLocaleString("en-IN", { month: "long", year: "numeric" });

  const thisMonth = transactions.filter((tx) => {
    const d = new Date(tx.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  let income = 0;
  let expense = 0;
  const catTotals: Record<string, number> = {};

  thisMonth.forEach((tx) => {
    if (tx.type === "income") { income += tx.amount; }
    else { expense += tx.amount; catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount; }
  });

  const sortedCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);
  const topCats = sortedCats.slice(0, 6);
  const maxAmt = topCats[0]?.[1] || 1;

  let narrative: string;
  if (thisMonth.length === 0) {
    narrative = "Log some transactions and your story will appear here.";
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
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="text-base font-medium" style={{ color: "var(--md-on-surface)" }}>{monthLabel}</div>
        <div className="flex gap-1">
          {["‹", "›"].map((ch) => (
            <button
              key={ch}
              className="w-9 h-9 rounded-full flex items-center justify-center md-ripple text-lg font-light"
              style={{ color: "var(--md-on-surface-variant)", background: "var(--md-surface-container)" }}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>

      {/* MD3 Filled cards — Totals */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <div className="rounded-[var(--md-shape-xl)] p-4 text-center" style={{ background: "var(--md-tertiary-container)" }}>
          <div className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--md-on-tertiary-container)", opacity: 0.7 }}>Income</div>
          <div className="text-base font-medium" style={{ color: "var(--md-on-tertiary-container)" }}>{fmtCompact(income)}</div>
        </div>
        <div className="rounded-[var(--md-shape-xl)] p-4 text-center" style={{ background: "var(--md-error-container)" }}>
          <div className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--md-on-error-container)", opacity: 0.7 }}>Spent</div>
          <div className="text-base font-medium" style={{ color: "var(--md-on-error-container)" }}>{fmtCompact(expense)}</div>
        </div>
        <div className="rounded-[var(--md-shape-xl)] p-4 text-center" style={{ background: "var(--md-primary-container)" }}>
          <div className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--md-on-primary-container)", opacity: 0.7 }}>Saved</div>
          <div className="text-base font-medium" style={{ color: "var(--md-on-primary-container)" }}>{fmtCompact(income - expense)}</div>
        </div>
      </div>

      {/* MD3 Outlined card — Narrative */}
      <div
        className="mx-4 mb-4 p-4 rounded-[var(--md-shape-xl)]"
        style={{ background: "var(--md-surface-container-low)", border: "1px solid var(--md-outline-variant)" }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span style={{ color: "var(--md-primary)" }}>✦</span>
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--md-primary)" }}>
            Your Monthly Story
          </span>
        </div>
        <p className="text-sm leading-[1.75]" style={{ color: "var(--md-on-surface)" }}>{narrative}</p>
      </div>

      {/* Top categories label */}
      <div className="px-4 pb-2">
        <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--md-on-surface-variant)" }}>
          Top Categories
        </span>
      </div>

      {topCats.length > 0 ? (
        <div className="px-4 flex flex-col gap-2">
          {topCats.map(([category, amount]) => {
            const meta = getCategoryMeta(category);
            const pct = Math.round((amount / maxAmt) * 100);
            return (
              <div
                key={category}
                className="flex items-center gap-3 p-3 rounded-[var(--md-shape-xl)]"
                style={{ background: "var(--md-surface-container-low)" }}
              >
                <div
                  className="w-10 h-10 rounded-[var(--md-shape-md)] flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: meta.bg }}
                >
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium mb-1.5" style={{ color: "var(--md-on-surface)" }}>{category}</div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--md-surface-container-highest)" }}>
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{ width: `${pct}%`, background: "var(--md-error)" }}
                    />
                  </div>
                </div>
                <div className="text-sm font-medium flex-shrink-0" style={{ color: "var(--md-on-surface)" }}>
                  {fmtFull(amount)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-5 text-center text-sm" style={{ color: "var(--md-outline)" }}>
          No expense categories yet.
        </div>
      )}
    </div>
  );
}
