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
    if (tx.type === "income") {
      income += tx.amount;
    } else {
      expense += tx.amount;
      catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
    }
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
    if (sortedCats.length > 0) {
      t += ` Your biggest expense was ${sortedCats[0][0]} (${fmtFull(sortedCats[0][1])}).`;
    }
    if (income > expense) {
      t += ` You saved ${fmtFull(income - expense)}.`;
    } else if (expense > income) {
      t += ` You overspent by ${fmtFull(expense - income)}.`;
    }
    narrative = t;
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-5">
      {/* Month selector */}
      <div className="flex items-center justify-between px-4 pb-4">
        <div className="text-base font-bold tracking-tight">{monthLabel}</div>
        <div className="flex gap-1">
          <button className="w-8 h-8 border border-border rounded-[9px] bg-white flex items-center justify-center text-text-secondary hover:bg-surface transition-colors">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button className="w-8 h-8 border border-border rounded-[9px] bg-white flex items-center justify-center text-text-secondary hover:bg-surface transition-colors">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <div className="bg-white rounded-radius-md p-[14px_10px] text-center shadow-shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary mb-[5px]">Income</div>
          <div className="text-[17px] font-bold tracking-tight text-green">{fmtCompact(income)}</div>
        </div>
        <div className="bg-white rounded-radius-md p-[14px_10px] text-center shadow-shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary mb-[5px]">Spent</div>
          <div className="text-[17px] font-bold tracking-tight text-red">{fmtCompact(expense)}</div>
        </div>
        <div className="bg-white rounded-radius-md p-[14px_10px] text-center shadow-shadow-sm">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary mb-[5px]">Saved</div>
          <div className="text-[17px] font-bold tracking-tight text-blue">{fmtCompact(income - expense)}</div>
        </div>
      </div>

      {/* Narrative */}
      <div className="mx-4 mb-4 bg-white rounded-radius-md p-[18px] shadow-shadow-sm border-l-[3px] border-blue">
        <div className="text-[10px] font-semibold uppercase tracking-wide text-blue mb-2.5">✦ Your Monthly Story</div>
        <div className="text-sm leading-[1.75] text-text-primary">{narrative}</div>
      </div>

      {/* Top categories */}
      <div className="px-4 pb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Top Categories</span>
      </div>

      {topCats.length > 0 ? (
        <div className="px-4 flex flex-col gap-2">
          {topCats.map(([category, amount]) => {
            const meta = getCategoryMeta(category);
            const pct = Math.round((amount / maxAmt) * 100);
            return (
              <div key={category} className="bg-white rounded-radius-md p-[13px_14px] flex items-center gap-[11px] shadow-shadow-sm">
                <div
                  className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: meta.bg }}
                >
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium mb-[5px]">{category}</div>
                  <div className="h-[3px] bg-surface-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-red transition-[width] duration-1000 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="text-[13px] font-semibold flex-shrink-0">{fmtFull(amount)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-5 text-center text-text-tertiary text-[13px]">No expense categories yet.</div>
      )}
    </div>
  );
}
