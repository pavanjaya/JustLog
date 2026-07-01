"use client";

import { createPortal } from "react-dom";

interface UpgradeSheetProps {
  open: boolean;
  feature?: string; // e.g. "AI Search", "Multiple Spaces", "Export"
  onUpgrade: () => void;
  onClose: () => void;
}

export default function UpgradeSheet({ open, feature, onUpgrade, onClose }: UpgradeSheetProps) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[800] flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div
        className="rounded-t-3xl flex flex-col max-w-[430px] w-full mx-auto"
        style={{ background: "var(--md-surface)", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 24px)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mt-3 mb-5" style={{ background: "var(--md-outline-variant)" }} />
        <div className="px-6 pb-2">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[18px]">⭐</span>
            <p className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>
              {feature ? `${feature} is a Pro feature` : "This is a Pro feature"}
            </p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
            Upgrade to JustLog Pro for full access — AI search, multiple spaces, export, and unlimited history.
          </p>
          <div className="mt-2 text-xs" style={{ color: "var(--md-outline)" }}>
            ₹79/month · or ₹299/year (save 68%)
          </div>
        </div>
        <div className="flex flex-col gap-2 px-6 mt-5">
          <button
            onClick={onUpgrade}
            className="w-full py-4 rounded-2xl text-sm font-semibold"
            style={{ background: "var(--md-primary)", color: "#fff" }}
          >
            Upgrade to Pro
          </button>
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl text-sm font-medium"
            style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)" }}
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
