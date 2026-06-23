"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Space, Transaction } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import PinPad from "@/components/PinPad";
import ConfirmSheet from "@/components/ConfirmSheet";
import { loadReminderSettings, saveReminderSettings, requestNotificationPermission, scheduleReminder, cancelReminder } from "@/lib/notifications";

function daysLeft(date: Date) {
  return Math.max(0, Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function fmt(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function SubscriptionCard({ subStatus, validUntil, subPlan, onManage, onStartTrial }: {
  subStatus?: string; validUntil?: Date; subPlan?: string;
  onManage?: () => void; onStartTrial?: () => void;
}) {
  const days = validUntil ? daysLeft(validUntil) : 0;
  const trialUsed = !!validUntil; // if validUntil exists, they've had a trial before

  // ── PRO ACTIVE ──
  if (subStatus === "active") {
    return (
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ background: "rgba(46,125,50,0.05)", border: "1px solid rgba(46,125,50,0.15)" }}>
        <button onClick={onManage} className="w-full p-4 flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(46,125,50,0.1)" }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2E7D32" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>💜 JustLog Pro</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(46,125,50,0.12)", color: "#2E7D32" }}>ACTIVE</span>
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--md-on-surface-variant)" }}>
              {subPlan === "yearly" ? "Annual" : "Monthly"} · {validUntil ? `Renews ${fmt(validUntil)}` : "Full access"}
            </div>
          </div>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-on-surface-variant)", flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
        </button>
        {subPlan !== "yearly" && (
          <div className="px-4 pb-4">
            <button onClick={onManage} className="w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "var(--md-primary)", color: "#fff" }}>
              Switch to Annual · Save 37% ⭐
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── TRIAL ACTIVE ──
  if (subStatus === "trialing") {
    const pct = validUntil ? Math.min(1, Math.max(0, (validUntil.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))) : 0;
    return (
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(200,49,255,0.2)" }}>
        <button onClick={onManage} className="w-full p-4 text-left">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>⚡ Pro Trial</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(200,49,255,0.15)", color: "var(--md-primary)" }}>TRIAL</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: "var(--md-primary)" }}>{days}d left</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "rgba(200,49,255,0.15)" }}>
            <div className="h-full rounded-full" style={{ width: `${pct * 100}%`, background: "var(--md-primary)" }} />
          </div>
          <div className="text-xs mt-2" style={{ color: "var(--md-on-surface-variant)" }}>Trial ends {validUntil ? fmt(validUntil) : ""}</div>
        </button>
        <div className="px-4 pb-4">
          <button onClick={onManage} className="w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "var(--md-primary)", color: "#fff" }}>
            Upgrade to Pro · ₹79/month
          </button>
        </div>
      </div>
    );
  }

  // ── FREE (chose free plan) ──
  if (subStatus === "free") {
    return (
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--md-outline-variant)" }}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>🆓 Free Plan</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--md-surface-container-highest)", color: "var(--md-on-surface-variant)" }}>FREE</span>
          </div>
          <div className="text-xs mb-3" style={{ color: "var(--md-on-surface-variant)" }}>1 space · 30 days history · No AI search</div>
          <button onClick={onStartTrial} className="w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "var(--md-primary)", color: "#fff" }}>
            Try Pro free — 7 days
          </button>
        </div>
      </div>
    );
  }

  // ── NONE: trial expired OR new user ──
  if (trialUsed) {
    // Trial expired — show upgrade to paid
    return (
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.2)" }}>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>Free Plan</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(255,107,53,0.12)", color: "#FF6B35" }}>TRIAL ENDED</span>
          </div>
          <div className="text-xs mb-3" style={{ color: "var(--md-on-surface-variant)" }}>Your trial ended. Upgrade to keep full access.</div>
          <button onClick={onManage} className="w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "var(--md-primary)", color: "#fff" }}>
            Upgrade to Pro · ₹79/month
          </button>
        </div>
      </div>
    );
  }

  // New user — never trialed
  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ border: "1px solid var(--md-outline-variant)" }}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-sm font-semibold" style={{ color: "var(--md-on-surface)" }}>🆓 Free Plan</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "var(--md-surface-container-highest)", color: "var(--md-on-surface-variant)" }}>FREE</span>
        </div>
        <div className="text-xs mb-3" style={{ color: "var(--md-on-surface-variant)" }}>1 space · 30 days history · No AI search</div>
        <button onClick={onStartTrial} className="w-full py-2.5 rounded-xl text-xs font-semibold" style={{ background: "var(--md-primary)", color: "#fff" }}>
          Try Pro free — 7 days
        </button>
      </div>
    </div>
  );
}

