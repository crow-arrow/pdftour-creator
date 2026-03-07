import { create } from "zustand";
import type { PricingConfig, PricingExtra, PricingItemConfig, Tier } from "@/lib/types";
import defaultPricing from "@/data/pricingConfig.json";

const PRICING_API_URL = "/api/pricing";

let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;

export type PricingTarget =
  | "hotel.budget"
  | "hotel.premium"
  | "hotel.luxury"
  | "dinner"
  | "guide"
  | "flight";

interface PricingState {
  pricing: PricingConfig;
  isLoading: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  lastSavedPricing: PricingConfig | null;

  setPricing: (pricing: PricingConfig) => void;
  loadPricing: () => Promise<void>;
  savePricing: () => Promise<void>;
  saveSection: (target: PricingTarget) => Promise<void>;

  updateConfig: (target: PricingTarget, patch: Partial<PricingItemConfig>) => void;
  updateTier: (target: PricingTarget, index: number, patch: Partial<Tier>) => void;
  addTier: (target: PricingTarget) => void;
  removeTier: (target: PricingTarget, index: number) => void;
  addExtra: () => void;
  updateExtra: (id: string, patch: Partial<PricingExtra>) => void;
  removeExtra: (id: string) => void;
  reset: () => void;
}

function getConfig(pricing: PricingConfig, target: PricingTarget): PricingItemConfig {
  if (target.startsWith("hotel.")) {
    const key = target.split(".")[1] as keyof PricingConfig["hotel"];
    return pricing.hotel[key];
  }
  return pricing[target as "dinner" | "guide" | "flight"];
}

function setConfig(
  pricing: PricingConfig,
  target: PricingTarget,
  config: PricingItemConfig
) {
  if (target.startsWith("hotel.")) {
    const key = target.split(".")[1] as keyof PricingConfig["hotel"];
    return { ...pricing, hotel: { ...pricing.hotel, [key]: config } };
  }
  return { ...pricing, [target]: config };
}

export const usePricingStore = create<PricingState>((set, get): PricingState => {
  const scheduleAutoSave = () => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    autoSaveTimeout = setTimeout(() => {
      void get()
        .savePricing()
        .catch((error) => {
          console.error("[pricing-store] Failed to auto-save pricing config", error);
        });
    }, 1000);
  };

  return {
    pricing: defaultPricing as PricingConfig,
    isLoading: false,
    isSaving: false,
    lastSaved: null,
    lastSavedPricing: null,

    setPricing: (pricing) => set({ pricing }),

    loadPricing: async () => {
      set({ isLoading: true });
      try {
        const response = await fetch(PRICING_API_URL, { method: "GET" });
        if (!response.ok) {
          throw new Error(`Failed to load pricing: ${response.status}`);
        }
        const data = (await response.json()) as PricingConfig;
        set({
          pricing: data,
          isLoading: false,
          lastSaved: new Date(),
          lastSavedPricing: data
        });
      } catch (error) {
        console.error("[pricing-store] Failed to load pricing config", error);
        set({ isLoading: false });
        throw error;
      }
    },

    savePricing: async () => {
      const { pricing } = get();
      set({ isSaving: true });
      try {
        const response = await fetch(PRICING_API_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pricing)
        });

        if (!response.ok) {
          throw new Error(`Failed to save pricing: ${response.status}`);
        }

        const data = (await response.json()) as PricingConfig;

        set({
          pricing: data,
          isSaving: false,
          lastSaved: new Date(),
          lastSavedPricing: data
        });
      } catch (error) {
        console.error("[pricing-store] Failed to save pricing config", error);
        set({ isSaving: false });
        throw error;
      }
    },

    saveSection: async (target) => {
      const { pricing, lastSavedPricing } = get();
      set({ isSaving: true });
      try {
        const currentSection = getConfig(pricing, target);
        const base = lastSavedPricing ?? pricing;
        const merged = setConfig(base, target, currentSection);

        const response = await fetch(PRICING_API_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(merged)
        });

        if (!response.ok) {
          throw new Error(`Failed to save pricing section: ${response.status}`);
        }

        const data = (await response.json()) as PricingConfig;

        set({
          isSaving: false,
          lastSaved: new Date(),
          lastSavedPricing: data
        });
      } catch (error) {
        console.error("[pricing-store] Failed to save pricing section", error);
        set({ isSaving: false });
        throw error;
      }
    },

    updateConfig: (target, patch) => {
      set((state) => {
        const current = getConfig(state.pricing, target);
        return { pricing: setConfig(state.pricing, target, { ...current, ...patch }) };
      });
      scheduleAutoSave();
    },

    updateTier: (target, index, patch) => {
      set((state) => {
        const current = getConfig(state.pricing, target);
        const tiers = current.tiers.map((tier, idx) =>
          idx === index ? { ...tier, ...patch } : tier
        );
        return { pricing: setConfig(state.pricing, target, { ...current, tiers }) };
      });
      scheduleAutoSave();
    },

    addTier: (target) => {
      set((state) => {
        const current = getConfig(state.pricing, target);
        const last = current.tiers[current.tiers.length - 1];
        const nextMin = last ? (last.maxPeople ?? last.minPeople) + 1 : 1;
        const tiers = [
          ...current.tiers,
          { minPeople: nextMin, maxPeople: null, price: last?.price ?? 0 }
        ];
        return { pricing: setConfig(state.pricing, target, { ...current, tiers }) };
      });
      scheduleAutoSave();
    },

    removeTier: (target, index) => {
      set((state) => {
        const current = getConfig(state.pricing, target);
        const tiers = current.tiers.filter((_, idx) => idx !== index);
        return { pricing: setConfig(state.pricing, target, { ...current, tiers }) };
      });
      scheduleAutoSave();
    },

    addExtra: () => {
      set((state) => ({
        pricing: {
          ...state.pricing,
          extras: [
            ...state.pricing.extras,
            {
              id: `extra-${Date.now()}`,
              titleEn: "New service",
              titleDe: "Neue Leistung",
              price: 0,
              pricingModel: "per_group",
              multiplier: "per_trip"
            }
          ]
        }
      }));
      scheduleAutoSave();
    },

    updateExtra: (id, patch) => {
      set((state) => ({
        pricing: {
          ...state.pricing,
          extras: state.pricing.extras.map((extra) =>
            extra.id === id ? { ...extra, ...patch } : extra
          )
        }
      }));
      scheduleAutoSave();
    },

    removeExtra: (id) => {
      set((state) => ({
        pricing: {
          ...state.pricing,
          extras: state.pricing.extras.filter((extra) => extra.id !== id)
        }
      }));
      scheduleAutoSave();
    },

    reset: () => set({ pricing: defaultPricing as PricingConfig })
  };
});
