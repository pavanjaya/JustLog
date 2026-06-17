"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Transaction, View, Space } from "@/types";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import TopBar from "@/components/TopBar";
import Drawer from "@/components/Drawer";
import HomeView from "@/components/HomeView";
import StoryView from "@/components/StoryView";
import SearchView from "@/components/SearchView";
import SettingsView from "@/components/SettingsView";
import SpaceSwitcher from "@/components/SpaceSwitcher";
import Toast from "@/components/Toast";

export default function AppShell() {
  const [view, setView] = useState<View>("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [spaceSwitcherOpen, setSpaceSwitcherOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2800);
  }

  const loadTransactions = useCallback(async (spaceId: string) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: true });
    if (!error && data) setTransactions(data as Transaction[]);
  }, [supabase]);

  const loadSpaces = useCallback(async (userId: string): Promise<Space[]> => {
    const { data, error } = await supabase
      .from("spaces")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error || !data) return [];
    return data as Space[];
  }, [supabase]);

  // Ensures the user has at least one space; creates "Personal" if not
  const ensureDefaultSpace = useCallback(async (userId: string): Promise<Space> => {
    const existing = await loadSpaces(userId);
    if (existing.length > 0) {
      setSpaces(existing);
      return existing[0];
    }
    const { data, error } = await supabase
      .from("spaces")
      .insert({ user_id: userId, name: "Personal", icon: "home", color: "#C831FF" })
      .select()
      .single();
    if (error || !data) throw new Error("Failed to create default space");
    const space = data as Space;
    setSpaces([space]);
    return space;
  }, [supabase, loadSpaces]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        const space = await ensureDefaultSpace(user.id);
        setActiveSpace(space);
        await loadTransactions(space.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const space = await ensureDefaultSpace(session.user.id);
        setActiveSpace(space);
        await loadTransactions(space.id);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [ensureDefaultSpace, loadTransactions, supabase]);

  async function handleSwitchSpace(space: Space) {
    setActiveSpace(space);
    setTransactions([]);
    await loadTransactions(space.id);
    setView("home");
  }

  async function handleCreateSpace(name: string, icon: string) {
    if (!user) return;
    const { data, error } = await supabase
      .from("spaces")
      .insert({ user_id: user.id, name, icon, color: "#C831FF" })
      .select()
      .single();
    if (error || !data) { showToast("Failed to create space"); return; }
    const space = data as Space;
    setSpaces((prev) => [...prev, space]);
    await handleSwitchSpace(space);
    showToast(`Switched to "${name}"`);
  }

  async function handleDeleteAll() {
    if (!user || !activeSpace) return;
    if (confirm("Delete all transactions in this space? This cannot be undone.")) {
      await supabase.from("transactions").delete().eq("space_id", activeSpace.id).eq("user_id", user.id);
      setTransactions([]);
      showToast("All data deleted");
    }
  }

  async function handleDeleteTransaction(id: string) {
    if (!user) return;
    await supabase.from("transactions").delete().eq("id", id).eq("user_id", user.id);
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  }

  async function handleAddTransactions(txs: Transaction[]) {
    if (!user || !activeSpace) return;
    const rows = txs.map((tx) => ({ ...tx, user_id: user.id, space_id: activeSpace.id }));
    const { data, error } = await supabase.from("transactions").insert(rows).select();
    if (error) { console.error("Insert error:", error); return; }
    if (data) setTransactions((prev) => [...prev, ...(data as Transaction[])]);
  }

  const userName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0];
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const userInitial = (user?.user_metadata?.full_name ?? user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <div
      className="flex flex-col max-w-[430px] mx-auto relative"
      style={{ height: "100dvh", background: "var(--md-surface)" }}
    >
      <Drawer
        open={drawerOpen}
        view={view}
        onClose={() => setDrawerOpen(false)}
        onNavigate={(v) => { setView(v); setDrawerOpen(false); }}
        onDeleteAll={handleDeleteAll}
        user={user}
      />

      <SpaceSwitcher
        open={spaceSwitcherOpen}
        spaces={spaces}
        activeSpaceId={activeSpace?.id ?? ""}
        onSwitch={handleSwitchSpace}
        onCreate={handleCreateSpace}
        onClose={() => setSpaceSwitcherOpen(false)}
      />

      <TopBar
        onNavigate={setView}
        onAvatarClick={() => setDrawerOpen(true)}
        onSpaceClick={() => setSpaceSwitcherOpen(true)}
        activeSpace={activeSpace ?? undefined}
        avatarUrl={avatarUrl}
        userInitial={userInitial}
      />

      <div className="flex-1 overflow-hidden flex">
        {view === "home" && (
          <HomeView
            transactions={transactions}
            onAddTransactions={handleAddTransactions}
            onDeleteTransaction={handleDeleteTransaction}
            onSeeAll={() => setView("search")}
            userName={userName}
          />
        )}
        {view === "story" && <StoryView transactions={transactions} />}
        {view === "search" && <SearchView transactions={transactions} onDeleteTransaction={handleDeleteTransaction} />}
        {view === "settings" && (
          <SettingsView user={user} onDeleteAll={handleDeleteAll} onToast={showToast} />
        )}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
