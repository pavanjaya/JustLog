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
    <div className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-6">
      {/* MD3 Profile card */}
      <div
        className="mx-4 mb-4 p-5 rounded-[var(--md-shape-xl)] flex items-center gap-4"
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
        <SettingsItem icon="📤" label="Export Data" onClick={() => onToast("Export coming soon")} />
        <SettingsItem icon="🗂️" label="Manage Spaces" onClick={() => onToast("Spaces coming in V2")} last />
      </SettingsGroup>

      {/* Group 2 */}
      <SettingsGroup>
        <SettingsItem icon="🌙" label="Dark Mode" onClick={() => onToast("Dark mode coming soon")} rightSlot={<Toggle />} />
        <SettingsItem icon="🔔" label="Notifications" onClick={() => onToast("Notifications coming in V2")} rightSlot={<Toggle />} last />
      </SettingsGroup>

      {/* Group 3 */}
      <SettingsGroup>
        <SettingsItem icon="ℹ️" label="About JustLog" onClick={() => onToast("JustLog V1.0 — Just type.")} />
        <SettingsItem icon="🗑️" label="Delete All Data" danger onClick={onDeleteAll} last />
      </SettingsGroup>

      {/* Sign out */}
      <SettingsGroup>
        <SettingsItem icon="🚪" label="Sign Out" danger onClick={handleSignOut} last />
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
      className="mx-4 mb-3 rounded-[var(--md-shape-xl)] overflow-hidden"
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

interface SettingsItemProps {
  icon: string;
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
      className={`w-full flex items-center gap-4 px-4 py-4 text-left md-ripple transition-colors ${!last ? "border-b" : ""}`}
      style={{ borderColor: "var(--md-outline-variant)" }}
    >
      <span className="text-xl w-7 text-center flex-shrink-0">{icon}</span>
      <span className="flex-1 text-sm font-medium" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface)" }}>
        {label}
      </span>
      {rightSlot ?? (
        <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} style={{ color: "var(--md-on-surface-variant)" }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )}
    </button>
  );
}
