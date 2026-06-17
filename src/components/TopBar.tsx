"use client";

import type { View } from "@/types";
import type { Space } from "@/types";

interface TopBarProps {
  view: View;
  onNavigate: (v: View) => void;
  onAvatarClick: () => void;
  onSpaceClick: () => void;
  activeSpace?: Space;
  avatarUrl?: string;
  userInitial?: string;
}

export default function TopBar({ view, onNavigate, onAvatarClick, onSpaceClick, activeSpace, avatarUrl, userInitial = "?" }: TopBarProps) {
  return (
    <div
      className="flex-shrink-0 flex items-center px-4 h-14 gap-2"
      style={{ background: "#fff" }}
    >
      {/* Logo */}
      <button onClick={() => onNavigate("home")} className="flex items-center flex-shrink-0">
        <img src="/logo.svg" alt="JustLog" className="h-6 w-auto" />
      </button>

      {/* Space switcher pill — center */}
      <div className="flex-1 flex justify-center">
        <button
          onClick={onSpaceClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full md-ripple transition-all"
          style={{ background: "var(--md-primary-container)" }}
        >
          <span className="text-xs font-semibold max-w-[120px] truncate" style={{ color: "var(--md-on-primary-container)" }}>
            {activeSpace?.name ?? "Personal"}
          </span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-primary)", flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>

      {/* Search icon */}
      <button
        onClick={() => onNavigate("search")}
        aria-label="Search"
        className="w-10 h-10 flex items-center justify-center rounded-full md-ripple"
        style={{
          background: view === "search" ? "var(--md-primary-container)" : "transparent",
          color: view === "search" ? "var(--md-primary)" : "var(--md-on-surface-variant)",
        }}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>

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
