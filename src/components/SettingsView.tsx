"use client";

import { useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SettingsViewProps {
  user: User | null;
  onDeleteAll: () => void;
  onToast: (msg: string) => void;
  subStatus?: "active" | "trialing" | "none" | "loading";
}

export default function SettingsView({ user, onDeleteAll, onToast, subStatus = "active" }: SettingsViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const name = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "You";
  const email = user?.email ?? "";
  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  const initials = name.charAt(0).toUpperCase();
  const [nameVal, setNameVal] = useState(name);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(avatar);
  const [saving, setSaving] = useState(false);
  const [editSheet, setEditSheet] = useState(false);
  const [editNameDraft, setEditNameDraft] = useState(name);
  const fileRef = useRef<HTMLInputElement>(null);

  async function saveDisplayName() {
    if (!editNameDraft.trim()) return;
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: editNameDraft.trim() } });
    setNameVal(editNameDraft.trim());
    setSaving(false);
    setEditSheet(false);
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

  async function handleManageBilling() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-6" style={{ background: "#fff" }}>
      {/* Profile card */}
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ background: "var(--md-surface-container-low)" }}>
        <button
          onClick={() => { setEditNameDraft(nameVal); setEditSheet(true); }}
          className="w-full p-4 flex items-center gap-4 text-left"
        >
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
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline)", flexShrink: 0 }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      {/* Edit profile bottom sheet */}
      {editSheet && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setEditSheet(false)}>
          <div
            className="rounded-t-3xl p-6 pb-10 flex flex-col gap-5"
            style={{ background: "#fff" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: "var(--md-outline-variant)" }} />
            <div className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>Edit Profile</div>

            {/* Avatar picker */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={nameVal} className="w-20 h-20 rounded-full object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold" style={{ background: "var(--md-outline-variant)", color: "var(--md-on-surface)" }}>
                    {nameVal.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-sm font-medium px-4 py-1.5 rounded-full"
                style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)" }}
              >
                Change Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            {/* Name input */}
            <div>
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

            <button
              onClick={saveDisplayName}
              disabled={saving}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold"
              style={{ background: "var(--md-on-surface)", color: "#fff", opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* Subscription card */}
      <div
        className="mx-4 mb-3 p-4 rounded-2xl flex items-center justify-between gap-3"
        style={{ background: "var(--md-surface-container-low)" }}
      >
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>JustLog Pro</span>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: subStatus === "trialing" ? "#EDE7F6" : subStatus === "active" ? "#E8F5E9" : "#FFF3E0",
                color: subStatus === "trialing" ? "#6A1B9A" : subStatus === "active" ? "#2E7D32" : "#E65100",
              }}
            >
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

      {/* Group 1 */}
      <SettingsGroup>
        <SettingsItem icon={<IconExport />} label="Export Data" onClick={() => onToast("Export coming soon")} />
        <SettingsItem icon={<IconFolders />} label="Manage Spaces" onClick={() => onToast("Spaces coming in V2")} />
        <SettingsItem icon={<IconCard />} label="Manage Subscription" onClick={handleManageBilling} last />
      </SettingsGroup>

      {/* Group 2 */}
      <SettingsGroup>
        <SettingsItem icon={<IconMoon />} label="Dark Mode" onClick={() => onToast("Dark mode coming soon")} rightSlot={<Toggle />} />
        <SettingsItem icon={<IconBell />} label="Notifications" onClick={() => onToast("Notifications coming in V2")} rightSlot={<Toggle />} last />
      </SettingsGroup>

      {/* Group 3 */}
      <SettingsGroup>
        <SettingsItem icon={<IconInfo />} label="About JustLog" onClick={() => onToast("JustLog V1.0 — Just type.")} last />
      </SettingsGroup>

      {/* Sign out */}
      <SettingsGroup>
        <SettingsItem icon={<IconLogOut />} label="Sign Out" danger onClick={handleSignOut} last />
      </SettingsGroup>

      <div className="text-center py-5 text-xs" style={{ color: "var(--md-outline)" }}>
        JustLog V1.0 · Just type.
      </div>
    </div>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{ background: "var(--md-surface-container-low)" }}
    >
      {children}
    </div>
  );
}

function Toggle() {
  return (
    <div
      className="w-11 h-6 rounded-full flex-shrink-0 relative"
      style={{ background: "var(--md-surface-container-highest)", border: "2px solid var(--md-outline)" }}
    >
      <div
        className="w-4 h-4 rounded-full absolute top-0.5 left-0.5"
        style={{ background: "var(--md-outline)" }}
      />
    </div>
  );
}

const iconProps = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IconExport()   { return <svg {...iconProps}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconFolders()  { return <svg {...iconProps}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>; }
function IconMoon()     { return <svg {...iconProps}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>; }
function IconBell()     { return <svg {...iconProps}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function IconInfo()     { return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function IconTrash()    { return <svg {...iconProps}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>; }
function IconLogOut()   { return <svg {...iconProps}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }
function IconCard()    { return <svg {...iconProps}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>; }

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  last?: boolean;
  rightSlot?: React.ReactNode;
}

function SettingsItem({ icon, label, onClick, danger, last, rightSlot }: SettingsItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3.5 text-left md-ripple transition-colors`}
      style={{}}
    >
      <span className="w-5 flex-shrink-0 flex items-center justify-center" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface-variant)" }}>{icon}</span>
      <span className="flex-1 text-sm font-medium" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface)" }}>
        {label}
      </span>
      {rightSlot ?? (
        <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.6} style={{ color: "var(--md-on-surface-variant)" }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  );
}
