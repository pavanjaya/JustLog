import type { Transaction } from "@/types";
import { getCategoryMeta, fmtFull } from "@/lib/format";
import CategoryIcon from "@/components/CategoryIcon";

interface TxItemProps {
  tx: Transaction;
  index?: number;
  showDate?: boolean;
}

export default function TxItem({ tx, index = 0, showDate = false }: TxItemProps) {
  const meta = getCategoryMeta(tx.category);
  const date = new Date(tx.created_at);

  const metaText = showDate
    ? `${tx.category} · ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
    : `${tx.category} · ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-[var(--md-shape-xl)] animate-fade-up md-ripple"
      style={{
        background: "var(--md-surface-container-low)",
        animationDelay: `${index * 0.04}s`,
      }}
    >
      {/* Icon container */}
      <div
        className="w-10 h-10 rounded-[var(--md-shape-md)] flex items-center justify-center flex-shrink-0"
        style={{ background: meta.bg }}
      >
        <CategoryIcon icon={meta.icon} size={18} color="#5a5a6e" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div
          className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis"
          style={{ color: "var(--md-on-surface)" }}
        >
          {tx.description}
        </div>
        <div className="text-xs mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>
          {metaText}
        </div>
      </div>

      {/* Amount */}
      <div
        className="text-sm font-medium flex-shrink-0"
        style={{ color: tx.type === "income" ? "var(--md-tertiary)" : "var(--md-on-surface)" }}
      >
        {tx.type === "income" ? "+" : "−"}
        {fmtFull(tx.amount)}
      </div>
    </div>
  );
}
