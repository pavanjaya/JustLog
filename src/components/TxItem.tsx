"use client";

import { useState, useRef } from "react";
import type { Transaction, Category } from "@/types";
import { getCategoryMeta, fmtFull } from "@/lib/format";
import CategoryIcon from "@/components/CategoryIcon";

const CATEGORIES: Category[] = [
  "Salary", "Business", "Transfer", "Refund",
  "Food & Drinks", "Groceries", "Transport", "Education",
  "Housing", "Healthcare", "Shopping", "Entertainment",
  "Bills", "Travel", "Investment", "Other",
];

interface TxItemProps {
  tx: Transaction;
  index?: number;
  showDate?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, updates: Partial<Transaction>) => void;
}

export default function TxItem({ tx, index = 0, showDate = false, onDelete, onEdit }: TxItemProps) {
  const meta = getCategoryMeta(tx.category);
  const date = new Date(tx.created_at);
  const [showDelete, setShowDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editAmount, setEditAmount] = useState(String(tx.amount));
  const [editDesc, setEditDesc] = useState(tx.description);
  const [editCategory, setEditCategory] = useState<Category>(tx.category);
  const [editType, setEditType] = useState<"income" | "expense">(tx.type);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function smartTime(d: Date) {
    const now = new Date();
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const txDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((today.getTime() - txDay.getTime()) / 86400000);
    if (diffDays === 0) return time;
    if (diffDays === 1) return `Yesterday ${time}`;
    if (diffDays < 7) return `${d.toLocaleDateString("en-IN", { weekday: "short" })} ${time}`;
    return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ${time}`;
  }

  const metaText = `${tx.category} · ${smartTime(date)}`;

  function startPress() {
    pressTimer.current = setTimeout(() => setShowDelete(true), 500);
  }

  function cancelPress() {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete?.(tx.id);
    setShowDelete(false);
  }

  function openEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditAmount(String(tx.amount));
    setEditDesc(tx.description);
    setEditCategory(tx.category);
    setEditType(tx.type);
    setShowDelete(false);
    setEditOpen(true);
  }

  function saveEdit() {
    const amount = parseFloat(editAmount);
    if (!amount || amount <= 0 || !editDesc.trim()) return;
    onEdit?.(tx.id, { amount, description: editDesc.trim(), category: editCategory, type: editType });
    setEditOpen(false);
  }

  return (
    <>
      <div className="animate-fade-up" style={{ animationDelay: `${index * 0.04}s` }}>
        <div
          className="flex items-center gap-3 px-3 py-3 select-none transition-all duration-200"
          style={{
            background: showDelete ? "var(--md-error-container)" : "transparent",
            borderRadius: showDelete ? "14px" : "0",
            transform: showDelete ? "scale(0.98)" : "scale(1)",
          }}
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchCancel={cancelPress}
          onClick={() => showDelete && setShowDelete(false)}
        >
          {/* Category icon */}
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: showDelete ? "rgba(255,255,255,0.5)" : meta.bg }}
          >
            <CategoryIcon icon={meta.icon} size={17} color={showDelete ? "var(--md-error)" : "#5a4e6e"} />
          </div>

          {/* Description + meta */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: showDelete ? "var(--md-on-error-container)" : "var(--md-on-surface)" }}>
              {tx.description}
            </div>
            <div className="text-xs mt-0.5" style={{ color: showDelete ? "var(--md-on-error-container)" : "var(--md-outline)", opacity: showDelete ? 0.75 : 1 }}>
              {showDelete ? "Edit or delete this entry" : metaText}
            </div>
          </div>

          {/* Actions or amount */}
          {showDelete ? (
            <div className="flex items-center gap-2">
              <button onClick={openEdit} className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 active:scale-90 transition-transform" style={{ background: "var(--md-outline-variant)" }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-on-surface)" }}>
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button onClick={handleDelete} className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 active:scale-90 transition-transform" style={{ background: "var(--md-error)", color: "#fff" }}>
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-sm font-semibold flex-shrink-0 tabular-nums" style={{ color: tx.type === "income" ? "#1B7A3E" : "var(--md-on-surface)" }}>
              {tx.type === "income" ? "+" : "−"}{fmtFull(tx.amount)}
            </div>
          )}
        </div>
      </div>

      {/* Edit bottom sheet */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setEditOpen(false)}>
          <div className="rounded-t-3xl p-6 pb-10 flex flex-col gap-4" style={{ background: "#fff", maxHeight: "85dvh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto" style={{ background: "var(--md-outline-variant)" }} />
            <div className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>Edit Entry</div>

            {/* Income / Expense toggle */}
            <div className="flex rounded-2xl overflow-hidden" style={{ background: "var(--md-surface-container-low)" }}>
              {(["expense", "income"] as const).map(t => (
                <button key={t} onClick={() => setEditType(t)} className="flex-1 py-2.5 text-sm font-semibold transition-all" style={{
                  background: editType === t ? (t === "income" ? "#E8F5E9" : "#FFF5F5") : "transparent",
                  color: editType === t ? (t === "income" ? "#2E7D32" : "#C62828") : "var(--md-outline)",
                  borderRadius: 14,
                }}>
                  {t === "income" ? "Income" : "Expense"}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <div className="text-xs font-medium mb-1.5" style={{ color: "var(--md-on-surface-variant)" }}>Amount</div>
              <input
                type="number"
                value={editAmount}
                onChange={e => setEditAmount(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none border-none"
                style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)" }}
                placeholder="0"
              />
            </div>

            {/* Description */}
            <div>
              <div className="text-xs font-medium mb-1.5" style={{ color: "var(--md-on-surface-variant)" }}>Description</div>
              <input
                autoFocus
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none border-none"
                style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)" }}
                placeholder="Description"
              />
            </div>

            {/* Category picker */}
            <div>
              <div className="text-xs font-medium mb-1.5" style={{ color: "var(--md-on-surface-variant)" }}>Category</div>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setEditCategory(cat)}
                    className="px-2 py-2 rounded-xl text-xs font-medium text-center transition-all"
                    style={{
                      background: editCategory === cat ? "var(--md-primary)" : "var(--md-surface-container-low)",
                      color: editCategory === cat ? "#fff" : "var(--md-on-surface)",
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={saveEdit}
              disabled={!editAmount || !editDesc.trim()}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-40"
              style={{ background: "var(--md-on-surface)", color: "#fff" }}
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </>
  );
}
