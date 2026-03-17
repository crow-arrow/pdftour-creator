import type { TourBuilderState } from "./types";

const STORAGE_KEY = "pdf-tour-drafts";

export interface TourDraft {
  id: string;
  name: string;
  createdAt: string;
  state: TourBuilderState;
}

export function getDrafts(): TourDraft[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TourDraft[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Удаляет base64-изображения из state для экономии места в localStorage */
function stripBase64Images(state: TourBuilderState): TourBuilderState {
  const strip = (url: string) => (url?.startsWith("data:") ? "" : url ?? "");
  return {
    ...state,
    cover: {
      ...state.cover,
      backgroundImageUrl: strip(state.cover.backgroundImageUrl),
      logoUrl: strip(state.cover.logoUrl ?? "")
    },
    tourManager: { ...state.tourManager, avatarUrl: strip(state.tourManager.avatarUrl ?? "") },
    itinerary: state.itinerary.map((d) => ({ ...d, imageUrl: strip(d.imageUrl) })),
    optionalExtension: state.optionalExtension
      ? {
          ...state.optionalExtension,
          days: state.optionalExtension.days.map((d) => ({
            ...d,
            imageUrl: strip(d.imageUrl)
          }))
        }
      : undefined
  };
}

export function saveDraft(name: string, state: TourBuilderState): TourDraft {
  const drafts = getDrafts();
  const draft: TourDraft = {
    id: `draft-${Date.now()}`,
    name: name.trim() || `Черновик ${new Date().toLocaleDateString()}`,
    createdAt: new Date().toISOString(),
    state: stripBase64Images(state)
  };
  drafts.unshift(draft);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw e;
  }
  return draft;
}

export function loadDraft(id: string): TourBuilderState | null {
  const drafts = getDrafts();
  const draft = drafts.find((d) => d.id === id);
  return draft?.state ?? null;
}

export function deleteDraft(id: string): void {
  const drafts = getDrafts().filter((d) => d.id !== id);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  } catch (e) {
    if (e instanceof DOMException && e.name === "QuotaExceededError") {
      throw new Error("QUOTA_EXCEEDED");
    }
    throw e;
  }
}

export function getSerializableState(state: TourBuilderState | Record<string, unknown>): TourBuilderState {
  const s = state as Record<string, unknown>;
  return {
    colors: s.colors as TourBuilderState["colors"],
    fonts: s.fonts as TourBuilderState["fonts"],
    cover: s.cover as TourBuilderState["cover"],
    overview: s.overview as TourBuilderState["overview"],
    inclusions: s.inclusions as TourBuilderState["inclusions"],
    tourManager: s.tourManager as TourBuilderState["tourManager"],
    price: s.price as TourBuilderState["price"],
    itinerary: s.itinerary as TourBuilderState["itinerary"],
    optionalExtension: s.optionalExtension as TourBuilderState["optionalExtension"],
    contact: s.contact as TourBuilderState["contact"]
  };
}

/** Формат файла конфига для экспорта/импорта */
export interface TourConfigFile {
  version: number;
  name: string;
  createdAt: string;
  state: TourBuilderState;
}

const CONFIG_VERSION = 1;

export function exportConfigToFile(state: TourBuilderState, name?: string): void {
  const config: TourConfigFile = {
    version: CONFIG_VERSION,
    name: name || state.cover.title || `tour-${new Date().toISOString().slice(0, 10)}`,
    createdAt: new Date().toISOString(),
    state
  };
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tour-config-${config.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseConfigFile(json: string): TourBuilderState | null {
  try {
    const parsed = JSON.parse(json) as TourConfigFile;
    if (!parsed?.state || typeof parsed.state !== "object") return null;
    return parsed.state as TourBuilderState;
  } catch {
    return null;
  }
}
