"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { type CurrencyConfig, loadCurrency, saveCurrency, CURRENCIES } from "./currency";

interface CurrencyCtx {
  currency: CurrencyConfig;
  setCurrencyCode: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyCtx>({
  currency: CURRENCIES[1], // USD fallback
  setCurrencyCode: () => {},
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyConfig>(CURRENCIES[1]);

  useEffect(() => {
    setCurrency(loadCurrency());
  }, []);

  function setCurrencyCode(code: string) {
    const found = CURRENCIES.find(c => c.code === code);
    if (!found) return;
    saveCurrency(code);
    setCurrency(found);
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrencyCode }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
