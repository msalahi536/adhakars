// Pure Hifz scheduling rules (no I/O). Intervals are whole days; days are device-local YYYY-MM-DD.
// No ease factor: the rules below are deterministic multipliers only.

export type Grade = "blank" | "mistake" | "hesitation" | "perfect";
export type Stage = "sabaq" | "sabqi" | "manzil";

export const FIRST_INTERVAL = 1;
export const GRADUATE_AT = 14;
export const MANZIL_FIRST = 7;
export const MANZIL_CAP = 30;
export const WORD_ERROR_PULL = 3;
export const WORD_ERROR_WINDOW_DAYS = 30;

export type AyahItem = { key: string; page: number; stage: Stage; interval: number; due: string; graduated: boolean };
export type PageItem = { page: number; inManzil: boolean; interval: number; due: string };

/** Device-local calendar day, so "due today" flips at local midnight, not UTC. */
export function localDay(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(day: string, n: number): string {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000);
}

export const isDue = (item: { due: string }, now: Date) => item.due <= localDay(now);

export function nextAyahInterval(current: number, grade: Grade): number {
  switch (grade) {
    case "blank":
      return 1;
    case "mistake":
      return Math.max(1, Math.round(current * 0.5));
    case "hesitation":
      return Math.ceil(current * 1.2);
    case "perfect":
      return current * 2;
  }
}

export function newAyah(key: string, page: number, day: string): AyahItem {
  return { key, page, stage: "sabaq", interval: FIRST_INTERVAL, due: addDays(day, FIRST_INTERVAL), graduated: false };
}

/**
 * Reviewed before its due date: growth is earned only for the days actually elapsed since the last review
 * (last review = due − interval). Perfect: max(current, elapsed × 2); Hesitation: elapsed × 1.2 (at least 1).
 * Mistake/Blank and on-time or late reviews use the normal multipliers.
 */
export function reviewInterval(current: number, due: string, grade: Grade, day: string): number {
  if (day >= due || grade === "mistake" || grade === "blank") return nextAyahInterval(current, grade);
  const elapsed = Math.max(0, daysBetween(addDays(due, -current), day));
  return grade === "perfect" ? Math.max(current, elapsed * 2) : Math.max(1, Math.ceil(elapsed * 1.2));
}

export function gradeAyah(a: AyahItem, grade: Grade, day: string): AyahItem {
  const interval = reviewInterval(a.interval, a.due, grade, day);
  const graduated = interval >= GRADUATE_AT;
  return { ...a, interval, due: addDays(day, interval), graduated, stage: graduated ? "manzil" : "sabqi" };
}

/** Judged only on memorized ayahs: a page enters manzil when every one of them has graduated. */
export function pageReady(memorized: AyahItem[]): boolean {
  return memorized.length > 0 && memorized.every((a) => a.graduated);
}

/** Weakest memorized ayah, never the average; overdue days reduce an ayah's strength. */
export function pageStrength(memorized: AyahItem[], today: string): number {
  if (!memorized.length) return 0;
  return Math.min(...memorized.map((a) => Math.max(0, a.interval - Math.max(0, daysBetween(a.due, today)))));
}

export function enterManzil(page: number, day: string): PageItem {
  return { page, inManzil: true, interval: MANZIL_FIRST, due: addDays(day, MANZIL_FIRST) };
}

/** Perfect/Hesitation grow the page (cap 30). Mistake/Blank send error-tapped ayahs to sabqi at 1 day. */
export function gradePage(p: PageItem, memorized: AyahItem[], grade: Grade, errorKeys: string[], day: string) {
  if (grade === "perfect" || grade === "hesitation") {
    const interval = Math.min(MANZIL_CAP, reviewInterval(p.interval, p.due, grade, day));
    return { page: { ...p, interval, due: addDays(day, interval) }, ayahs: memorized };
  }
  const errs = new Set(errorKeys);
  const ayahs = memorized.map((a) =>
    errs.has(a.key) ? { ...a, stage: "sabqi" as Stage, graduated: false, interval: 1, due: addDays(day, 1) } : a,
  );
  return { page: pageReady(ayahs) ? p : { ...p, inManzil: false }, ayahs };
}

/** A hint or any word tapped as wrong rules out Perfect: the best grade is then Hesitation. */
export function capGrade(g: Grade, hintUsed: boolean, wrongWords: number): Grade {
  return g === "perfect" && (hintUsed || wrongWords > 0) ? "hesitation" : g;
}
