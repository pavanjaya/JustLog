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
import SubscriptionPage from "@/components/SubscriptionPage";
import SwitchPlanSheet from "@/components/SwitchPlanSheet";
import PinPad from "@/components/PinPad";

type SubStatus = "loading" | "active" | "trialing" | "none" | "free";

export default function AppShell() {
  const router = useRouter();
  const [view, setView] = useState<View>("home");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [spaceSwitcherOpen, setSpaceSwitcherOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [activeSpace, setActiveSpace] = useState<Space | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [subStatus, setSubStatus] = useState<SubStatus>("loading");
  const [showSubPage, setShowSubPage] = useState(false);
  const [showSwitchSheet, setShowSwitchSheet] = useState(false);
  const [subValidUntil, setSubValidUntil] = useState<Date | null>(null);
  const [subPlan, setSubPlan] = useState<string>("monthly");
  const [splashDone, setSplashDone] = useState(false);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [pendingSpace, setPendingSpace] = useState<Space | null>(null);
  const [unlockedSpaces, setUnlockedSpaces] = useState<Set<string>>(new Set());
  const [onboardingDone, setOnboardingDone] = useState(true);
  const ensureDefaultSpaceRunning = useRef(false);
  const personalSpaceId = useRef<string | null>(null);
  const [spaceLoading, setSpaceLoading] = useState(true);
  const [trialBannerDismissed, setTrialBannerDismissed] = useState(false);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  // Read localStorage on client mount — avoids hydration mismatch
  useEffect(() => {
    // Onboarding
    setOnboardingDone(localStorage.getItem("jl_onboarded") === "1");
    // Subscription cache
    try {
      const c = JSON.parse(localStorage.getItem("jl_sub") ?? "{}");
      if (c.status === "trialing" || c.status === "active" || c.status === "free") {
        setSubStatus(c.status as SubStatus);
        if (c.validUntil) setSubValidUntil(new Date(c.validUntil));
        if (c.plan) setSubPlan(c.plan);
      }
    } catch { /* ignore */ }
  }, []);

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
          const tagged = (linked_data as Transaction[])
            .filter((tx) => tx.type === "expense")
            .map((tx) => ({
              ...tx,
              description: space.pin_hash ? "Miscellaneous" : tx.description,
              spaceName: space.name,
            }));
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

  // Ensures the user has at least one space; creates "Personal" if not. Returns [defaultSpace, allSpaces].
  const ensureDefaultSpace = useCallback(async (userId: string): Promise<[Space, Space[]]> => {
    // Prevent concurrent calls from both seeing "no spaces" and creating duplicates
    if (ensureDefaultSpaceRunning.current) {
      const existing = await loadSpaces(userId);
      return [existing[0], existing];
    }
    ensureDefaultSpaceRunning.current = true;
    try {
      const existing = await loadSpaces(userId);
      if (existing.length > 0) {
        setSpaces(existing);
        personalSpaceId.current = existing[0].id;
        return [existing[0], existing];
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
      return [space, [space]];
    } finally {
      ensureDefaultSpaceRunning.current = false;
    }
  }, [supabase, loadSpaces]);

  const loadSubscription = useCallback(async () => {
    try {
      const res = await fetch("/api/subscription/status");
      const data = await res.json();
      const serverStatus: SubStatus = data.status === "trialing" ? "trialing" : data.status === "active" ? "active" : "none";

      // Never downgrade from an active/trialing cache to "none" due to server auth glitches.
      // Only update if server returns a positive status, or if we had no status (loading/none).
      setSubStatus((prev) => {
        if (serverStatus === "trialing" || serverStatus === "active") return serverStatus; // server confirms paid — always trust
        if (prev === "trialing" || prev === "active" || prev === "free") return prev; // keep user's choice / paid cache
        return serverStatus; // loading/none — let server decide
      });

      if (data.validUntil) setSubValidUntil(new Date(data.validUntil));
      if (data.plan) setSubPlan(data.plan);

      // Only update cache when server confirms a real status
      if (serverStatus !== "none") {
        localStorage.setItem("jl_sub", JSON.stringify({ status: serverStatus, validUntil: data.validUntil, plan: data.plan }));
      }
      // If a subscription row exists, user has been through onboarding before
      // Restore the flag so a cache-clear never re-shows onboarding
      if (data.existingUser) {
        localStorage.setItem("jl_onboarded", "1");
        setOnboardingDone(true);
      }
    } catch {
      // Network error — keep current state
      setSubStatus((prev) => prev === "loading" ? "none" : prev);
    }
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

      App.addListener("backButton", ({ canGoBack }) => {
        setView((currentView) => {
          if (currentView !== "home") return "home";
          // On home, exit app
          if (!canGoBack) App.exitApp();
          return currentView;
        });
        setDrawerOpen(false);
        setSpaceSwitcherOpen(false);
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
        if (!user.user_metadata?.full_name && !user.email && user.phone) {
          setShowNamePrompt(true);
        }
        setSpaceLoading(true);
        const [space, allSpaces] = await ensureDefaultSpace(user.id);
        setActiveSpace(space);
        await Promise.all([
          loadTransactions(space.id, allSpaces),
          loadSubscription(),
        ]);
        setSpaceLoading(false);
      } else {
        setSpaceLoading(false);
        localStorage.removeItem("jl_sub");
        setSubStatus("none");
        router.replace("/login");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // INITIAL_SESSION is already handled by getUser() above — skip to avoid duplicate space creation
      if (event === "INITIAL_SESSION") return;
      // TOKEN_REFRESHED should not re-load subscription (would override optimistic state)
      if (event === "TOKEN_REFRESHED") return;
      setUser(session?.user ?? null);
      if (session?.user) {
        const [space, allSpaces] = await ensureDefaultSpace(session.user.id);
        setActiveSpace(space);
        await Promise.all([
          loadTransactions(space.id, allSpaces),
          loadSubscription(),
        ]);
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

  async function handleSwitchSpace(space: Space, allSpaces?: Space[], bypassPin = false) {
    const isPersonal = (allSpaces ?? spaces).indexOf(space) === 0 || space.id === personalSpaceId.current;
    if (!bypassPin && !isPersonal && space.pin_hash && !unlockedSpaces.has(space.id)) {
      setPendingSpace(space);
      return;
    }
    // Lock previous space when leaving it
    if (activeSpace?.pin_hash && activeSpace.id !== space.id) {
      setUnlockedSpaces((prev) => { const next = new Set(prev); next.delete(activeSpace.id); return next; });
    }
    setActiveSpace(space);
    setTransactions([]);
    setSpaceLoading(true);
    setView("home");
    await loadTransactions(space.id, allSpaces ?? spaces);
    setSpaceLoading(false);
  }

  async function handleCreateSpace(name: string, icon: string, includeInPersonal: boolean, peopleCount: number, pinHash?: string) {
    if (!user) return;
    const { data, error } = await supabase
      .from("spaces")
      .insert({ user_id: user.id, name, icon, color: "#C831FF", include_in_personal: includeInPersonal, people_count: peopleCount, pin_hash: pinHash ?? null })
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

  function handleTrialSuccess() {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 7);
    setSubStatus("trialing");
    setSubValidUntil(trialEnd);
    localStorage.setItem("jl_sub", JSON.stringify({ status: "trialing", validUntil: trialEnd.toISOString(), plan: "trial" }));
  }

  async function handleSubscribeSuccess() {
    const monthEnd = new Date();
    monthEnd.setDate(monthEnd.getDate() + 30);
    setSubStatus("active");
    setSubPlan("monthly");
    setSubValidUntil(monthEnd);
    localStorage.setItem("jl_sub", JSON.stringify({ status: "active", validUntil: monthEnd.toISOString(), plan: "monthly" }));
  }

  const isPro = subStatus === "active" || subStatus === "trialing";
  const isActive = isPro || subStatus === "free";
  const isTrialExpired = subStatus === "none" && !!subValidUntil && subValidUntil < new Date();
  const trialDaysLeft = subValidUntil && subStatus === "trialing"
    ? Math.max(0, Math.ceil((subValidUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const visibleTransactions = isPro
    ? transactions
    : transactions.filter(tx => new Date(tx.created_at) > cutoff);
  const hiddenTransactionCount = isPro ? 0 : transactions.filter(tx => new Date(tx.created_at) <= cutoff).length;
  const freeMonthlyLimitHit = false;
  const userName = user?.user_metadata?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? user?.phone?.slice(-4);
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const userInitial = (user?.user_metadata?.full_name ?? user?.email ?? user?.phone ?? "?").charAt(0).toUpperCase();

  async function handleSaveName() {
    if (!nameInput.trim()) return;
    setSavingName(true);
    const { data } = await supabase.auth.updateUser({ data: { full_name: nameInput.trim() } });
    if (data.user) setUser(data.user);
    setSavingName(false);
    setShowNamePrompt(false);
  }

  return (
    <div
      className="flex flex-col max-w-[430px] mx-auto relative"
      style={{ height: "100dvh", background: "var(--md-surface)" }}
    >
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      {showNamePrompt && (
        <div className="fixed inset-0 flex items-end justify-center z-[900] px-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="w-full max-w-[430px] rounded-t-[28px] p-6 pb-10 flex flex-col gap-4" style={{ background: "var(--md-surface)" }}>
            <div className="text-[20px] font-bold" style={{ color: "var(--md-on-surface)" }}>What should we call you?</div>
            <div className="text-[14px]" style={{ color: "var(--md-on-surface-variant)" }}>Add your name to personalize JustLog.</div>
            <input
              autoFocus
              type="text"
              placeholder="Your name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
              className="w-full px-4 py-3.5 rounded-[14px] text-[16px] outline-none"
              style={{ background: "var(--md-surface-container-low)", border: "1.5px solid var(--md-outline-variant)", color: "var(--md-on-surface)" }}
            />
            <button
              onClick={handleSaveName}
              disabled={savingName || !nameInput.trim()}
              className="w-full py-4 rounded-[16px] text-[15px] font-semibold"
              style={{ background: nameInput.trim() ? "var(--md-primary)" : "var(--md-surface-container-high)", color: nameInput.trim() ? "#fff" : "var(--md-outline)", opacity: savingName ? 0.7 : 1 }}
            >
              {savingName ? "Saving…" : "Continue"}
            </button>
            <button onClick={() => setShowNamePrompt(false)} className="text-[13px] text-center" style={{ color: "var(--md-on-surface-variant)" }}>
              Skip for now
            </button>
          </div>
        </div>
      )}
      {splashDone && !onboardingDone && subStatus !== "loading" && subStatus !== "trialing" && subStatus !== "active" && (
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
        subStatus={subStatus}
        validUntil={subValidUntil}
        onUpgrade={() => subStatus === "trialing" ? setShowSubPage(true) : setSubStatus("none")}
      />

      <SpaceSwitcher
        open={spaceSwitcherOpen}
        spaces={spaces}
        activeSpaceId={activeSpace?.id ?? ""}
        onSwitch={handleSwitchSpace}
        onCreate={handleCreateSpace}
        onClose={() => setSpaceSwitcherOpen(false)}
        isPro={isPro}
        onUpgrade={() => setSubStatus("none")}
      />

      {/* Trial banner */}
      {subStatus === "trialing" && trialDaysLeft > 0 && !trialBannerDismissed && view === "home" && (
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--md-primary)" }}>
          <span className="text-[13px] font-medium text-white">⚡ Pro Trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} remaining</span>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSubPage(true)} className="text-[12px] font-semibold text-white underline">Upgrade</button>
            <button onClick={() => setTrialBannerDismissed(true)} className="text-white opacity-70 active:opacity-100">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      )}

      {/* Free plan limit banner */}
      {freeMonthlyLimitHit && view === "home" && (
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "#FF6B35" }}>
          <span className="text-[12px] font-medium text-white">You&apos;ve used all 50 free transactions this month</span>
          <button onClick={() => setSubStatus("none")} className="text-[12px] font-semibold text-white underline ml-2 flex-shrink-0">Upgrade</button>
        </div>
      )}

      {view !== "settings" && subStatus !== "none" && (
        <TopBar
          onNavigate={setView}
          onAvatarClick={() => setDrawerOpen(true)}
          onSpaceClick={() => setSpaceSwitcherOpen(true)}
          activeSpace={activeSpace ?? undefined}
          avatarUrl={avatarUrl}
          userInitial={userInitial}
        />
      )}

      <div className="flex-1 overflow-hidden flex">
        {/* Paywall */}
        {subStatus === "loading" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--md-primary)", borderTopColor: "transparent" }} />
          </div>
        )}
        {(subStatus === "none") && user && (
          <div className="flex-1 w-full">
            <PaywallView
              userId={user.id}
              onSuccess={handleTrialSuccess}
              onPaymentSuccess={() => { handleSubscribeSuccess(); showToast("Welcome to Pro! 🎉"); }}
              onContinueFree={isTrialExpired ? undefined : () => { setSubStatus("free"); localStorage.setItem("jl_sub", JSON.stringify({ status: "free" })); }}
              trialExpired={isTrialExpired}
              trialStats={isTrialExpired ? { transactions: transactions.length, spaces: spaces.length } : undefined}
            />
          </div>
        )}

        {spaceLoading && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--md-primary)", borderTopColor: "transparent" }} />
          </div>
        )}

        {!spaceLoading && isActive && (
          <div key={view} className="flex-1 overflow-hidden flex animate-view-enter">
            {view === "home" && (
              <HomeView
                transactions={visibleTransactions}
                allTransactions={transactions}
                hiddenCount={hiddenTransactionCount}
                onAddTransactions={freeMonthlyLimitHit ? undefined : handleAddTransactions}
                onDeleteTransaction={handleDeleteTransaction}
                onBulkDelete={handleBulkDelete}
                onEditTransaction={handleEditTransaction}
                onSeeAll={() => setView("search")}
                userName={userName}
                activeSpace={activeSpace}
                logDisabled={freeMonthlyLimitHit}
                onUpgrade={() => setSubStatus("none")}
              />
            )}
            {view === "story" && <StoryView transactions={transactions} isPro={isPro} onUpgrade={() => setSubStatus("none")} />}
            {view === "search" && <SearchView transactions={visibleTransactions} onDeleteTransaction={handleDeleteTransaction} onBulkDelete={handleBulkDelete} onEditTransaction={handleEditTransaction} isPro={isPro} onUpgrade={() => setSubStatus("none")} hiddenCount={hiddenTransactionCount} />}
            {view === "settings" && (
              <SettingsView
                user={user}
                spaces={spaces}
                transactions={transactions}
                activeSpace={activeSpace}
                onDeleteAll={handleDeleteAll}
                onToast={showToast}
                subStatus={subStatus}
                validUntil={subValidUntil ?? undefined}
                subPlan={subPlan}
                onUpgrade={() => setSubStatus("none")}
                onBack={() => setView("home")}
                onShowSubPage={() => setShowSubPage(true)}
                onRenameSpace={async (id, name) => {
                  await supabase.from("spaces").update({ name }).eq("id", id);
                  setSpaces((prev) => prev.map((s) => s.id === id ? { ...s, name } : s));
                }}
                onDeleteSpace={async (id, action = "delete") => {
                  const personalId = personalSpaceId.current;
                  if (action === "move" && personalId && personalId !== id) {
                    await supabase.from("transactions").update({ space_id: personalId }).eq("space_id", id);
                  } else {
                    await supabase.from("transactions").delete().eq("space_id", id);
                  }
                  await supabase.from("spaces").delete().eq("id", id);
                  const remaining = spaces.filter((s) => s.id !== id);
                  setSpaces(remaining);
                  if (activeSpace?.id === id && remaining.length > 0) {
                    setActiveSpace(remaining[0]);
                    await loadTransactions(remaining[0].id);
                  } else if (activeSpace?.id === personalId) {
                    await loadTransactions(personalId, remaining);
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

      {pendingSpace && (
        <PinPad
          mode="verify"
          spaceName={pendingSpace.name}
          storedHash={pendingSpace.pin_hash ?? undefined}
          onConfirm={() => {
            setUnlockedSpaces((prev) => new Set([...prev, pendingSpace.id]));
            const space = pendingSpace;
            setPendingSpace(null);
            handleSwitchSpace(space, undefined, true);
          }}
          onClose={() => setPendingSpace(null)}
        />
      )}

      {showSwitchSheet && user && (
        <SwitchPlanSheet
          userId={user.id}
          onSuccess={() => { setShowSwitchSheet(false); setShowSubPage(false); handleSubscribeSuccess(); }}
          onClose={() => setShowSwitchSheet(false)}
        />
      )}

      {showSubPage && (
        <SubscriptionPage
          subStatus={subStatus}
          validUntil={subValidUntil ?? undefined}
          subPlan={subPlan}
          userId={user?.id}
          onBack={() => setShowSubPage(false)}
          onUpgrade={() => { setShowSubPage(false); setSubStatus("none"); }}
          onSwitchToAnnual={() => { setShowSwitchSheet(true); }}
          onCancelled={() => { setShowSubPage(false); setSubStatus("none"); }}
          onPaymentSuccess={() => { setShowSubPage(false); handleSubscribeSuccess(); showToast("Welcome to Pro! 🎉"); }}
        />
      )}
    </div>
  );
}
