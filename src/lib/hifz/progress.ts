// Pure heatmap rules: one state per mushaf page, derived from the replayed log.
import { allAyahs, juzOfAyah, pageOfAyah } from "./layout";
import { addDays, daysBetween, pageStrength, WORD_ERROR_PULL, WORD_ERROR_WINDOW_DAYS, type Grade } from "./scheduler";
import type { Derived, HifzEvent } from "./store";

export type PageState = "strong" | "good" | "light" | "weak" | "overdue";
export type PageInfo = { page: number; state: PageState; keys: string[]; stage: "sabqi" | "manzil"; due: string; strength: number; errors: [string, number][] };

export const STRONG_AT = 21;
export const GOOD_AT = 10;
export const WEAK_BELOW = 7;
export const SOON_DAYS = 2;

const byAyah = (a: string, b: string) => { const [x, y] = a.split(":").map(Number), [u, v] = b.split(":").map(Number); return x - u || y - v; };

/** Memorized pages only; pages with nothing memorized are absent (gray). */
export function pageStates(d: Derived, today: string): Record<number, PageInfo> {
  const out: Record<number, PageInfo> = {};
  const groups = new Map<number, typeof d.ayahs[string][]>();
  for (const a of Object.values(d.ayahs)) groups.set(a.page, [...(groups.get(a.page) ?? []), a]);
  for (const [page, its] of groups) {
    const pg = d.pages[page];
    const manzil = !!pg?.inManzil;
    const due = manzil ? pg.due : its.map((a) => a.due).sort()[0];
    const strength = manzil ? Math.max(0, pg.interval - Math.max(0, daysBetween(pg.due, today))) : pageStrength(its, today);
    const keys = its.map((a) => a.key).sort(byAyah);
    const errors = Object.entries(d.wordErrors)
      .filter(([w]) => keys.includes(w.split(":").slice(0, 2).join(":")))
      .map(([w, days]) => [w, days.filter((x) => daysBetween(x, today) < WORD_ERROR_WINDOW_DAYS).length] as [string, number])
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1]);
    const repeated = errors.some(([, n]) => n >= WORD_ERROR_PULL);
    const state: PageState =
      due < today || repeated ? "overdue"
      : due <= addDays(today, SOON_DAYS) || strength < WEAK_BELOW ? "weak"
      : strength >= STRONG_AT ? "strong" : strength >= GOOD_AT ? "good" : "light";
    out[page] = { page, state, keys, stage: manzil ? "manzil" : "sabqi", due, strength, errors };
  }
  return out;
}

let juzPages: number[][] | null = null;
/** Pages grouped by the juz their first ayah belongs to (30 sections, 604 pages). */
export function pagesByJuz(): number[][] {
  if (juzPages) return juzPages;
  const first = new Map<number, number>();
  for (const k of allAyahs()) { const p = pageOfAyah(k); if (!first.has(p)) first.set(p, juzOfAyah(k)); }
  juzPages = Array.from({ length: 30 }, () => []);
  for (const [p, j] of [...first].sort((a, b) => a[0] - b[0])) juzPages[j - 1]?.push(p);
  return juzPages;
}

/** Most recent graded review touching this page. */
export function lastReview(events: HifzEvent[], page: number): { day: string; grade: Grade } | null {
  let best: HifzEvent | null = null;
  for (const e of events) if (e.page === page && e.grade && e.kind !== "placement" && (!best || e.at > best.at)) best = e;
  return best ? { day: best.day, grade: best.grade! } : null;
}
