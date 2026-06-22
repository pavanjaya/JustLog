export interface CurrencyConfig {
  code: string;
  symbol: string;
  locale: string;
  // Indian-style compact (L = lakh) vs standard (K/M)
  style: "indian" | "standard";
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: "INR", symbol: "₹", locale: "en-IN", style: "indian" },
  { code: "USD", symbol: "$", locale: "en-US", style: "standard" },
  { code: "EUR", symbol: "€", locale: "de-DE", style: "standard" },
  { code: "GBP", symbol: "£", locale: "en-GB", style: "standard" },
  { code: "AUD", symbol: "A$", locale: "en-AU", style: "standard" },
  { code: "CAD", symbol: "C$", locale: "en-CA", style: "standard" },
  { code: "SGD", symbol: "S$", locale: "en-SG", style: "standard" },
  { code: "AED", symbol: "AED", locale: "ar-AE", style: "standard" },
  { code: "JPY", symbol: "¥", locale: "ja-JP", style: "standard" },
  { code: "MYR", symbol: "RM", locale: "ms-MY", style: "standard" },
];

const STORAGE_KEY = "jl_currency";

function detectCurrency(): CurrencyConfig {
  try {
    const locale = navigator.language || "en-US";
    const detected = new Intl.NumberFormat(locale, { style: "currency", currency: "USD" })
      .resolvedOptions().currency;
    // Try to match detected currency
    const match = CURRENCIES.find(c => c.code === detected);
    if (match) return match;
    // Fallback by locale prefix
    if (locale.startsWith("en-IN") || locale === "hi") return CURRENCIES[0]; // INR
    if (locale.startsWith("en-GB")) return CURRENCIES[3]; // GBP
    if (locale.startsWith("en-AU")) return CURRENCIES[4]; // AUD
    if (locale.startsWith("en-CA")) return CURRENCIES[5]; // CAD
    if (locale.startsWith("de") || locale.startsWith("fr") || locale.startsWith("es-ES"))
      return CURRENCIES[2]; // EUR
  } catch {}
  return CURRENCIES[1]; // USD default
}

export function loadCurrency(): CurrencyConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = CURRENCIES.find(c => c.code === saved);
      if (found) return found;
    }
  } catch {}
  return detectCurrency();
}

export function saveCurrency(code: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {}
}

export function fmtCompact(n: number, currency: CurrencyConfig): string {
  if (currency.style === "indian") {
    if (n >= 100000) return `${currency.symbol}${(n / 100000).toFixed(1).replace(/\.0$/, "")}L`;
    if (n >= 1000) return `${currency.symbol}${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
    return `${currency.symbol}${n.toLocaleString(currency.locale)}`;
  }
  if (n >= 1000000) return `${currency.symbol}${(n / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1000) return `${currency.symbol}${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return `${currency.symbol}${n.toLocaleString(currency.locale)}`;
}

export function fmtFull(n: number, currency: CurrencyConfig): string {
  if (!n || isNaN(n)) return `${currency.symbol}0`;
  return `${currency.symbol}${n.toLocaleString(currency.locale)}`;
}
