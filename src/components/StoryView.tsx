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

  // All-time stats
  const allIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const allExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const allBalance = allIncome - allExpense;
  const allCatTotals: Record<string, number> = {};
  transactions.filter(t => t.type === "expense").forEach(t => {
    allCatTotals[t.category] = (allCatTotals[t.category] || 0) + t.amount;
  });
  const topAllCats = Object.entries(allCatTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxAllCat = topAllCats[0]?.[1] || 1;

  const sortedCats = Object.entries(curr.catTotals).sort((a, b) => b[1] - a[1]);
  const topCats = sortedCats.slice(0, 5);
  const maxCat = topCats[0]?.[1] || 1;
  const maxDay = Math.max(...Object.values(curr.dayTotals), 1);
  const savingsRate = curr.income > 0 ? Math.round(((curr.income - curr.expense) / curr.income) * 100) : null;

  function delta(curr: number, prev: number) {
    if (prev === 0) return null;
    return Math.round(((curr - prev) / prev) * 100);
  }

  const expenseDelta = delta(curr.expense, prev.expense);

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-8" style={{ background: "#fff" }}>

      {/* ── ALL-TIME OVERVIEW ── */}
      <div className="px-4 pt-5 pb-2">
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--md-outline)" }}>All Time</div>

        {/* Balance hero */}
        <div className="rounded-2xl px-4 py-4 mb-3" style={{ background: allBalance >= 0 ? "#F0FBF4" : "#FFF5F5" }}>
          <div className="text-xs font-medium mb-1" style={{ color: allBalance >= 0 ? "#2E7D32" : "#C62828" }}>Total Balance</div>
          <div className="text-3xl font-bold tracking-tight" style={{ color: allBalance >= 0 ? "#1B5E20" : "#B71C1C" }}>
            {allBalance < 0 ? "−" : ""}{fmtFull(Math.abs(allBalance))}
          </div>
        </div>

        {/* Income + Expense row */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl px-4 py-3" style={{ background: "#F0FBF4" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#2E7D32" }}>Total Income</div>
            <div className="text-lg font-bold" style={{ color: "#1B5E20" }}>{fmtCompact(allIncome)}</div>
          </div>
          <div className="rounded-2xl px-4 py-3" style={{ background: "#FFF5F5" }}>
            <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#C62828" }}>Total Spent</div>
            <div className="text-lg font-bold" style={{ color: "#B71C1C" }}>{fmtCompact(allExpense)}</div>
          </div>
        </div>

        {/* All-time top categories */}
        {topAllCats.length > 0 && (
          <>
            <div className="text-xs font-semibold mb-2" style={{ color: "var(--md-on-surface-variant)" }}>Where You Spend Most</div>
            <div className="flex flex-col gap-1.5 mb-2">
              {topAllCats.map(([category, amount]) => {
                const meta = getCategoryMeta(category);
                const pct = Math.round((amount / maxAllCat) * 100);
                return (
                  <div key={category} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ background: "var(--md-surface-container-low)" }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                      <CategoryIcon icon={meta.icon} size={14} color="#5a5a6e" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium mb-1" style={{ color: "var(--md-on-surface)" }}>{category}</div>
                      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--md-outline-variant)" }}>
                        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: "var(--md-primary)" }} />
                      </div>
                    </div>
                    <div className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--md-on-surface)" }}>{fmtCompact(amount)}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 my-3" style={{ height: "1px", background: "var(--md-outline-variant)" }} />

      {/* ── MONTHLY BREAKDOWN ── */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--md-outline)" }}>Monthly</div>
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
              style={{ color: "var(--md-on-surface-variant)", background: "var(--md-surface-container-low)" }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button
              onClick={() => setOffset((o) => o + 1)}
              disabled={isCurrentMonth}
              className="w-9 h-9 rounded-full flex items-center justify-center md-ripple disabled:opacity-30"
              style={{ color: "var(--md-on-surface-variant)", background: "var(--md-surface-container-low)" }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>

        {curr.filtered.length === 0 ? (
          <div className="py-8 text-center text-sm" style={{ color: "var(--md-outline)" }}>No transactions this month</div>
        ) : (
          <>
            {/* Monthly narrative — first thing you see */}
            <div className="mb-3 p-4 rounded-2xl" style={{ background: "rgba(200,49,255,0.05)" }}>
              <div className="flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-primary)" }}><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--md-primary)" }}>This Month</span>
              </div>
              <p className="text-sm leading-[1.75]" style={{ color: "var(--md-on-surface)" }}>
                {(() => {
                  let t = `You received ${fmtFull(curr.income)}.`;
                  if (curr.expense > 0) t += ` You spent ${fmtFull(curr.expense)}.`;
                  if (sortedCats.length > 0) t += ` Biggest spend: ${sortedCats[0][0]} (${fmtFull(sortedCats[0][1])}).`;
                  if (curr.income > curr.expense) t += ` Saved ${fmtFull(curr.income - curr.expense)}.`;
                  else if (curr.expense > curr.income) t += ` Overspent by ${fmtFull(curr.expense - curr.income)}.`;
                  return t;
                })()}
              </p>
            </div>

            {/* Savings rate */}
            {savingsRate !== null && (
              <div className="mb-3 px-4 py-3 rounded-2xl flex items-center justify-between" style={{ background: "var(--md-surface-container-low)" }}>
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--md-outline)" }}>Savings Rate</div>
                  <div className="text-xl font-bold" style={{ color: savingsRate >= 0 ? "#1B5E20" : "#B71C1C" }}>{savingsRate}%</div>
                </div>
                <div className="text-xs text-right max-w-[120px]" style={{ color: "var(--md-on-surface-variant)" }}>
                  {savingsRate >= 30 ? "Excellent!" : savingsRate >= 20 ? "Good job!" : savingsRate >= 10 ? "Room to improve" : savingsRate >= 0 ? "Save more" : "Overspent"}
                </div>
              </div>
            )}

            {/* Biggest transaction */}
            {curr.biggest && (
              <div className="mb-3 px-4 py-3 rounded-2xl flex items-center gap-3" style={{ background: "var(--md-surface-container-low)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: getCategoryMeta(curr.biggest.category).bg }}>
                  <CategoryIcon icon={getCategoryMeta(curr.biggest.category).icon} size={16} color="#5a5a6e" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: "var(--md-outline)" }}>Biggest</div>
                  <div className="text-sm font-medium truncate" style={{ color: "var(--md-on-surface)" }}>{curr.biggest.description}</div>
                </div>
                <div className="text-sm font-bold flex-shrink-0" style={{ color: curr.biggest.type === "income" ? "#1B7A3E" : "#C62828" }}>
                  {curr.biggest.type === "income" ? "+" : "−"}{fmtFull(curr.biggest.amount)}
                </div>
              </div>
            )}

            {/* Daily spending chart */}
            {Object.keys(curr.dayTotals).length > 0 && (
              <div className="mb-3 p-4 rounded-2xl" style={{ background: "var(--md-surface-container-low)" }}>
                <div className="text-xs font-semibold mb-3" style={{ color: "var(--md-on-surface-variant)" }}>Daily Spending</div>
                <div className="flex items-end gap-[3px] h-16">
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const amt = curr.dayTotals[day] || 0;
                    const pct = amt > 0 ? Math.max((amt / maxDay) * 100, 8) : 0;
                    const isToday = isCurrentMonth && day === now.getDate();
                    return (
                      <div key={day} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div className="w-full rounded-t-sm transition-all duration-500" style={{
                          height: `${pct}%`,
                          background: isToday ? "var(--md-primary)" : amt > 0 ? "rgba(200,49,255,0.15)" : "transparent",
                          minHeight: amt > 0 ? 3 : 0,
                        }} />
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

            {/* Monthly top categories */}
            {topCats.length > 0 && (
              <>
                <div className="text-xs font-semibold mb-2" style={{ color: "var(--md-on-surface-variant)" }}>Top Categories</div>
                <div className="flex flex-col gap-1.5">
                  {topCats.map(([category, amount]) => {
                    const meta = getCategoryMeta(category);
                    const pct = Math.round((amount / maxCat) * 100);
                    return (
                      <div key={category} className="flex items-center gap-3 px-3 py-2.5 rounded-2xl" style={{ background: "var(--md-surface-container-low)" }}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                          <CategoryIcon icon={meta.icon} size={14} color="#5a5a6e" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium mb-1" style={{ color: "var(--md-on-surface)" }}>{category}</div>
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--md-outline-variant)" }}>
                            <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: "var(--md-primary)" }} />
                          </div>
                        </div>
                        <div className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--md-on-surface)" }}>{fmtCompact(amount)}</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, delta, bg, color, accentColor, positiveIsGood }: {
  label: string; value: string; delta: number | null; bg: string; color: string; accentColor: string; positiveIsGood: boolean;
}) {
  const isGood = delta !== null && (positiveIsGood ? delta > 0 : delta < 0);
  const isBad = delta !== null && (positiveIsGood ? delta < 0 : delta > 0);

  return (
    <div className="rounded-2xl px-3 py-3" style={{ background: bg }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: accentColor }}>{label}</div>
      <div className="text-sm font-bold mb-1" style={{ color }}>{value}</div>
      {delta !== null && (
        <div className="text-[10px] font-medium" style={{ color: isGood ? "#2E7D32" : isBad ? "#C62828" : "var(--md-outline)" }}>
          {delta > 0 ? "↑" : "↓"}{Math.abs(delta)}% vs last
        </div>
      )}
    </div>
  );
}
