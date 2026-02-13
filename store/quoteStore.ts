import { create } from "zustand";
import type { QuoteInput, SelectedExtra } from "@/lib/types";
import defaultQuote from "@/data/quoteInput.json";

import { getNextQuoteNumber } from "@/lib/quoteNumber";

const defaultQuoteTyped = defaultQuote as QuoteInput;
export const QUOTE_NUMBER_STORAGE_KEY = "pdf-tour-quote-number";

/** Устанавливает quoteNumber в (последний сохранённый + 1) или из localStorage. Вызывать в useEffect на клиенте. */
export async function hydrateQuoteNumberToNext(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const res = await fetch("/api/pdf/files");
    const data = (await res.json()) as { files?: { quoteNumber: string }[] };
    const files = data?.files ?? [];
    if (files.length > 0) {
      const lastNumber = files[0].quoteNumber;
      const nextNumber = getNextQuoteNumber(lastNumber);
      useQuoteStore.getState().setField("quoteNumber", nextNumber);
      return;
    }
    const stored = localStorage.getItem(QUOTE_NUMBER_STORAGE_KEY);
    if (stored && /^Q-\d{4}-\d+$/i.test(stored)) {
      const current = useQuoteStore.getState().quote.quoteNumber;
      if (current !== stored) {
        useQuoteStore.getState().setField("quoteNumber", stored);
      }
    }
  } catch {
    // ignore
  }
}

interface QuoteState {
  quote: QuoteInput;
  setField: <K extends keyof QuoteInput>(key: K, value: QuoteInput[K]) => void;
  addSelectedExtra: (id: string, days: number) => void;
  updateSelectedExtra: (id: string, patch: Partial<SelectedExtra>) => void;
  removeSelectedExtra: (id: string) => void;
  reorderSelectedExtras: (sourceId: string, targetId: string) => void;
  setQuote: (quote: QuoteInput) => void;
  reset: () => void;
}

export const useQuoteStore = create<QuoteState>((set) => ({
  quote: defaultQuoteTyped,
  setField: (key, value) => {
    set((state) => ({ quote: { ...state.quote, [key]: value } }));
    if (key === "quoteNumber" && typeof window !== "undefined") {
      try {
        localStorage.setItem(QUOTE_NUMBER_STORAGE_KEY, String(value));
      } catch {
        // ignore
      }
    }
  },
  addSelectedExtra: (id, days) =>
    set((state) => ({
      quote: {
        ...state.quote,
        selectedExtras: state.quote.selectedExtras.some((extra) => extra.id === id)
          ? state.quote.selectedExtras
          : [...state.quote.selectedExtras, { id, days, quantity: 1 }]
      }
    })),
  updateSelectedExtra: (id, patch) =>
    set((state) => ({
      quote: {
        ...state.quote,
        selectedExtras: state.quote.selectedExtras.map((extra) =>
          extra.id === id ? { ...extra, ...patch } : extra
        )
      }
    })),
  removeSelectedExtra: (id) =>
    set((state) => ({
      quote: {
        ...state.quote,
        selectedExtras: state.quote.selectedExtras.filter((extra) => extra.id !== id)
      }
    })),
  reorderSelectedExtras: (sourceId, targetId) =>
    set((state) => {
      const list = [...state.quote.selectedExtras];
      const fromIndex = list.findIndex((extra) => extra.id === sourceId);
      const toIndex = list.findIndex((extra) => extra.id === targetId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return state;
      }
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      return { quote: { ...state.quote, selectedExtras: list } };
    }),
  setQuote: (quote) => set({ quote }),
  reset: () => {
    set({ quote: defaultQuoteTyped });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          QUOTE_NUMBER_STORAGE_KEY,
          defaultQuoteTyped.quoteNumber
        );
      } catch {
        // ignore
      }
    }
  }
}));
