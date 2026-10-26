// Local-first Hifz state. The review log is the only source of truth: ayah/page state is
// always recomputed from the full log, never stored or merged directly. Cloud backup is optional (sync.ts).
import {
  WORD_ERROR_PULL,
  WORD_ERROR_WINDOW_DAYS,
  addDays,
  daysBetween,
  enterManzil,
  gradeAyah,
  gradePage,
  localDay,
  newAyah,
  pageReady,
  type AyahItem,
  type Grade,
  type PageItem,
} from "./scheduler";

export type HifzPlan = { targets: string[]; dailyNewAyahs: number; direction: "forward" | "backward"; updatedAt: string };

export type HifzEvent = {
  id: string; // UUID
  kind: "learn" | "ayah" | "page" | "chain"; // "chain" = joined-chunk review: logged, never moves intervals
  key: string; // ayah key ("2:255") or page number as text
  page: number;
  grade?: Grade;
  errorKeys?: string[]; // ayahs marked wrong in a page review
  errorWords?: string[]; // "2:255:3" (ayah key + word position)
  at: string; // ISO timestamp, for ordering
  day: string; // device-local day of the review
};

export type HifzState = { plan: HifzPlan | null; events: HifzEvent[] };
export type Derived = { ayahs: Record<string, AyahItem>; pages: Record<number, PageItem>; wordErrors: Record<string, string[]> };

const KEY = "hifz:state:v2";
export const emptyState = (): HifzState => ({ plan: null, events: [] });

const order = (a: HifzEvent, b: HifzEvent) => a.at.localeCompare(b.at) || a.id.localeCompare(b.id);

/** Replay the log in chronological order. */
export function derive(events: HifzEvent[]): Derived {
  const ayahs: Record<string, AyahItem> = {};
  const pages: Record<number, PageItem> = {};
  const wordErrors: Record<string, string[]> = {}; // word -> days tapped
  const onPage = (p: number) => Object.values(ayahs).filter((a) => a.page === p);

  for (const e of [...events].sort(order)) {
    if (e.kind === "learn") {
      if (!ayahs[e.key]) ayahs[e.key] = newAyah(e.key, e.page, e.day);
    } else if (e.kind === "ayah" && ayahs[e.key] && e.grade) {
      ayahs[e.key] = gradeAyah(ayahs[e.key], e.grade, e.day);
      if (e.grade === "perfect") for (const w of Object.keys(wordErrors)) if (w.startsWith(e.key + ":")) delete wordErrors[w];
    } else if (e.kind === "page" && pages[e.page]?.inManzil && e.grade) {
      const r = gradePage(pages[e.page], onPage(e.page), e.grade, e.errorKeys ?? [], e.day);
      pages[e.page] = r.page;
      for (const a of r.ayahs) ayahs[a.key] = a;
    }
    for (const w of e.errorWords ?? []) (wordErrors[w] ??= []).push(e.day);

    // Manzil entry and repeated-word pull-forward for the touched page.
    const p = e.page;
    if (pageReady(onPage(p)) && !pages[p]?.inManzil) pages[p] = enterManzil(p, e.day);
    const page = pages[p];
    if (page?.inManzil && page.due > e.day) {
      const hot = Object.entries(wordErrors).some(
        ([w, days]) =>
          ayahs[w.split(":").slice(0, 2).join(":")]?.page === p &&
          days.filter((d) => daysBetween(d, e.day) < WORD_ERROR_WINDOW_DAYS).length >= WORD_ERROR_PULL,
      );
      if (hot) pages[p] = { ...page, due: e.day };
    }
  }
  return { ayahs, pages, wordErrors };
}

/** Merge devices: union logs by UUID; plan keeps its newest edit. State is then re-derived. */
export function mergeHifz(a: HifzState, b: HifzState): HifzState {
  const byId = new Map<string, HifzEvent>();
  for (const e of [...a.events, ...b.events]) byId.set(e.id, e);
  const plan = !a.plan ? b.plan : !b.plan ? a.plan : b.plan.updatedAt > a.plan.updatedAt ? b.plan : a.plan;
  return { plan, events: [...byId.values()].sort(order) };
}

export function loadHifz(): HifzState {
  if (typeof localStorage === "undefined") return emptyState();
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? JSON.parse(raw) : null;
    return { plan: s?.plan ?? null, events: Array.isArray(s?.events) ? s.events : [] };
  } catch {
    return emptyState();
  }
}

export function saveHifz(s: HifzState) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("hifz:changed"));
}

export function recordEvent(e: Omit<HifzEvent, "id" | "at" | "day">, now = new Date()): HifzEvent {
  const ev: HifzEvent = { ...e, id: crypto.randomUUID(), at: now.toISOString(), day: localDay(now) };
  const s = loadHifz();
  saveHifz({ ...s, events: [...s.events, ev] });
  return ev;
}

export { addDays };
