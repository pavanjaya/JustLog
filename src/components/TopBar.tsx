"use client";

import type { View, Space } from "@/types";

interface TopBarProps {
  onNavigate: (v: View) => void;
  onAvatarClick: () => void;
  onSpaceClick: () => void;
  activeSpace?: Space;
  avatarUrl?: string;
  userInitial?: string;
}

export default function TopBar({ onNavigate, onAvatarClick, onSpaceClick, activeSpace, avatarUrl, userInitial = "?" }: TopBarProps) {
  return (
    <div
      className="flex-shrink-0 flex items-center px-4 h-14 gap-2"
      style={{ background: "#fff" }}
    >
      {/* Logo */}
      <button onClick={() => onNavigate("home")} className="flex items-center flex-shrink-0">
        <img src="/logo.svg" alt="JustLog" className="h-8 w-auto" />
      </button>

      {/* Space switcher pill — center */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={onSpaceClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full md-ripple transition-all"
          style={{ background: "transparent", border: "1.5px solid var(--md-outline-variant)" }}
        >
          <span className="text-xs font-semibold max-w-[120px] truncate" style={{ color: "var(--md-on-surface)" }}>
            {activeSpace?.name ?? "Personal"}
          </span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-on-surface-variant)", flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {/* Avatar */}
      <button
        onClick={onAvatarClick}
        className="w-10 h-10 flex items-center justify-center rounded-full md-ripple flex-shrink-0"
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium overflow-hidden flex-shrink-0"
          style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-container)" }}
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
