"use client";

import type { View } from "@/types";

interface TopBarProps {
  view: View;
  onAvatarClick: () => void;
  avatarUrl?: string;
  userInitial?: string;
}

const VIEW_TITLES: Record<View, string> = {
  home: "JustLog",
  story: "Monthly Story",
  search: "Search",
  settings: "Settings",
};

export default function TopBar({ view, onAvatarClick, avatarUrl, userInitial = "?" }: TopBarProps) {
  return (
    <div
      className="flex-shrink-0 px-1 flex items-center justify-between gap-1 h-16"
      style={{ background: "var(--md-surface-container-low)" }}
    >
      {/* Leading — spacer to balance avatar */}
      <div className="w-12 h-12" />

      {/* Center title */}
      <div className="flex-1 flex items-center justify-center">
        {view === "home" ? (
          <img src="/logo.svg" alt="JustLog" className="h-7 w-auto" />
        ) : (
          <span
            className="text-[22px] font-medium tracking-tight"
            style={{ color: "var(--md-on-surface)" }}
          >
            {VIEW_TITLES[view]}
          </span>
        )}
      </div>

      {/* Trailing — avatar */}
      <button
        onClick={onAvatarClick}
        className="w-12 h-12 flex items-center justify-center rounded-full md-ripple flex-shrink-0"
        style={{ color: "var(--md-on-surface-variant)" }}
      >
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium overflow-hidden"
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
