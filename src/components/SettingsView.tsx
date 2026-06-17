"use client";

import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface SettingsViewProps {
  user: User | null;
  onDeleteAll: () => void;
  onToast: (msg: string) => void;
}

export default function SettingsView({ user, onDeleteAll, onToast }: SettingsViewProps) {
  const router = useRouter();
  const name = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "You";
  const email = user?.email ?? "";
  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  const initials = name.charAt(0).toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-6" style={{ background: "#fff" }}>
      {/* Profile card */}
      <div
        className="mx-4 mb-5 p-5 rounded-2xl flex items-center gap-4"
        style={{ background: "var(--md-primary-container)" }}
      >
        {avatar ? (
          <img src={avatar} alt={name} className="w-14 h-14 rounded-full flex-shrink-0 object-cover" />
        ) : (
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium flex-shrink-0"
            style={{ background: "var(--md-primary)", color: "var(--md-on-primary)" }}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <div className="text-base font-medium truncate" style={{ color: "var(--md-on-primary-container)" }}>{name}</div>
          <div className="text-sm truncate mt-0.5" style={{ color: "var(--md-on-primary-container)", opacity: 0.75 }}>{email}</div>
        </div>
      </div>

      {/* Group 1 */}
      <SettingsGroup>
        <SettingsItem icon={<IconExport />} label="Export Data" onClick={() => onToast("Export coming soon")} />
        <SettingsItem icon={<IconFolders />} label="Manage Spaces" onClick={() => onToast("Spaces coming in V2")} last />
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
