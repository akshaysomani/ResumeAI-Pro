"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { getTranslation, LANGUAGES, formatCurrency, formatDate } from "@/lib/translations";

interface I18nContextType {
  locale: string;
  setLocale: (lang: string) => void;
  t: (key: string) => string;
  dir: "ltr" | "rtl";
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: string | Date) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Load default from localStorage if available, fallback to English
  const [locale, setLocaleState] = useState("en");
  const [dir, setDir] = useState<"ltr" | "rtl">("ltr");

  useEffect(() => {
    const saved = localStorage.getItem("preferred_lang");
    if (saved) {
      setLocaleState(saved);
      const conf = LANGUAGES.find((l) => l.code === saved);
      setDir(conf?.dir || "ltr");
    }
  }, []);

  const setLocale = (lang: string) => {
    setLocaleState(lang);
    localStorage.setItem("preferred_lang", lang);
    const conf = LANGUAGES.find((l) => l.code === lang);
    const newDir = conf?.dir || "ltr";
    setDir(newDir);
    
    // Dynamically set HTML lang and dir tags on layout root
    document.documentElement.lang = lang;
    document.documentElement.dir = newDir;
  };

  const t = (key: string) => {
    return getTranslation(locale, key);
  };

  const currencyFormatter = (amount: number, currency: string) => {
    return formatCurrency(amount, currency, locale);
  };

  const dateFormatter = (date: string | Date) => {
    return formatDate(date, locale);
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        dir,
        formatCurrency: currencyFormatter,
        formatDate: dateFormatter,
      }}
    >
      <div dir={dir}>{children}</div>
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
