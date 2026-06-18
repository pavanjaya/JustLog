"use client";

import { useRef, useState } from "react";
import type { Transaction } from "@/types";
import TxItem from "@/components/TxItem";
import AiBubble from "@/components/AiBubble";
import BottomInput from "@/components/BottomInput";
import { fmtCompact, fmtFull, getGreeting } from "@/lib/format";

interface HomeViewProps {
  transactions: Transaction[];
  onAddTransactions: (txs: Transaction[]) => Promise<void>;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (id: string, updates: Partial<Transaction>) => void;
  onSeeAll: () => void;
  userName?: string;
}

type AiState = "idle" | "loading" | "review" | "success" | "error";

type DraftTx = {
  id: string;
  amount: number;
  type: "income" | "expense";
  category: Transaction["category"];
  description: string;
  created_at: string;
};

export default function HomeView({ transactions, onAddTransactions, onDeleteTransaction, onEditTransaction, onSeeAll, userName = "there" }: HomeViewProps) {
  const [input, setInput] = useState("");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [newTxs, setNewTxs] = useState<Transaction[]>([]);
  const [drafts, setDrafts] = useState<DraftTx[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);

  const today = new Date().toDateString();
  const todayIncome = transactions
    .filter((tx) => new Date(tx.created_at).toDateString() === today && tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const todayExpense = transactions
    .filter((tx) => new Date(tx.created_at).toDateString() === today && tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalIncome = transactions.filter((tx) => tx.type === "income").reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpense = transactions.filter((tx) => tx.type === "expense").reduce((sum, tx) => sum + tx.amount, 0);
  const balance = totalIncome - totalExpense;

  const all = [...transactions].reverse();

  function scrollToBottom() {
    setTimeout(() => { feedRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }, 60);
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

      const created: DraftTx[] = parsed.map((tx) => ({
        id: crypto.randomUUID(),
        amount: Number(tx.amount),
        type: tx.type,
        category: tx.category as Transaction["category"],
        description: tx.description,
        created_at: new Date().toISOString(),
      }));

      setDrafts(created);
      setAiState("review");
      scrollToBottom();
    } catch {
      setAiState("error");
      setTimeout(() => setAiState("idle"), 5000);
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmDrafts() {
    await onAddTransactions(drafts as Transaction[]);
    setNewTxs(drafts as Transaction[]);
    setDrafts([]);
    setAiState("success");
    scrollToBottom();
    setTimeout(() => setAiState("idle"), drafts.length > 1 ? 6000 : 4000);
  }

  function toggleDraftType(id: string) {
    setDrafts(prev => prev.map(d => d.id === id ? { ...d, type: d.type === "income" ? "expense" : "income" } : d));
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "#fff" }}>
      {/* Greeting + summary cards */}
      <div className="flex-shrink-0 px-4 pt-5 pb-3">
        <div className="mb-4">
          <div className="text-xs font-medium mb-0.5" style={{ color: "var(--md-on-surface-variant)" }}>{getGreeting()}</div>
          <div className="text-2xl font-bold tracking-tight" style={{ color: "var(--md-on-surface)" }}>
            {userName} 👋
          </div>
        </div>

        <div className="mb-4">
          <div className="text-xs font-medium mb-1" style={{ color: "var(--md-on-surface-variant)" }}>Total Balance</div>
          <div className="text-3xl font-bold tracking-tight" style={{ color: balance >= 0 ? "#1B5E20" : "#B71C1C" }}>
            {balance < 0 ? "−" : ""}{fmtFull(Math.abs(balance))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl px-4 py-3" style={{ background: "#F0FBF4", border: "1px solid #C8EECF" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#2E7D32" }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 2 L5 8 M2 5 L5 8 L8 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#2E7D32" }}>Today's Income</span>
            </div>
            <div className="text-lg font-bold" style={{ color: "#1B5E20" }}>{fmtCompact(todayIncome)}</div>
          </div>

          <div className="rounded-2xl px-4 py-3" style={{ background: "#FFF5F5", border: "1px solid #FFCDD2" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#C62828" }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 8 L5 2 M2 5 L5 2 L8 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#C62828" }}>Today's Spend</span>
            </div>
            <div className="text-lg font-bold" style={{ color: "#B71C1C" }}>{fmtCompact(todayExpense)}</div>
          </div>
        </div>
      </div>

      {/* Section header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-2 pb-2">
        <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>Recent</span>
        {all.length > 0 && (
          <button onClick={onSeeAll} className="text-xs font-semibold" style={{ color: "var(--md-on-surface)" }}>
            See all ({transactions.length})
          </button>
        )}
      </div>

      {/* Chat feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto no-scrollbar px-3 pt-2 pb-2 flex flex-col-reverse gap-1">

        {/* Review step — shown before confirming */}
        {aiState === "review" && drafts.length > 0 && (
          <div className="pb-1">
            <div className="rounded-[20px] rounded-tl-[4px] p-4 animate-fade-up" style={{ background: "var(--md-secondary-container)" }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--md-primary)", color: "#fff" }}>
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--md-on-secondary-container)" }}>
                  {drafts.length === 1 ? "Confirm this entry" : `Confirm ${drafts.length} entries`}
                </span>
              </div>

              <div className="flex flex-col gap-2 mb-3">
                {drafts.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.55)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: "var(--md-on-surface)" }}>{d.description}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--md-outline)" }}>{d.category}</div>
                    </div>
                    {/* Income/Expense flip */}
                    <button
                      onClick={() => toggleDraftType(d.id)}
                      className="flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold transition-all"
                      style={{
                        background: d.type === "income" ? "#E8F5E9" : "#FFF5F5",
                        color: d.type === "income" ? "#2E7D32" : "#C62828",
                      }}
                    >
                      {d.type === "income" ? `+₹${d.amount}` : `−₹${d.amount}`}
                    </button>
                  </div>
                ))}
              </div>

              <div className="text-[10px] mb-3" style={{ color: "var(--md-on-secondary-container)", opacity: 0.7 }}>
                Tap the amount to flip income ↔ expense
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setAiState("idle"); setDrafts([]); }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-medium"
                  style={{ background: "rgba(0,0,0,0.08)", color: "var(--md-on-secondary-container)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDrafts}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: "var(--md-primary)", color: "#fff" }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        <AiBubble state={aiState === "review" ? "idle" : aiState} newTxs={newTxs} />

        {all.length === 0 && aiState === "idle" ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--md-surface-container-low)" }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline)" }}>
                <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-center mb-1" style={{ color: "var(--md-on-surface)" }}>Log your first entry</div>
              <div className="text-xs text-center leading-relaxed" style={{ color: "var(--md-outline)" }}>
                500 coffee · 25000 salary · 1200 petrol
              </div>
            </div>
          </div>
        ) : (
          all.map((tx, i) => <TxItem key={tx.id} tx={tx} index={i} showDate onDelete={onDeleteTransaction} onEdit={onEditTransaction} />)
        )}
      </div>

      <BottomInput value={input} onChange={setInput} onSend={handleSend} disabled={isLoading || aiState === "review"} />
    </div>
  );
}
