"use client";

import { useState, useEffect } from "react";
import type { Space } from "@/types";

const SPACE_ICONS = [
  { key: "home" }, { key: "briefcase" }, { key: "plane" },
  { key: "heart" }, { key: "graduation" },
];

function SpaceIcon({ icon, size = 20, color = "currentColor" }: { icon: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icon) {
    case "briefcase": return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
    case "plane": return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case "heart": return <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
    case "graduation": return <svg {...p}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
    default: return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  }
}

interface SpaceSwitcherProps {
  open: boolean;
  spaces: Space[];
  activeSpaceId: string;
  onSwitch: (space: Space) => void;
  onCreate: (name: string, icon: string, includeInPersonal: boolean, peopleCount: number, pinHash?: string) => Promise<void>;
  onClose: () => void;
  isPro?: boolean;
  onUpgrade?: () => void;
}

export default function SpaceSwitcher({ open, spaces, activeSpaceId, onSwitch, onCreate, onClose, isPro = true, onUpgrade }: SpaceSwitcherProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("home");
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [includeInPersonal, setIncludeInPersonal] = useState(false);
  const [sharedExpense, setSharedExpense] = useState(false);
  const [peopleCount, setPeopleCount] = useState(2);
  const [showMore, setShowMore] = useState(false);
  const [enablePin, setEnablePin] = useState(false);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");

  // Reset create form whenever sheet closes
  useEffect(() => {
    if (!open) {
      setCreating(false);
      setNewName("");
      setNewIcon("home");
      setNameError("");
      setIncludeInPersonal(false);
      setSharedExpense(false);
      setPeopleCount(2);
      setShowMore(false);
      setEnablePin(false);
      setPinValue("");
      setPinError("");
    }
  }, [open]);

  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const isDuplicate = spaces.some((s) => s.name.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) { setNameError("A space with this name already exists"); return; }
    if (enablePin && pinValue.length !== 4) { setPinError("Enter a 4-digit PIN"); return; }
    setSaving(true);
    setNameError("");
    let pinHash: string | undefined;
    if (enablePin && pinValue.length === 4) {
      const data = new TextEncoder().encode(pinValue + "jl-pin-salt");
      const hash = await crypto.subtle.digest("SHA-256", data);
      pinHash = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    onClose();
    await onCreate(trimmed, newIcon, includeInPersonal, sharedExpense ? peopleCount : 1, pinHash);
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
          <div className="px-5 pt-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}>
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
              className="w-full px-4 py-3 rounded-2xl text-sm outline-none mb-4"
              style={{
                background: "var(--md-surface-container-low)",
                border: `1.5px solid ${nameError ? "var(--md-error)" : "var(--md-outline-variant)"}`,
                color: "var(--md-on-surface)",
              }}
            />
            {nameError && (
              <div className="text-xs px-1 mb-2" style={{ color: "var(--md-error)" }}>{nameError}</div>
            )}

            {/* More options — above Create button so it's visible before keyboard hides it */}
            <button
              type="button"
              onClick={() => setShowMore((v) => !v)}
              className="w-full flex items-center justify-center gap-1 py-2"
            >
              <span className="text-xs font-medium" style={{ color: "var(--md-outline)" }}>
                {showMore ? "Less options" : "More options"}
              </span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline)", transform: showMore ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms ease" }}>
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>

            {showMore && (
              <div className="flex flex-col gap-2 mt-1 animate-fade-up">
                {/* Include in Personal */}
                <button type="button" onClick={() => setIncludeInPersonal((v) => !v)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left" style={{ background: includeInPersonal ? "rgba(200,49,255,0.06)" : "var(--md-surface-container-low)", border: `1.5px solid ${includeInPersonal ? "var(--md-primary)" : "transparent"}` }}>
                  <div className="flex items-center justify-center flex-shrink-0" style={{ width: 18, height: 18, borderRadius: 4, background: includeInPersonal ? "var(--md-primary)" : "transparent", border: `2px solid ${includeInPersonal ? "var(--md-primary)" : "var(--md-outline-variant)"}` }}>
                    {includeInPersonal && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>Include in Personal</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>Entries also appear in your Personal space</div>
                  </div>
                </button>

                {/* Shared Expense */}
                <button type="button" onClick={() => setSharedExpense((v) => !v)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left" style={{ background: sharedExpense ? "rgba(200,49,255,0.06)" : "var(--md-surface-container-low)", border: `1.5px solid ${sharedExpense ? "var(--md-primary)" : "transparent"}` }}>
                  <div className="flex items-center justify-center flex-shrink-0" style={{ width: 18, height: 18, borderRadius: 4, background: sharedExpense ? "var(--md-primary)" : "transparent", border: `2px solid ${sharedExpense ? "var(--md-primary)" : "var(--md-outline-variant)"}` }}>
                    {sharedExpense && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>Shared Expense</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>Split total by number of people</div>
                  </div>
                </button>

                {/* PIN Lock */}
                <button type="button" onClick={() => { setEnablePin((v) => !v); setPinValue(""); setPinError(""); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left" style={{ background: enablePin ? "rgba(200,49,255,0.06)" : "var(--md-surface-container-low)", border: `1.5px solid ${enablePin ? "var(--md-primary)" : "transparent"}` }}>
                  <div className="flex items-center justify-center flex-shrink-0" style={{ width: 18, height: 18, borderRadius: 4, background: enablePin ? "var(--md-primary)" : "transparent", border: `2px solid ${enablePin ? "var(--md-primary)" : "var(--md-outline-variant)"}` }}>
                    {enablePin && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>PIN Lock</div>
                    <div className="text-[11px] mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>Require a 4-digit PIN to open this space</div>
                  </div>
                </button>

                {/* PIN input — 4 dot boxes */}
                {enablePin && (
                  <div className="animate-fade-up">
                    <div className="flex gap-2 justify-center relative">
                      {[0,1,2,3].map((i) => (
                        <div
                          key={i}
                          className="w-12 h-12 rounded-[14px] flex items-center justify-center"
                          style={{ background: "var(--md-surface-container-low)", border: `1.5px solid ${pinError ? "var(--md-error)" : i < pinValue.length ? "var(--md-primary)" : "var(--md-outline-variant)"}` }}
                        >
                          <span className="text-[18px] font-bold" style={{ color: "var(--md-on-surface)" }}>
                            {pinValue[i] ?? ""}
                          </span>
                        </div>
                      ))}
                      {/* Hidden input to capture keyboard */}
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinValue}
                        onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0,4); setPinValue(v); setPinError(""); }}
                        className="absolute inset-0 opacity-0 w-full"
                        autoFocus={enablePin}
                      />
                    </div>
                    {pinError && <div className="text-xs text-center mt-2" style={{ color: "var(--md-error)" }}>{pinError}</div>}
                  </div>
                )}

                {/* People stepper */}
                {sharedExpense && (
                  <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl animate-fade-up" style={{ background: "rgba(200,49,255,0.06)", border: "1.5px solid rgba(200,49,255,0.15)" }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>People</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "var(--md-primary)" }}>Total ÷ {peopleCount} per head</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setPeopleCount((n) => Math.max(2, n - 1))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                      <span className="text-base font-bold w-5 text-center" style={{ color: "var(--md-on-surface)" }}>{peopleCount}</span>
                      <button type="button" onClick={() => setPeopleCount((n) => Math.min(20, n + 1))} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--md-primary)", color: "#fff" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={!newName.trim() || saving}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold mt-2"
              style={{
                background: !newName.trim() || saving ? "var(--md-surface-container-high)" : "var(--md-primary)",
                color: !newName.trim() || saving ? "var(--md-outline)" : "#fff",
              }}
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

            <div className="px-4 pb-3 flex flex-col gap-1 overflow-y-auto no-scrollbar" style={{ maxHeight: "55vh" }}>
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
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <div className="text-sm font-medium truncate" style={{ color: isActive ? "var(--md-primary)" : "var(--md-on-surface)" }}>{space.name}</div>
                      {space.people_count > 1 && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}>
                          split
                        </span>
                      )}
                      {space.include_in_personal && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}>
                          + personal
                        </span>
                      )}
                      {space.pin_hash && (
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="var(--md-on-surface-variant)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
                          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                        </svg>
                      )}
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
            <div className="px-4 pt-1" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 32px)" }}>
              <button
                onClick={() => {
                  if (!isPro && spaces.length >= 1) { onClose(); onUpgrade?.(); return; }
                  setCreating(true);
                }}
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
