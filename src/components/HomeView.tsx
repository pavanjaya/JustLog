"use client";

import { useEffect, useRef, useState } from "react";
import type { Transaction, Space } from "@/types";
import TxItem from "@/components/TxItem";
import { apiUrl } from "@/lib/api";
import { localParse } from "@/lib/localParse";

function isAndroid() {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  return cap?.getPlatform?.() === "android";
}
import AiBubble from "@/components/AiBubble";
import BottomInput from "@/components/BottomInput";
import { fmtCompact, fmtFull, getGreeting } from "@/lib/format";
import { useCountUp } from "@/lib/useCountUp";

interface HomeViewProps {
  transactions: Transaction[];
  onAddTransactions: (txs: Transaction[]) => Promise<void>;
  onDeleteTransaction: (id: string) => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onEditTransaction: (id: string, updates: Partial<Transaction>) => void;
  onSeeAll: () => void;
  userName?: string;
  activeSpace?: Space | null;
}

type AiState = "idle" | "loading" | "success" | "error" | "clarify";

export default function HomeView({ transactions, onAddTransactions, onDeleteTransaction, onBulkDelete, onEditTransaction, onSeeAll, userName = "there", activeSpace }: HomeViewProps) {
  const [input, setInput] = useState("");
  const [aiState, setAiState] = useState<AiState>("idle");
  const [newTxs, setNewTxs] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clarifyAmount, setClarifyAmount] = useState<number | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [clarifyPerson, setClarifyPerson] = useState<{ amount: number; name: string } | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  useEffect(() => { return () => { mountedRef.current = false; }; }, []);

  function enterSelectMode(id: string) {
    setSelectMode(true);
    setSelectedIds(new Set([id]));
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return;
    if (selectedIds.size === 1) { await confirmAndDelete(); return; }
    setConfirmDelete(true);
  }

  async function confirmAndDelete() {
    setConfirmDelete(false);
    setBulkDeleting(true);
    await onBulkDelete([...selectedIds]);
    if (mountedRef.current) {
      setBulkDeleting(false);
      exitSelectMode();
    }
  }

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

  const animatedBalance = useCountUp(balance);
  const animatedIncome = useCountUp(totalIncome);
  const animatedExpense = useCountUp(totalExpense);

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
    setClarifyAmount(null);
    setClarifyPerson(null);
    scrollToBottom();

    // Bare number (or bare k/L amount) — ask income or expense
    if (/^\d+(\.\d+)?([kKlL])?$/.test(text)) {
      const raw = parseFloat(text);
      const suffix = text.slice(-1).toLowerCase();
      const amount = suffix === "k" ? raw * 1000 : suffix === "l" ? raw * 100000 : raw;
      setClarifyAmount(amount);
      setAiState("clarify");
      setIsLoading(false);
      scrollToBottom();
      return;
    }

    // Ambiguous: "3000 sameer" or "sameer 3000" — amount + single name, no direction keywords
    const DIRECTION_KEYWORDS = ["from", "to", "for", "paid", "received", "got", "lend", "lent", "loan", "sent", "give", "gave", "salary", "income", "spend", "spent", "bought", "buy"];
    const KNOWN_WORDS = [
      // Apps & services — always expense
      "swiggy", "zomato", "amazon", "flipkart", "meesho", "myntra", "ajio", "nykaa", "blinkit", "zepto", "dunzo", "bigbasket", "grofers", "jiomart", "hotstar", "netflix", "spotify", "youtube", "prime", "disney", "zee5", "sonyliv", "gaana", "wynk", "phonepe", "gpay", "paytm", "razorpay", "uber", "ola", "rapido", "airbnb", "makemytrip", "goibibo", "irctc", "redbus", "dominos", "mcdonalds", "kfc", "subway", "starbucks", "cafe", "restaurant", "hotel",
      // Food & drinks
      "coffee", "cofee", "coffe", "coffe", "tea", "chai", "chay", "food", "lunch", "luch", "dinner", "diner", "breakfast", "brekfast", "snack", "petrol", "patrol", "fuel", "uber", "ola", "auto", "bus", "metro", "rent", "grocery", "groceries", "milk", "vegetables", "vegitable", "fruits", "fuits", "medicine", "medecine", "doctor", "hospital", "movie", "movei", "netflix", "amazon", "shopping", "shoping", "clothes", "cloths", "electricity", "wifi", "internet", "phone", "recharge", "school", "fees", "tuition", "college", "travel", "salary", "business", "investment", "ice", "cream", "swiggy", "zomato", "bill", "bills", "transport", "housing", "entertainment", "education", "healthcare", "transfer", "refund", "other", "pav", "vada", "pavada", "samosa", "paratha", "roti", "sabzi", "dal", "rice", "biryani", "pizza", "burger", "maggi", "noodles", "juice", "water", "cold", "drink", "beer", "wine", "apple", "banana", "mango", "orange", "grapes", "pomegranate", "watermelon", "watarmelon", "watermellon", "watrmelon", "papaya", "guava", "tomato", "onion", "potato", "carrot", "cabbage", "spinach", "paneer", "curd", "yogurt", "butter", "ghee", "oil", "sugar", "salt", "flour", "atta", "maida", "poha", "upma", "idli", "dosa", "vada", "chole", "rajma", "kadhi", "khichdi", "halwa", "mithai", "sweet", "chocolate", "biscuit", "chips", "namkeen", "pen", "notebook", "book", "stationery", "uniform", "shoes", "bag", "haircut", "parlour", "salon", "gym", "yoga", "protein", "supplement", "tobacco", "cigarette", "paan", "gutka", "parking", "toll", "cab", "taxi", "flight", "train", "ticket", "hotel", "room", "maintenance", "repair", "service", "plumber", "electrician", "carpenter", "maid", "cook", "driver", "donation", "charity", "temple", "church", "mosque",
    ];
    const ambiguousMatch = text.match(/^(\d+(?:\.\d+)?(?:k|K|l|L)?)\s+([a-zA-Z]+)$/) || text.match(/^([a-zA-Z]+)\s+(\d+(?:\.\d+)?(?:k|K|l|L)?)$/);
    if (ambiguousMatch) {
      const hasDirection = DIRECTION_KEYWORDS.some(kw => text.toLowerCase().includes(kw));
      const wordRaw = ambiguousMatch[1].match(/\d/) ? ambiguousMatch[2] : ambiguousMatch[1];
      const word = wordRaw.toLowerCase();
      const isKnownWord = KNOWN_WORDS.includes(word);
      // Only clarify for likely person names — starts with uppercase AND not a known word
      // Everything else (misspelled food, unknown items) goes to Gemini to figure out
      const looksLikeName = wordRaw[0] === wordRaw[0].toUpperCase() && wordRaw[0] !== wordRaw[0].toLowerCase();
      if (!hasDirection && !isKnownWord && looksLikeName) {
        const numStr = ambiguousMatch[1].match(/\d/) ? ambiguousMatch[1] : ambiguousMatch[2];
        const name = ambiguousMatch[1].match(/\d/) ? ambiguousMatch[2] : ambiguousMatch[1];
        const raw = numStr.toLowerCase();
        const amount = raw.endsWith("k") ? parseFloat(raw) * 1000 : raw.endsWith("l") ? parseFloat(raw) * 100000 : parseFloat(raw);
        setClarifyPerson({ amount, name: name.charAt(0).toUpperCase() + name.slice(1) });
        setAiState("clarify");
        setIsLoading(false);
        scrollToBottom();
        return;
      }
    }

    try {
      let parsed: Array<{ amount: number; type: "income" | "expense"; category: string; description: string }>;
      try {
        const res = await fetch(apiUrl("/api/log"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const data = await res.json();
        parsed = data.transactions;
      } catch {
        // Fallback to local parsing if network/CORS fails
        parsed = localParse(text);
        if (parsed.length === 0) throw new Error("Could not parse");
      }

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
      setTimeout(() => setAiState("idle"), created.length > 1 ? 3000 : 2000);
    } catch (err) {
      console.error("Log error:", err);
      setAiState("error");
      setTimeout(() => setAiState("idle"), 3000);
    } finally {
      setIsLoading(false);
    }
  }

  async function logClarified(type: "income" | "expense") {
    if (!clarifyAmount) return;
    const tx: Transaction = {
      id: crypto.randomUUID(),
      amount: clarifyAmount,
      type,
      category: type === "income" ? "Salary" : "Other",
      description: type === "income" ? "Income" : "Expense",
      created_at: new Date().toISOString(),
    };
    setClarifyAmount(null);
    setAiState("loading");
    await onAddTransactions([tx]);
    setNewTxs([tx]);
    setAiState("success");
    scrollToBottom();
    setTimeout(() => setAiState("idle"), 2000);
  }

  async function logClarifiedPerson(type: "income" | "expense") {
    if (!clarifyPerson) return;
    const { amount, name } = clarifyPerson;
    const tx: Transaction = {
      id: crypto.randomUUID(),
      amount,
      type,
      category: "Transfer",
      description: type === "income" ? `From ${name}` : `To ${name}`,
      created_at: new Date().toISOString(),
    };
    setClarifyPerson(null);
    setAiState("loading");
    await onAddTransactions([tx]);
    setNewTxs([tx]);
    setAiState("success");
    scrollToBottom();
    setTimeout(() => setAiState("idle"), 2000);
  }

  function dismissClarify() { setClarifyAmount(null); setClarifyPerson(null); setAiState("idle"); }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: "#fff" }}>
      {aiState === "clarify" && (
        <div className="absolute inset-0 z-10" onClick={dismissClarify} />
      )}
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
            {animatedBalance < 0 ? "−" : ""}{fmtFull(Math.abs(animatedBalance))}
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
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#2E7D32" }}>Total Income</span>
            </div>
            <div className="text-lg font-bold" style={{ color: "#1B5E20" }}>{fmtCompact(animatedIncome)}</div>
          </div>

          <div className="rounded-2xl px-4 py-3" style={{ background: "#FFF5F5", border: "1px solid #FFCDD2" }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#C62828" }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M5 8 L5 2 M2 5 L5 2 L8 5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#C62828" }}>Total Spend</span>
            </div>
            <div className="text-lg font-bold" style={{ color: "#B71C1C" }}>{fmtCompact(animatedExpense)}</div>
          </div>
        </div>

        {/* Per head split — shown when space has people_count > 1 */}
        {activeSpace && activeSpace.people_count > 1 && totalExpense > 0 && (
          <div className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-2xl" style={{ background: "rgba(200,49,255,0.06)", border: "1px solid rgba(200,49,255,0.12)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-primary)", flexShrink: 0 }}>
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
            </svg>
            <span className="text-xs" style={{ color: "var(--md-on-surface-variant)" }}>
              Per head
            </span>
            <span className="text-sm font-semibold" style={{ color: "var(--md-primary)" }}>
              {fmtFull(Math.round(totalExpense / activeSpace.people_count))}
            </span>
            <span className="text-xs ml-auto" style={{ color: "var(--md-outline)" }}>
              ÷ {activeSpace.people_count} people
            </span>
          </div>
        )}
      </div>

      {/* Section header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-2 pb-2">
        {selectMode ? (
          <>
            <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>
              {selectedIds.size} selected
            </span>
            <button onClick={() => setSelectedIds(new Set(all.map(t => t.id)))} className="text-xs font-semibold" style={{ color: "var(--md-primary)" }}>
              Select all
            </button>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>Recent</span>
            {all.length > 0 && (
              <button onClick={onSeeAll} className="text-xs font-semibold" style={{ color: "var(--md-on-surface)" }}>
                See all
              </button>
            )}
          </>
        )}
      </div>

      {/* Chat feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto no-scrollbar px-3 pt-2 pb-2 flex flex-col-reverse gap-1" style={{ background: "#fff" }}>
        {aiState === "clarify" && clarifyPerson && (
          <div className="pb-1 animate-fade-up relative z-20">
            <div className="rounded-2xl p-4" style={{ background: "var(--md-surface-container-low)", border: "1px solid var(--md-outline-variant)" }}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--md-primary)", color: "#fff" }}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>
                    ₹{clarifyPerson.amount.toLocaleString("en-IN")} with {clarifyPerson.name}
                  </span>
                </div>
                <button onClick={() => { setClarifyPerson(null); setAiState("idle"); }} style={{ color: "var(--md-on-surface-variant)", padding: "2px 6px", fontSize: 13 }}>✕</button>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--md-on-surface-variant)" }}>Paid or received?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => logClarifiedPerson("income")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "#1B8A3E", color: "#fff" }}
                >
                  + Received
                </button>
                <button
                  onClick={() => logClarifiedPerson("expense")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "#C62828", color: "#fff" }}
                >
                  − Paid
                </button>
              </div>
            </div>
          </div>
        )}

        {aiState === "clarify" && clarifyAmount && (
          <div className="pb-1 animate-fade-up relative z-20">
            <div className="rounded-2xl p-4" style={{ background: "var(--md-surface-container-low)", border: "1px solid var(--md-outline-variant)" }}>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--md-primary)", color: "#fff" }}>
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                  </div>
                  <span className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>
                    ₹{clarifyAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <button onClick={() => { setClarifyAmount(null); setAiState("idle"); }} style={{ color: "var(--md-on-surface-variant)", padding: "2px 6px", fontSize: 13 }}>✕</button>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--md-on-surface-variant)" }}>Income or expense?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => logClarified("income")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "#1B8A3E", color: "#fff" }}
                >
                  + Income
                </button>
                <button
                  onClick={() => logClarified("expense")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: "#C62828", color: "#fff" }}
                >
                  − Expense
                </button>
              </div>
            </div>
          </div>
        )}

        <AiBubble state={(aiState === "clarify") ? "idle" : aiState} newTxs={newTxs} />

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
          <>
            {/* In flex-col-reverse, last JSX item appears at top visually */}
            {all.length > 5 && (
              <div className="flex justify-center px-3 py-5">
                <span className="text-[11px] font-medium" style={{ color: "var(--md-outline)" }}>you're all caught up</span>
              </div>
            )}
            {all.map((tx, i) => (
              <TxItem
                key={tx.id}
                tx={tx}
                index={i}
                showDate
                onDelete={onDeleteTransaction}
                onEdit={onEditTransaction}
                selectMode={selectMode}
                selected={selectedIds.has(tx.id)}
                onSelect={toggleSelect}
                onEnterSelectMode={enterSelectMode}
              />
            ))}
          </>
        )}
      </div>

      {selectMode && (
        <div className="flex-shrink-0 px-4 pt-3 flex gap-3" style={{ background: "#fff", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
          <button
            onClick={exitSelectMode}
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
            style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting || selectedIds.size === 0}
            className="flex-1 py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "var(--md-error)", color: "#fff" }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
            {bulkDeleting ? "Deleting…" : selectedIds.size > 0 ? `Delete ${selectedIds.size}` : "Delete"}
          </button>
        </div>
      )}

      {!selectMode && <BottomInput value={input} onChange={setInput} onSend={handleSend} disabled={isLoading} transactions={transactions} />}

      {/* Confirm delete bottom sheet */}
      {confirmDelete && (
        <>
          <div className="absolute inset-0 z-40" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setConfirmDelete(false)} />
          <div className="absolute bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 flex flex-col gap-4" style={{ background: "#fff", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
            <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: "var(--md-outline-variant)" }} />
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-1" style={{ background: "#FFDAD6" }}>
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#BA1A1A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
              </div>
              <p className="text-base font-semibold text-center" style={{ color: "var(--md-on-surface)" }}>
                Delete {selectedIds.size} {selectedIds.size === 1 ? "entry" : "entries"}?
              </p>
              <p className="text-sm text-center" style={{ color: "var(--md-on-surface-variant)" }}>
                This cannot be undone.
              </p>
            </div>
            <button
              onClick={confirmAndDelete}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold"
              style={{ background: "var(--md-error)", color: "#fff" }}
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold"
              style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface)" }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
