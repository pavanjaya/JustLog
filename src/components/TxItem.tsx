import type { Transaction } from "@/types";
import { getCategoryMeta, fmtFull } from "@/lib/format";

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
      className="bg-white rounded-radius-md p-[13px_14px] flex items-center gap-[11px] shadow-shadow-sm animate-fade-up"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div
        className="w-10 h-10 rounded-[11px] flex items-center justify-center text-[17px] flex-shrink-0"
        style={{ background: meta.bg }}
      >
        {meta.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis">
          {tx.description}
        </div>
        <div className="text-[11px] text-text-secondary">{metaText}</div>
      </div>
      <div
        className={`text-sm font-semibold flex-shrink-0 ${
          tx.type === "income" ? "text-green" : "text-text-primary"
        }`}
      >
        {tx.type === "income" ? "+" : ""}
        {fmtFull(tx.amount)}
      </div>
    </div>
  );
}
