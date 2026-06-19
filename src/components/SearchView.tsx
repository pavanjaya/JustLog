"use client";

import { useState, useRef, useEffect } from "react";
import type { Transaction } from "@/types";
import TxItem from "@/components/TxItem";
import { apiUrl } from "@/lib/api";

interface SearchViewProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onEditTransaction: (id: string, updates: Partial<Transaction>) => void;
}

const ic = { width: 16, height: 16, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const SEARCH_CHIPS = [
  { icon: <svg {...ic}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>, label: "Monthly spend", query: "How much did I spend this month?" },
  { icon: <svg {...ic}><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/></svg>, label: "Food", query: "Show food expenses" },
  { icon: <svg {...ic}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>, label: "Income", query: "Income this month" },
  { icon: <svg {...ic}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>, label: "Top expense", query: "Biggest expense" },
  { icon: <svg {...ic}><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, label: "Transport", query: "Transport this month" },
  { icon: <svg {...ic}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>, label: "All entries", query: "Show all transactions" },
];

function groupByMonthAndDate(transactions: Transaction[]) {
  // newest first
  const sorted = [...transactions].reverse();

  // month key → date key → transactions
  const months: { monthKey: string; monthLabel: string; days: { dateKey: string; dateLabel: string; txs: Transaction[] }[] }[] = [];
  const monthMap = new Map<string, Map<string, Transaction[]>>();

  for (const tx of sorted) {
    const d = new Date(tx.created_at);
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
    const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    if (!monthMap.has(monthKey)) monthMap.set(monthKey, new Map());
    const dayMap = monthMap.get(monthKey)!;
    if (!dayMap.has(dateKey)) dayMap.set(dateKey, []);
    dayMap.get(dateKey)!.push(tx);
  }

  for (const [monthKey, dayMap] of monthMap) {
    const [year, month] = monthKey.split("-").map(Number);
    const monthLabel = new Date(year, month, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
    const days: { dateKey: string; dateLabel: string; txs: Transaction[] }[] = [];

    for (const [dateKey, txs] of dayMap) {
      const [y, m, day] = dateKey.split("-").map(Number);
      const d = new Date(y, m, day);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const isYesterday = d.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString();
      const dateLabel = isToday ? "Today" : isYesterday ? "Yesterday" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      days.push({ dateKey, dateLabel, txs });
    }

    months.push({ monthKey, monthLabel, days });
  }

  return months;
}

export default function SearchView({ transactions, onDeleteTransaction, onBulkDelete, onEditTransaction }: SearchViewProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const queryRef = useRef("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [timeFilter, setTimeFilter] = useState<"all" | "this_month" | "last_month">("all");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [voiceListening, setVoiceListening] = useState(false);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => () => { recognitionRef.current?.stop(); }, []);

  function isNative() {
    if (typeof window === "undefined") return false;
    return !!(window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.();
  }

  async function startVoiceSearch() {
    if (voiceListening) {
      if (isNative()) {
        const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
        await SpeechRecognition.stop();
      } else {
        recognitionRef.current?.stop();
      }
      setVoiceListening(false);
      return;
    }

    setVoiceListening(true);
    setSearchFocused(true);

    if (isNative()) {
      try {
        const { SpeechRecognition } = await import("@capacitor-community/speech-recognition");
        const perm = await SpeechRecognition.requestPermissions();
        if (perm.speechRecognition !== "granted") { setVoiceListening(false); return; }
        await SpeechRecognition.start({ language: "en-IN", maxResults: 1, partialResults: true, popup: false });
        const listener = await SpeechRecognition.addListener("partialResults", (data: { matches?: string[] }) => {
          if (data.matches?.length) {
            const transcript = data.matches[0].trim();
            setQuery(transcript);
            queryRef.current = transcript;
          }
        });
        setTimeout(async () => {
          listener.remove();
          await SpeechRecognition.stop();
          setVoiceListening(false);
          if (queryRef.current.trim()) runSearch(queryRef.current);
        }, 5000);
      } catch (e) {
        console.error("Native speech error:", e);
        setVoiceListening(false);
      }
    } else {
      const w = window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown };
      const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
      if (!SR) { setVoiceListening(false); return; }
      const rec = new (SR as new () => { continuous: boolean; interimResults: boolean; lang: string; start: () => void; stop: () => void; onresult: ((e: { results: { [k: number]: { [k: number]: { transcript: string } }; length?: number } }) => void) | null; onerror: (() => void) | null; onend: (() => void) | null })();
      rec.continuous = false; rec.interimResults = false; rec.lang = "en-IN";
      rec.onresult = (e) => {
        const results = e.results;
        const len = results.length ?? Object.keys(results).length;
        const transcript = results[len - 1][0].transcript.trim();
        setQuery(transcript); queryRef.current = transcript; runSearch(transcript);
      };
      rec.onerror = () => setVoiceListening(false);
      rec.onend = () => setVoiceListening(false);
      recognitionRef.current = rec as { stop: () => void };
      rec.start();
    }
  }

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
    setConfirmDelete(true);
  }

  async function confirmAndDelete() {
    setConfirmDelete(false);
    setBulkDeleting(true);
    await onBulkDelete([...selectedIds]);
    setBulkDeleting(false);
    exitSelectMode();
  }

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${now.getMonth()}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${lastMonthDate.getMonth()}`;

  const filtered = transactions.filter(tx => {
    if (typeFilter !== "all" && tx.type !== typeFilter) return false;
    if (timeFilter !== "all") {
      const d = new Date(tx.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (timeFilter === "this_month" && key !== thisMonthKey) return false;
      if (timeFilter === "last_month" && key !== lastMonthKey) return false;
    }
    return true;
  });

  const grouped = groupByMonthAndDate(filtered);

  async function runSearch(q: string) {
    if (!q.trim()) return;
    setQuery(q);
    queryRef.current = q;
    setSearchFocused(true);
    setLoading(true);
    setResult("");

    try {
      const res = await fetch(apiUrl("/api/search"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, transactions }),
      });
      const data = await res.json();
      setResult(data.answer || data.error || "No answer found.");
    } catch {
      setResult("Couldn't process that right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative" style={{ background: "#fff" }}>
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0 flex items-center gap-2">
        <div
          className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl"
          style={{ background: "var(--md-surface-container-low)", border: "1px solid var(--md-outline-variant)" }}
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline)" }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); queryRef.current = e.target.value; }}
            onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
            onFocus={() => setSearchFocused(true)}
            type="text"
            placeholder="Ask about your money..."
            autoComplete="off"
            className="flex-1 border-none outline-none bg-transparent text-sm"
            style={{ color: "var(--md-on-surface)" }}
          />
          {query && (
            <button onClick={() => { setQuery(""); queryRef.current = ""; setResult(null); setSearchFocused(false); }} className="flex-shrink-0">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ color: "var(--md-outline)" }}>
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          <button onClick={startVoiceSearch} className="flex-shrink-0" style={{ color: voiceListening ? "var(--md-primary)" : "var(--md-outline)" }}>
            {voiceListening ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            )}
          </button>
        </div>
        {searchFocused && (
          <button
            onClick={() => { setQuery(""); queryRef.current = ""; setResult(null); setSearchFocused(false); }}
            className="text-sm font-medium flex-shrink-0"
            style={{ color: "var(--md-primary)" }}
          >
            Cancel
          </button>
        )}
      </div>

      {/* Select mode header */}
      {selectMode && (
        <div className="flex-shrink-0 px-4 pb-3 flex items-center justify-between">
          <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>{selectedIds.size} selected</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setSelectedIds(new Set(filtered.map(t => t.id)))} className="text-xs font-semibold" style={{ color: "var(--md-primary)" }}>Select all</button>
            <button onClick={exitSelectMode} className="text-xs font-semibold" style={{ color: "var(--md-on-surface-variant)" }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filters — hidden when search is active or in select mode */}
      {!searchFocused && !result && !selectMode && (
        <div className="flex-shrink-0 px-4 pb-3 flex items-center justify-between gap-3">
          {/* Segmented control — primary filter */}
          <div className="flex rounded-xl p-0.5 flex-1" style={{ background: "var(--md-surface-container-low)" }}>
            {(["all", "income", "expense"] as const).map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className="flex-1 py-1.5 rounded-[10px] text-xs font-semibold transition-all"
                style={{
                  background: typeFilter === t ? "#fff" : "transparent",
                  color: typeFilter === t ? "var(--md-on-surface)" : "var(--md-on-surface-variant)",
                  boxShadow: typeFilter === t ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
                }}
              >
                {t === "all" ? "All" : t === "income" ? "Income" : "Expense"}
              </button>
            ))}
          </div>

          {/* Time chip — secondary filter */}
          <button
            onClick={() => setTimeFilter(prev => prev === "all" ? "this_month" : prev === "this_month" ? "last_month" : "all")}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all"
            style={{
              background: timeFilter !== "all" ? "var(--md-primary)" : "var(--md-surface-container-low)",
              color: timeFilter !== "all" ? "#fff" : "var(--md-on-surface-variant)",
            }}
          >
            {timeFilter === "all" ? "All time" : timeFilter === "this_month" ? "This month" : "Last month"}
            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>
        {/* AI result */}
        {result !== null && (
          <div className="mx-4 mb-3 p-4 rounded-2xl animate-fade-up" style={{ background: "rgba(200,49,255,0.05)" }}>
            {loading ? (
              <div className="flex gap-1.5 items-center py-1">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: "var(--md-primary)" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot [animation-delay:0.2s]" style={{ background: "var(--md-primary)" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot [animation-delay:0.4s]" style={{ background: "var(--md-primary)" }} />
              </div>
            ) : (
              <p className="text-sm leading-[1.7]" style={{ color: "var(--md-on-surface)" }}>{result}</p>
            )}
            <button onClick={() => runSearch(query)} className="mt-2 text-xs font-medium" style={{ color: "var(--md-primary)" }}>
              Ask again
            </button>
          </div>
        )}

        {/* Suggestion chips — horizontal scroll, only when search focused */}
        {!result && searchFocused && (
          <div className="flex gap-2 px-4 mb-3 overflow-x-auto no-scrollbar">
            {SEARCH_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() => runSearch(chip.query)}
                className="flex items-center gap-2 px-3 py-2 rounded-full text-left flex-shrink-0"
                style={{ background: "var(--md-surface-container-low)" }}
              >
                <span className="flex-shrink-0" style={{ color: "var(--md-on-surface-variant)" }}>{chip.icon}</span>
                <span className="text-xs font-medium whitespace-nowrap" style={{ color: "var(--md-on-surface)" }}>{chip.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Grouped entries */}
        {filtered.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm" style={{ color: "var(--md-outline)" }}>No transactions found</div>
        ) : (
          grouped.map(({ monthKey, monthLabel, days }) => (
            <div key={monthKey}>
              {/* Month header */}
              <div className="px-4 pt-2 pb-1 flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: "var(--md-on-surface-variant)" }}>{monthLabel}</span>
                <span className="text-[10px]" style={{ color: "var(--md-outline)" }}>
                  {days.reduce((s, d) => s + d.txs.length, 0)} entries
                </span>
              </div>

              {/* Days */}
              {days.map(({ dateKey, dateLabel, txs }) => (
                <div key={dateKey}>
                  {/* Date label */}
                  <div className="px-4 py-1">
                    <span className="text-[11px] font-medium" style={{ color: "var(--md-outline)" }}>{dateLabel}</span>
                  </div>
                  {/* Transactions */}
                  <div className="px-3">
                    {txs.map((tx, i) => (
                      <TxItem key={tx.id} tx={tx} index={i} onDelete={onDeleteTransaction} onEdit={onEditTransaction} selectMode={selectMode} selected={selectedIds.has(tx.id)} onSelect={toggleSelect} onEnterSelectMode={enterSelectMode} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {selectMode && selectedIds.size > 0 && (
        <div className="flex-shrink-0 px-4 pt-2" style={{ background: "#fff", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDeleting}
            className="w-full py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-40 flex items-center justify-center gap-2"
            style={{ background: "var(--md-error)", color: "#fff" }}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
            {bulkDeleting ? "Deleting…" : `Delete ${selectedIds.size} ${selectedIds.size === 1 ? "entry" : "entries"}`}
          </button>
        </div>
      )}

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
            <button onClick={confirmAndDelete} className="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{ background: "var(--md-error)", color: "#fff" }}>
              Yes, delete
            </button>
            <button onClick={() => setConfirmDelete(false)} className="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface)" }}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
