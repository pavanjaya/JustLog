"use client";

import { useState } from "react";
import type { Space } from "@/types";

const SPACE_ICONS = [
  { key: "home", label: "Personal" },
  { key: "briefcase", label: "Business" },
  { key: "heart", label: "Family" },
  { key: "star", label: "Savings" },
  { key: "car", label: "Vehicle" },
  { key: "globe", label: "Travel" },
];

function SpaceIcon({ icon, size = 20, color = "currentColor" }: { icon: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icon) {
    case "briefcase": return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="12"/></svg>;
    case "heart": return <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
    case "star": return <svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case "car": return <svg {...p}><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
    case "globe": return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>;
    default: return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  }
}

interface SpaceSwitcherProps {
  open: boolean;
  spaces: Space[];
  activeSpaceId: string;
  onSwitch: (space: Space) => void;
  onCreate: (name: string, icon: string) => Promise<void>;
  onClose: () => void;
}

export default function SpaceSwitcher({ open, spaces, activeSpaceId, onSwitch, onCreate, onClose }: SpaceSwitcherProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("home");
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    await onCreate(newName.trim(), newIcon);
    setSaving(false);
    setNewName("");
    setNewIcon("home");
    setCreating(false);
  }

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-20"
        style={{ background: "rgba(0,0,0,0.3)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 rounded-t-3xl overflow-hidden"
        style={{ background: "#fff", boxShadow: "0 -4px 32px rgba(0,0,0,0.12)" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--md-outline-variant)" }} />
        </div>

        <div className="px-5 pb-2 pt-1 flex items-center justify-between">
          <span className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>Your Spaces</span>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full" style={{ color: "var(--md-on-surface-variant)" }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Space list */}
        <div className="px-4 pb-2 flex flex-col gap-1">
          {spaces.map((space) => {
            const isActive = space.id === activeSpaceId;
            return (
              <button
                key={space.id}
                onClick={() => { onSwitch(space); onClose(); }}
                className="flex items-center gap-3 px-3 py-3 rounded-2xl w-full text-left transition-all"
                style={{
                  background: isActive ? "rgba(200,49,255,0.05)" : "transparent",
                }}
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: isActive ? "var(--md-primary)" : "var(--md-surface-container-low)" }}
                >
                  <SpaceIcon icon={space.icon} size={18} color={isActive ? "#fff" : "var(--md-on-surface-variant)"} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: isActive ? "var(--md-on-primary-container)" : "var(--md-on-surface)" }}>{space.name}</div>
                </div>
                {isActive && (
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-primary)", flexShrink: 0 }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        {/* Create new space */}
        {creating ? (
          <div className="px-5 pb-6 pt-2 border-t" style={{ borderColor: "var(--md-outline-variant)" }}>
            <div className="text-sm font-medium mb-3" style={{ color: "var(--md-on-surface)" }}>New Space</div>

            {/* Icon picker */}
            <div className="flex gap-2 mb-3">
              {SPACE_ICONS.map(({ key }) => (
                <button
                  key={key}
                  onClick={() => setNewIcon(key)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center transition-all"
                  style={{
                    background: newIcon === key ? "var(--md-primary)" : "var(--md-surface-container-low)",
                  }}
                >
                  <SpaceIcon icon={key} size={16} color={newIcon === key ? "#fff" : "var(--md-on-surface-variant)"} />
                </button>
              ))}
            </div>

            {/* Name input */}
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Space name (e.g. Business)"
              autoFocus
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none border"
              style={{
                background: "var(--md-surface-container-low)",
                borderColor: "var(--md-outline-variant)",
                color: "var(--md-on-surface)",
              }}
            />

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setCreating(false)}
                className="flex-1 py-2.5 rounded-2xl text-sm font-medium"
                style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface-variant)" }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || saving}
                className="flex-1 py-2.5 rounded-2xl text-sm font-medium disabled:opacity-40"
                style={{ background: "var(--md-primary)", color: "#fff" }}
              >
                {saving ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 pb-8 pt-2">
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-3 px-3 py-3 rounded-2xl w-full"
              style={{ background: "var(--md-surface-container-low)" }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "var(--md-outline-variant)" }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--md-on-surface-variant)" strokeWidth={2} strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <span className="text-sm font-medium" style={{ color: "var(--md-on-surface-variant)" }}>New Space</span>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
