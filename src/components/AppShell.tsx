"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Transaction, View } from "@/types";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/TopBar";
import Drawer from "@/components/Drawer";
import HomeView from "@/components/HomeView";
import StoryView from "@/components/StoryView";
import SearchView from "@/components/SearchView";
import SettingsView from "@/components/SettingsView";
import Toast from "@/components/Toast";

export default function AppShell() {
  const [view, setView] = useState<View>("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2800);
  }

  const loadTransactions = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setTransactions(data as Transaction[]);
    }
  }, [supabase]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (user) loadTransactions(user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadTransactions(session.user.id);
    });

    return () => {
      subscription.unsubscribe();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [loadTransactions, supabase]);

  async function handleDeleteAll() {
    if (!user) return;
    if (confirm("Delete all transaction data? This cannot be undone.")) {
      await supabase.from("transactions").delete().eq("user_id", user.id);
      setTransactions([]);
      setDrawerOpen(false);
      showToast("All data deleted");
    }
  }

  async function handleAddTransactions(txs: Transaction[]) {
    if (!user) return;
    const rows = txs.map((tx) => ({ ...tx, user_id: user.id }));
    const { data, error } = await supabase.from("transactions").insert(rows).select();
    if (!error && data) {
      setTransactions((prev) => [...prev, ...(data as Transaction[])]);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-[430px] mx-auto relative bg-surface">
      <Drawer
        open={drawerOpen}
        view={view}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(v) => setView(v)}
        onDeleteAll={handleDeleteAll}
      />

      <TopBar
        view={view}
        onSearchClick={() => setView("search")}
        onAvatarClick={() => setDrawerOpen(true)}
        avatarUrl={user?.user_metadata?.avatar_url}
        userInitial={(user?.user_metadata?.full_name ?? user?.email ?? "?").charAt(0).toUpperCase()}
      />

      <div className="flex-1 overflow-hidden flex">
        {view === "home" && (
          <HomeView
            transactions={transactions}
            onAddTransactions={handleAddTransactions}
            onSeeAll={() => setView("search")}
            userName={user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0]}
          />
        )}
        {view === "story" && <StoryView transactions={transactions} />}
        {view === "search" && <SearchView transactions={transactions} />}
        {view === "settings" && <SettingsView user={user} onDeleteAll={handleDeleteAll} onToast={showToast} />}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
