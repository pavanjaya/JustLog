"use client";

import { useState, useRef } from "react";
import type { Transaction } from "@/types";
import { getCategoryMeta, fmtFull } from "@/lib/format";
import CategoryIcon from "@/components/CategoryIcon";

interface TxItemProps {
  tx: Transaction;
  index?: number;
  showDate?: boolean;
  onDelete?: (id: string) => void;
}

export default function TxItem({ tx, index = 0, showDate = false, onDelete }: TxItemProps) {
  const meta = getCategoryMeta(tx.category);
  const date = new Date(tx.created_at);
  const [showDelete, setShowDelete] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function smartTime(d: Date) {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 0) return time;
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

  return (
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
        {/* Category icon circle */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: showDelete ? "rgba(255,255,255,0.5)" : meta.bg }}
        >
          <CategoryIcon icon={meta.icon} size={17} color={showDelete ? "var(--md-error)" : "#5a4e6e"} />
        </div>

        {/* Description + meta */}
        <div className="flex-1 min-w-0">
          <div
            className="text-sm font-medium leading-tight whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ color: showDelete ? "var(--md-on-error-container)" : "var(--md-on-surface)" }}
          >
            {tx.description}
          </div>
          <div
            className="text-xs mt-0.5"
            style={{ color: showDelete ? "var(--md-on-error-container)" : "var(--md-outline)", opacity: showDelete ? 0.75 : 1 }}
          >
            {showDelete ? "Tap trash to delete · tap row to cancel" : metaText}
          </div>
        </div>

        {/* Amount or delete */}
        {showDelete ? (
          <button
            onClick={handleDelete}
            className="flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0 active:scale-90 transition-transform"
            style={{ background: "var(--md-error)", color: "#fff" }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </button>
        ) : (
          <div
            className="text-sm font-semibold flex-shrink-0 tabular-nums"
            style={{ color: tx.type === "income" ? "#1B7A3E" : "var(--md-on-surface)" }}
          >
            {tx.type === "income" ? "+" : "−"}{fmtFull(tx.amount)}
          </div>
        )}
      </div>

    </div>
  );
}
