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
    <div className="pb-2 animate-fade-up">
      <div
        className="p-4 flex gap-3"
        style={{ borderRadius: 12, background: isError ? "var(--md-error-container)" : "var(--md-secondary-container)", border: "none" }}
      >
        {/* JustLog icon */}
        <div
          className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: isError ? "var(--md-error)" : "var(--md-primary)", opacity: 0.9 }}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            {isError
              ? <><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>
              : <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
            }
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {state === "loading" && (
            <div className="flex gap-1.5 items-center h-7">
              <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: "var(--md-primary)" }} />
              <span className="w-2 h-2 rounded-full animate-pulse-dot [animation-delay:0.2s]" style={{ background: "var(--md-primary)" }} />
              <span className="w-2 h-2 rounded-full animate-pulse-dot [animation-delay:0.4s]" style={{ background: "var(--md-primary)" }} />
            </div>
          )}

          {state === "success" && newTxs.length === 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>{newTxs[0].description}</span>
              <span className="text-sm font-semibold" style={{ color: newTxs[0].type === "income" ? "#1B7A3E" : "#C62828" }}>
                {newTxs[0].type === "income" ? "+" : "−"}{fmtFull(newTxs[0].amount)}
              </span>
              <span className="text-xs font-medium" style={{ color: "#2E7D32" }}>logged</span>
            </div>
          )}

          {state === "success" && newTxs.length > 1 && (
            <div className="w-full">
              <div className="text-xs font-medium mb-2.5" style={{ color: "var(--md-on-surface-variant)" }}>{newTxs.length} entries logged</div>
              <div className="flex flex-col gap-2">
                {newTxs.map((tx) => (
                  <div key={tx.id} className="flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: getCategoryMeta(tx.category).bg }}>
                      <CategoryIcon icon={getCategoryMeta(tx.category).icon} size={11} color="#5a4e6e" />
                    </div>
                    <span className="text-sm flex-1 truncate" style={{ color: "var(--md-on-surface)" }}>{tx.description}</span>
                    <span className="text-sm font-semibold flex-shrink-0" style={{ color: tx.type === "income" ? "#1B7A3E" : "#C62828" }}>
                      {tx.type === "income" ? "+" : "−"}{fmtFull(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {state === "error" && (
            <div>
              <div className="text-sm font-medium mb-0.5" style={{ color: "var(--md-on-error-container)" }}>Couldn't understand that</div>
              <div className="text-xs leading-relaxed" style={{ color: "var(--md-on-error-container)", opacity: 0.75 }}>
                Add an amount with a description — e.g.<br />
                <span className="font-medium" style={{ color: "var(--md-on-surface)" }}>500 coffee · 25000 salary · 1200 petrol</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
