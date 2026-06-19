"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import PaywallView from "@/components/PaywallView";
import SplashScreen from "@/components/SplashScreen";
import OnboardingScreen from "@/components/OnboardingScreen";

type SubStatus = "loading" | "active" | "trialing" | "none";

export default function AppShell() {
  const router = useRouter();
  const [view, setView] = useState<View>("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [spaceSwitcherOpen, setSpaceSwitcherOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subStatus, setSubStatus] = useState<SubStatus>("active");
  const [splashDone, setSplashDone] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("jl_onboarded") === "1";
  });
  const ensureDefaultSpaceRunning = useRef(false);
  const personalSpaceId = useRef<string | null>(null);
  const [spaceLoading, setSpaceLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, visible: true });
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2800);
  }

  const loadTransactions = useCallback(async (spaceId: string, allSpaces?: Space[]) => {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("space_id", spaceId)
      .order("created_at", { ascending: true });
    if (error || !data) return;

    let txs: Transaction[] = data as Transaction[];

    // If this is the Personal space, also load transactions from linked spaces
    if (spaceId === personalSpaceId.current && allSpaces) {
      const linked = allSpaces.filter((s) => s.include_in_personal && s.id !== spaceId);
      for (const space of linked) {
        const { data: linked_data } = await supabase
          .from("transactions")
          .select("*")
          .eq("space_id", space.id)
          .order("created_at", { ascending: true });
        if (linked_data) {
          const tagged = (linked_data as Transaction[]).map((tx) => ({ ...tx, spaceName: space.name }));
          txs = [...txs, ...tagged];
        }
      }
      // Re-sort by created_at after merging
      txs.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    }

    setTransactions(txs);
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
    // Prevent concurrent calls from both seeing "no spaces" and creating duplicates
    if (ensureDefaultSpaceRunning.current) {
      const existing = await loadSpaces(userId);
      return existing[0];
    }
    ensureDefaultSpaceRunning.current = true;
    try {
      const existing = await loadSpaces(userId);
      if (existing.length > 0) {
        setSpaces(existing);
        personalSpaceId.current = existing[0].id;
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
      personalSpaceId.current = space.id;
      return space;
    } finally {
      ensureDefaultSpaceRunning.current = false;
    }
  }, [supabase, loadSpaces]);

  const loadSubscription = useCallback(async (_userId: string) => {
    // Stripe not yet configured — grant access to everyone
    setSubStatus("active");
  }, []);

  // Handle deep link auth callback from Capacitor
  useEffect(() => {
    async function handleDeepLink(url: string) {
      // Implicit flow: tokens arrive in URL hash
      const hashPart = url.split("#")[1] ?? "";
      const params = new URLSearchParams(hashPart);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        router.replace("/");
      }
    }

    // Native deep link handler (set on window so MainActivity can call it)
    (window as unknown as { __handleDeepLink: (url: string) => void }).__handleDeepLink = handleDeepLink;

    import("@capacitor/app").then(({ App }) => {
      App.addListener("appUrlOpen", ({ url }) => { handleDeepLink(url); });
      App.getLaunchUrl().then((result) => {
        if (result?.url) handleDeepLink(result.url);
      });
    }).catch(() => {});

    import("@capacitor/browser").then(({ Browser }) => {
      Browser.addListener("browserFinished", async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) router.replace("/");
      });
    }).catch(() => {});
  }, [supabase, router]);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user);
      if (user) {
        setSpaceLoading(true);
        const space = await ensureDefaultSpace(user.id);
        setActiveSpace(space);
        const allSpaces = await loadSpaces(user.id);
        await loadTransactions(space.id, allSpaces);
        setSpaceLoading(false);
        await loadSubscription(user.id);
      } else {
        setSubStatus("none");
        router.replace("/login");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // INITIAL_SESSION is already handled by getUser() above — skip to avoid duplicate space creation
      if (event === "INITIAL_SESSION") return;
      setUser(session?.user ?? null);
      if (session?.user) {
        const space = await ensureDefaultSpace(session.user.id);
        setActiveSpace(space);
        const allSpaces = await loadSpaces(session.user.id);
        await loadTransactions(space.id, allSpaces);
        await loadSubscription(session.user.id);
      } else {
        setSubStatus("none");
        router.replace("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [ensureDefaultSpace, loadTransactions, loadSubscription, supabase]);

  async function handleSwitchSpace(space: Space, allSpaces?: Space[]) {
    setActiveSpace(space);
    setTransactions([]);
    setSpaceLoading(true);
    setView("home");
    await loadTransactions(space.id, allSpaces ?? spaces);
    setSpaceLoading(false);
  }

  async function handleCreateSpace(name: string, icon: string, includeInPersonal: boolean, peopleCount: number) {
    if (!user) return;
    const { data, error } = await supabase
      .from("spaces")
      .insert({ user_id: user.id, name, icon, color: "#C831FF", include_in_personal: includeInPersonal, people_count: peopleCount })
      .select()
      .single();
    if (error || !data) { showToast("Failed to create space"); return; }
    const space = data as Space;
    const updatedSpaces = [...spaces, space];
    setSpaces(updatedSpaces);
    await handleSwitchSpace(space, updatedSpaces);
    showToast(`"${name}" created`);
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

  async function handleBulkDelete(ids: string[]) {
    if (!user || ids.length === 0) return;
    await supabase.from("transactions").delete().in("id", ids).eq("user_id", user.id);
    setTransactions((prev) => prev.filter((tx) => !ids.includes(tx.id)));
  }

  async function handleEditTransaction(id: string, updates: Partial<Transaction>) {
    if (!user) return;
    const { data, error } = await supabase.from("transactions").update(updates).eq("id", id).eq("user_id", user.id).select().single();
    if (!error && data) setTransactions((prev) => prev.map((tx) => tx.id === id ? { ...tx, ...data } : tx));
  }

  async function handleAddTransactions(txs: Transaction[]) {
    if (!user || !activeSpace) return;
    const rows = txs.map((tx) => ({ ...tx, user_id: user.id, space_id: activeSpace.id }));
    const { data, error } = await supabase.from("transactions").insert(rows).select();
    if (error) { console.error("Insert error:", error); return; }
    if (data) setTransactions((prev) => [...prev, ...(data as Transaction[])]);
  }

  async function handleSubscribe() {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  const userName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0];
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const userInitial = (user?.user_metadata?.full_name ?? user?.email ?? "?").charAt(0).toUpperCase();

  return (
    <div
      className="flex flex-col max-w-[430px] mx-auto relative"
      style={{ height: "100dvh", background: "var(--md-surface)" }}
    >
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      {splashDone && !onboardingDone && (
        <OnboardingScreen onDone={() => {
          localStorage.setItem("jl_onboarded", "1");
          setOnboardingDone(true);
        }} />
      )}
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
        {/* Paywall */}
        {subStatus === "loading" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--md-primary)", borderTopColor: "transparent" }} />
          </div>
        )}
        {subStatus === "none" && null}

        {spaceLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--md-primary)", borderTopColor: "transparent" }} />
          </div>
        )}

        {!spaceLoading && (subStatus === "active" || subStatus === "trialing") && (
          <div key={view} className="flex-1 overflow-hidden flex animate-view-enter">
            {view === "home" && (
              <HomeView
                transactions={transactions}
                onAddTransactions={handleAddTransactions}
                onDeleteTransaction={handleDeleteTransaction}
                onBulkDelete={handleBulkDelete}
                onEditTransaction={handleEditTransaction}
                onSeeAll={() => setView("search")}
                userName={userName}
                activeSpace={activeSpace}
              />
            )}
            {view === "story" && <StoryView transactions={transactions} />}
            {view === "search" && <SearchView transactions={transactions} onDeleteTransaction={handleDeleteTransaction} onBulkDelete={handleBulkDelete} onEditTransaction={handleEditTransaction} />}
            {view === "settings" && (
              <SettingsView
                user={user}
                spaces={spaces}
                transactions={transactions}
                activeSpace={activeSpace}
                onDeleteAll={handleDeleteAll}
                onToast={showToast}
                subStatus={subStatus}
                onRenameSpace={async (id, name) => {
                  await supabase.from("spaces").update({ name }).eq("id", id);
                  setSpaces((prev) => prev.map((s) => s.id === id ? { ...s, name } : s));
                }}
                onDeleteSpace={async (id) => {
                  await supabase.from("transactions").delete().eq("space_id", id);
                  await supabase.from("spaces").delete().eq("id", id);
                  const remaining = spaces.filter((s) => s.id !== id);
                  setSpaces(remaining);
                  if (activeSpace?.id === id && remaining.length > 0) {
                    setActiveSpace(remaining[0]);
                    await loadTransactions(remaining[0].id);
                  }
                }}
                onDeleteSpaceData={async (id) => {
                  await supabase.from("transactions").delete().eq("space_id", id);
                  if (activeSpace?.id === id) setTransactions([]);
                }}
                onUpdateSpace={async (id, updates) => {
                  await supabase.from("spaces").update(updates).eq("id", id);
                  setSpaces((prev) => prev.map((s) => s.id === id ? { ...s, ...updates } : s));
                  if (activeSpace?.id === id) setActiveSpace((prev) => prev ? { ...prev, ...updates } : prev);
                }}
              />
            )}
          </div>
        )}
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  );
}
