import type { Transaction } from "@/types";
import { fmtFull } from "@/lib/format";
import CategoryIcon from "@/components/CategoryIcon";
import { getCategoryMeta } from "@/lib/format";

interface AiBubbleProps {
  state: "idle" | "loading" | "success" | "error";
  newTxs?: Transaction[];
}

export default function AiBubble({ state, newTxs = [] }: AiBubbleProps) {
  if (state === "idle") return null;

  const isError = state === "error";

  return (
    <div className="pb-1">
      <div
        className="rounded-[var(--md-shape-xl)] rounded-tl-[var(--md-shape-xs)] p-4 flex gap-3 animate-fade-up"
        style={{ background: isError ? "var(--md-error-container)" : "var(--md-secondary-container)" }}
      >
        {/* JustLog avatar */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: isError ? "var(--md-error)" : "var(--md-primary)", color: "#fff" }}
        >
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
        </div>

        {state === "loading" && (
          <div className="flex gap-1.5 items-center py-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: "var(--md-on-secondary-container)" }} />
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot [animation-delay:0.2s]" style={{ background: "var(--md-on-secondary-container)" }} />
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot [animation-delay:0.4s]" style={{ background: "var(--md-on-secondary-container)" }} />
          </div>
        )}

        {state === "success" && newTxs.length === 1 && (
          <div className="flex items-center gap-2 flex-wrap" style={{ color: "var(--md-on-secondary-container)" }}>
            <CategoryIcon icon={getCategoryMeta(newTxs[0].category).icon} size={15} color="var(--md-on-secondary-container)" />
            <span className="text-sm font-medium">{newTxs[0].description}</span>
            <span className="text-sm font-semibold" style={{ color: newTxs[0].type === "income" ? "var(--md-tertiary)" : "var(--md-on-secondary-container)" }}>
              {newTxs[0].type === "income" ? "+" : "−"}{fmtFull(newTxs[0].amount)}
            </span>
            <span className="text-xs opacity-60">logged</span>
          </div>
        )}

        {state === "success" && newTxs.length > 1 && (
          <div className="w-full" style={{ color: "var(--md-on-secondary-container)" }}>
            <div className="text-xs font-medium mb-2 opacity-70">{newTxs.length} entries logged</div>
            <div className="flex flex-col gap-1.5">
              {newTxs.map((tx) => (
                <div key={tx.id} className="flex items-center gap-2">
                  <CategoryIcon icon={getCategoryMeta(tx.category).icon} size={14} color="var(--md-on-secondary-container)" />
                  <span className="text-sm flex-1 truncate">{tx.description}</span>
                  <span className="text-sm font-semibold" style={{ color: tx.type === "income" ? "var(--md-tertiary)" : "var(--md-on-secondary-container)" }}>
                    {tx.type === "income" ? "+" : "−"}{fmtFull(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="text-sm leading-[1.6]" style={{ color: "var(--md-on-error-container)" }}>
            Couldn&apos;t parse that. Try:
            <br />
            <span className="font-medium">200 curd · 400 snacks · 1000 income from Jaya</span>
          </div>
        )}
      </div>
    </div>
  );
}
