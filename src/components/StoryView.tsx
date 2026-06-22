"use client";

import { useState, useMemo } from "react";
import type { Transaction } from "@/types";
import { getCategoryMeta } from "@/lib/format";
import { fmtCompact, fmtFull } from "@/lib/currency";
import { useCurrency } from "@/lib/CurrencyContext";
import CategoryIcon from "@/components/CategoryIcon";

interface StoryViewProps {
  transactions: Transaction[];
  isPro?: boolean;
  onUpgrade?: () => void;
}

function txMonthKey(tx: Transaction) {
  const d = new Date(tx.created_at);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

function formatMonthShort(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short" });
}

function daysInMonth(key: string): number {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

const CHART_COLORS = [
  "var(--md-primary)",
  "#FF6B6B",
  "#4ECDC4",
  "#FFE66D",
  "#95E1D3",
];

export default function StoryView({ transactions, isPro = false, onUpgrade }: StoryViewProps) {
  const { currency } = useCurrency();
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [transactions]
  );

  const currentMonthKey = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const months = useMemo(() => {
    const seen = new Set<string>();
    sorted.forEach((tx) => seen.add(txMonthKey(tx)));
    return Array.from(seen).sort().reverse();
  }, [sorted]);

  const monthlyAgg = useMemo(() => {
    const map: Record<string, { income: number; expense: number }> = {};
    sorted.forEach((tx) => {
      const k = txMonthKey(tx);
      if (!map[k]) map[k] = { income: 0, expense: 0 };
      if (tx.type === "income") map[k].income += tx.amount;
      else map[k].expense += tx.amount;
    });
    return map;
  }, [sorted]);

  const filtered = useMemo(() => {
    if (!selectedMonth) return sorted;
    return sorted.filter((tx) => txMonthKey(tx) === selectedMonth);
  }, [sorted, selectedMonth]);

  const totalIncome = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Running balance points for day-wise chart
  const balancePoints = useMemo(() => {
    let balance = 0;
    if (selectedMonth) {
      const [y, m] = selectedMonth.split("-").map(Number);
      sorted.forEach((tx) => {
        const d = new Date(tx.created_at);
        if (d.getFullYear() < y || (d.getFullYear() === y && d.getMonth() + 1 < m))
          balance += tx.type === "income" ? tx.amount : -tx.amount;
      });
    }
    return filtered.map((tx) => {
      balance += tx.type === "income" ? tx.amount : -tx.amount;
      return { date: tx.created_at, balance, tx };
    });
  }, [filtered, sorted, selectedMonth]);
  const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : null;

  const dailyAvg = useMemo(() => {
    if (totalExpense === 0) return null;
    if (selectedMonth) return totalExpense / daysInMonth(selectedMonth);
    if (filtered.length === 0) return null;
    const first = new Date(filtered[0].created_at);
    const last = new Date(filtered[filtered.length - 1].created_at);
    const days = Math.max(1, Math.ceil((last.getTime() - first.getTime()) / 86400000) + 1);
    return totalExpense / days;
  }, [filtered, totalExpense, selectedMonth]);

  const catTotals = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const topCats = catTotals.slice(0, 5);

  const biggestExpense = useMemo(
    () =>
      filtered
        .filter((t) => t.type === "expense")
        .reduce<Transaction | null>((max, t) => (!max || t.amount > max.amount ? t : max), null),
    [filtered]
  );

  const streak = useMemo(() => {
    if (sorted.length === 0) return 0;
    const days = new Set(sorted.map((tx) => new Date(tx.created_at).toDateString()));
    let count = 0;
    const d = new Date();
    if (!days.has(d.toDateString())) {
      d.setDate(d.getDate() - 1);
      if (!days.has(d.toDateString())) return 0;
    }
    while (days.has(d.toDateString())) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [sorted]);

  const momComparison = useMemo(() => {
    if (selectedMonth || months.length < 2) return null;
    const curr = months[0];
    const prev = months[1];
    const c = monthlyAgg[curr] ?? { income: 0, expense: 0 };
    const p = monthlyAgg[prev] ?? { income: 0, expense: 0 };
    const expDiff = p.expense > 0 ? Math.round(((c.expense - p.expense) / p.expense) * 100) : null;
    const incDiff = p.income > 0 ? Math.round(((c.income - p.income) / p.income) * 100) : null;
    return { curr, prev, c, p, expDiff, incDiff };
  }, [selectedMonth, months, monthlyAgg]);

  const insights = useMemo(() => {
    const lines: string[] = [];
    if (totalExpense === 0 && totalIncome === 0) return lines;
    if (savingsRate !== null) {
      if (savingsRate >= 40) lines.push(`You saved ${savingsRate}% of your income — excellent discipline.`);
      else if (savingsRate >= 20) lines.push(`You're saving ${savingsRate}% of what you earn — solid progress.`);
      else if (savingsRate >= 0) lines.push(`Savings rate is ${savingsRate}%. There's room to grow.`);
      else lines.push(`Spending exceeded income by ${fmtFull(Math.abs(netBalance), currency)} this period.`);
    }
    if (topCats.length > 0 && totalExpense > 0) {
      const top = topCats[0];
      const pct = Math.round((top[1] / totalExpense) * 100);
      if (pct > 40) lines.push(`${top[0]} dominated at ${pct}% of all spending — worth a closer look.`);
    }
    if (dailyAvg !== null) lines.push(`You're averaging ${fmtCompact(dailyAvg, currency)} a day in expenses.`);
    return lines;
  }, [savingsRate, netBalance, topCats, totalExpense, dailyAvg]);

  const trendMonths = useMemo(() => months.slice(0, 6).reverse(), [months]);

  if (!isPro) {
    return <StoryUpgradeScreen onUpgrade={onUpgrade} />;
  }

  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8" style={{ background: "#fff" }}>
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "var(--md-surface-container-low)" }}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline)" }}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>
        <div className="text-center">
          <div className="text-base font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Your story starts here</div>
          <div className="text-sm leading-relaxed" style={{ color: "var(--md-outline)" }}>Log a few transactions and we'll write your financial story</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-10" style={{ background: "#fff" }}>

      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="text-xs font-medium mb-0.5" style={{ color: "var(--md-on-surface-variant)" }}>
          {selectedMonth ? formatMonthKey(selectedMonth) : "All time"}
        </div>
        <div className="text-xl font-bold tracking-tight" style={{ color: "var(--md-on-surface)" }}>Your Story</div>
      </div>

      {/* Month filter pills */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
        {/* "All time" locked for free users */}
        <FilterPill label="All time" active={!selectedMonth} onClick={() => setSelectedMonth(null)} />
        {months.map((m) => (
          <FilterPill key={m} label={formatMonthKey(m)} active={selectedMonth === m} onClick={() => setSelectedMonth(m)} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mx-4 py-12 flex flex-col items-center gap-2 rounded-2xl" style={{ background: "var(--md-surface-container-low)" }}>
          <div className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>No entries for {selectedMonth ? formatMonthKey(selectedMonth) : "this period"}</div>
        </div>
      ) : (
        <>
          {/* ── Hero metrics grid ── */}
          <div className="px-4 mb-5">
            <div className="grid grid-cols-3 gap-2">
              {/* Savings */}
              {savingsRate !== null && (
                <MetricTile
                  label="Saved"
                  value={`${savingsRate}%`}
                  sub={savingsRate >= 30 ? "great job" : savingsRate >= 10 ? "decent" : "needs work"}
                  bg={savingsRate >= 0 ? "rgba(200,49,255,0.07)" : "#FFF5F5"}
                  color={savingsRate >= 30 ? "var(--md-primary)" : savingsRate >= 10 ? "#FF9500" : "#EF4444"}
                />
              )}
              {/* Income */}
              {totalIncome > 0 && (
                <MetricTile label="Income" value={fmtCompact(totalIncome, currency)} sub="earned" bg="#F0FBF4" color="#1B5E20" />
              )}
              {/* Spent */}
              {totalExpense > 0 && (
                <MetricTile label="Spent" value={fmtCompact(totalExpense, currency)} sub="expenses" bg="#FFF5F5" color="#B71C1C" />
              )}
              {/* Balance */}
              <MetricTile
                label="Balance"
                value={(netBalance < 0 ? "−" : "") + fmtCompact(Math.abs(netBalance), currency)}
                sub={netBalance >= 0 ? "saved" : "overspent"}
                bg={netBalance >= 0 ? "rgba(200,49,255,0.07)" : "#FFF5F5"}
                color={netBalance >= 0 ? "var(--md-primary)" : "#B71C1C"}
              />
              {/* Daily avg */}
              {dailyAvg !== null && (
                <MetricTile label="Daily avg" value={fmtCompact(dailyAvg, currency)} sub="per day" bg="#FFF5F5" color="#B71C1C" />
              )}
              {/* Streak */}
              {streak > 0 && (
                <MetricTile label="Streak" value={`${streak} 🔥`} sub="days logged" bg="rgba(255,149,0,0.08)" color="#E65100" />
              )}
            </div>
          </div>

          {/* ── Smart Insights ── */}
          {insights.length > 0 && (
            <div className="px-4 mb-5">
              <div className="rounded-2xl px-4 py-4" style={{ background: "var(--md-surface-container-low)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--md-primary)" }}>
                    <svg viewBox="0 0 24 24" width="11" height="11" fill="#fff"><path d="M12 2a7 7 0 017 7c0 2.5-1.3 4.7-3.3 6L15 17H9l-.7-2C6.3 13.7 5 11.5 5 9a7 7 0 017-7zm-1 16h2v3h-2v-3z"/></svg>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "var(--md-primary)" }}>Insights</span>
                </div>
                {insights.map((line, i) => (
                  <p key={i} className="text-[13.5px] leading-[1.8]" style={{ color: i === 0 ? "var(--md-on-surface)" : "var(--md-on-surface-variant)" }}>
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="mx-4 mb-5" style={{ height: 1, background: "var(--md-outline-variant)" }} />

          {/* ── Balance trajectory (day-wise) ── */}
          {balancePoints.length > 1 && (
            <div className="px-4 mb-5">
              <div className="text-sm font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Balance trajectory</div>
              <div className="text-[11px] mb-3" style={{ color: "var(--md-outline)" }}>Day by day</div>
              <BalanceChart points={balancePoints} currency={currency} />
            </div>
          )}

          {/* ── Income vs Expense Trend chart ── */}
          {isPro && trendMonths.length >= 1 && (
            <div className="px-4 mb-5">
              <div className="text-sm font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Income vs Expenses</div>
              <div className="text-[11px] mb-3" style={{ color: "var(--md-outline)" }}>
                {trendMonths.length === 1 ? "This month" : "Monthly trend"}
              </div>
              <TrendChart months={trendMonths} agg={monthlyAgg} currency={currency} />
            </div>
          )}

          {/* ── Month-over-month comparison ── */}
          {momComparison ? (
            <div className="px-4 mb-5">
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--md-on-surface)" }}>
                vs {formatMonthKey(momComparison.prev)}
              </div>
              <div className="flex gap-2">
                <MomCard label="Income" curr={momComparison.c.income} diff={momComparison.incDiff} positive currency={currency} />
                <MomCard label="Expenses" curr={momComparison.c.expense} diff={momComparison.expDiff} positive={false} currency={currency} />
              </div>
            </div>
          ) : null}

          <div className="mx-4 mb-5" style={{ height: 1, background: "var(--md-outline-variant)" }} />

          {/* ── Category donut + breakdown ── */}
          {topCats.length > 0 && (
            <div className="px-4 mb-5">
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--md-on-surface)" }}>Where it went</div>
              <div className="flex gap-4 items-center mb-4">
                <DonutChart cats={topCats} total={totalExpense} />
                <div className="flex-1 flex flex-col gap-2">
                  {topCats.slice(0, 4).map(([cat], i) => {
                    const pct = totalExpense > 0 ? Math.round((topCats[i][1] / totalExpense) * 100) : 0;
                    return (
                      <div key={cat} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <span className="text-[11px] flex-1 truncate" style={{ color: "var(--md-on-surface-variant)" }}>{cat}</span>
                        <span className="text-[11px] font-semibold flex-shrink-0" style={{ color: "var(--md-on-surface)" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {topCats.map(([category, amount], i) => {
                  const meta = getCategoryMeta(category);
                  const pct = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                  const barPct = topCats[0][1] > 0 ? (amount / topCats[0][1]) * 100 : 0;
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                        <CategoryIcon icon={meta.icon} size={14} color="#5a5a6e" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>{category}</span>
                          <span className="text-xs font-semibold" style={{ color: "var(--md-on-surface)" }}>{fmtCompact(amount, currency)}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--md-outline-variant)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${barPct}%`, background: CHART_COLORS[i % CHART_COLORS.length], transition: "width 0.7s ease" }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Biggest expense ── */}
          {biggestExpense && (
            <div className="px-4 mb-5">
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--md-on-surface)" }}>Biggest expense</div>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={{ background: "var(--md-surface-container-low)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: getCategoryMeta(biggestExpense.category).bg }}>
                  <CategoryIcon icon={getCategoryMeta(biggestExpense.category).icon} size={16} color="#5a5a6e" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--md-on-surface)" }}>{biggestExpense.description}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--md-outline)" }}>
                    {biggestExpense.category} · {new Date(biggestExpense.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </div>
                </div>
                <div className="text-sm font-bold flex-shrink-0" style={{ color: "#B71C1C" }}>−{fmtFull(biggestExpense.amount, currency)}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Balance Chart (day-wise trajectory) ─────────────────────────────────────

function BalanceChart({ points, currency }: { points: { date: string; balance: number; tx: Transaction }[]; currency: import("@/lib/currency").CurrencyConfig }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const balances = points.map((p) => p.balance);
  const minB = Math.min(...balances, 0);
  const maxB = Math.max(...balances, 1);
  const range = maxB - minB || 1;
  const W = 320, H = 100, PAD = 8;

  const pts = points.map((p, i) => ({
    x: PAD + (i / Math.max(points.length - 1, 1)) * (W - PAD * 2),
    y: PAD + ((maxB - p.balance) / range) * (H - PAD * 2),
    ...p,
  }));

  const zeroY = Math.max(PAD, Math.min(H - PAD, PAD + ((maxB - 0) / range) * (H - PAD * 2)));
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fill = [...pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`), `${pts[pts.length - 1].x.toFixed(1)},${zeroY}`, `${pts[0].x.toFixed(1)},${zeroY}`].join(" ");
  const sel = hovered !== null ? pts[hovered] : null;

  return (
    <div>
      {sel ? (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: "var(--md-on-surface-variant)" }}>
            {new Date(sel.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {sel.tx.description}
          </span>
          <span className="text-xs font-semibold" style={{ color: sel.balance >= 0 ? "var(--md-primary)" : "#EF4444" }}>
            {sel.balance >= 0 ? "" : "−"}{fmtFull(Math.abs(sel.balance), currency)}
          </span>
        </div>
      ) : (
        <div className="flex justify-between mb-2">
          <span className="text-[10px]" style={{ color: "var(--md-outline)" }}>
            {new Date(points[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
          <span className="text-[10px]" style={{ color: "var(--md-outline)" }}>
            {new Date(points[points.length - 1].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
          </span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {minB < 0 && <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="var(--md-outline-variant)" strokeWidth={1} strokeDasharray="3,3" />}
        <polygon points={fill} fill="rgba(200,49,255,0.08)" />
        <path d={path} fill="none" stroke="var(--md-primary)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {sel && <circle cx={sel.x} cy={sel.y} r={4} fill="var(--md-primary)" />}
        {pts.map((p, i) => (
          <rect key={i} x={p.x - W / points.length / 2} y={0} width={W / points.length} height={H} fill="transparent"
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
            onTouchStart={() => setHovered(i)} onTouchEnd={() => setHovered(null)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </svg>
    </div>
  );
}

// ─── Metric Tile ─────────────────────────────────────────────────────────────

function MetricTile({ label, value, sub, bg, color }: { label: string; value: string; sub: string; bg: string; color: string }) {
  return (
    <div className="rounded-2xl px-3 py-3 flex flex-col gap-0.5" style={{ background: bg }}>
      <div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--md-on-surface-variant)" }}>{label}</div>
      <div className="text-[15px] font-bold leading-tight" style={{ color }}>{value}</div>
      <div className="text-[9px]" style={{ color: "var(--md-outline)" }}>{sub}</div>
    </div>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────

function DonutChart({ cats, total }: { cats: [string, number][]; total: number }) {
  const R = 38, CX = 48, CY = 48, SW = 14;
  const circumference = 2 * Math.PI * R;

  let offsetPct = 0;
  const segments = cats.slice(0, 5).map(([, amt], i) => {
    const pct = total > 0 ? amt / total : 0;
    const dash = circumference * pct - 1;
    const gap = circumference - dash;
    const rotation = -90 + offsetPct * 360;
    offsetPct += pct;
    return { dash: Math.max(0, dash), gap, rotation, color: CHART_COLORS[i % CHART_COLORS.length] };
  });

  return (
    <svg width={96} height={96} viewBox="0 0 96 96" className="flex-shrink-0">
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--md-outline-variant)" strokeWidth={SW} />
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke={seg.color}
          strokeWidth={SW}
          strokeDasharray={`${seg.dash} ${seg.gap}`}
          transform={`rotate(${seg.rotation} ${CX} ${CY})`}
          strokeLinecap="butt"
        />
      ))}
    </svg>
  );
}

// ─── Trend Chart (Income vs Expense dual-line) ────────────────────────────────

function TrendChart({ months, agg, currency }: { months: string[]; agg: Record<string, { income: number; expense: number }>; currency: import("@/lib/currency").CurrencyConfig }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const W = 320, H = 110, PAD_X = 8, PAD_Y = 12;

  const incomes = months.map((m) => agg[m]?.income ?? 0);
  const expenses = months.map((m) => agg[m]?.expense ?? 0);
  const maxVal = Math.max(...incomes, ...expenses, 1);

  function xOf(i: number) {
    return PAD_X + (i / Math.max(months.length - 1, 1)) * (W - PAD_X * 2);
  }
  function yOf(v: number) {
    return PAD_Y + ((maxVal - v) / maxVal) * (H - PAD_Y * 2);
  }

  const incPath = months.map((_, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(incomes[i]).toFixed(1)}`).join(" ");
  const expPath = months.map((_, i) => `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)},${yOf(expenses[i]).toFixed(1)}`).join(" ");

  return (
    <div>
      <div className="flex gap-4 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded-full" style={{ background: "#22C55E" }} />
          <span className="text-[10px]" style={{ color: "var(--md-outline)" }}>Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 rounded-full" style={{ background: "#EF4444" }} />
          <span className="text-[10px]" style={{ color: "var(--md-outline)" }}>Expenses</span>
        </div>
      </div>
      {hovered !== null && (
        <div className="flex gap-4 mb-2">
          <span className="text-xs font-medium" style={{ color: "var(--md-on-surface)" }}>{formatMonthShort(months[hovered])}</span>
          <span className="text-xs" style={{ color: "#22C55E" }}>↑ {fmtCompact(incomes[hovered], currency)}</span>
          <span className="text-xs" style={{ color: "#EF4444" }}>↓ {fmtCompact(expenses[hovered], currency)}</span>
        </div>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {[0.25, 0.5, 0.75].map((f, i) => (
          <line key={i} x1={PAD_X} y1={yOf(maxVal * f)} x2={W - PAD_X} y2={yOf(maxVal * f)}
            stroke="var(--md-outline-variant)" strokeWidth={0.5} strokeDasharray="2,4" />
        ))}
        <path d={incPath} fill="none" stroke="#22C55E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={expPath} fill="none" stroke="#EF4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {months.map((_, i) => (
          <g key={i}>
            <circle cx={xOf(i)} cy={yOf(incomes[i])} r={hovered === i ? 4 : 2.5} fill={hovered === i ? "#22C55E" : "#fff"} stroke="#22C55E" strokeWidth={1.5} />
            <circle cx={xOf(i)} cy={yOf(expenses[i])} r={hovered === i ? 4 : 2.5} fill={hovered === i ? "#EF4444" : "#fff"} stroke="#EF4444" strokeWidth={1.5} />
            <rect
              x={xOf(i) - W / months.length / 2} y={0}
              width={W / months.length} height={H}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(i)}
              onTouchEnd={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            />
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-1" style={{ paddingLeft: PAD_X, paddingRight: PAD_X }}>
        {months.map((m, i) => (
          <span key={m} className="text-[9px]" style={{ color: hovered === i ? "var(--md-primary)" : "var(--md-outline)" }}>
            {formatMonthShort(m)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Month-over-month card ────────────────────────────────────────────────────

function MomCard({ label, curr, diff, positive, currency }: { label: string; curr: number; diff: number | null; positive: boolean; currency: import("@/lib/currency").CurrencyConfig }) {
  const up = diff !== null && diff > 0;
  const neutral = diff === null || diff === 0;
  const goodChange = positive ? up : !up;

  return (
    <div className="flex-1 rounded-2xl px-3 py-3" style={{ background: "var(--md-surface-container-low)" }}>
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--md-on-surface-variant)" }}>{label}</div>
      <div className="text-base font-bold" style={{ color: "var(--md-on-surface)" }}>{fmtCompact(curr, currency)}</div>
      {!neutral && (
        <div className="flex items-center gap-1 mt-1">
          <svg viewBox="0 0 10 10" width={8} height={8} style={{ transform: up ? "none" : "rotate(180deg)" }}>
            <path d="M5 1L9 7H1z" fill={goodChange ? "#22C55E" : "#EF4444"} />
          </svg>
          <span className="text-[10px] font-semibold" style={{ color: goodChange ? "#22C55E" : "#EF4444" }}>
            {Math.abs(diff!)}%
          </span>
          <span className="text-[10px]" style={{ color: "var(--md-outline)" }}>vs last month</span>
        </div>
      )}
    </div>
  );
}

// ─── Filter pill ──────────────────────────────────────────────────────────────

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
      style={{
        background: active ? "var(--md-primary)" : "var(--md-surface-container-low)",
        color: active ? "#fff" : "var(--md-on-surface-variant)",
      }}
    >
      {label}
    </button>
  );
}

// ─── Story upgrade screen (free users) ───────────────────────────────────────

const STORY_FEATURES = [
  { icon: "📊", title: "Savings rate & daily average", desc: "See exactly how much you save and spend per day" },
  { icon: "📈", title: "Income vs expense trends", desc: "Monthly charts showing your financial trajectory" },
  { icon: "🔁", title: "Month-over-month comparison", desc: "Know if you're improving or slipping" },
  { icon: "🔥", title: "Logging streaks", desc: "Track your consistency and build good habits" },
  { icon: "💡", title: "Smart insights", desc: "Personalised commentary on your spending patterns" },
  { icon: "📅", title: "Full history browsing", desc: "Browse any month, any time" },
];

function StoryUpgradeScreen({ onUpgrade }: { onUpgrade?: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pb-10" style={{ background: "#fff" }}>
      {/* Header */}
      <div className="px-6 pt-8 pb-6 text-center">
        <div className="w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center" style={{ background: "rgba(200,49,255,0.1)" }}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="var(--md-primary)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
        </div>
        <div className="text-[22px] font-bold mb-2" style={{ color: "var(--md-on-surface)" }}>Your Financial Story</div>
        <div className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
          Like a monthly review with a smart friend — charts, insights, and trends that actually make sense of your money.
        </div>
      </div>

      {/* Feature list */}
      <div className="px-4 flex flex-col gap-3 mb-8">
        {STORY_FEATURES.map((f) => (
          <div key={f.title} className="flex items-start gap-3 px-4 py-3.5 rounded-2xl" style={{ background: "var(--md-surface-container-low)" }}>
            <span className="text-xl leading-none mt-0.5">{f.icon}</span>
            <div>
              <div className="text-[13px] font-semibold mb-0.5" style={{ color: "var(--md-on-surface)" }}>{f.title}</div>
              <div className="text-[12px]" style={{ color: "var(--md-on-surface-variant)" }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-4">
        <button
          onClick={onUpgrade}
          className="w-full py-4 rounded-2xl text-[15px] font-bold active:opacity-80"
          style={{ background: "var(--md-primary)", color: "#fff" }}
        >
          Unlock Your Story — Go Pro
        </button>
        <div className="text-center mt-3 text-xs" style={{ color: "var(--md-outline)" }}>
          ₹79/week or ₹599/year · Cancel anytime
        </div>
      </div>
    </div>
  );
}