function SpaceIcon({ icon, size = 18, color = "currentColor" }: { icon: string; size?: number; color?: string }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (icon) {
    case "briefcase": return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>;
    case "plane": return <svg {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>;
    case "heart": return <svg {...p}><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>;
    case "graduation": return <svg {...p}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>;
    default: return <svg {...p}><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
  }
}

interface SettingsViewProps {
  user: User | null;
  spaces: Space[];
  transactions: Transaction[];
  activeSpace: Space | null;
  onDeleteAll: () => void;
  onToast: (msg: string) => void;
  onRenameSpace: (id: string, name: string) => void;
  onDeleteSpace: (id: string, action?: "move" | "delete") => void;
  onDeleteSpaceData: (id: string) => void;
  onUpdateSpace?: (id: string, updates: Partial<Space>) => void;
  subStatus?: "active" | "trialing" | "none" | "loading" | "free";
  validUntil?: Date;
  subPlan?: string;
  onUpgrade?: () => void;
  onBack?: () => void;
  onShowSubPage?: () => void;
}

type Sheet = "none" | "profile" | "spaces" | "about" | "privacy" | "terms" | "rename";

export default function SettingsView({
  user, spaces, transactions, activeSpace,
  onDeleteAll, onToast, onRenameSpace, onDeleteSpace, onDeleteSpaceData, onUpdateSpace,
  subStatus = "active", validUntil, subPlan, onUpgrade, onBack, onShowSubPage,
}: SettingsViewProps) {
  const router = useRouter();
  const supabase = createClient();
  const name = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "You";
  const email = user?.email ?? "";
  const avatar = user?.user_metadata?.avatar_url as string | undefined;

  const isPro = subStatus === "active" || subStatus === "trialing";

  const [nameVal, setNameVal] = useState(name);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(avatar);
  const [saving, setSaving] = useState(false);
  const [sheet, setSheet] = useState<Sheet>("none");
  const [editNameDraft, setEditNameDraft] = useState(name);
  const [darkMode, setDarkMode] = useState(false);
  const [renameSheetTarget, setRenameSheetTarget] = useState<Space | null>(null);
  const [renamingInSheet, setRenamingInSheet] = useState(false);
  const [renameVal, setRenameVal] = useState("");
  const [spaceActionTarget, setSpaceActionTarget] = useState<Space | null>(null);
  const [confirmAction, setConfirmAction] = useState<null | "clear" | "delete" | "archive">(null);
  const [spaceIncludePersonal, setSpaceIncludePersonal] = useState(false);
  const [spacePeopleCount, setSpacePeopleCount] = useState(1);
  const [showPinPad, setShowPinPad] = useState(false);
  const [showExportSheet, setShowExportSheet] = useState(false);
  const [showReminderSheet, setShowReminderSheet] = useState(false);
  const [reminder, setReminder] = useState(loadReminderSettings);
  const [reminderHour, setReminderHour] = useState(loadReminderSettings().hour);
  const [reminderMinute, setReminderMinute] = useState(loadReminderSettings().minute);
  const [showDeleteLinkedSheet, setShowDeleteLinkedSheet] = useState(false);
  const [exportRange, setExportRange] = useState<"this-month" | "last-month" | "3-months" | "all">("this-month");
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = nameVal.charAt(0).toUpperCase();

  async function saveDisplayName() {
    if (!editNameDraft.trim()) return;
    setSaving(true);
    await supabase.auth.updateUser({ data: { full_name: editNameDraft.trim() } });
    setNameVal(editNameDraft.trim());
    setSaving(false);
    setSheet("none");
    onToast("Name updated");
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setSaving(true);
    const ext = file.name.split(".").pop();
    const path = `avatars/${user.id}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = data.publicUrl + "?t=" + Date.now();
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      setAvatarUrl(url);
      onToast("Photo updated");
    } else {
      onToast("Upload failed — check Supabase storage bucket");
    }
    setSaving(false);
  }

  function getFilteredTransactions() {
    const now = new Date();
    const start = new Date();
    if (exportRange === "this-month") { start.setDate(1); start.setHours(0,0,0,0); }
    else if (exportRange === "last-month") { start.setMonth(now.getMonth() - 1, 1); start.setHours(0,0,0,0); now.setDate(0); }
    else if (exportRange === "3-months") { start.setMonth(now.getMonth() - 3, 1); start.setHours(0,0,0,0); }
    else return transactions;
    return transactions.filter(tx => new Date(tx.created_at) >= start && new Date(tx.created_at) <= now);
  }

  function getSplitSummary(txs: typeof transactions) {
    if (!activeSpace || activeSpace.people_count <= 1) return null;
    const totalExpense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const perHead = Math.round(totalExpense / activeSpace.people_count);
    const map: Record<string, number> = {};
    txs.filter(t => t.type === "income").forEach(t => {
      const m = t.description.match(/(?:from|by)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
      const n = m ? m[1].trim().toLowerCase() : null;
      if (n) map[n] = (map[n] || 0) + t.amount;
    });
    const payers = Object.entries(map).map(([key, paid]) => ({
      name: key.replace(/\b\w/g, c => c.toUpperCase()),
      paid,
      owes: perHead - paid,
    }));
    const unnamedCount = Math.max(0, activeSpace.people_count - payers.length);
    return { perHead, payers, unnamedCount, totalExpense };
  }

  function handleExportCSV() {
    const txs = getFilteredTransactions();
    if (!txs.length) { onToast("No transactions in this period"); return; }
    const header = "Date,Type,Category,Description,Amount";
    const rows = txs.map((tx) => {
      const d = new Date(tx.created_at).toLocaleDateString("en-IN");
      return `${d},${tx.type},${tx.category},"${tx.description}",${tx.amount}`;
    });
    const split = getSplitSummary(txs);
    const splitRows: string[] = [];
    if (split) {
      splitRows.push("");
      splitRows.push("--- Split Summary ---,,,,");
      splitRows.push(`People,${activeSpace!.people_count},,Per head,${split.perHead}`);
      split.payers.forEach(p => {
        const label = p.owes <= 0 ? `gets back ${Math.abs(p.owes)}` : `owes ${p.owes}`;
        splitRows.push(`${p.name} (paid ${p.paid}),,,${label},`);
      });
      if (split.unnamedCount > 0) {
        splitRows.push(`${split.unnamedCount} ${split.unnamedCount === 1 ? "person" : "people"},,,owes ${split.perHead} each,`);
      }
    }
    const csv = [header, ...rows, ...splitRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `justlog-${activeSpace?.name ?? "export"}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportSheet(false);
    onToast("CSV exported");
  }

  function handleExportPDF() {
    const txs = getFilteredTransactions();
    if (!txs.length) { onToast("No transactions in this period"); return; }
    const spaceName = activeSpace?.name ?? "Personal";
    const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

    // Group by month
    const grouped: Record<string, typeof txs> = {};
    txs.forEach((tx) => {
      const key = new Date(tx.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(tx);
    });

    const totalIncome = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const split = getSplitSummary(txs);
    const splitSection = split ? (() => {
      const payerRows = split.payers.map(p => {
        const settled = p.owes <= 0;
        const label = settled ? `gets back ₹${Math.abs(p.owes).toLocaleString("en-IN")}` : `owes ₹${p.owes.toLocaleString("en-IN")}`;
        const color = settled ? "#16a34a" : "#dc2626";
        return `<tr>
          <td style="font-weight:500">${p.name}</td>
          <td style="color:#666">Paid ₹${p.paid.toLocaleString("en-IN")}</td>
          <td style="text-align:right;font-weight:600;color:${color}">${label}</td>
        </tr>`;
      }).join("");
      const unnamedRow = split.unnamedCount > 0 ? `<tr>
        <td style="color:#666">${split.unnamedCount} ${split.unnamedCount === 1 ? "person" : "people"}</td>
        <td style="color:#666">Not tracked</td>
        <td style="text-align:right;font-weight:600;color:#dc2626">owes ₹${split.perHead.toLocaleString("en-IN")} each</td>
      </tr>` : "";
      return `<div class="split-block">
        <div class="split-header">
          <span>Split Summary</span>
          <span style="font-size:12px;color:#666">${activeSpace!.people_count} people · ₹${split.perHead.toLocaleString("en-IN")} per head</span>
        </div>
        <table><thead><tr><th>Person</th><th>Contributed</th><th style="text-align:right">Settlement</th></tr></thead>
        <tbody>${payerRows}${unnamedRow}</tbody></table>
      </div>`;
    })() : "";

    const monthSections = Object.entries(grouped).map(([month, txs]) => {
      const mIncome = txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
      const mExpense = txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
      const rows = txs.map(tx => `
        <tr>
          <td>${new Date(tx.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</td>
          <td>${tx.description}</td>
          <td>${tx.category}</td>
          <td style="color:${tx.type === "income" ? "#16a34a" : "#dc2626"};text-align:right;font-weight:600">
            ${tx.type === "income" ? "+" : "−"}₹${tx.amount.toLocaleString("en-IN")}
          </td>
        </tr>`).join("");
      return `
        <div class="month-block">
          <div class="month-header">
            <span>${month}</span>
            <span style="font-size:12px;color:#666">Income ₹${mIncome.toLocaleString("en-IN")} &nbsp;|&nbsp; Expense ₹${mExpense.toLocaleString("en-IN")}</span>
          </div>
          <table><thead><tr><th>Date</th><th>Description</th><th>Category</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>${rows}</tbody></table>
        </div>`;
    }).join("");

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>JustLog — ${spaceName}</title>
      <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: -apple-system, sans-serif; font-size:13px; color:#1a1a1a; padding:32px; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; padding-bottom:16px; border-bottom:2px solid #7c3aed; }
        .logo { font-size:22px; font-weight:700; color:#7c3aed; }
        .meta { text-align:right; font-size:12px; color:#666; }
        .summary { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; margin-bottom:24px; }
        .summary-card { padding:12px 16px; border-radius:10px; background:#f5f3ff; }
        .summary-card .label { font-size:11px; color:#7c3aed; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
        .summary-card .value { font-size:18px; font-weight:700; }
        .month-block { margin-bottom:20px; }
        .month-header { display:flex; justify-content:space-between; align-items:center; padding:8px 0; margin-bottom:6px; border-bottom:1px solid #e5e7eb; font-weight:600; font-size:13px; }
        table { width:100%; border-collapse:collapse; }
        th { text-align:left; font-size:11px; font-weight:600; color:#666; text-transform:uppercase; letter-spacing:0.4px; padding:6px 8px; border-bottom:1px solid #e5e7eb; }
        td { padding:7px 8px; border-bottom:1px solid #f3f4f6; font-size:12px; }
        tr:last-child td { border-bottom:none; }
        .footer { margin-top:24px; padding-top:12px; border-top:1px solid #e5e7eb; font-size:11px; color:#999; text-align:center; }
        .split-block { margin-bottom:20px; background:#f5f3ff; border-radius:10px; padding:12px 16px; }
        .split-header { display:flex; justify-content:space-between; align-items:center; padding:4px 0 10px; font-weight:600; font-size:13px; color:#7c3aed; border-bottom:1px solid #e5e7eb; margin-bottom:8px; }
        @media print { body { padding:16px; } }
      </style></head><body>
      <div class="header">
        <div><div class="logo">JustLog</div><div style="font-size:12px;color:#666;margin-top:2px">${spaceName} space</div></div>
        <div class="meta">Generated on ${dateStr}<br>${txs.length} transactions</div>
      </div>
      <div class="summary">
        <div class="summary-card"><div class="label">Total Income</div><div class="value" style="color:#16a34a">₹${totalIncome.toLocaleString("en-IN")}</div></div>
        <div class="summary-card"><div class="label">Total Expense</div><div class="value" style="color:#dc2626">₹${totalExpense.toLocaleString("en-IN")}</div></div>
        <div class="summary-card"><div class="label">Balance</div><div class="value" style="color:${balance >= 0 ? "#16a34a" : "#dc2626"}">${balance < 0 ? "−" : ""}₹${Math.abs(balance).toLocaleString("en-IN")}</div></div>
      </div>
      ${splitSection}
      ${monthSections}
      <div class="footer">Exported from JustLog · justlog.app</div>
    </body></html>`;

    const win = window.open("", "_blank");
    if (!win) { onToast("Allow popups to export PDF"); return; }
    win.document.write(html);
    win.document.close();
    setTimeout(() => { win.print(); }, 400);
    setShowExportSheet(false);
  }

  async function toggleReminder() {
    if (reminder.enabled) {
      await cancelReminder();
      const next = { ...reminder, enabled: false };
      setReminder(next);
      saveReminderSettings(next);
      onToast("Reminder off");
    } else {
      const granted = await requestNotificationPermission();
      if (!granted) { onToast("Allow notifications in device settings"); return; }
      await scheduleReminder(reminderHour, reminderMinute);
      const next = { enabled: true, hour: reminderHour, minute: reminderMinute };
      setReminder(next);
      saveReminderSettings(next);
      onToast("Daily reminder set");
    }
  }

  async function saveReminderTime() {
    if (reminder.enabled) {
      await scheduleReminder(reminderHour, reminderMinute);
    }
    const next = { enabled: reminder.enabled, hour: reminderHour, minute: reminderMinute };
    setReminder(next);
    saveReminderSettings(next);
    setShowReminderSheet(false);
    if (reminder.enabled) onToast("Reminder updated");
  }

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle("dark", next);
    onToast(next ? "Dark mode on" : "Dark mode off");
  }

  async function handleManageBilling() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else onToast("Stripe not configured yet");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function confirmDeleteSpace(space: Space) {
    if (spaces.length <= 1) { onToast("Can't delete your only space"); return; }
    if (space.include_in_personal) {
      setShowDeleteLinkedSheet(true);
    } else {
      setConfirmAction("delete");
    }
  }

  return (
    <>
    <div className="flex-1 flex flex-col" style={{ background: "var(--md-surface)", overflow: "hidden" }}>
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 flex-shrink-0"
        style={{
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 12px)",
          paddingBottom: "12px",
          background: "var(--md-surface)",
        }}
      >
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full active:opacity-70"
          style={{ color: "var(--md-on-surface)" }}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
        </button>
        <span className="text-[17px] font-semibold tracking-tight" style={{ color: "var(--md-on-surface)" }}>Settings</span>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pt-4" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)" }}>

      {/* Profile card */}
      <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ background: "var(--md-surface-container-low)" }}>
        <button onClick={() => { setEditNameDraft(nameVal); setSheet("profile"); }} className="w-full p-4 flex items-center gap-4 text-left">
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={nameVal} className="w-14 h-14 rounded-full object-cover" />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold" style={{ background: "var(--md-outline-variant)", color: "var(--md-on-surface)" }}>
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate" style={{ color: "var(--md-on-surface)" }}>{nameVal}</div>
            <div className="text-xs mt-0.5 truncate" style={{ color: "var(--md-on-surface-variant)" }}>{email}</div>
          </div>
          <Chevron />
        </button>
      </div>

      {/* Subscription card */}
      <SubscriptionCard
        subStatus={subStatus}
        validUntil={validUntil}
        subPlan={subPlan}
        onManage={() => onShowSubPage?.()}
        onStartTrial={() => onUpgrade?.()}
      />

      {/* Group 1 — data */}
      <SettingsGroup>
        <SettingsItem icon={<IconExport />} label="Export Data" sublabel={isPro ? `${transactions.length} transactions` : "Pro only"} onClick={() => { if (!isPro) { onUpgrade?.(); return; } if (!transactions.length) { onToast("No transactions to export"); return; } setShowExportSheet(true); }} />
        <SettingsItem icon={<IconFolders />} label="Manage Spaces" sublabel={`${spaces.length} space${spaces.length !== 1 ? "s" : ""}`} onClick={() => setSheet("spaces")} last />
      </SettingsGroup>

      {/* Group 2 — preferences */}
      <SettingsGroup>
        <SettingsItem icon={<IconMoon />} label="Dark Mode" onClick={toggleDarkMode} rightSlot={<Toggle on={darkMode} />} />
        <SettingsItem icon={<IconBell />} label="Daily Reminder" sublabel={reminder.enabled ? `${String(reminder.hour).padStart(2,"0")}:${String(reminder.minute).padStart(2,"0")} every day` : "Off"} onClick={() => setShowReminderSheet(true)} rightSlot={<Toggle on={reminder.enabled} />} last />
      </SettingsGroup>

      {/* Group 3 — legal + info */}
      <SettingsGroup>
        <SettingsItem icon={<IconShield />} label="Privacy Policy" onClick={() => setSheet("privacy")} />
        <SettingsItem icon={<IconScroll />} label="Terms of Service" onClick={() => setSheet("terms")} />
        <SettingsItem icon={<IconInfo />} label="About JustLog" onClick={() => setSheet("about")} last />
      </SettingsGroup>

      {/* Sign out */}
      <SettingsGroup>
        <SettingsItem icon={<IconLogOut />} label="Sign Out" danger onClick={handleSignOut} last />
      </SettingsGroup>

      <div className="text-center py-5 text-xs" style={{ color: "var(--md-outline)" }}>JustLog V1.0 · Just type.</div>

      {/* ── Sheets ── */}

      {/* Edit profile sheet */}
      <Sheet open={sheet === "profile"} onClose={() => setSheet("none")}>
        <div className="text-base font-semibold mb-5" style={{ color: "var(--md-on-surface)" }}>Edit Profile</div>
        <div className="flex flex-col items-center gap-3 mb-5">
          {avatarUrl ? (
            <img src={avatarUrl} alt={nameVal} className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold" style={{ background: "var(--md-outline-variant)", color: "var(--md-on-surface)" }}>
              {nameVal.charAt(0).toUpperCase()}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} className="text-sm font-medium px-4 py-1.5 rounded-full" style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)" }}>
            Change Photo
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div className="mb-4">
          <div className="text-xs font-medium mb-2" style={{ color: "var(--md-on-surface-variant)" }}>Display Name</div>
          <input
            autoFocus
            value={editNameDraft}
            onChange={(e) => setEditNameDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveDisplayName()}
            className="w-full px-4 py-3 rounded-2xl text-sm outline-none border-none"
            style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)" }}
            placeholder="Your name"
          />
        </div>
        <button onClick={saveDisplayName} disabled={saving} className="w-full py-3.5 rounded-2xl text-sm font-semibold" style={{ background: "var(--md-on-surface)", color: "#fff", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </Sheet>

      {/* Spaces sheet — single sheet, panel switches between list / action / rename */}
      <Sheet open={sheet === "spaces"} onClose={() => { setSheet("none"); setSpaceActionTarget(null); setRenamingInSheet(false); setConfirmAction(null); }}>
        {/* Panel: space list */}
        {!spaceActionTarget && (
          <>
            <div className="text-base font-semibold mb-4" style={{ color: "var(--md-on-surface)" }}>Manage Spaces</div>
            <div className="flex flex-col gap-2 overflow-y-auto no-scrollbar" style={{ maxHeight: "55vh" }}>
              {spaces.filter(sp => !sp.archived).map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => { setSpaceActionTarget(sp); setSpaceIncludePersonal(sp.include_in_personal); setSpacePeopleCount(sp.people_count ?? 1); setRenamingInSheet(false); }}
                  className="rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left w-full"
                  style={{ background: "var(--md-surface-container-low)" }}
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sp.id === activeSpace?.id ? "var(--md-primary)" : "var(--md-surface-container)" }}>
                    <SpaceIcon icon={sp.icon} size={16} color={sp.id === activeSpace?.id ? "#fff" : "var(--md-on-surface-variant)"} />
                  </div>
                  <span className="flex-1 text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>{sp.name}</span>
                  <div className="flex items-center gap-1.5">
                    {sp.include_in_personal && (
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--md-on-surface-variant)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    )}
                    {sp.people_count > 1 && (
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--md-on-surface-variant)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                    )}
                    {sp.pin_hash && (
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="var(--md-on-surface-variant)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    )}
                    {sp.id === activeSpace?.id && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#E8F5E9", color: "#2E7D32" }}>Active</span>
                    )}
                  </div>
                  <Chevron />
                </button>
              ))}
              {/* Archived spaces */}
              {spaces.some(sp => sp.archived) && (
                <>
                  <div className="text-xs font-medium mt-3 mb-1 px-1" style={{ color: "var(--md-on-surface-variant)" }}>Archived</div>
                  {spaces.filter(sp => sp.archived).map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => { setSpaceActionTarget(sp); setSpaceIncludePersonal(sp.include_in_personal); setSpacePeopleCount(sp.people_count ?? 1); setRenamingInSheet(false); }}
                      className="rounded-2xl px-4 py-3.5 flex items-center gap-3 text-left w-full opacity-50"
                      style={{ background: "var(--md-surface-container-low)" }}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--md-surface-container)" }}>
                        <SpaceIcon icon={sp.icon} size={16} color="var(--md-on-surface-variant)" />
                      </div>
                      <span className="flex-1 text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>{sp.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface-variant)" }}>Archived</span>
                      <Chevron />
                    </button>
                  ))}
                </>
              )}
            </div>
          </>
        )}

        {/* Panel: space actions / rename — shown when a space is selected */}
        {spaceActionTarget && (
          <>
            {/* Back to list */}
            <button onClick={() => { setSpaceActionTarget(null); setRenamingInSheet(false); setConfirmAction(null); }} className="flex items-center gap-1.5 mb-4" style={{ color: "var(--md-on-surface-variant)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              <span className="text-sm">Spaces</span>
            </button>

            {renamingInSheet ? (
              /* Rename form */
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--md-primary)" }}>
                    <SpaceIcon icon={spaceActionTarget.icon} size={17} color="#fff" />
                  </div>
                  <span className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>Rename</span>
                </div>
                <input
                  autoFocus
                  value={renameVal}
                  onChange={(e) => setRenameVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && renameVal.trim()) { onRenameSpace(spaceActionTarget.id, renameVal.trim()); setSheet("none"); setSpaceActionTarget(null); setRenamingInSheet(false); onToast("Space renamed"); } }}
                  maxLength={30}
                  className="w-full px-4 py-3.5 rounded-2xl text-sm outline-none"
                  style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)", border: "none" }}
                  placeholder="Space name"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { if (renameVal.trim()) { onRenameSpace(spaceActionTarget.id, renameVal.trim()); setSheet("none"); setSpaceActionTarget(null); setRenamingInSheet(false); onToast("Space renamed"); } }}
                    disabled={!renameVal.trim()}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
                    style={{ background: renameVal.trim() ? "var(--md-on-surface)" : "var(--md-surface-container)", color: renameVal.trim() ? "#fff" : "var(--md-outline)" }}
                  >Save</button>
                  <button onClick={() => setRenamingInSheet(false)} className="px-6 py-3.5 rounded-2xl text-sm font-medium" style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)" }}>Cancel</button>
                </div>
              </div>
            ) : (
              /* Action list */
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--md-primary)" }}>
                    <SpaceIcon icon={spaceActionTarget.icon} size={20} color="#fff" />
                  </div>
                  <div>
                    <div className="text-base font-semibold" style={{ color: "var(--md-on-surface)" }}>{spaceActionTarget.name}</div>
                    <div className="text-xs" style={{ color: "var(--md-on-surface-variant)" }}>{spaceActionTarget.id === activeSpace?.id ? "Active space" : "Space"}</div>
                  </div>
                </div>
                <div className="flex flex-col">
                  {spaceActionTarget.name !== "Personal" && (
                    <ListRow icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>} label="Rename" onClick={() => { setRenameVal(spaceActionTarget.name); setRenamingInSheet(true); }} />
                  )}
                  {spaceActionTarget.name !== "Personal" && (
                    <ListRow icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>} label="+ Personal" sublabel="Show entries in Personal space too" right={<Toggle on={spaceIncludePersonal} />}
                      onClick={() => { const next = !spaceIncludePersonal; setSpaceIncludePersonal(next); onUpdateSpace?.(spaceActionTarget.id, { include_in_personal: next }); onToast(next ? "Linked to Personal" : "Unlinked from Personal"); }}
                    />
                  )}
                  {spaceActionTarget.name !== "Personal" && (
                    <>
                      <ListRow icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>} label="Split expense" sublabel="Show per-head amount on home" right={<Toggle on={spacePeopleCount > 1} />}
                        onClick={() => { const next = spacePeopleCount > 1 ? 1 : 2; setSpacePeopleCount(next); onUpdateSpace?.(spaceActionTarget.id, { people_count: next }); onToast(next > 1 ? `Split for ${next} people` : "Split removed"); }}
                      />
                      {spacePeopleCount > 1 && (
                        <div className="flex items-center gap-4 px-4 py-3">
                          <span className="text-xs flex-1" style={{ color: "var(--md-on-surface-variant)" }}>People</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => { const n = Math.max(2, spacePeopleCount - 1); setSpacePeopleCount(n); onUpdateSpace?.(spaceActionTarget.id, { people_count: n }); }} className="w-7 h-7 rounded-full flex items-center justify-center text-base font-semibold" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface)" }}>−</button>
                            <span className="text-sm font-semibold w-5 text-center" style={{ color: "var(--md-on-surface)" }}>{spacePeopleCount}</span>
                            <button onClick={() => { const n = Math.min(20, spacePeopleCount + 1); setSpacePeopleCount(n); onUpdateSpace?.(spaceActionTarget.id, { people_count: n }); }} className="w-7 h-7 rounded-full flex items-center justify-center text-base font-semibold" style={{ background: "var(--md-surface-container)", color: "var(--md-on-surface)" }}>+</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {/* PIN management — Pro only */}
                  {spaceActionTarget.name !== "Personal" && (
                    spaceActionTarget.pin_hash ? (
                      <>
                        <ListRow
                          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
                          label="Change PIN"
                          sublabel="Set a new 4-digit PIN"
                          onClick={() => isPro ? setShowPinPad(true) : onUpgrade?.()}
                        />
                        <ListRow
                          icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
                          label="Remove PIN"
                          sublabel="Anyone can open this space"
                          danger
                          onClick={() => { onUpdateSpace?.(spaceActionTarget!.id, { pin_hash: null }); onToast("PIN removed"); }}
                        />
                      </>
                    ) : (
                      <ListRow
                        icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>}
                        label="Add PIN Lock"
                        sublabel={isPro ? "Require PIN to open this space" : "Pro only"}
                        onClick={() => isPro ? setShowPinPad(true) : onUpgrade?.()}
                      />
                    )
                  )}

                  {spaceActionTarget.name !== "Personal" && (
                    spaceActionTarget.archived ? (
                      <ListRow
                        icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>}
                        label="Unarchive Space"
                        sublabel="Restore to active spaces"
                        onClick={() => { onUpdateSpace?.(spaceActionTarget.id, { archived: false }); setSheet("none"); setSpaceActionTarget(null); onToast(`"${spaceActionTarget.name}" restored`); }}
                      />
                    ) : confirmAction === "archive" ? (
                      <ListRow icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>} label="Archive Space" sublabel="Hide from list, data stays safe" onClick={() => setConfirmAction("archive")} />
                    ) : (
                      <ListRow
                        icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8"/><path d="M1 3h22v5H1z"/><path d="M10 12h4"/></svg>}
                        label="Archive Space"
                        sublabel="Hide from list, data stays safe"
                        onClick={() => setConfirmAction("archive")}
                      />
                    )
                  )}
                  <ListRow icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>} label="Clear All Transactions" sublabel="Removes all entries, keeps the space" onClick={() => setConfirmAction("clear")} />
                  {spaces.length > 1 && spaceActionTarget.name !== "Personal" && (
                    <ListRow icon={<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>} label="Delete Space" danger onClick={() => confirmDeleteSpace(spaceActionTarget)} />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </Sheet>


      {/* About sheet */}
      <Sheet open={sheet === "about"} onClose={() => setSheet("none")}>
        <div className="flex flex-col items-center gap-4 py-2">
          <img src="/logo.svg" alt="JustLog" className="h-10" />
          <div className="text-center">
            <div className="text-sm font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>JustLog V1.0</div>
            <div className="text-xs leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
              The simplest way to track your money.<br />Just type, we do the rest.
            </div>
          </div>
          <div className="w-full rounded-2xl overflow-hidden" style={{ background: "var(--md-surface-container-low)" }}>
            <AboutRow label="Version" value="1.0.0" />
            <AboutRow label="Plan" value={subStatus === "trialing" ? "Free Trial" : subStatus === "active" ? "Pro" : "Free"} />
            <AboutRow label="Transactions" value={String(transactions.length)} last />
          </div>
        </div>
      </Sheet>

      {/* Privacy sheet */}
      <Sheet open={sheet === "privacy"} onClose={() => setSheet("none")}>
        <div className="flex flex-col gap-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(200,49,255,0.08)" }}>
            <IconShield />
          </div>
          <div>
            <div className="text-base font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Data Privacy</div>
            <div className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
              JustLog believes in transparent data practices. Your financial journal is private and only visible to you — we never sell or share your data.
            </div>
          </div>
          <div className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
            Keeping your data safe is our priority. All entries are encrypted in transit and at rest. Visit our full Privacy Policy for complete details on how your information is protected.
          </div>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener"
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-center block"
            style={{ background: "var(--md-primary)", color: "#fff" }}
          >
            Read Privacy Policy
          </a>
        </div>
      </Sheet>

      {/* Terms sheet */}
      <Sheet open={sheet === "terms"} onClose={() => setSheet("none")}>
        <div className="flex flex-col gap-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(200,49,255,0.08)" }}>
            <IconScroll />
          </div>
          <div>
            <div className="text-base font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Terms of Service</div>
            <div className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
              You own all the data you enter into JustLog. We just help you log it. JustLog is a personal journal — not a bank, financial advisor, or investment platform.
            </div>
          </div>
          <div className="text-sm leading-relaxed" style={{ color: "var(--md-on-surface-variant)" }}>
            By using JustLog you agree to our terms, including acceptable use and our AI processing policy. Read the full Terms of Service for details.
          </div>
          <a
            href="/terms"
            target="_blank"
            rel="noopener"
            className="w-full py-3.5 rounded-2xl text-sm font-semibold text-center block"
            style={{ background: "var(--md-primary)", color: "#fff" }}
          >
            Read Terms of Service
          </a>
        </div>
      </Sheet>

    </div>
    </div>

    {showDeleteLinkedSheet && spaceActionTarget && (
      <>
        <div className="fixed inset-0 z-[800]" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowDeleteLinkedSheet(false)} />
        <div className="fixed bottom-0 left-0 right-0 z-[900] max-w-[430px] mx-auto rounded-t-[28px] p-6 flex flex-col gap-4" style={{ background: "var(--md-surface)", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 24px)" }}>
          <div className="w-9 h-1 rounded-full mx-auto mb-2" style={{ background: "var(--md-outline-variant)" }} />

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(220,38,38,0.1)" }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--md-error)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>
            </div>
            <div>
              <div className="text-[15px] font-semibold" style={{ color: "var(--md-on-surface)" }}>Delete "{spaceActionTarget.name}"?</div>
              <div className="text-[12px]" style={{ color: "var(--md-on-surface-variant)" }}>This space is linked to Personal. What happens to its entries?</div>
            </div>
          </div>

          {/* Keep in Personal */}
          <button
            onClick={() => { onDeleteSpace(spaceActionTarget.id, "move"); setShowDeleteLinkedSheet(false); setSpaceActionTarget(null); onToast(`"${spaceActionTarget.name}" deleted · Entries kept in Personal`); }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-[16px] text-left active:opacity-80"
            style={{ background: "var(--md-primary)", color: "#fff" }}
          >
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold">Keep in Personal</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>Recommended</span>
              </div>
              <div className="text-[12px] opacity-80">Entries stay in Personal history permanently</div>
            </div>
          </button>

          {/* Delete everything */}
          <button
            onClick={() => { onDeleteSpace(spaceActionTarget.id, "delete"); setShowDeleteLinkedSheet(false); setSpaceActionTarget(null); onToast(`"${spaceActionTarget.name}" deleted`); }}
            className="w-full flex items-center gap-4 px-4 py-4 rounded-[16px] text-left active:opacity-80"
            style={{ background: "var(--md-surface-container-low)", border: "1.5px solid var(--md-outline-variant)" }}
          >
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: "var(--md-surface-container)" }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--md-error)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </div>
            <div>
              <div className="text-[15px] font-semibold" style={{ color: "var(--md-on-surface)" }}>Delete everywhere</div>
              <div className="text-[12px]" style={{ color: "var(--md-on-surface-variant)" }}>Remove entries from Personal and this space</div>
            </div>
          </button>

          <button onClick={() => setShowDeleteLinkedSheet(false)} className="text-[13px] text-center py-1" style={{ color: "var(--md-on-surface-variant)" }}>Cancel</button>
        </div>
      </>
    )}
    {showReminderSheet && (
      <>
        <div className="fixed inset-0 z-[800]" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowReminderSheet(false)} />
        <div className="fixed bottom-0 left-0 right-0 z-[900] max-w-[430px] mx-auto rounded-t-[28px] p-6 flex flex-col gap-5" style={{ background: "var(--md-surface)", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 24px)" }}>
          <div className="w-9 h-1 rounded-full mx-auto mb-1" style={{ background: "var(--md-outline-variant)" }} />
          <div>
            <div className="text-[17px] font-semibold mb-1" style={{ color: "var(--md-on-surface)" }}>Daily Reminder</div>
            <div className="text-sm" style={{ color: "var(--md-on-surface-variant)" }}>Get a nudge to log your expenses every day</div>
          </div>

          {/* Time picker */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-xs font-medium mb-1.5" style={{ color: "var(--md-on-surface-variant)" }}>Hour</div>
              <select
                value={reminderHour}
                onChange={e => setReminderHour(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)", border: "none" }}
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
                ))}
              </select>
            </div>
            <div className="text-2xl font-bold mt-4" style={{ color: "var(--md-on-surface-variant)" }}>:</div>
            <div className="flex-1">
              <div className="text-xs font-medium mb-1.5" style={{ color: "var(--md-on-surface-variant)" }}>Minute</div>
              <select
                value={reminderMinute}
                onChange={e => setReminderMinute(Number(e.target.value))}
                className="w-full px-4 py-3 rounded-2xl text-sm outline-none"
                style={{ background: "var(--md-surface-container-low)", color: "var(--md-on-surface)", border: "none" }}
              >
                {[0, 15, 30, 45].map(m => (
                  <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={toggleReminder}
              className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
              style={{ background: reminder.enabled ? "var(--md-error)" : "var(--md-surface-container-low)", color: reminder.enabled ? "#fff" : "var(--md-on-surface)" }}
            >
              {reminder.enabled ? "Turn Off" : "Turn On"}
            </button>
            {reminder.enabled && (
              <button
                onClick={saveReminderTime}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
                style={{ background: "var(--md-on-surface)", color: "#fff" }}
              >
                Save Time
              </button>
            )}
            {!reminder.enabled && (
              <button
                onClick={async () => { await toggleReminder(); setShowReminderSheet(false); }}
                className="flex-1 py-3.5 rounded-2xl text-sm font-semibold"
                style={{ background: "var(--md-on-surface)", color: "#fff" }}
              >
                Enable
              </button>
            )}
          </div>
        </div>
      </>
    )}

    {showExportSheet && (
      <>
        <div className="fixed inset-0 z-[800]" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowExportSheet(false)} />
        <div className="fixed bottom-0 left-0 right-0 z-[900] max-w-[430px] mx-auto rounded-t-[28px] p-6 flex flex-col gap-4" style={{ background: "var(--md-surface)", paddingBottom: "calc(env(safe-area-inset-bottom,0px) + 24px)" }}>
          <div className="w-9 h-1 rounded-full mx-auto mb-2" style={{ background: "var(--md-outline-variant)" }} />
          <div className="text-[17px] font-semibold" style={{ color: "var(--md-on-surface)" }}>Export Data</div>
          <div className="text-[13px]" style={{ color: "var(--md-on-surface-variant)" }}>{activeSpace?.name}</div>

          {/* Range selector */}
          <div className="flex gap-2 flex-wrap">
            {(["this-month", "last-month", "3-months", "all"] as const).map((r) => {
              const labels = { "this-month": "This month", "last-month": "Last month", "3-months": "Last 3 months", "all": "All time" };
              const active = exportRange === r;
              return (
                <button key={r} onClick={() => setExportRange(r)}
                  className="px-3 py-1.5 rounded-full text-[12px] font-medium"
                  style={{ background: active ? "var(--md-primary)" : "var(--md-surface-container)", color: active ? "#fff" : "var(--md-on-surface-variant)" }}>
                  {labels[r]}
                </button>
              );
            })}
          </div>

          {/* PDF */}
          <button onClick={handleExportPDF} className="w-full flex items-center gap-4 px-4 py-4 rounded-[16px] text-left active:opacity-80" style={{ background: "var(--md-primary)", color: "#fff" }}>
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.15)" }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            </div>
            <div>
              <div className="text-[15px] font-semibold">Download PDF</div>
              <div className="text-[12px] opacity-80">Beautiful summary, easy to read</div>
            </div>
          </button>

          {/* CSV */}
          <button onClick={handleExportCSV} className="w-full flex items-center gap-4 px-4 py-4 rounded-[16px] text-left active:opacity-80" style={{ background: "var(--md-surface-container-low)", border: "1.5px solid var(--md-outline-variant)" }}>
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0" style={{ background: "var(--md-surface-container)" }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--md-on-surface-variant)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div>
              <div className="text-[15px] font-semibold" style={{ color: "var(--md-on-surface)" }}>Export CSV</div>
              <div className="text-[12px]" style={{ color: "var(--md-on-surface-variant)" }}>For Excel or accounting software</div>
            </div>
          </button>
        </div>
      </>
    )}
    {showPinPad && spaceActionTarget && (
      <PinPad
        mode="set"
        spaceName={spaceActionTarget.name}
        onConfirm={(pinHash) => {
          onUpdateSpace?.(spaceActionTarget.id, { pin_hash: pinHash });
          setShowPinPad(false);
          onToast("PIN saved");
        }}
        onClose={() => setShowPinPad(false)}
      />
    )}

    {/* Global confirm sheets */}
    <ConfirmSheet
      open={confirmAction === "archive" && !!spaceActionTarget}
      title={`Archive "${spaceActionTarget?.name}"?`}
      message="It will be hidden from your space list. All data stays safe and can be restored anytime."
      confirmLabel="Archive"
      onConfirm={() => { onUpdateSpace?.(spaceActionTarget!.id, { archived: true }); setConfirmAction(null); setSheet("none"); setSpaceActionTarget(null); onToast(`"${spaceActionTarget?.name}" archived`); }}
      onCancel={() => setConfirmAction(null)}
    />
    <ConfirmSheet
      open={confirmAction === "clear" && !!spaceActionTarget}
      title={`Clear "${spaceActionTarget?.name}"?`}
      message="All transactions will be removed. The space itself will remain."
      confirmLabel="Clear All"
      danger
      onConfirm={() => { onDeleteSpaceData(spaceActionTarget!.id); setConfirmAction(null); setSpaceActionTarget(null); onToast(`"${spaceActionTarget?.name}" cleared`); }}
      onCancel={() => setConfirmAction(null)}
    />
    <ConfirmSheet
      open={confirmAction === "delete" && !!spaceActionTarget}
      title={`Delete "${spaceActionTarget?.name}"?`}
      message="This space and all its transactions will be permanently deleted."
      confirmLabel="Delete Space"
      danger
      onConfirm={() => { onDeleteSpace(spaceActionTarget!.id); setConfirmAction(null); setSpaceActionTarget(null); onToast(`"${spaceActionTarget?.name}" deleted`); }}
      onCancel={() => setConfirmAction(null)}
    />
    </>
  );
}

function ConfirmBox({ message, confirmLabel, danger, onConfirm, onCancel }: { message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="rounded-2xl p-4 mb-2" style={{ background: danger ? "#FFF5F5" : "var(--md-surface-container-low)" }}>
      <p className="text-sm mb-4 leading-relaxed" style={{ color: "var(--md-on-surface)" }}>{message}</p>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-3 rounded-xl text-sm font-medium" style={{ background: "var(--md-surface-container-highest)", color: "var(--md-on-surface)" }}>
          Cancel
        </button>
        <button onClick={onConfirm} className="flex-1 py-3 rounded-xl text-sm font-semibold" style={{ background: danger ? "var(--md-error)" : "var(--md-on-surface)", color: "#fff" }}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}

function ListRow({ icon, label, sublabel, danger, onClick, right }: { icon: React.ReactNode; label: string; sublabel?: string; danger?: boolean; onClick: () => void; right?: React.ReactNode }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left" style={{}}>
      <span className="flex-shrink-0 flex items-center justify-center" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface-variant)" }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface)" }}>{label}</div>
        {sublabel && <div className="text-xs mt-0.5" style={{ color: "var(--md-outline)" }}>{sublabel}</div>}
      </div>
      {right}
    </button>
  );
}

function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <div className="rounded-t-3xl p-6 pb-10 flex flex-col" style={{ background: "#fff", maxHeight: "80dvh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-4 flex-shrink-0" style={{ background: "var(--md-outline-variant)" }} />
        {children}
      </div>
    </div>
  );
}

function AboutRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: last ? "none" : "1px solid var(--md-outline-variant)" }}>
      <span className="text-sm" style={{ color: "var(--md-on-surface-variant)" }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: "var(--md-on-surface)" }}>{value}</span>
    </div>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-4 mb-3 rounded-2xl overflow-hidden" style={{ background: "var(--md-surface-container-low)" }}>
      {children}
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div className="w-11 h-6 rounded-full flex-shrink-0 relative transition-colors" style={{ background: on ? "var(--md-primary)" : "var(--md-surface-container-highest)" }}>
      <div className="w-4 h-4 rounded-full absolute transition-all" style={{ background: on ? "#fff" : "#9E9E9E", left: on ? "calc(100% - 20px)" : "4px", top: "4px" }} />
    </div>
  );
}

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--md-outline)", flexShrink: 0 }}>
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  );
}

const ip = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
function IconExport()  { return <svg {...ip}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>; }
function IconFolders() { return <svg {...ip}><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>; }
function IconMoon()    { return <svg {...ip}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>; }
function IconBell()    { return <svg {...ip}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>; }
function IconInfo()    { return <svg {...ip}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>; }
function IconShield()  { return <svg {...ip}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>; }
function IconScroll()  { return <svg {...ip}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>; }
function IconLogOut()  { return <svg {...ip}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>; }

interface SettingsItemProps {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick: () => void;
  danger?: boolean;
  last?: boolean;
  rightSlot?: React.ReactNode;
}

function SettingsItem({ icon, label, sublabel, onClick, danger, last, rightSlot }: SettingsItemProps) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-4 px-5 py-4 text-left md-ripple">
      <span className="flex-shrink-0 flex items-center justify-center" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface-variant)" }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-medium" style={{ color: danger ? "var(--md-error)" : "var(--md-on-surface)" }}>{label}</div>
        {sublabel && <div className="text-xs mt-0.5" style={{ color: "var(--md-outline)" }}>{sublabel}</div>}
      </div>
      {rightSlot ?? <Chevron />}
    </button>
  );
}
