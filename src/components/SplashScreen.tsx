"use client";

import { useEffect, useState } from "react";

interface Props {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), 1400);
    const t3 = setTimeout(() => onDone(), 1900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background: "var(--md-surface)",
        opacity: phase === "out" ? 0 : 1,
        transition: phase === "out" ? "opacity 0.5s ease" : undefined,
      }}
    >
      <div
        style={{
          transform: phase === "in" ? "scale(0.7)" : "scale(1)",
          opacity: phase === "in" ? 0 : 1,
          transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "var(--md-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ color: "#fff", fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>J</span>
        </div>

        {/* Wordmark */}
        <span
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: "var(--md-on-surface)",
            letterSpacing: -0.5,
          }}
        >
          JustLog
        </span>
      </div>
    </div>
  );
}
