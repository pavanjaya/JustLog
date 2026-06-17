"use client";

import { useRef, useState } from "react";
import type { Transaction } from "@/types";
import TxItem from "@/components/TxItem";
import AiBubble from "@/components/AiBubble";
import BottomInput from "@/components/BottomInput";
import { fmtCompact } from "@/lib/format";

interface HomeViewProps {
  transactions: Transaction[];
  onAddTransactions: (txs: Transaction[]) => Promise<void>;
  onSeeAll: () => void;
  userName?: string;
}

type AiState = "idle" | "loading" | "success" | "error";

export default function HomeView({ transactions, onAddTransactions, userName = "there" }: HomeViewProps) {
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

  const all = transactions.slice().reverse();

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
      {/* Today summary cards */}
      <div className="flex-shrink-0 grid grid-cols-2 gap-3 px-4 pt-4 pb-2">
        <div className="rounded-[var(--md-shape-xl)] p-4" style={{ background: "var(--md-tertiary-container)" }}>
          <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "var(--md-on-tertiary-container)", opacity: 0.7 }}>
            Received
          </div>
          <div className="text-xl font-medium" style={{ color: "var(--md-on-tertiary-container)" }}>
            {fmtCompact(todayIncome)}
          </div>
        </div>
        <div className="rounded-[var(--md-shape-xl)] p-4" style={{ background: "var(--md-error-container)" }}>
          <div className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "var(--md-on-error-container)", opacity: 0.7 }}>
            Spent
          </div>
          <div className="text-xl font-medium" style={{ color: "var(--md-on-error-container)" }}>
            {fmtCompact(todayExpense)}
          </div>
        </div>
      </div>

      {/* Chat feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto no-scrollbar px-3 pt-3 pb-2 flex flex-col gap-1.5">
        {all.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline-variant)" }}>
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <div className="text-base font-medium" style={{ color: "var(--md-on-surface-variant)" }}>
              Hi {userName}
            </div>
            <div className="text-sm text-center leading-relaxed" style={{ color: "var(--md-outline)" }}>
              Type anything below to log.
              <br />
              <span className="opacity-70">500 coffee · 25000 salary · 1200 petrol</span>
            </div>
          </div>
        ) : (
          all.map((tx, i) => <TxItem key={tx.id} tx={tx} index={i} showDate />)
        )}

        {/* AI response bubble */}
        <AiBubble state={aiState} newTxs={newTxs} />
      </div>

      {/* Chat input — always at bottom */}
      <BottomInput value={input} onChange={setInput} onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
