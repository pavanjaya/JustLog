"use client";

import { useState } from "react";
import type { Transaction } from "@/types";
import { getCategoryMeta, fmtCompact, fmtFull } from "@/lib/format";
import CategoryIcon from "@/components/CategoryIcon";

interface StoryViewProps {
  transactions: Transaction[];
}

function getMonthData(transactions: Transaction[], year: number, month: number) {
  const filtered = transactions.filter((tx) => {
    const d = new Date(tx.created_at);
    return d.getMonth() === month && d.getFullYear() === year;
  });
  let income = 0, expense = 0;
  const catTotals: Record<string, number> = {};
  const dayTotals: Record<number, number> = {};

  filtered.forEach((tx) => {
    const day = new Date(tx.created_at).getDate();
    if (tx.type === "income") {
      income += tx.amount;
    } else {
      expense += tx.amount;
      catTotals[tx.category] = (catTotals[tx.category] || 0) + tx.amount;
      dayTotals[day] = (dayTotals[day] || 0) + tx.amount;
    }
  });

  const biggest = filtered.reduce<Transaction | null>((max, tx) => {
    if (!max || tx.amount > max.amount) return tx;
    return max;
  }, null);

  return { filtered, income, expense, catTotals, dayTotals, biggest };
}

export default function StoryView({ transactions }: StoryViewProps) {
  const now = new Date();
  const [offset, setOffset] = useState(0);

  const target = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const prevTarget = new Date(now.getFullYear(), now.getMonth() + offset - 1, 1);
  const isCurrentMonth = offset === 0;
  const monthLabel = target.toLocaleString("en-IN", { month: "long", year: "numeric" });
  const daysInMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();

  const curr = getMonthData(transactions, target.getFullYear(), target.getMonth());
  const prev = getMonthData(transactions, prevTarget.getFullYear(), prevTarget.getMonth());

  const sortedCats = Object.entries(curr.catTotals).sort((a, b) => b[1] - a[1]);
  const topCats = sortedCats.slice(0, 6);
  const maxCat = topCats[0]?.[1] || 1;
  const maxDay = Math.max(...Object.values(curr.dayTotals), 1);
  const savingsRate = curr.income > 0 ? Math.round(((curr.income - curr.expense) / curr.income) * 100) : null;

  function delta(curr: number, prev: number) {
    if (prev === 0) return null;
    const pct = Math.round(((curr - prev) / prev) * 100);
    return pct;
  }

  const incomeDelta = delta(curr.income, prev.income);
  const expenseDelta = delta(curr.expense, prev.expense);
  const savedDelta = delta(curr.income - curr.expense, prev.income - prev.expense);

  let narrative = "";
  if (curr.filtered.length === 0) {
    narrative = "No transactions logged for this month.";
  } else {
    let t = `You received ${fmtFull(curr.income)}.`;
    if (curr.expense > 0) t += ` You spent ${fmtFull(curr.expense)}.`;
    if (sortedCats.length > 0) t += ` Your biggest spend was on ${sortedCats[0][0]} (${fmtFull(sortedCats[0][1])}).`;
    if (curr.income > curr.expense) t += ` You saved ${fmtFull(curr.income - curr.expense)} — ${savingsRate}% of your income.`;
    else if (curr.expense > curr.income) t += ` You overspent by ${fmtFull(curr.expense - curr.income)}.`;
    if (expenseDelta !== null) {
      if (expenseDelta < 0) t += ` Spending is down ${Math.abs(expenseDelta)}% vs last month.`;
      else if (expenseDelta > 0) t += ` Spending is up ${expenseDelta}% vs last month.`;
    }
    narrative = t;
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-5" style={{ background: "#fff" }}>
      {/* Month selector */}
      <div className="flex items-center justify-between px-4 pt-3 pb-4">
        <div>
          <div className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>{monthLabel}</div>
          {!isCurrentMonth && (
            <button onClick={() => setOffset(0)} className="text-xs mt-0.5" style={{ color: "var(--md-primary)" }}>
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
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button
            onClick={() => setOffset((o) => o + 1)}
            disabled={isCurrentMonth}
            className="w-9 h-9 rounded-full flex items-center justify-center md-ripple disabled:opacity-30"
            style={{ color: "var(--md-on-surface-variant)", background: "var(--md-surface-container)" }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      {/* Totals with vs last month */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <StatCard label="Income" value={fmtCompact(curr.income)} delta={incomeDelta} bg="var(--md-tertiary-container)" color="var(--md-on-tertiary-container)" positiveIsGood />
        <StatCard label="Spent" value={fmtCompact(curr.expense)} delta={expenseDelta} bg="var(--md-error-container)" color="var(--md-on-error-container)" positiveIsGood={false} />
        <StatCard label="Saved" value={fmtCompact(curr.income - curr.expense)} delta={savedDelta} bg="var(--md-primary-container)" color="var(--md-on-primary-container)" positiveIsGood />
      </div>

      {/* Savings rate */}
      {savingsRate !== null && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-[var(--md-shape-xl)] flex items-center justify-between"
          style={{ background: savingsRate >= 20 ? "var(--md-tertiary-container)" : savingsRate >= 0 ? "var(--md-surface-container)" : "var(--md-error-container)" }}>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5"
              style={{ color: savingsRate >= 20 ? "var(--md-on-tertiary-container)" : savingsRate >= 0 ? "var(--md-on-surface-variant)" : "var(--md-on-error-container)", opacity: 0.7 }}>
              Savings Rate
            </div>
            <div className="text-xl font-bold"
              style={{ color: savingsRate >= 20 ? "var(--md-on-tertiary-container)" : savingsRate >= 0 ? "var(--md-on-surface)" : "var(--md-on-error-container)" }}>
              {savingsRate}%
            </div>
          </div>
          <div className="text-xs text-right max-w-[120px]"
            style={{ color: savingsRate >= 20 ? "var(--md-on-tertiary-container)" : "var(--md-on-surface-variant)", opacity: 0.8 }}>
            {savingsRate >= 30 ? "Excellent saving!" : savingsRate >= 20 ? "Good job!" : savingsRate >= 10 ? "Room to improve" : savingsRate >= 0 ? "Save more if you can" : "Overspent this month"}
          </div>
        </div>
      )}

      {/* Biggest transaction */}
      {curr.biggest && (
        <div className="mx-4 mb-4 px-4 py-3 rounded-[var(--md-shape-xl)] flex items-center gap-3"
          style={{ background: "var(--md-surface-container-low)", border: "1px solid var(--md-outline-variant)" }}>
          <div className="w-9 h-9 rounded-[var(--md-shape-md)] flex items-center justify-center flex-shrink-0"
            style={{ background: getCategoryMeta(curr.biggest.category).bg }}>
            <CategoryIcon icon={getCategoryMeta(curr.biggest.category).icon} size={16} color="#5a5a6e" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--md-on-surface-variant)" }}>Biggest Transaction</div>
            <div className="text-sm font-medium truncate" style={{ color: "var(--md-on-surface)" }}>{curr.biggest.description}</div>
          </div>
          <div className="text-sm font-bold flex-shrink-0" style={{ color: curr.biggest.type === "income" ? "#2E7D32" : "#C62828" }}>
            {curr.biggest.type === "income" ? "+" : "−"}{fmtFull(curr.biggest.amount)}
          </div>
        </div>
      )}

      {/* Day-wise spend chart */}
      {Object.keys(curr.dayTotals).length > 0 && (
        <div className="mx-4 mb-4 p-4 rounded-[var(--md-shape-xl)]" style={{ background: "var(--md-surface-container-low)" }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--md-on-surface-variant)" }}>Daily Spending</div>
          <div className="flex items-end gap-[3px] h-16">
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const amt = curr.dayTotals[day] || 0;
              const pct = amt > 0 ? Math.max((amt / maxDay) * 100, 8) : 0;
              const isToday = isCurrentMonth && day === now.getDate();
              return (
                <div key={day} className="flex-1 flex flex-col items-center justify-end h-full">
                  <div
                    className="w-full rounded-t-sm transition-all duration-500"
                    style={{
                      height: `${pct}%`,
                      background: isToday ? "var(--md-primary)" : amt > 0 ? "var(--md-primary-container)" : "transparent",
                      minHeight: amt > 0 ? 3 : 0,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px]" style={{ color: "var(--md-outline)" }}>1</span>
            <span className="text-[10px]" style={{ color: "var(--md-outline)" }}>{Math.ceil(daysInMonth / 2)}</span>
            <span className="text-[10px]" style={{ color: "var(--md-outline)" }}>{daysInMonth}</span>
          </div>
        </div>
      )}

      {/* Narrative */}
      <div className="mx-4 mb-4 p-4 rounded-[var(--md-shape-xl)]"
        style={{ background: "var(--md-surface-container-low)", border: "1px solid var(--md-outline-variant)" }}>
        <div className="flex items-center gap-2 mb-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-primary)" }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--md-primary)" }}>Your Story</span>
        </div>
        <p className="text-sm leading-[1.75]" style={{ color: "var(--md-on-surface)" }}>{narrative}</p>
      </div>

      {/* Top categories */}
      {topCats.length > 0 && (
        <>
          <div className="px-4 pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--md-on-surface-variant)" }}>Top Categories</span>
          </div>
          <div className="px-4 flex flex-col gap-2">
            {topCats.map(([category, amount]) => {
              const meta = getCategoryMeta(category);
              const pct = Math.round((amount / maxCat) * 100);
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
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, delta, bg, color, positiveIsGood }: {
  label: string; value: string; delta: number | null; bg: string; color: string; positiveIsGood: boolean;
}) {
  const isGood = delta !== null && (positiveIsGood ? delta > 0 : delta < 0);
  const isBad = delta !== null && (positiveIsGood ? delta < 0 : delta > 0);

  return (
    <div className="rounded-[var(--md-shape-xl)] p-3 text-center" style={{ background: bg }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color, opacity: 0.7 }}>{label}</div>
      <div className="text-sm font-bold mb-1" style={{ color }}>{value}</div>
      {delta !== null && (
        <div className="text-[10px] font-medium" style={{ color: isGood ? "#2E7D32" : isBad ? "#C62828" : color, opacity: 0.9 }}>
          {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}% vs last
        </div>
      )}
    </div>
  );
}
