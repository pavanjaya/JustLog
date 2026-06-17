import type { Transaction } from "@/types";
import { getCategoryMeta, fmtFull } from "@/lib/format";

interface AiBubbleProps {
  state: "idle" | "loading" | "success" | "error";
  newTxs?: Transaction[];
}

export default function AiBubble({ state, newTxs = [] }: AiBubbleProps) {
  if (state === "idle") return null;

  return (
    <div className="px-4 pb-1">
      <div
        className={`bg-blue-light rounded-tl-[4px] rounded-tr-radius-lg rounded-br-radius-lg rounded-bl-radius-lg p-[11px_14px] flex gap-2.5 animate-fade-up ${
          newTxs.length > 1 ? "items-start" : "items-start"
        }`}
      >
        <div className="w-[26px] h-[26px] rounded-[8px] bg-blue flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
          J
        </div>

        {state === "loading" && (
          <div className="flex gap-1 items-center py-0.5">
            <span className="w-1.5 h-1.5 bg-blue rounded-full animate-pulse-dot" />
            <span className="w-1.5 h-1.5 bg-blue rounded-full animate-pulse-dot [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 bg-blue rounded-full animate-pulse-dot [animation-delay:0.4s]" />
          </div>
        )}

        {state === "success" && newTxs.length === 1 && (
          <div className="text-sm text-[#1565C0] leading-[1.55]">
            {getCategoryMeta(newTxs[0].category).emoji}{" "}
            <strong className="font-semibold">{newTxs[0].description}</strong>{" "}
            <span
              className="font-semibold"
              style={{ color: newTxs[0].type === "income" ? "var(--color-green)" : "var(--color-text-primary)" }}
            >
              {newTxs[0].type === "income" ? "+" : "−"}
              {fmtFull(newTxs[0].amount)}
            </span>{" "}
            logged ✓
          </div>
        )}

        {state === "success" && newTxs.length > 1 && (
          <div className="text-sm text-[#1565C0] leading-[1.55] w-full">
            <div className="mb-1.5 font-semibold">{newTxs.length} entries logged ✓</div>
            {newTxs.map((tx) => (
              <div key={tx.id} className="flex justify-between items-center text-[13px] gap-3 mt-1">
                <span>
                  {getCategoryMeta(tx.category).emoji} {tx.description}
                </span>
                <span
                  className="font-semibold"
                  style={{ color: tx.type === "income" ? "var(--color-green)" : "var(--color-text-primary)" }}
                >
                  {tx.type === "income" ? "+" : "−"}
                  {fmtFull(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        )}

        {state === "error" && (
          <div className="text-sm leading-[1.55]" style={{ color: "var(--color-red)" }}>
            Couldn&apos;t parse that. Try:
            <br />
            <strong className="font-semibold">
              200 curd
              <br />
              400 snacks
              <br />
              1000 income from Jaya
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}
