"use client";

import { useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Space, Transaction } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SubscriptionPage from "@/components/SubscriptionPage";

function daysLeft(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function fmt(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function SubscriptionCard({ subStatus, validUntil, subPlan, onUpgrade, onManage }: { subStatus?: string; validUntil?: Date; subPlan?: string; onUpgrade?: () => void; onManage?: () => void }) {
  const days = validUntil ? daysLeft(validUntil) : 0;

  if (subStatus === "trialing") {
    const pct = validUntil ? Math.min(1, Math.max(0, (validUntil.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))) : 0;
    return (
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(200,49,255,0.2)" }}>
        <button onClick={onManage} className="w-full p-4 text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>JustLog Pro</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(200,49,255,0.15)", color: "var(--md-primary)" }}>TRIAL</span>
            </div>
            <div className="flex items-center gap-1" style={{ color: "var(--md-primary)" }}>
              <span className="text-xs font-semibold">{days}d left</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "rgba(200,49,255,0.15)" }}>
            <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: "var(--md-primary)" }} />
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--md-on-surface-variant)" }}>Trial ends {validUntil ? fmt(validUntil) : ""} · Tap to manage</div>
        </button>
        <div className="px-4 pb-4">
          <button onClick={onUpgrade} className="w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "var(--md-primary)", color: "#fff" }}>
            Upgrade to Pro · ₹49/month
          </button>
        </div>
      </div>
    );
  }

  if (subStatus === "active") {
    return (
      <button onClick={onManage} className="mx-4 mb-3 w-[calc(100%-2rem)] p-4 rounded-2xl flex items-center gap-3 text-left" style={{ background: "rgba(46,125,50,0.05)", border: "1px solid rgba(46,125,50,0.15)" }}>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(46,125,50,0.1)" }}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2E7D32" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>JustLog Pro</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(46,125,50,0.12)", color: "#2E7D32" }}>ACTIVE</span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>
            {validUntil ? `Renews ${fmt(validUntil)}` : "Full access"} · Tap to manage
          </div>
        </div>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-on-surface-variant)", flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
      </button>
    );
  }

  if (subStatus === "free") {
    return (
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--md-outline-variant)" }}>
        <button onClick={onManage} className="w-full p-4 flex items-center justify-between text-left">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>Free Plan</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--md-surface-container-highest)", color: "var(--md-on-surface-variant)" }}>FREE</span>
            </div>
            <div className="text-xs" style={{ color: "var(--md-on-surface-variant)" }}>1 space · 3 months · No AI search</div>
          </div>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-on-surface-variant)" }}><path d="M9 18l6-6-6-6"/></svg>
        </button>
        <div className="px-4 pb-4">
          <button onClick={onUpgrade} className="w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "var(--md-primary)", color: "#fff" }}>
            Upgrade to Pro · ₹49/month
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-4 mb-3 p-4 rounded-2xl" style={{ background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.2)" }}>
      <div className="text-sm font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>No active plan</div>
      <div className="text-xs mb-3" style={{ color: "var(--md-on-surface-variant)" }}>Your trial has ended. Upgrade to keep logging.</div>
      <button onClick={onUpgrade} className="w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "var(--md-primary)", color: "#fff" }}>
        Upgrade to Pro · ₹49/month
      </button>
    </div>
  );
}

function SpaceIcon({ icon, size = 18, color = "currentColor" }: { icon: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icon) {
    case "briefcase": return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
    case "plane": return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case "heart": return <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
    case "graduation": return <svg {...p}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
    default: return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  }
}

interface SettingsViewProps {
  user: User | null;
  spaces: Space[];
  transactions: Transaction[];
  activeSpace: Space | null;
  onDeleteAll: () => void;
  onToast: (msg: string) => void;
  onRenameSpace: (id: string, name: string) => void;
  onDeleteSpace: (id: string) => void;
  onDeleteSpaceData: (id: string) => void;
  onUpdateSpace?: (id: string, updates: Partial<Space>) => void;
  subStatus?: "active" | "trialing" | "none" | "loading" | "free";
  validUntil?: Date;
  subPlan?: string;
  onUpgrade?: () => void;
}

type Sheet = "none" | "profile" | "spaces" | "about" | "privacy" | "terms" | "rename";

