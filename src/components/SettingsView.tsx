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
    <div className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-6">
      {/* Profile card */}
      <div className="mx-4 mb-4 bg-white rounded-radius-md p-[18px] flex items-center gap-3.5 shadow-shadow-sm">
        {avatar ? (
          <img src={avatar} alt={name} className="w-[54px] h-[54px] rounded-full flex-shrink-0 object-cover" />
        ) : (
          <div className="w-[54px] h-[54px] bg-blue rounded-full flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
            {initials}
          </div>
        )}
        <div>
          <div className="text-base font-semibold mb-[3px]">{name}</div>
          <div className="text-xs text-text-secondary">{email}</div>
        </div>
      </div>

      {/* Group 1 */}
      <div className="mx-4 mb-2.5 bg-white rounded-radius-md overflow-hidden shadow-shadow-sm">
        <SettingsItem icon="📤" bg="#E3F2FD" label="Export Data" onClick={() => onToast("Export coming soon")} />
        <SettingsItem icon="🗂️" bg="#F3E5F5" label="Manage Spaces" onClick={() => onToast("Spaces coming in V2")} last />
      </div>

      {/* Group 2 */}
      <div className="mx-4 mb-2.5 bg-white rounded-radius-md overflow-hidden shadow-shadow-sm">
        <SettingsItem
          icon="🌙"
          bg="#E8F5E9"
          label="Dark Mode"
          onClick={() => onToast("Dark mode coming soon")}
          rightSlot={<Toggle />}
        />
        <SettingsItem
          icon="🔔"
          bg="#FFF8E1"
          label="Notifications"
          onClick={() => onToast("Notifications coming in V2")}
          rightSlot={<Toggle />}
          last
        />
      </div>

      {/* Group 3 */}
      <div className="mx-4 mb-2.5 bg-white rounded-radius-md overflow-hidden shadow-shadow-sm">
        <SettingsItem icon="ℹ️" bg="#F5F5F5" label="About JustLog" onClick={() => onToast("JustLog V1.0 — Just type.")} />
        <SettingsItem icon="🗑️" bg="#FFEBEE" label="Delete All Data" danger onClick={onDeleteAll} last />
      </div>

      {/* Sign out */}
      <div className="mx-4 mb-2.5 bg-white rounded-radius-md overflow-hidden shadow-shadow-sm">
        <SettingsItem icon="🚪" bg="#FFF3E0" label="Sign Out" danger onClick={handleSignOut} last />
      </div>

      <div className="text-center py-5 text-[11px] text-text-tertiary">JustLog V1.0 · Just type.</div>
    </div>
  );
}

function Toggle() {
  return <div className="w-[42px] h-6 bg-surface-2 rounded-xl relative cursor-pointer transition-colors" />;
}

interface SettingsItemProps {
  icon: string;
  bg: string;
  label: string;
  onClick: () => void;
  danger?: boolean;
  last?: boolean;
  rightSlot?: React.ReactNode;
}

function SettingsItem({ icon, bg, label, onClick, danger, last, rightSlot }: SettingsItemProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-[13px] px-4 py-3.5 cursor-pointer transition-colors hover:bg-surface ${
        !last ? "border-b border-border" : ""
      }`}
    >
      <div className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[17px] flex-shrink-0" style={{ background: bg }}>
        {icon}
      </div>
      <div className={`flex-1 text-sm ${danger ? "text-red" : "text-text-primary"}`}>{label}</div>
      {rightSlot ?? <div className={`text-base ${danger ? "text-red" : "text-text-tertiary"}`}>›</div>}
    </div>
  );
}
