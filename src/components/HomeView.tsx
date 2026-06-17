"use client";

import { useRef, useState } from "react";
import type { Transaction } from "@/types";
import TxItem from "@/components/TxItem";
import AiBubble from "@/components/AiBubble";
import BottomInput from "@/components/BottomInput";
import { fmtCompact, getGreeting } from "@/lib/format";

interface HomeViewProps {
  transactions: Transaction[];
  onAddTransactions: (txs: Transaction[]) => Promise<void>;
  onSeeAll: () => void;
  userName?: string;
}

type AiState = "idle" | "loading" | "success" | "error";

export default function HomeView({ transactions, onAddTransactions, onSeeAll, userName = "there" }: HomeViewProps) {
  const [input, setInput] = useState("");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [newTxs, setNewTxs] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const today = new Date().toDateString();
  const todayIncome = transactions
    .filter((tx) => new Date(tx.created_at).toDateString() === today && tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const todayExpense = transactions
    .filter((tx) => new Date(tx.created_at).toDateString() === today && tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const recent = transactions.slice().reverse().slice(0, 12);

  function scrollToBottom() {
    setTimeout(() => {
      feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
    }, 60);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setInput("");
    setAiState("loading");
    scrollToBottom();

    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("API error");

      const data = await res.json();
      const parsed: Array<{ amount: number; type: "income" | "expense"; category: string; description: string }> = data.transactions;

      const now = Date.now();
      const created: Transaction[] = parsed.map((tx, i) => ({
        id: String(now + i),
        amount: Number(tx.amount),
        type: tx.type,
        category: tx.category as Transaction["category"],
        description: tx.description,
        created_at: new Date(now + i).toISOString(),
      }));

      await onAddTransactions(created);
      setNewTxs(created);
      setAiState("success");
      scrollToBottom();
      setTimeout(() => setAiState("idle"), created.length > 1 ? 6000 : 4000);
    } catch {
      setAiState("error");
      setTimeout(() => setAiState("idle"), 5000);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-2">

        {/* Greeting */}
        <div className="px-4 pb-4 pt-2">
          <div className="text-xs font-medium" style={{ color: "var(--md-on-surface-variant)" }}>
            {getGreeting()}
          </div>
          <div className="text-[28px] font-medium tracking-tight mt-0.5" style={{ color: "var(--md-on-surface)" }}>
            {userName} 👋
          </div>
        </div>

        {/* MD3 Cards — Today's summary */}
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          {/* Income card — MD3 Filled card with tertiary container */}
          <div
            className="rounded-[var(--md-shape-xl)] p-4"
            style={{ background: "var(--md-tertiary-container)" }}
          >
            <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "var(--md-on-tertiary-container)", opacity: 0.7 }}>
              Received
            </div>
            <div className="text-xl font-medium" style={{ color: "var(--md-on-tertiary-container)" }}>
              {fmtCompact(todayIncome)}
            </div>
          </div>

          {/* Expense card — MD3 Filled card with error container */}
          <div
            className="rounded-[var(--md-shape-xl)] p-4"
            style={{ background: "var(--md-error-container)" }}
          >
            <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "var(--md-on-error-container)", opacity: 0.7 }}>
              Spent
            </div>
            <div className="text-xl font-medium" style={{ color: "var(--md-on-error-container)" }}>
              {fmtCompact(todayExpense)}
            </div>
          </div>
        </div>

        {/* AI bubble */}
        <AiBubble state={aiState} newTxs={newTxs} />

        {/* Recent section */}
        <div className="flex items-center justify-between px-4 pt-2 pb-2">
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--md-on-surface-variant)" }}
          >
            Recent
          </span>
          <button
            onClick={onSeeAll}
            className="text-sm font-medium md-ripple px-3 py-1 rounded-full"
            style={{ color: "var(--md-primary)" }}
          >
            See all
          </button>
        </div>

        {recent.length > 0 ? (
          <div className="px-4 flex flex-col gap-1">
            {recent.map((tx, i) => (
              <TxItem key={tx.id} tx={tx} index={i} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center flex flex-col items-center gap-3">
            <div className="text-5xl opacity-20">📝</div>
            <div className="text-base font-medium" style={{ color: "var(--md-on-surface-variant)" }}>
              Nothing logged yet
            </div>
            <div className="text-sm leading-relaxed" style={{ color: "var(--md-outline)" }}>
              Type anything below.
              <br />
              Takes under 3 seconds.
            </div>
          </div>
        )}
      </div>

      {/* Bottom input */}
      <BottomInput value={input} onChange={setInput} onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
