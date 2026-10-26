// Pure placement-test rules: which pages to test, how untested pages inherit, and the seed review logs.
// Seeding is only ever expressed as log events, so sync replay rebuilds it like any other review.
import { addDays, type Grade } from "./scheduler";
import type { Derived } from "./store";
import { juzOfAyah, pageOfAyah, surahOf } from "./layout";

export const SAMPLE_MIN = 3;
export const SAMPLE_MAX = 20;
export const STAGGER_DAYS = 30;
export const HESITATION_WITHIN = 3;
export const NEED_WORK_DAYS = 5;

/** About one prompt per two checked pages (3–20), spread evenly across everything checked. */
export function samplePages(pages: number[]): number[] {
  const ps = [...new Set(pages)].sort((a, b) => a - b);
  const n = Math.min(ps.length, Math.max(SAMPLE_MIN, Math.min(SAMPLE_MAX, Math.round(ps.length / 2))));
  if (n === 0) return [];
  return [...new Set(Array.from({ length: n }, (_, i) => ps[Math.floor(((i + 0.5) * ps.length) / n)]))];
}

const cap = (g: Grade): Grade => (g === "perfect" ? "hesitation" : g);

/** Untested pages take the nearest tested page in the same surah, else the same juz, else overall — capped at Hesitation. */
export function inheritGrades(pageKeys: Record<number, string[]>, tested: Record<number, Grade>): Record<number, Grade> {
  const testedPages = Object.keys(tested).map(Number);
  const out: Record<number, Grade> = {};
  const nearest = (p: number, pool: number[]) => pool.sort((a, b) => Math.abs(a - p) - Math.abs(b - p) || a - b)[0];
  for (const p of Object.keys(pageKeys).map(Number)) {
    if (tested[p]) { out[p] = tested[p]; continue; }
    const keys = pageKeys[p];
    const surahs = new Set(keys.map(surahOf)), juz = new Set(keys.map(juzOfAyah));
    const tKeys = (t: number) => pageKeys[t] ?? [];
    const sameSurah = testedPages.filter((t) => tKeys(t).some((k) => surahs.has(surahOf(k))));
    const sameJuz = testedPages.filter((t) => tKeys(t).some((k) => juz.has(juzOfAyah(k))));
    const src = nearest(p, sameSurah.length ? sameSurah : sameJuz.length ? sameJuz : [...testedPages]);
    out[p] = src ? cap(tested[src]) : "hesitation";
  }
  return out;
}

export function groupByPage(keys: string[]): Record<number, string[]> {
  const out: Record<number, string[]> = {};
  for (const k of keys) (out[pageOfAyah(k)] ??= []).push(k);
  return out;
}

export type SeedPlan = { page: number; keys: string[]; grade: Grade; dueOffset: number };

/** Perfect pages' first dues spread evenly over 30 days; Hesitation within 3 days; Mistake/Blank go to sabqi spread over 5 days. */
export function seedPlan(pageKeys: Record<number, string[]>, grades: Record<number, Grade>): SeedPlan[] {
  const pages = Object.keys(pageKeys).map(Number).sort((a, b) => a - b);
  const perfect = pages.filter((p) => grades[p] === "perfect");
  const hes = pages.filter((p) => grades[p] === "hesitation");
  const work = pages.filter((p) => grades[p] === "mistake" || grades[p] === "blank");
  return pages.map((p) => {
    const g = grades[p] ?? "hesitation";
    const dueOffset =
      g === "perfect" ? 1 + Math.floor((perfect.indexOf(p) * STAGGER_DAYS) / perfect.length)
      : g === "hesitation" ? 1 + (hes.indexOf(p) % HESITATION_WITHIN)
      : 1 + Math.floor((work.indexOf(p) * NEED_WORK_DAYS) / work.length);
    return { page: p, keys: pageKeys[p], grade: g, dueOffset };
  });
}

/** Real review load per day: manzil pages due that day plus distinct pages with sabqi ayahs due that day. */
export function dailyLoad(d: Derived, today: string, days: number): { day: string; pages: number }[] {
  return Array.from({ length: days }, (_, i) => {
    const day = addDays(today, i + 1);
    const manzil = Object.values(d.pages).filter((p) => p.inManzil && p.due === day).map((p) => p.page);
    const sabqi = Object.values(d.ayahs).filter((a) => a.stage === "sabqi" && a.due === day).map((a) => a.page);
    return { day, pages: new Set([...manzil, ...sabqi]).size };
  });
}
