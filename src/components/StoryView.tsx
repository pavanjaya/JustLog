"use client";

import { useState, useMemo } from "react";
import type { Transaction } from "@/types";
import { getCategoryMeta, fmtCompact, fmtFull } from "@/lib/format";
import CategoryIcon from "@/components/CategoryIcon";

interface StoryViewProps {
  transactions: Transaction[];
}

export default function StoryView({ transactions }: StoryViewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null); // "2026-06" format

  // All transactions sorted oldest → newest
  const sorted = useMemo(() => [...transactions].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()), [transactions]);

  // Available months for filter
  const months = useMemo(() => {
    const seen = new Set<string>();
    sorted.forEach((tx) => {
      const d = new Date(tx.created_at);
      seen.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    });
    return Array.from(seen).sort().reverse();
  }, [sorted]);

  // Filtered transactions
  const filtered = useMemo(() => {
    if (!selectedMonth) return sorted;
    return sorted.filter((tx) => {
      const d = new Date(tx.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return key === selectedMonth;
    });
  }, [sorted, selectedMonth]);

  // Running balance points
  const balancePoints = useMemo(() => {
    let balance = selectedMonth ? 0 : 0;
    // If filtering by month, start from actual balance before that month
    if (selectedMonth) {
      const [y, m] = selectedMonth.split("-").map(Number);
      sorted.forEach((tx) => {
        const d = new Date(tx.created_at);
        if (d.getFullYear() < y || (d.getFullYear() === y && d.getMonth() + 1 < m)) {
          balance += tx.type === "income" ? tx.amount : -tx.amount;
        }
      });
    }
    const points: { date: string; balance: number; tx: Transaction }[] = [];
    filtered.forEach((tx) => {
      balance += tx.type === "income" ? tx.amount : -tx.amount;
      points.push({ date: tx.created_at, balance, tx });
    });
    return points;
  }, [filtered, sorted, selectedMonth]);

  const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  // Category breakdown
  const catTotals = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === "expense").forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [filtered]);

  const maxCat = catTotals[0]?.[1] || 1;

  // Biggest expense
  const biggestExpense = useMemo(() =>
    filtered.filter(t => t.type === "expense").reduce<Transaction | null>((max, t) => (!max || t.amount > max.amount ? t : max), null),
    [filtered]
  );

  // Narrative
  function buildNarrative(): string[] {
    if (filtered.length === 0) return [];
    const lines: string[] = [];
    const label = selectedMonth ? formatMonthKey(selectedMonth) : "overall";

    if (totalIncome > 0 && totalExpense > 0) {
      lines.push(`You brought in ${fmtFull(totalIncome)} and spent ${fmtFull(totalExpense)} ${label}.`);
      if (netBalance >= 0) lines.push(`That leaves you ${fmtFull(netBalance)} ahead.`);
      else lines.push(`You're ${fmtFull(Math.abs(netBalance))} in the hole for this period.`);
    } else if (totalIncome > 0) {
      lines.push(`You received ${fmtFull(totalIncome)} ${label} with no expenses logged.`);
    } else {
      lines.push(`You spent ${fmtFull(totalExpense)} ${label} with no income logged.`);
    }

    if (catTotals.length > 0) {
      const top = catTotals[0];
      const pct = totalExpense > 0 ? Math.round((top[1] / totalExpense) * 100) : 0;
      if (pct > 50) lines.push(`${top[0]} was your biggest cost at ${pct}% of all spending.`);
      else lines.push(`Your biggest spend area was ${top[0]} (${fmtFull(top[1])}).`);
    }

    return lines;
  }

  const narrative = buildNarrative();

  if (transactions.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-8" style={{ background: "#fff" }}>
        <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: "var(--md-surface-container-low)" }}>
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline)" }}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
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

      {/* Month filter pills — always visible */}
      <div className="flex gap-2 px-4 pb-4 overflow-x-auto no-scrollbar">
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
          {/* Narrative */}
          <div className="px-4 pb-5">
            {narrative.map((line, i) => (
              <p key={i} className="text-[15px] leading-[1.85]" style={{ color: i === 0 ? "var(--md-on-surface)" : "var(--md-on-surface-variant)" }}>
                {line}
              </p>
            ))}
          </div>

          {/* Stat strip */}
          <div className="px-4 mb-5">
            <div className="flex gap-2">
              {totalIncome > 0 && (
                <div className="flex-1 rounded-2xl px-3 py-3" style={{ background: "#F0FBF4" }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#2E7D32" }}>Income</div>
                  <div className="text-base font-bold" style={{ color: "#1B5E20" }}>{fmtCompact(totalIncome)}</div>
                </div>
              )}
              {totalExpense > 0 && (
                <div className="flex-1 rounded-2xl px-3 py-3" style={{ background: "#FFF5F5" }}>
                  <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#C62828" }}>Spent</div>
                  <div className="text-base font-bold" style={{ color: "#B71C1C" }}>{fmtCompact(totalExpense)}</div>
                </div>
              )}
              <div className="flex-1 rounded-2xl px-3 py-3" style={{ background: netBalance >= 0 ? "rgba(200,49,255,0.06)" : "#FFF5F5" }}>
                <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: netBalance >= 0 ? "var(--md-primary)" : "#C62828" }}>Balance</div>
                <div className="text-base font-bold" style={{ color: netBalance >= 0 ? "var(--md-primary)" : "#B71C1C" }}>
                  {netBalance < 0 ? "−" : ""}{fmtCompact(Math.abs(netBalance))}
                </div>
              </div>
            </div>
          </div>

          <div className="mx-4 mb-5" style={{ height: 1, background: "var(--md-outline-variant)" }} />

          {/* Running balance chart */}
          {balancePoints.length > 1 && (
            <div className="px-4 mb-5">
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--md-on-surface)" }}>Balance over time</div>
              <BalanceChart points={balancePoints} />
            </div>
          )}

          {/* Top categories */}
          {catTotals.length > 0 && (
            <div className="px-4 mb-5">
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--md-on-surface)" }}>Where it went</div>
              <div className="flex flex-col gap-5">
                {catTotals.map(([category, amount], i) => {
                  const meta = getCategoryMeta(category);
                  const pct = Math.round((amount / maxCat) * 100);
                  const ofTotal = totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0;
                  return (
                    <div key={category} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                        <CategoryIcon icon={meta.icon} size={14} color="#5a5a6e" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>{category}</span>
                          <span className="text-xs font-semibold" style={{ color: "var(--md-on-surface)" }}>{fmtCompact(amount)}</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--md-outline-variant)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i === 0 ? "var(--md-primary)" : "rgba(200,49,255,0.3)", transition: "width 0.7s ease" }} />
                        </div>
                      </div>
                      <span className="text-[11px] w-8 text-right flex-shrink-0" style={{ color: "var(--md-outline)" }}>{ofTotal}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Biggest expense */}
          {biggestExpense && (
            <div className="px-4 mb-5">
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--md-on-surface)" }}>Biggest expense</div>
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl" style={{ background: "var(--md-surface-container-low)" }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: getCategoryMeta(biggestExpense.category).bg }}>
                  <CategoryIcon icon={getCategoryMeta(biggestExpense.category).icon} size={16} color="#5a5a6e" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate" style={{ color: "var(--md-on-surface)" }}>{biggestExpense.description}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--md-outline)" }}>{biggestExpense.category}</div>
                </div>
                <div className="text-sm font-bold flex-shrink-0" style={{ color: "#B71C1C" }}>−{fmtFull(biggestExpense.amount)}</div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BalanceChart({ points }: { points: { date: string; balance: number; tx: Transaction }[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const balances = points.map(p => p.balance);
  const minB = Math.min(...balances, 0);
  const maxB = Math.max(...balances, 1);
  const range = maxB - minB || 1;
  const W = 320, H = 90, PAD = 4;

  const pts = points.map((p, i) => {
    const x = PAD + (i / Math.max(points.length - 1, 1)) * (W - PAD * 2);
    const y = PAD + ((maxB - p.balance) / range) * (H - PAD * 2);
    return { x, y, ...p };
  });

  const zero = PAD + ((maxB - 0) / range) * (H - PAD * 2);
  const zeroY = Math.max(PAD, Math.min(H - PAD, zero));

  // Build SVG path
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const fill = [...pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`), `${pts[pts.length - 1].x.toFixed(1)},${zeroY}`, `${pts[0].x.toFixed(1)},${zeroY}`].join(" ");

  const sel = hovered !== null ? pts[hovered] : null;

  return (
    <div>
      {sel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: "var(--md-on-surface-variant)" }}>
            {new Date(sel.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {sel.tx.description}
          </span>
          <span className="text-xs font-semibold" style={{ color: sel.balance >= 0 ? "var(--md-primary)" : "#C62828" }}>
            {fmtFull(sel.balance)}
          </span>
        </div>
      )}
      <div className="relative w-full" style={{ height: H + 8 }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
          {/* Zero line */}
          {minB < 0 && <line x1={PAD} y1={zeroY} x2={W - PAD} y2={zeroY} stroke="var(--md-outline-variant)" strokeWidth={1} strokeDasharray="3,3" />}
          {/* Fill area */}
          <polygon points={fill} fill="rgba(200,49,255,0.08)" />
          {/* Line */}
          <path d={path} fill="none" stroke="var(--md-primary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          {/* Hover dot */}
          {sel && <circle cx={sel.x} cy={sel.y} r={4} fill="var(--md-primary)" />}
          {/* Touch targets */}
          {pts.map((p, i) => (
            <rect key={i} x={p.x - (W / points.length / 2)} y={0} width={W / points.length} height={H} fill="transparent"
              onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}
              onTouchStart={() => setHovered(i)} onTouchEnd={() => setHovered(null)}
              style={{ cursor: "pointer" }}
            />
          ))}
        </svg>
        {!sel && (
          <div className="flex justify-between mt-1">
            <span className="text-[10px]" style={{ color: "var(--md-outline)" }}>
              {new Date(points[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
            <span className="text-[10px]" style={{ color: "var(--md-outline)" }}>
              {new Date(points[points.length - 1].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

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

function formatMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}
