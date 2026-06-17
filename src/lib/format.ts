import type { Category, CategoryMeta } from "@/types";

export const CATEGORY_META: Record<Category, CategoryMeta> = {
  "Food & Drinks": { emoji: "☕", bg: "#FFF3E0" },
  Groceries: { emoji: "🛒", bg: "#E8F5E9" },
  Transport: { emoji: "🚗", bg: "#E3F2FD" },
  Education: { emoji: "📚", bg: "#F3E5F5" },
  Housing: { emoji: "🏠", bg: "#FFF8E1" },
  Healthcare: { emoji: "💊", bg: "#FCE4EC" },
  Shopping: { emoji: "🛍️", bg: "#F3E5F5" },
  Entertainment: { emoji: "🎬", bg: "#E8EAF6" },
  Bills: { emoji: "📄", bg: "#F5F5F5" },
  Travel: { emoji: "✈️", bg: "#E0F2F1" },
  Investment: { emoji: "📈", bg: "#E8F5E9" },
  Salary: { emoji: "💵", bg: "#E8F5E9" },
  Business: { emoji: "💼", bg: "#E3F2FD" },
  Transfer: { emoji: "↔️", bg: "#F5F5F5" },
  Refund: { emoji: "↩️", bg: "#FFF9C4" },
  Other: { emoji: "📦", bg: "#F5F5F5" },
};

export function getCategoryMeta(category: string): CategoryMeta {
  return CATEGORY_META[category as Category] ?? CATEGORY_META.Other;
}

/** Compact format: ₹500, ₹1.2K, ₹2.5L */
export function fmtCompact(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Full format: ₹1,25,000 */
export function fmtFull(n: number): string {
  return `₹${n.toLocaleString("en-IN")}`;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
