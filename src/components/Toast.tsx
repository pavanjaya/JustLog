"use client";

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 px-4 py-3.5 rounded-[var(--md-shape-xs)] text-sm font-medium whitespace-nowrap max-w-[90%] z-[999] pointer-events-none transition-all duration-200`}
      style={{
        background: "var(--md-on-surface)",
        color: "var(--md-surface)",
        boxShadow: "var(--md-elevation-3)",
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? "0" : "8px"})`,
      }}
    >
      {message}
    </div>
  );
}
