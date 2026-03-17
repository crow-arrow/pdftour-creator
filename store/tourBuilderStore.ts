import { create } from "zustand";
import { tourBuilderDefault } from "@/data/tourBuilderDefault";
import type {
  TourBuilderState,
  TourBuilderColors,
  TourBuilderFonts,
  ItineraryDay,
  TourOverview,
  TourInclusions,
  TourManager,
  TourPrice
} from "@/lib/pdf-builder/types";

interface TourBuilderStore extends TourBuilderState {
  setColors: (colors: Partial<TourBuilderColors>) => void;
  setFonts: (fonts: Partial<TourBuilderFonts>) => void;
  setCover: (cover: Partial<TourBuilderState["cover"]>) => void;
  setOverview: (overview: Partial<TourOverview>) => void;
  setInclusions: (inclusions: Partial<TourInclusions>) => void;
  setTourManager: (manager: Partial<TourManager>) => void;
  setPrice: (price: Partial<TourPrice>) => void;
  setContact: (contact: Partial<TourBuilderState["contact"]>) => void;
  setItineraryDay: (id: string, day: Partial<ItineraryDay>) => void;
  addItineraryDay: (afterId?: string) => void;
  removeItineraryDay: (id: string) => void;
  reorderItinerary: (fromIndex: number, toIndex: number) => void;
  setOptionalExtension: (ext: Partial<NonNullable<TourBuilderState["optionalExtension"]>>) => void;
  setExtensionDay: (id: string, day: Partial<ItineraryDay>) => void;
  reset: () => void;
  loadState: (state: TourBuilderState) => void;
}

export const useTourBuilderStore = create<TourBuilderStore>((set) => ({
  ...tourBuilderDefault,

  setColors: (colors) =>
    set((s) => ({ colors: { ...s.colors, ...colors } })),

  setFonts: (fonts) =>
    set((s) => ({ fonts: { ...s.fonts, ...fonts } })),

  setCover: (cover) =>
    set((s) => ({ cover: { ...s.cover, ...cover } })),

  setOverview: (overview) =>
    set((s) => ({ overview: { ...s.overview, ...overview } })),

  setInclusions: (inclusions) =>
    set((s) => ({
      inclusions: {
        ...s.inclusions,
        ...inclusions
      }
    })),

  setTourManager: (manager) =>
    set((s) => ({ tourManager: { ...s.tourManager, ...manager } })),

  setPrice: (price) =>
    set((s) => ({ price: { ...s.price, ...price } })),

  setContact: (contact) =>
    set((s) => ({ contact: { ...s.contact, ...contact } })),

  setItineraryDay: (id, day) =>
    set((s) => ({
      itinerary: s.itinerary.map((d) =>
        d.id === id ? { ...d, ...day } : d
      )
    })),

  addItineraryDay: (afterId) =>
    set((s) => {
      const newId = `day-${Date.now()}`;
      const newDay: ItineraryDay = {
        id: newId,
        date: "",
        title: "",
        meals: "",
        description: "",
        imageUrl: "https://images.unsplash.com/photo-1654861857754-4a6a5a1de01e?w=800&q=80",
        location: "",
        additionalInfo: []
      };
      if (afterId) {
        const idx = s.itinerary.findIndex((d) => d.id === afterId);
        const insertAt = idx >= 0 ? idx + 1 : s.itinerary.length;
        const next = [...s.itinerary];
        next.splice(insertAt, 0, newDay);
        return { itinerary: next };
      }
      return { itinerary: [...s.itinerary, newDay] };
    }),

  removeItineraryDay: (id) =>
    set((s) => ({
      itinerary: s.itinerary.filter((d) => d.id !== id)
    })),

  reorderItinerary: (fromIndex, toIndex) =>
    set((s) => {
      const next = [...s.itinerary];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return { itinerary: next };
    }),

  setOptionalExtension: (ext) =>
    set((s) => ({
      optionalExtension: s.optionalExtension
        ? { ...s.optionalExtension, ...ext }
        : undefined
    })),

  setExtensionDay: (id, day) =>
    set((s) => {
      if (!s.optionalExtension) return s;
      return {
        optionalExtension: {
          ...s.optionalExtension,
          days: s.optionalExtension.days.map((d) =>
            d.id === id ? { ...d, ...day } : d
          )
        }
      };
    }),

  reset: () => set(tourBuilderDefault),

  loadState: (state) => {
    const price = state.price as TourPrice & {
      groupSize?: string;
      customOptions?: string;
      fitnessNote?: string;
      experienceNote?: string;
    };
    const additionalNotes =
      price.additionalNotes ??
      [price.groupSize, price.customOptions, price.fitnessNote, price.experienceNote]
        .filter(Boolean)
        .join("\n\n");
    const { groupSize, customOptions, fitnessNote, experienceNote, ...rest } = price;
    const normalizedPrice: TourPrice = {
      ...tourBuilderDefault.price,
      ...rest,
      additionalNotes
    };
    const migrateDay = (d: ItineraryDay): ItineraryDay => {
      const hasAdditional = d.additionalInfo && d.additionalInfo.length > 0;
      if (hasAdditional) return d;
      const items: { label: string; value: string }[] = [];
      if (d.meals) items.push({ label: "Meals", value: d.meals });
      if (d.location) items.push({ label: "Location", value: d.location });
      return items.length ? { ...d, additionalInfo: items } : d;
    };

    return set((s) => ({
      ...s,
      colors: state.colors,
      fonts: state.fonts,
      cover: state.cover,
      overview: state.overview,
      inclusions: state.inclusions,
      tourManager: state.tourManager,
      price: normalizedPrice,
      itinerary: state.itinerary.map(migrateDay),
      optionalExtension: state.optionalExtension
        ? { ...state.optionalExtension, days: state.optionalExtension.days.map(migrateDay) }
        : state.optionalExtension,
      contact: state.contact
    }));
  }
}));
