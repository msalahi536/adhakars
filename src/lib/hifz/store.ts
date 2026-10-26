// Local-first Hifz state. Everything lives on the device; cloud backup is optional (see sync.ts).
import type { AyahItem, Grade, PageItem, Stage } from "./scheduler";

export type HifzPlan = {
  targets: string[]; // e.g. ["juz:30", "surah:67"]
  dailyNewAyahs: number;
  direction: "forward" | "backward";
  updatedAt: string;
};

export type HifzReview = {
  id: string;
  itemKey: string; // ayah key or "page:N"
  grade: Grade;
  intervalBefore: number;
  intervalAfter: number;
  session: Stage;
  errorWords: string[]; // "2:255:3"
  at: string;
};

export type WordError = { word: string; page: number; count: number; updatedAt: string };

export type HifzState = {
  plan: HifzPlan | null;
  ayahs: Record<string, AyahItem>;
  pages: Record<string, PageItem>;
  reviews: HifzReview[];
  wordErrors: Record<string, WordError>;
};

const KEY = "hifz:state:v1";
export const emptyState = (): HifzState => ({ plan: null, ayahs: {}, pages: {}, reviews: [], wordErrors: {} });

export function loadHifz(): HifzState {
  if (typeof localStorage === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState();
  } catch {
    return emptyState();
  }
}

export function saveHifz(s: HifzState) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("hifz:changed"));
}

const newer = <T extends { updatedAt: string }>(a: T | undefined, b: T | undefined): T | undefined =>
  !a ? b : !b ? a : b.updatedAt > a.updatedAt ? b : a;

function mergeRecord<T extends { updatedAt: string }>(a: Record<string, T>, b: Record<string, T>) {
  const out: Record<string, T> = { ...a };
  for (const k of Object.keys(b)) out[k] = newer(a[k], b[k])!;
  return out;
}

/** Merge two devices' states: newest edit wins per item, reviews are an append-only union. */
export function mergeHifz(a: HifzState, b: HifzState): HifzState {
  const reviews = new Map<string, HifzReview>();
  for (const r of [...a.reviews, ...b.reviews]) reviews.set(r.id, r);
  return {
    plan: newer(a.plan ?? undefined, b.plan ?? undefined) ?? null,
    ayahs: mergeRecord(a.ayahs, b.ayahs),
    pages: mergeRecord(a.pages, b.pages),
    reviews: [...reviews.values()].sort((x, y) => x.at.localeCompare(y.at)),
    wordErrors: mergeRecord(a.wordErrors, b.wordErrors),
  };
}
