"use client";

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  const isError = message.toLowerCase().startsWith("failed");

  return (
    <div
      className="fixed bottom-28 left-1/2 z-[999] pointer-events-none"
      style={{
        transform: `translateX(-50%) translateY(${visible ? "0" : "12px"})`,
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease, transform 250ms cubic-bezier(0.2, 0, 0, 1)",
      }}
    >
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl whitespace-nowrap max-w-[90vw]"
        style={{
          background: "#fff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.06)",
          border: `1px solid ${isError ? "rgba(186,26,26,0.15)" : "rgba(200,49,255,0.15)"}`,
        }}
      >
        {/* Icon */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: isError ? "var(--md-error)" : "var(--md-primary)" }}
        >
          {isError ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>

        <span className="text-[13px] font-medium" style={{ color: "var(--md-on-surface)" }}>
          {message}
        </span>
      </div>
    </div>
  );
}
