"use client";

import { useState, useEffect } from "react";
import type { Space } from "@/types";

const SPACE_ICONS = [
  { key: "home" }, { key: "briefcase" }, { key: "heart" },
  { key: "star" }, { key: "car" }, { key: "globe" },
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
  onCreate: (name: string, icon: string, includeInPersonal: boolean) => Promise<void>;
  onClose: () => void;
}

export default function SpaceSwitcher({ open, spaces, activeSpaceId, onSwitch, onCreate, onClose }: SpaceSwitcherProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("home");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [includeInPersonal, setIncludeInPersonal] = useState(false);

  // Reset create form whenever sheet closes
  useEffect(() => {
    if (!open) {
      setCreating(false);
      setNewName("");
      setNewIcon("home");
      setNameError("");
      setIncludeInPersonal(false);
    }
  }, [open]);

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const isDuplicate = spaces.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) { setNameError("A space with this name already exists"); return; }
    setSaving(true);
    setNameError("");
    onClose();
    await onCreate(trimmed, newIcon, includeInPersonal);
    setSaving(false);
  }

  function handleBackdropClick() {
    // Tap outside always closes the entire sheet
    onClose();
  }

  return (
    <>
      {/* Backdrop — tap outside closes sheet */}
      <div
        className="fixed inset-0 z-[200]"
        style={{
          background: "rgba(0,0,0,0.3)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 250ms ease",
        }}
        onClick={handleBackdropClick}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[300] rounded-t-3xl overflow-hidden max-w-[430px] mx-auto"
        style={{
          background: "#fff",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.12)",
          transform: open ? "translateY(0)" : "translateY(100%)",
          transition: "transform 350ms cubic-bezier(0.2, 0, 0, 1)",
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--md-outline-variant)" }} />
        </div>

        {creating ? (
          /* ── Create mode: form only, no list ── */
          <div className="px-5 pt-2 pb-8">
            <div className="flex items-center gap-3 mb-5">
              <button
                onClick={() => setCreating(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                style={{ background: "var(--md-surface-container-low)" }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-on-surface-variant)" }}>
                  <path d="M19 12H5M12 5l-7 7 7 7"/>
                </svg>
              </button>
              <span className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>New Space</span>
            </div>

            {/* Icon picker */}
            <div className="flex gap-2 mb-4">
              {SPACE_ICONS.map(({ key }) => (
                <button
                  key={key}
                  onClick={() => setNewIcon(key)}
                  className="flex-1 aspect-square rounded-2xl flex items-center justify-center transition-all"
                  style={{
                    background: newIcon === key ? "rgba(200,49,255,0.1)" : "var(--md-surface-container-low)",
                    border: newIcon === key ? "2px solid var(--md-primary)" : "2px solid transparent",
                  }}
                >
                  <SpaceIcon icon={key} size={18} color={newIcon === key ? "var(--md-primary)" : "var(--md-on-surface-variant)"} />
                </button>
              ))}
            </div>

            {/* Name input */}
            <input
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setNameError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="Space name (e.g. Business)"
              maxLength={30}
              autoFocus
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none mb-1"
              style={{
                background: "var(--md-surface-container-low)",
                border: `1.5px solid ${nameError ? "var(--md-error)" : "var(--md-outline-variant)"}`,
                color: "var(--md-on-surface)",
              }}
            />
            {nameError && (
              <div className="text-xs px-1 mb-2" style={{ color: "var(--md-error)" }}>{nameError}</div>
            )}

            {/* Include in Personal toggle */}
            <button
              type="button"
              onClick={() => setIncludeInPersonal((v) => !v)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl mb-3 text-left"
              style={{ background: includeInPersonal ? "rgba(200,49,255,0.06)" : "var(--md-surface-container-low)", border: `1.5px solid ${includeInPersonal ? "var(--md-primary)" : "transparent"}` }}
            >
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                style={{ background: includeInPersonal ? "var(--md-primary)" : "transparent", border: `2px solid ${includeInPersonal ? "var(--md-primary)" : "var(--md-outline-variant)"}` }}
              >
                {includeInPersonal && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>Include in Personal</div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>Entries also appear in your Personal space</div>
              </div>
            </button>

            <button
              onClick={handleCreate}
              disabled={!newName.trim() || saving}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold disabled:opacity-40"
              style={{ background: "var(--md-primary)", color: "#fff" }}
            >
              {saving ? "Creating…" : "Create Space"}
            </button>
          </div>
        ) : (
          /* ── Browse mode: list + CTA ── */
          <>
            <div className="px-5 pb-2 pt-1">
              <span className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>Your Spaces</span>
            </div>

            <div className="px-4 pb-3 flex flex-col gap-1">
              {spaces.map((space) => {
                const isActive = space.id === activeSpaceId;
                return (
                  <button
                    key={space.id}
                    onClick={() => { onSwitch(space); onClose(); }}
                    className="flex items-center gap-3 px-3 py-3 rounded-2xl w-full text-left transition-all"
                    style={{ background: isActive ? "rgba(200,49,255,0.05)" : "transparent" }}
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isActive ? "var(--md-primary)" : "var(--md-surface-container-low)" }}
                    >
                      <SpaceIcon icon={space.icon} size={18} color={isActive ? "#fff" : "var(--md-on-surface-variant)"} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: isActive ? "var(--md-primary)" : "var(--md-on-surface)" }}>{space.name}</div>
                    </div>
                    {isActive && (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-primary)" }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Create CTA — clear purple button */}
            <div className="px-4 pb-8 pt-1">
              <button
                onClick={() => setCreating(true)}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: "rgba(200,49,255,0.08)", color: "var(--md-primary)" }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Space
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
