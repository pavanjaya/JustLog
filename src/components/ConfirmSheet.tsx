"use client";

import { createPortal } from "react-dom";

interface ConfirmSheetProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmSheet({ open, title, message, confirmLabel, danger = false, onConfirm, onCancel }: ConfirmSheetProps) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[800] flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onCancel}>
      <div
        className="rounded-t-3xl flex flex-col max-w-[430px] w-full mx-auto"
        style={{ background: "var(--md-surface)", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 24px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-5" style={{ background: "var(--md-outline-variant)" }} />
        <div className="px-6 pb-2">
          <p className="text-base font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>{title}</p>
          <p className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>{message}</p>
        </div>
        <div className="flex flex-col gap-2 px-6 mt-5">
          <button
            onClick={onConfirm}
            className="w-full py-4 rounded-2xl text-sm font-semibold"
            style={{ background: danger ? "var(--md-error)" : "var(--md-on-surface)", color: "#fff" }}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-4 rounded-2xl text-sm font-medium"
            style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
