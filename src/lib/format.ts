import type { Category, CategoryMeta } from "@/types";

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  "Food & Drinks": { icon: "food",          bg: "#F5E6FF" },
  Groceries:       { icon: "groceries",     bg: "#EDF7EE" },
  Transport:       { icon: "transport",     bg: "#E6F0FF" },
  Education:       { icon: "education",     bg: "#F3E6FF" },
  Housing:         { icon: "housing",       bg: "#FFF5E6" },
  Healthcare:      { icon: "healthcare",    bg: "#FFE6EE" },
  Shopping:        { icon: "shopping",      bg: "#F5E6FF" },
  Entertainment:   { icon: "entertainment", bg: "#E8E6FF" },
  Bills:           { icon: "bills",         bg: "#F0F0F0" },
  Travel:          { icon: "travel",        bg: "#E6F5F5" },
  Investment:      { icon: "investment",    bg: "#E6F7E6" },
  Salary:          { icon: "salary",        bg: "#E6F7E6" },
  Business:        { icon: "business",      bg: "#E6F0FF" },
  Transfer:        { icon: "transfer",      bg: "#F0F0F0" },
  Refund:          { icon: "refund",        bg: "#FFFCE6" },
  Other:           { icon: "other",         bg: "#F0F0F0" },
};

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category as Category] ?? CATEGORY_META.Other;
}

/** Compact format: ₹500, ₹1.2K, ₹2.5L */
export function fmtCompact(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Full format: ₹1,25,000 */
export function fmtFull(n: number): string {
  if (!n || isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