export default function SettingsView({
  user, spaces, transactions, activeSpace,
  onDeleteAll, onToast, onRenameSpace, onDeleteSpace, onDeleteSpaceData, onUpdateSpace,
  subStatus = "active", validUntil, subPlan, onUpgrade,
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
  const [showSubPage, setShowSubPage] = useState(false);
  const [editNameDraft, setEditNameDraft] = useState(name);
  const [darkMode, setDarkMode] = useState(false);
  const [renameSheetTarget, setRenameSheetTarget] = useState<Space | null>(null);
  const [renamingInSheet, setRenamingInSheet] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const [spaceActionTarget, setSpaceActionTarget] = useState<Space | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | "clear" | "delete">(null);
  const [spaceIncludePersonal, setSpaceIncludePersonal] = useState(false);
  const [spacePeopleCount, setSpacePeopleCount] = useState(1);
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
    setConfirmAction("delete");
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pt-4" style={{ background: "#fff", paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>

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
      <SubscriptionCard subStatus={subStatus} validUntil={validUntil} subPlan={subPlan} onUpgrade={onUpgrade} onManage={() => setShowSubPage(true)} />

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

      {/* Group 3 — legal + info */}
      <SettingsGroup>
        <SettingsItem icon={<IconShield />} label="Privacy Policy" onClick={() => setSheet("privacy")} />
        <SettingsItem icon={<IconScroll />} label="Terms of Service" onClick={() => setSheet("terms")} />
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

      {/* Spaces sheet — single sheet, panel switches between list / action / rename */}
      <Sheet open={sheet === "spaces"} onClose={() => { setSheet("none"); setSpaceActionTarget(null); setRenamingInSheet(false); setConfirmAction(null); }}>
        {/* Panel: space list */}
        {!spaceActionTarget && (
          <>
            <div className="text-base font-semibold mb-4" style={{ color: "var(--md-on-surface)" }}>Manage Spaces</div>
            <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar" style={{ maxHeight: "55vh" }}>
              {spaces.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => { setSpaceActionTarget(sp); setSpaceIncludePersonal(sp.include_in_personal); setSpacePeopleCount(sp.people_count ?? 1); setRenamingInSheet(false); }}
                  className="rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left w-full"
                  style={{ background: "var(--md-surface-container-low)" }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sp.id === activeSpace?.id ? "var(--md-primary)" : "var(--md-surface-container)" }}>
                    <SpaceIcon icon={sp.icon} size={16} color={sp.id === activeSpace?.id ? "#fff" : "var(--md-on-surface-variant)"} />
                  </div>
                  <span className="flex-1 text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>{sp.name}</span>
                  {sp.id === activeSpace?.id && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#E8F5E9", color: "#2E7D32" }}>Active</span>
                  )}
                  <Chevron />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Panel: space actions / rename — shown when a space is selected */}
        {spaceActionTarget && (
          <>
            {/* Back to list */}
            <button onClick={() => { setSpaceActionTarget(null); setRenamingInSheet(false); setConfirmAction(null); }} className="flex items-center gap-1.5 mb-4" style={{ color: "var(--md-on-surface-variant)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              <span className="text-sm">Spaces</span>
            </button>

            {renamingInSheet ? (
              /* Rename form */
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--md-primary)" }}>
                    <SpaceIcon icon={spaceActionTarget.icon} size={17} color="#fff" />
                  </div>
                  <span className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>Rename</span>
                </div>
                <input
                  autoFocus
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && renameVal.trim()) { onRenameSpace(spaceActionTarget.id, renameVal.trim()); setSheet("none"); setSpaceActionTarget(null); setRenamingInSheet(false); onToast("Space renamed"); } }}
                  maxLength={30}
                  className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none"
                  style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)", border: "none" }}
                  placeholder="Space name"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (renameVal.trim()) { onRenameSpace(spaceActionTarget.id, renameVal.trim()); setSheet("none"); setSpaceActionTarget(null); setRenamingInSheet(false); onToast("Space renamed"); } }}
                    disabled={!renameVal.trim()}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
                    style={{ background: renameVal.trim() ? "var(--md-on-surface)" : "var(--md-surface-container)", color: renameVal.trim() ? "#fff" : "var(--md-outline)" }}
                  >Save</button>
                  <button onClick={() => setRenamingInSheet(false)} className="px-6 py-3.5 rounded-2xl text-sm font-medium" style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)" }}>Cancel</button>
                </div>
              </div>
            ) : (
              /* Action list */
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--md-primary)" }}>
                    <SpaceIcon icon={spaceActionTarget.icon} size={20} color="#fff" />
                  </div>
                  <div>
                    <div className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>{spaceActionTarget.name}</div>
                    <div className="text-xs" style={{ color: "var(--md-on-surface-variant)" }}>{spaceActionTarget.id === activeSpace?.id ? "Active space" : "Space"}</div>
                  </div>
                </div>
                <div className="flex flex-col">
                  {spaceActionTarget.name !== "Personal" && (
                    <ListRow icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} label="Rename" onClick={() => { setRenameVal(spaceActionTarget.name); setRenamingInSheet(true); }} />
                  )}
                  {spaceActionTarget.name !== "Personal" && (
                    <ListRow icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>} label="+ Personal" sublabel="Show entries in Personal space too" right={<Toggle on={spaceIncludePersonal} />}
                      onClick={() => { const next = !spaceIncludePersonal; setSpaceIncludePersonal(next); onUpdateSpace?.(spaceActionTarget.id, { include_in_personal: next }); onToast(next ? "Linked to Personal" : "Unlinked from Personal"); }}
                    />
                  )}
                  {spaceActionTarget.name !== "Personal" && (
                    <>
                      <ListRow icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>} label="Split expense" sublabel="Show per-head amount on home" right={<Toggle on={spacePeopleCount > 1} />}
                        onClick={() => { const next = spacePeopleCount > 1 ? 1 : 2; setSpacePeopleCount(next); onUpdateSpace?.(spaceActionTarget.id, { people_count: next }); onToast(next > 1 ? `Split for ${next} people` : "Split removed"); }}
                      />
                      {spacePeopleCount > 1 && (
                        <div className="flex items-center gap-4 px-4 py-3">
                          <span className="text-xs flex-1" style={{ color: "var(--md-on-surface-variant)" }}>People</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => { const n = Math.max(2, spacePeopleCount - 1); setSpacePeopleCount(n); onUpdateSpace?.(spaceActionTarget.id, { people_count: n }); }} className="w-7 h-7 rounded-full flex items-center justify-center text-base font-semibold" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface)" }}>−</button>
                            <span className="text-sm font-semibold w-5 text-center" style={{ color: "var(--md-on-surface)" }}>{spacePeopleCount}</span>
                            <button onClick={() => { const n = Math.min(20, spacePeopleCount + 1); setSpacePeopleCount(n); onUpdateSpace?.(spaceActionTarget.id, { people_count: n }); }} className="w-7 h-7 rounded-full flex items-center justify-center text-base font-semibold" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface)" }}>+</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {confirmAction === "clear" ? (
                    <div className="px-4 py-4"><ConfirmBox message={`Clear all transactions in "${spaceActionTarget.name}"?`} confirmLabel="Yes, Clear" onConfirm={() => { onDeleteSpaceData(spaceActionTarget.id); setConfirmAction(null); setSpaceActionTarget(null); onToast(`"${spaceActionTarget.name}" cleared`); }} onCancel={() => setConfirmAction(null)} /></div>
                  ) : (
                    <ListRow icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>} label="Clear All Transactions" sublabel="Removes all entries, keeps the space" onClick={() => setConfirmAction("clear")} />
                  )}
                  {confirmAction === "delete" ? (
                    <div className="px-4 py-4"><ConfirmBox message={`Delete "${spaceActionTarget.name}"? All data will be lost.`} confirmLabel="Yes, Delete" danger onConfirm={() => { onDeleteSpace(spaceActionTarget.id); setConfirmAction(null); setSpaceActionTarget(null); onToast(`"${spaceActionTarget.name}" deleted`); }} onCancel={() => setConfirmAction(null)} /></div>
                  ) : spaces.length > 1 && spaceActionTarget.name !== "Personal" ? (
                    <ListRow icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>} label="Delete Space" danger onClick={() => setConfirmAction("delete")} />
                  ) : null}
                </div>
              </>
            )}
          </>
        )}
      </Sheet>


      {/* Subscription full page */}
      {showSubPage && (
        <SubscriptionPage
          subStatus={subStatus}
          validUntil={validUntil}
          subPlan={subPlan}
          onBack={() => setShowSubPage(false)}
          onUpgrade={() => { setShowSubPage(false); onUpgrade?.(); }}
          onSwitchToAnnual={() => { setShowSubPage(false); onUpgrade?.(); }}
        />
      )}

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

      {/* Privacy sheet */}
      <Sheet open={sheet === "privacy"} onClose={() => setSheet("none")}>
        <div className="flex flex-col gap-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(200,49,255,0.08)" }}>
            <IconShield />
          </div>
          <div>
            <div className="text-base font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Data Privacy</div>
            <div className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
              JustLog believes in transparent data practices. Your financial journal is private and only visible to you — we never sell or share your data.
            </div>
          </div>
          <div className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
            Keeping your data safe is our priority. All entries are encrypted in transit and at rest. Visit our full Privacy Policy for complete details on how your information is protected.
          </div>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener"
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-center block"
            style={{ background: "var(--md-primary)", color: "#fff" }}
          >
            Read Privacy Policy
          </a>
        </div>
      </Sheet>

      {/* Terms sheet */}
      <Sheet open={sheet === "terms"} onClose={() => setSheet("none")}>
        <div className="flex flex-col gap-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(200,49,255,0.08)" }}>
            <IconScroll />
          </div>
          <div>
            <div className="text-base font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Terms of Service</div>
            <div className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
              You own all the data you enter into JustLog. We just help you log it. JustLog is a personal journal — not a bank, financial advisor, or investment platform.
            </div>
          </div>
          <div className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
            By using JustLog you agree to our terms, including acceptable use and our AI processing policy. Read the full Terms of Service for details.
          </div>
          <a
            href="/terms"
            target="_blank"
            rel="noopener"
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-center block"
            style={{ background: "var(--md-primary)", color: "#fff" }}
          >
            Read Terms of Service
          </a>
        </div>
      </Sheet>

    </div>
  );
}

