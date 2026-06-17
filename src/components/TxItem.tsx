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
    if (pressTimer.current) clearTimeout(pressTimer.current);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete?.(tx.id);
    setShowDelete(false);
  }

  return (
    <div className="relative animate-fade-up" style={{ animationDelay: `${index * 0.04}s` }}>
      <div
        className="flex items-center gap-4 px-4 py-3 rounded-[var(--md-shape-xl)] md-ripple select-none transition-all duration-200"
        style={{
          background: showDelete ? "var(--md-error-container)" : "var(--md-surface-container-low)",
          transform: showDelete ? "scale(0.98)" : "scale(1)",
        }}
        onMouseDown={startPress}
        onMouseUp={cancelPress}
        onMouseLeave={cancelPress}
        onTouchStart={startPress}
        onTouchEnd={cancelPress}
        onClick={() => showDelete && setShowDelete(false)}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-[var(--md-shape-md)] flex items-center justify-center flex-shrink-0"
          style={{ background: showDelete ? "rgba(255,255,255,0.5)" : meta.bg }}
        >
          <CategoryIcon icon={meta.icon} size={18} color={showDelete ? "var(--md-error)" : "#5a5a6e"} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis"
            style={{ color: showDelete ? "var(--md-on-error-container)" : "var(--md-on-surface)" }}>
            {tx.description}
          </div>
          <div className="text-xs mt-0.5" style={{ color: showDelete ? "var(--md-on-error-container)" : "var(--md-on-surface-variant)", opacity: showDelete ? 0.7 : 1 }}>
            {showDelete ? "Hold to delete · tap to cancel" : metaText}
          </div>
        </div>

        {/* Amount or delete button */}
        {showDelete ? (
          <button
            onClick={handleDelete}
            className="flex items-center justify-center w-9 h-9 rounded-full flex-shrink-0 active:scale-90 transition-transform"
            style={{ background: "var(--md-error)", color: "#fff" }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/>
            </svg>
          </button>
        ) : (
          <div className="text-sm font-medium flex-shrink-0"
            style={{ color: tx.type === "income" ? "#2E7D32" : "var(--md-on-surface)" }}>
            {tx.type === "income" ? "+" : "−"}{fmtFull(tx.amount)}
          </div>
        )}
      </div>
    </div>
  );
}
