"use client";

import { useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Space, Transaction } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SettingsViewProps {
  user: User | null;
  spaces: Space[];
  transactions: Transaction[];
  activeSpace: Space | null;
  onDeleteAll: () => void;
  onToast: (msg: string) => void;
  onRenameSpace: (id: string, name: string) => void;
  onDeleteSpace: (id: string) => void;
  subStatus?: "active" | "trialing" | "none" | "loading";
}

type Sheet = "none" | "profile" | "spaces" | "about";

export default function SettingsView({
  user, spaces, transactions, activeSpace,
  onDeleteAll, onToast, onRenameSpace, onDeleteSpace,
  subStatus = "active",
}: SettingsViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const name = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "You";
  const email = user?.email ?? "";
  const avatar = user?.user_metadata?.avatar_url as string | undefined;

  const [nameVal, setNameVal] = useState(name);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(avatar);
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState<Sheet>("none");
  const [editNameDraft, setEditNameDraft] = useState(name);
  const [darkMode, setDarkMode] = useState(false);
  const [renamingSpace, setRenamingSpace] = useState<Space | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = nameVal.charAt(0).toUpperCase();

  async function saveDisplayName() {
    if (!editNameDraft.trim()) return;
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: editNameDraft.trim() } });
    setNameVal(editNameDraft.trim());
    setSaving(false);
    setSheet("none");
    onToast("Name updated");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSaving(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      setAvatarUrl(url);
      onToast("Photo updated");
    } else {
      onToast("Upload failed — check Supabase storage bucket");
    }
    setSaving(false);
  }

  function handleExport() {
    if (!transactions.length) { onToast("No transactions to export"); return; }
    const header = "Date,Type,Category,Description,Amount";
    const rows = transactions.map((tx) => {
      const d = new Date(tx.created_at).toLocaleDateString("en-IN");
      return `${d},${tx.type},${tx.category},"${tx.description}",${tx.amount}`;
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `justlog-${activeSpace?.name ?? "export"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    onToast("Exported successfully");
  }

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    onToast(next ? "Dark mode on" : "Dark mode off");
  }

  async function handleManageBilling() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else onToast("Stripe not configured yet");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function confirmDeleteSpace(space: Space) {
    if (spaces.length <= 1) { onToast("Can't delete your only space"); return; }
    if (confirm(`Delete "${space.name}"? All transactions in this space will be lost.`)) {
      onDeleteSpace(space.id);
      onToast(`"${space.name}" deleted`);
    }
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-6" style={{ background: "#fff" }}>

      {/* Profile card */}
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ background: "var(--md-surface-container-low)" }}>
        <button onClick={() => { setEditNameDraft(nameVal); setSheet("profile"); }} className="w-full p-4 flex items-center gap-4 text-left">
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={nameVal} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold" style={{ background: "var(--md-outline-variant)", color: "var(--md-on-surface)" }}>
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--md-on-surface)" }}>{nameVal}</div>
            <div className="text-xs mt-0.5 truncate" style={{ color: "var(--md-on-surface-variant)" }}>{email}</div>
          </div>
          <Chevron />
        </button>
      </div>

      {/* Subscription card */}
      <div className="mx-4 mb-3 p-4 rounded-2xl flex items-center justify-between gap-3" style={{ background: "var(--md-surface-container-low)" }}>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>JustLog Pro</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{
              background: subStatus === "trialing" ? "#EDE7F6" : subStatus === "active" ? "#E8F5E9" : "#FFF3E0",
              color: subStatus === "trialing" ? "#6A1B9A" : subStatus === "active" ? "#2E7D32" : "#E65100",
            }}>
              {subStatus === "trialing" ? "Free Trial" : subStatus === "active" ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--md-on-surface-variant)" }}>
            {subStatus === "trialing" ? "Your free trial is active" : subStatus === "active" ? "₹99 / month" : "Subscribe to unlock all features"}
          </div>
        </div>
        <button
          onClick={subStatus === "none" ? () => onToast("Stripe setup pending") : handleManageBilling}
          className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{ background: "var(--md-surface-container-highest)", color: "var(--md-on-surface)" }}
        >
          {subStatus === "none" ? "Subscribe" : "Manage"}
        </button>
      </div>

      {/* Group 1 — data */}
      <SettingsGroup>
        <SettingsItem icon={<IconExport />} label="Export Data" sublabel={`${transactions.length} transactions`} onClick={handleExport} />
        <SettingsItem icon={<IconFolders />} label="Manage Spaces" sublabel={`${spaces.length} space${spaces.length !== 1 ? "s" : ""}`} onClick={() => setSheet("spaces")} last />
      </SettingsGroup>

      {/* Group 2 — preferences */}
      <SettingsGroup>
        <SettingsItem icon={<IconMoon />} label="Dark Mode" onClick={toggleDarkMode} rightSlot={<Toggle on={darkMode} />} />
        <SettingsItem icon={<IconBell />} label="Notifications" onClick={() => onToast("Notifications coming soon")} rightSlot={<Toggle on={false} />} last />
      </SettingsGroup>

      {/* Group 3 — info */}
      <SettingsGroup>
        <SettingsItem icon={<IconInfo />} label="About JustLog" onClick={() => setSheet("about")} last />
      </SettingsGroup>

      {/* Sign out */}
      <SettingsGroup>
        <SettingsItem icon={<IconLogOut />} label="Sign Out" danger onClick={handleSignOut} last />
      </SettingsGroup>

      <div className="text-center py-5 text-xs" style={{ color: "var(--md-outline)" }}>JustLog V1.0 · Just type.</div>

      {/* ── Sheets ── */}

      {/* Edit profile sheet */}
      <Sheet open={sheet === "profile"} onClose={() => setSheet("none")}>
        <div className="text-base font-semibold mb-5" style={{ color: "var(--md-on-surface)" }}>Edit Profile</div>
        <div className="flex flex-col items-center gap-3 mb-5">
          {avatarUrl ? (
            <img src={avatarUrl} alt={nameVal} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold" style={{ background: "var(--md-outline-variant)", color: "var(--md-on-surface)" }}>
              {nameVal.charAt(0).toUpperCase()}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} className="text-sm font-medium px-4 py-1.5 rounded-full" style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)" }}>
            Change Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div className="mb-4">
          <div className="text-xs font-medium mb-2" style={{ color: "var(--md-on-surface-variant)" }}>Display Name</div>
          <input
            autoFocus
            value={editNameDraft}
            onChange={(e) => setEditNameDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveDisplayName()}
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none border-none"
            style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)" }}
            placeholder="Your name"
          />
        </div>
        <button onClick={saveDisplayName} disabled={saving} className="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{ background: "var(--md-on-surface)", color: "#fff", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </Sheet>

      {/* Manage spaces sheet */}
      <Sheet open={sheet === "spaces"} onClose={() => { setSheet("none"); setRenamingSpace(null); }}>
        <div className="text-base font-semibold mb-4" style={{ color: "var(--md-on-surface)" }}>Manage Spaces</div>
        <div className="flex flex-col gap-2">
          {spaces.map((sp) => (
            <div key={sp.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--md-surface-container-low)" }}>
              {renamingSpace?.id === sp.id ? (
                <div className="flex items-center gap-2 px-4 py-3">
                  <input
                    autoFocus
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { onRenameSpace(sp.id, renameVal); setRenamingSpace(null); onToast("Space renamed"); }
                      if (e.key === "Escape") setRenamingSpace(null);
                    }}
                    className="flex-1 text-sm outline-none border-none bg-transparent"
                    style={{ color: "var(--md-on-surface)" }}
                  />
                  <button onClick={() => { onRenameSpace(sp.id, renameVal); setRenamingSpace(null); onToast("Space renamed"); }} className="text-xs font-semibold" style={{ color: "var(--md-primary)" }}>Save</button>
                  <button onClick={() => setRenamingSpace(null)} className="text-xs" style={{ color: "var(--md-outline)" }}>Cancel</button>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-lg">{sp.icon === "home" ? "🏠" : "📁"}</span>
                  <span className="flex-1 text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>{sp.name}</span>
                  {sp.id === activeSpace?.id && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#E8F5E9", color: "#2E7D32" }}>Active</span>
                  )}
                  {sp.name !== "Personal" && (
                    <button onClick={() => { setRenamingSpace(sp); setRenameVal(sp.name); }} className="p-1.5 rounded-full" style={{ color: "var(--md-outline)" }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  )}
                  {spaces.length > 1 && sp.name !== "Personal" && (
                    <button onClick={() => confirmDeleteSpace(sp)} className="p-1.5 rounded-full" style={{ color: "var(--md-error)" }}>
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Sheet>

      {/* About sheet */}
      <Sheet open={sheet === "about"} onClose={() => setSheet("none")}>
        <div className="flex flex-col items-center gap-4 py-2">
          <img src="/logo.svg" alt="JustLog" className="h-10" />
          <div className="text-center">
            <div className="text-sm font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>JustLog V1.0</div>
            <div className="text-xs leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
              The simplest way to track your money.<br />Just type, we do the rest.
            </div>
          </div>
          <div className="w-full rounded-2xl overflow-hidden" style={{ background: "var(--md-surface-container-low)" }}>
            <AboutRow label="Version" value="1.0.0" />
            <AboutRow label="Plan" value={subStatus === "trialing" ? "Free Trial" : subStatus === "active" ? "Pro" : "Free"} />
            <AboutRow label="Transactions" value={String(transactions.length)} last />
          </div>
        </div>
      </Sheet>

    </div>
  );
}

function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="rounded-t-3xl p-6 pb-10 flex flex-col" style={{ background: "#fff", maxHeight: "80dvh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4 flex-shrink-0" style={{ background: "var(--md-outline-variant)" }} />
        {children}
      </div>
    </div>
  );
}

function AboutRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: last ? "none" : "1px solid var(--md-outline-variant)" }}>
      <span className="text-sm" style={{ color: "var(--md-on-surface-variant)" }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>{value}</span>
    </div>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ background: "var(--md-surface-container-low)" }}>
      {children}
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div className="w-11 h-6 rounded-full flex-shrink-0 relative transition-colors" style={{ background: on ? "var(--md-primary)" : "var(--md-surface-container-highest)", border: on ? "none" : "2px solid var(--md-outline)" }}>
      <div className="w-4 h-4 rounded-full absolute top-1 transition-all" style={{ background: on ? "#fff" : "var(--md-outline)", left: on ? "calc(100% - 20px)" : "2px", top: on ? "4px" : "2px" }} />
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline)", flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

const ip = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IconExport()  { return <svg {...ip}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconFolders() { return <svg {...ip}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>; }
function IconMoon()    { return <svg {...ip}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>; }
function IconBell()    { return <svg {...ip}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function IconInfo()    { return <svg {...ip}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function IconLogOut()  { return <svg {...ip}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  danger?: boolean;
  last?: boolean;
  rightSlot?: React.ReactNode;
}

function SettingsItem({ icon, label, sublabel, onClick, danger, last, rightSlot }: SettingsItemProps) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 px-4 py-3.5 text-left md-ripple">
      <span className="w-5 flex-shrink-0 flex items-center justify-center" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface-variant)" }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface)" }}>{label}</div>
        {sublabel && <div className="text-xs mt-0.5" style={{ color: "var(--md-outline)" }}>{sublabel}</div>}
      </div>
      {rightSlot ?? <Chevron />}
    </button>
  );
}
