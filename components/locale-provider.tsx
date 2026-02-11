"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { Locale } from "@/lib/types";

const COOKIE_NAME = "locale";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year
const STORAGE_KEY = "ui-locale";

function setLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

interface LocaleProviderProps {
  initialLocale: Locale;
  children: ReactNode;
}

export function LocaleProvider({ initialLocale, children }: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setLocaleCookie(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch (e) {
      console.error("[locale] Failed to save to localStorage", e);
    }
  }, []);

  // Один раз подтянуть из localStorage в cookie, если в cookie ещё нет (старые пользователи)
  useEffect(() => {
    if (initialLocale !== "en") return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "de" || saved === "en") {
        setLocaleCookie(saved);
        if (saved === "de") window.location.reload();
      }
    } catch {
      // ignore
    }
  }, [initialLocale]);

  const value = useMemo(
    () => ({ locale, setLocale }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
