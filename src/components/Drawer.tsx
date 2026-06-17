"use client";

import type { View } from "@/types";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface DrawerProps {
  open: boolean;
  view: View;
  onClose: () => void;
  onNavigate: (view: View) => void;
  onDeleteAll: () => void;
  user: User | null;
}

const ic = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function IconStory()   { return <svg {...ic}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M8 8h5M8 16h6"/></svg>; }
function IconSettings(){ return <svg {...ic}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }
function IconExport()  { return <svg {...ic}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconTrash()   { return <svg {...ic}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>; }
function IconLogOut()  { return <svg {...ic}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }

export default function Drawer({ open, view, onClose, onNavigate, onDeleteAll, user }: DrawerProps) {
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

  function nav(v: View) {
    onNavigate(v);
    onClose();
  }

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[200] transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.28)" }}
      />

      {/* Sheet */}
      <div
        className={`fixed top-0 right-0 w-[280px] h-full z-[300] flex flex-col overflow-hidden transition-transform duration-300`}
        style={{
          background: "var(--md-surface-container-low)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
          borderTopLeftRadius: 24,
          borderBottomLeftRadius: 24,
        }}
      >
        {/* Profile */}
        <div className="px-5 pt-14 pb-5">
          <div className="flex items-center gap-3">
            {avatar ? (
              <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium flex-shrink-0"
                style={{ background: "var(--md-primary-container)", color: "var(--md-primary)" }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate" style={{ color: "var(--md-on-surface)" }}>{name}</div>
              <div className="text-xs truncate mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>{email}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 flex flex-col gap-0.5">
          <DrawerItem icon={<IconStory />} label="Story" active={view === "story"} onClick={() => nav("story")} />
          <DrawerItem icon={<IconSettings />} label="Settings" active={view === "settings"} onClick={() => nav("settings")} />
          <DrawerItem icon={<IconExport />} label="Export Data" onClick={onClose} />
          <div className="flex-1" />
          <DrawerItem icon={<IconLogOut />} label="Sign Out" danger onClick={handleSignOut} />
        </div>

        <div className="text-center py-5 text-[11px]" style={{ color: "var(--md-outline)" }}>
          JustLog V1.0
        </div>
      </div>
    </>
  );
}

function DrawerItem({ icon, label, onClick, danger, active }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left md-ripple transition-colors"
      style={{
        background: active ? "rgba(200,49,255,0.05)" : "transparent",
        color: danger ? "var(--md-error)" : active ? "var(--md-primary)" : "var(--md-on-surface)",
      }}
    >
      <span style={{ color: danger ? "var(--md-error)" : active ? "var(--md-primary)" : "var(--md-on-surface-variant)" }}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
