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

  // Today's totals
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
      const parsed: Array<{ amount: number; type: "income" | "expense"; category: string; description: string }> =
        data.transactions;

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
      <div ref={feedRef} className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-2">
        {/* Greeting */}
        <div className="px-4 pb-5 pt-2">
          <div className="text-xs text-text-secondary mb-[3px]">{getGreeting()}</div>
          <div className="text-[24px] font-bold tracking-tight">{userName} 👋</div>
        </div>

        {/* Today cards */}
        <div className="grid grid-cols-2 gap-2.5 px-4 pb-4">
          <div className="bg-white rounded-radius-md p-[14px_16px] shadow-shadow-sm">
            <div className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-[5px] flex items-center gap-[5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green flex-shrink-0" />
              Received today
            </div>
            <div className="text-xl font-bold tracking-tight text-green">{fmtCompact(todayIncome)}</div>
          </div>
          <div className="bg-white rounded-radius-md p-[14px_16px] shadow-shadow-sm">
            <div className="text-[11px] font-medium uppercase tracking-wide text-text-secondary mb-[5px] flex items-center gap-[5px]">
              <span className="w-1.5 h-1.5 rounded-full bg-red flex-shrink-0" />
              Spent today
            </div>
            <div className="text-xl font-bold tracking-tight text-red">{fmtCompact(todayExpense)}</div>
          </div>
        </div>

        {/* AI bubble */}
        <AiBubble state={aiState} newTxs={newTxs} />

        {/* Recent section */}
        <div className="flex items-center justify-between px-4 pt-1 pb-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">Recent</span>
          <button onClick={onSeeAll} className="text-[13px] font-medium text-blue">
            See all
          </button>
        </div>

        {recent.length > 0 ? (
          <div className="px-4 flex flex-col gap-2">
            {recent.map((tx, i) => (
              <TxItem key={tx.id} tx={tx} index={i} />
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center flex flex-col items-center gap-2.5">
            <div className="text-[44px] opacity-25">📝</div>
            <div className="text-[15px] font-semibold text-text-secondary">Nothing logged yet</div>
            <div className="text-[13px] text-text-tertiary leading-relaxed">
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
