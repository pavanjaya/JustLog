"use client";

import type { View } from "@/types";

interface TopBarProps {
  view: View;
  onSearchClick: () => void;
  onAvatarClick: () => void;
  avatarUrl?: string;
  userInitial?: string;
}

const VIEW_TITLES: Record<View, string> = {
  home: "",
  story: "Monthly Story",
  search: "Search",
  settings: "Settings",
};

export default function TopBar({ view, onSearchClick, onAvatarClick, avatarUrl, userInitial = "?" }: TopBarProps) {
  return (
    <div className="flex-shrink-0 bg-white border-b border-border px-4 py-3 flex items-center justify-between gap-3">
      <div className="text-[17px] font-bold tracking-tight text-text-primary">
        Just<span className="text-blue">Log</span>
      </div>

      <div className="flex-1 flex justify-center">
        <div className="text-[15px] font-semibold text-text-primary">
          {VIEW_TITLES[view]}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {view !== "search" && (
          <button
            onClick={onSearchClick}
            title="Search"
            className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        )}

        <button
          onClick={onAvatarClick}
          className="w-8 h-8 rounded-full bg-blue text-white text-[13px] font-bold flex items-center justify-center hover:opacity-85 transition-opacity overflow-hidden"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            userInitial
          )}
        </button>
      </div>
    </div>
  );
}
