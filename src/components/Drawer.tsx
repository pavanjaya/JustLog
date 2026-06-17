"use client";

import type { View } from "@/types";

interface DrawerProps {
  open: boolean;
  view: View;
  onClose: () => void;
  onNavigate: (view: View) => void;
  onDeleteAll: () => void;
}

const NAV_ITEMS: { id: View; label: string; icon: React.ReactNode }[] = [
  {
    id: "home",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: "story",
    label: "Monthly Story",
    icon: (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      </svg>
    ),
  },
  {
    id: "search",
    label: "Search",
    icon: (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function Drawer({ open, view, onClose, onNavigate, onDeleteAll }: DrawerProps) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/25 backdrop-blur-[2px] z-[200] transition-opacity ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 w-[280px] h-full bg-white z-[300] flex flex-col overflow-hidden transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="px-5 pt-14 pb-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
              P
            </div>
            <div>
              <div className="text-[16px] font-semibold mb-0.5">Pavan</div>
              <div className="text-xs text-text-secondary">pavan@example.com</div>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-blue-light text-blue text-[11px] font-medium px-2.5 py-1 rounded-full mt-2.5">
            🏠 Personal
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 py-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = view === item.id;
            return (
              <div
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                  active ? "bg-blue-light" : "hover:bg-surface"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 ${
                    active ? "bg-white" : "bg-surface"
                  }`}
                >
                  <span className={active ? "text-blue" : "text-text-secondary"}>{item.icon}</span>
                </div>
                <span className={`text-[15px] ${active ? "font-semibold text-blue" : "font-normal text-text-primary"}`}>
                  {item.label}
                </span>
              </div>
            );
          })}

          <div className="h-px bg-border mx-5 my-1.5" />

          <div
            onClick={onDeleteAll}
            className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-surface transition-colors"
          >
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0 bg-[#FFEBEE]">
              <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="var(--color-red)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4h6v2" />
              </svg>
            </div>
            <span className="text-[15px] text-red">Delete All Data</span>
          </div>
        </div>
      </div>
    </>
  );
}
