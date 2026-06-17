"use client";

import type { View } from "@/types";
import type { User } from "@supabase/supabase-js";

interface DrawerProps {
  open: boolean;
  view: View;
  onClose: () => void;
  onNavigate: (view: View) => void;
  onDeleteAll: () => void;
  user: User | null;
}

export default function Drawer({ open, onClose, onDeleteAll, user }: DrawerProps) {
  const name = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "You";
  const email = user?.email ?? "";
  const avatar = user?.user_metadata?.avatar_url as string | undefined;
  const initials = name.charAt(0).toUpperCase();

  return (
    <>
      {/* Scrim */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[200] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        style={{ background: "rgba(0,0,0,0.32)" }}
      />

      {/* MD3 Modal Side Sheet */}
      <div
        className={`fixed top-0 right-0 w-[300px] h-full z-[300] flex flex-col overflow-hidden transition-transform duration-300`}
        style={{
          background: "var(--md-surface-container-low)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transitionTimingFunction: "cubic-bezier(0.2, 0, 0, 1)",
          borderTopLeftRadius: "var(--md-shape-xl)",
          borderBottomLeftRadius: "var(--md-shape-xl)",
        }}
      >
        {/* Header */}
        <div className="px-6 pt-16 pb-6" style={{ borderBottom: "1px solid var(--md-outline-variant)" }}>
          <div className="flex items-center gap-4 mb-4">
            {avatar ? (
              <img src={avatar} alt={name} className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-medium flex-shrink-0"
                style={{ background: "var(--md-primary-container)", color: "var(--md-on-primary-container)" }}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-base font-medium truncate" style={{ color: "var(--md-on-surface)" }}>{name}</div>
              <div className="text-sm truncate" style={{ color: "var(--md-on-surface-variant)" }}>{email}</div>
            </div>
          </div>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
            style={{ background: "var(--md-secondary-container)", color: "var(--md-on-secondary-container)" }}
          >
            🏠 Personal Space
          </div>
        </div>

        {/* Actions */}
        <div className="flex-1 py-3">
          <DrawerItem icon="📤" label="Export Data" onClick={() => {}} />
          <DrawerItem icon="ℹ️" label="About JustLog" onClick={() => {}} />
          <div className="h-px mx-4 my-2" style={{ background: "var(--md-outline-variant)" }} />
          <DrawerItem icon="🗑️" label="Delete All Data" danger onClick={onDeleteAll} />
        </div>

        <div
          className="text-center py-4 text-xs"
          style={{ color: "var(--md-on-surface-variant)" }}
        >
          JustLog V1.0 · Just type.
        </div>
      </div>
    </>
  );
}

function DrawerItem({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-6 py-3.5 text-left md-ripple transition-colors"
      style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface)" }}
    >
      <span className="text-lg">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
