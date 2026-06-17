import type { Transaction } from "@/types";
import { getCategoryMeta, fmtFull } from "@/lib/format";

interface AiBubbleProps {
  state: "idle" | "loading" | "success" | "error";
  newTxs?: Transaction[];
}

export default function AiBubble({ state, newTxs = [] }: AiBubbleProps) {
  if (state === "idle") return null;

  const isError = state === "error";

  return (
    <div className="px-4 pb-3">
      <div
        className="rounded-[var(--md-shape-xl)] rounded-tl-[var(--md-shape-xs)] p-4 flex gap-3 animate-fade-up"
        style={{
          background: isError ? "var(--md-error-container)" : "var(--md-secondary-container)",
        }}
      >
        {/* Avatar chip */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5"
          style={{
            background: isError ? "var(--md-error)" : "var(--md-primary)",
            color: isError ? "var(--md-on-error)" : "var(--md-on-primary)",
          }}
        >
          J
        </div>

        {state === "loading" && (
          <div className="flex gap-1 items-center py-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot" style={{ background: "var(--md-on-secondary-container)" }} />
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot [animation-delay:0.2s]" style={{ background: "var(--md-on-secondary-container)" }} />
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-dot [animation-delay:0.4s]" style={{ background: "var(--md-on-secondary-container)" }} />
          </div>
        )}

        {state === "success" && newTxs.length === 1 && (
          <div className="text-sm leading-[1.6]" style={{ color: "var(--md-on-secondary-container)" }}>
            {getCategoryMeta(newTxs[0].category).emoji}{" "}
            <strong className="font-medium">{newTxs[0].description}</strong>{" "}
            <span style={{ color: newTxs[0].type === "income" ? "var(--md-tertiary)" : "var(--md-on-secondary-container)" }} className="font-medium">
              {newTxs[0].type === "income" ? "+" : "−"}{fmtFull(newTxs[0].amount)}
            </span>{" "}
            logged ✓
          </div>
        )}

        {state === "success" && newTxs.length > 1 && (
          <div className="text-sm leading-[1.6] w-full" style={{ color: "var(--md-on-secondary-container)" }}>
            <div className="mb-2 font-medium">{newTxs.length} entries logged ✓</div>
            {newTxs.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center text-[13px] gap-3 mt-1">
                <span>{getCategoryMeta(tx.category).emoji} {tx.description}</span>
                <span className="font-medium" style={{ color: tx.type === "income" ? "var(--md-tertiary)" : "var(--md-on-secondary-container)" }}>
                  {tx.type === "income" ? "+" : "−"}{fmtFull(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        {state === "error" && (
          <div className="text-sm leading-[1.6]" style={{ color: "var(--md-on-error-container)" }}>
            Couldn&apos;t parse that. Try:
            <br />
            <span className="font-medium">
              200 curd · 400 snacks · 1000 income from Jaya
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