function ConfirmBox({ message, confirmLabel, danger, onConfirm, onCancel }: { message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="rounded-2xl p-4 mb-2" style={{ background: danger ? "#FFF5F5" : "var(--md-surface-container-low)" }}>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--md-on-surface)" }}>{message}</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: "var(--md-surface-container-highest)", color: "var(--md-on-surface)" }}>
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: danger ? "var(--md-error)" : "var(--md-on-surface)", color: "#fff" }}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

function ListRow({ icon, label, sublabel, danger, onClick, right }: { icon: React.ReactNode; label: string; sublabel?: string; danger?: boolean; onClick: () => void; right?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left" style={{}}>
      <span className="flex-shrink-0 flex items-center justify-center" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface-variant)" }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface)" }}>{label}</div>
        {sublabel && <div className="text-xs mt-0.5" style={{ color: "var(--md-outline)" }}>{sublabel}</div>}
      </div>
      {right}
    </button>
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
    <div className="w-11 h-6 rounded-full flex-shrink-0 relative transition-colors" style={{ background: on ? "var(--md-primary)" : "var(--md-surface-container-highest)" }}>
      <div className="w-4 h-4 rounded-full absolute transition-all" style={{ background: on ? "#fff" : "#9E9E9E", left: on ? "calc(100% - 20px)" : "4px", top: "4px" }} />
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline)", flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

const ip = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IconExport()  { return <svg {...ip}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconFolders() { return <svg {...ip}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>; }
function IconMoon()    { return <svg {...ip}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>; }
function IconBell()    { return <svg {...ip}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function IconInfo()    { return <svg {...ip}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function IconShield()  { return <svg {...ip}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconScroll()  { return <svg {...ip}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>; }
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
    <button onClick={onClick} className="w-full flex items-center gap-4 px-5 py-4 text-left md-ripple">
      <span className="flex-shrink-0 flex items-center justify-center" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface-variant)" }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface)" }}>{label}</div>
        {sublabel && <div className="text-xs mt-0.5" style={{ color: "var(--md-outline)" }}>{sublabel}</div>}
      </div>
      {rightSlot ?? <Chevron />}
    </button>
  );
}
