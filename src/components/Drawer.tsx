"use client";

"use client";

import { useState } from "react";
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

const ic = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" as const, stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function IconStory()    { return <svg {...ic}><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8M8 8h5M8 16h6"/></svg>; }
function IconSettings() { return <svg {...ic}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>; }
function IconLogOut()   { return <svg {...ic}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }

export default function Drawer({ open, view, onClose, onNavigate, onDeleteAll, user }: DrawerProps) {
  const router = useRouter();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const name = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "You";
  const email = user?.email ?? "";
  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  const initials = name.charAt(0).toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  function nav(v: View) { onNavigate(v); onClose(); }

  return (
    <>
      <div
        onClick={() => { setConfirmSignOut(false); onClose(); }}
        className={`fixed inset-0 z-[200] transition-opacity duration-300 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        style={{ background: "rgba(0,0,0,0.28)" }}
      />

      <div
        className={`fixed top-0 right-0 w-[290px] h-full z-[300] flex flex-col overflow-hidden transition-transform duration-300`}
        style={{
          background: "var(--md-surface-container-low)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
          borderTopLeftRadius: 28,
          borderBottomLeftRadius: 28,
        }}
      >
        {/* Profile */}
        <div className="px-6 pt-16 pb-6" style={{ borderBottom: "1px solid var(--md-outline-variant)" }}>
          <div className="flex items-center gap-4">
            {avatar ? (
              <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold flex-shrink-0" style={{ background: "var(--md-primary-container)", color: "var(--md-primary)" }}>
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-base font-semibold truncate" style={{ color: "var(--md-on-surface)" }}>{name}</div>
              <div className="text-sm truncate mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>{email}</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 px-3 py-3 flex flex-col gap-1">
          <DrawerItem icon={<IconStory />} label="Story" active={view === "story"} onClick={() => nav("story")} />
          <DrawerItem icon={<IconSettings />} label="Settings" active={view === "settings"} onClick={() => nav("settings")} />
        </div>

        {/* Sign out pinned to bottom */}
        <div className="px-3 pb-8 pt-2" style={{ borderTop: "1px solid var(--md-outline-variant)" }}>
          {confirmSignOut ? (
            <div className="px-2 py-3 animate-fade-up">
              <div className="text-sm font-medium mb-3" style={{ color: "var(--md-on-surface)" }}>Sign out of JustLog?</div>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmSignOut(false)}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold"
                  style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex-1 py-2.5 rounded-2xl text-sm font-semibold"
                  style={{ background: "var(--md-error)", color: "#fff" }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <DrawerItem icon={<IconLogOut />} label="Sign Out" danger onClick={() => setConfirmSignOut(true)} />
          )}
        </div>
      </div>
    </>
  );
}

function DrawerItem({ icon, label, onClick, danger, active }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left md-ripple transition-colors"
      style={{ background: active ? "rgba(200,49,255,0.05)" : "transparent" }}
    >
      <span className="flex-shrink-0" style={{ color: danger ? "var(--md-error)" : active ? "var(--md-primary)" : "var(--md-on-surface-variant)" }}>{icon}</span>
      <span className="text-[15px] font-medium" style={{ color: danger ? "var(--md-error)" : active ? "var(--md-primary)" : "var(--md-on-surface)" }}>{label}</span>
    </button>
  );
}
