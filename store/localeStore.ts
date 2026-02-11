"use client";

import { create } from "zustand";
import type { Locale } from "@/lib/types";

const STORAGE_KEY = "ui-locale";

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  rehydrate: () => void;
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: "en",
  setLocale: (locale) => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, locale);
      } catch (error) {
        console.error("[locale-store] Failed to save locale to localStorage", error);
      }
    }
    set({ locale });
  },
  rehydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "de") {
        set({ locale: saved });
      }
    } catch (error) {
      console.error("[locale-store] Failed to read locale from localStorage", error);
    }
  }
}));

