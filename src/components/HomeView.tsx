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
  onDeleteTransaction: (id: string) => void;
  onSeeAll: () => void;
  userName?: string;
}

type AiState = "idle" | "loading" | "success" | "error";

export default function HomeView({ transactions, onAddTransactions, onDeleteTransaction, userName = "there" }: HomeViewProps) {
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

  const all = transactions.slice();

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

      const created: Transaction[] = parsed.map((tx) => ({
        id: crypto.randomUUID(),
        amount: Number(tx.amount),
        type: tx.type,
        category: tx.category as Transaction["category"],
        description: tx.description,
        created_at: new Date().toISOString(),
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
      {/* Greeting + summary */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2">
        <div className="text-sm mb-0.5" style={{ color: "var(--md-on-surface-variant)" }}>{getGreeting()}</div>
        <div className="text-2xl font-semibold mb-4" style={{ color: "var(--md-on-surface)" }}>
          {userName} 👋
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[var(--md-shape-xl)] p-4" style={{ background: "var(--md-surface-container-low)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#2E7D32" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--md-on-surface-variant)" }}>Received Today</span>
            </div>
            <div className="text-xl font-semibold" style={{ color: "#2E7D32" }}>{fmtCompact(todayIncome)}</div>
          </div>
          <div className="rounded-[var(--md-shape-xl)] p-4" style={{ background: "var(--md-surface-container-low)", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#C62828" }} />
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--md-on-surface-variant)" }}>Spent Today</span>
            </div>
            <div className="text-xl font-semibold" style={{ color: "#C62828" }}>{fmtCompact(todayExpense)}</div>
          </div>
        </div>
      </div>

      {/* Chat feed — newest at bottom, scroll up for history */}
      <div ref={feedRef} className="flex-1 overflow-y-auto no-scrollbar px-3 pt-3 pb-2 flex flex-col-reverse gap-1.5">
        {/* AI response bubble — shows at bottom (visually) due to flex-col-reverse */}
        <AiBubble state={aiState} newTxs={newTxs} />

        {all.length === 0 && aiState === "idle" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline-variant)" }}>
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <div className="text-sm text-center leading-relaxed" style={{ color: "var(--md-outline)" }}>
              Type anything below to log.
              <br />
              <span className="opacity-70">500 coffee · 25000 salary · 1200 petrol</span>
            </div>
          </div>
        ) : (
          all.map((tx, i) => <TxItem key={tx.id} tx={tx} index={i} showDate onDelete={onDeleteTransaction} />)
        )}
      </div>

      {/* Chat input — always at bottom */}
      <BottomInput value={input} onChange={setInput} onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
