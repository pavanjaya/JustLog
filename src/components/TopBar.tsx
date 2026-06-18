"use client";

import { useEffect, useState } from "react";
import type { View, Space } from "@/types";

interface TopBarProps {
  onNavigate: (v: View) => void;
  onAvatarClick: () => void;
  onSpaceClick: () => void;
  activeSpace?: Space;
  avatarUrl?: string;
  userInitial?: string;
}

function getStatusBarHeight(): number {
  if (typeof window === "undefined") return 0;
  const cap = (window as unknown as { Capacitor?: { getPlatform?: () => string } }).Capacitor;
  if (cap?.getPlatform?.() === "android") return 28;
  return 0;
}

export default function TopBar({ onNavigate, onAvatarClick, onSpaceClick, activeSpace, avatarUrl, userInitial = "?" }: TopBarProps) {
  const [statusBarHeight, setStatusBarHeight] = useState(0);

  useEffect(() => {
    setStatusBarHeight(getStatusBarHeight());
  }, []);

  return (
    <div
      className="flex-shrink-0 flex items-center px-4 gap-2"
      style={{ background: "#fff", paddingTop: `${statusBarHeight + 12}px`, paddingBottom: "12px", minHeight: "56px" }}
    >
      {/* Logo + Space switcher — left side */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button onClick={() => onNavigate("home")} className="flex items-center flex-shrink-0">
          <img src="/logo.svg" alt="JustLog" className="h-8 w-auto" />
        </button>

        {/* Divider */}
        <div className="w-px h-4 flex-shrink-0" style={{ background: "var(--md-outline-variant)" }} />

        {/* Space switcher */}
        <button
          onClick={onSpaceClick}
          className="flex items-center gap-1.5 min-w-0"
          style={{ height: 36, paddingLeft: 14, paddingRight: 10, borderRadius: 18, border: "1.5px solid var(--md-outline-variant)", maxWidth: 180 }}
        >
          <span className="text-[13px] font-semibold truncate min-w-0 flex-1" style={{ color: "var(--md-on-surface)" }}>
            {activeSpace?.name ?? "Personal"}
          </span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-on-surface-variant)", flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {/* Avatar */}
      <button
        onClick={onAvatarClick}
        className="flex items-center justify-center rounded-full md-ripple flex-shrink-0"
        style={{ width: 36, height: 36 }}
      >
        <div
          className="rounded-full flex items-center justify-center text-[13px] font-semibold overflow-hidden flex-shrink-0"
          style={{ width: 36, height: 36, background: "var(--md-primary-container)", color: "var(--md-on-primary-container)" }}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            userInitial
          )}
        </div>
      </button>
    </div>
  );
}
