// Pure Hifz scheduling rules (no I/O). Intervals are whole days.
// No ease factor: the rules below are deterministic multipliers only.

export type Grade = "blank" | "mistake" | "hesitation" | "perfect";
export type Stage = "sabaq" | "sabqi" | "manzil";

export const FIRST_INTERVAL = 1;
export const GRADUATE_AT = 14;
export const MANZIL_FIRST = 7;
export const MANZIL_CAP = 30;
export const WORD_ERROR_PULL = 3;

export type AyahItem = {
  key: string; // "2:255"
  page: number;
  stage: Stage;
  interval: number;
  due: string; // YYYY-MM-DD
  graduated: boolean;
  updatedAt: string; // ISO
};

export type PageItem = {
  page: number;
  inManzil: boolean;
  interval: number;
  due: string;
  updatedAt: string;
};

export function addDays(day: string, n: number): string {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

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

export function newAyah(key: string, page: number, today: string, now: string): AyahItem {
  return { key, page, stage: "sabaq", interval: FIRST_INTERVAL, due: addDays(today, FIRST_INTERVAL), graduated: false, updatedAt: now };
}

export function gradeAyah(a: AyahItem, grade: Grade, today: string, now: string): AyahItem {
  const interval = nextAyahInterval(a.interval, grade);
  const graduated = interval >= GRADUATE_AT;
  return { ...a, interval, due: addDays(today, interval), graduated, stage: graduated ? "manzil" : "sabqi", updatedAt: now };
}

/** A page enters manzil only when every memorized ayah on it has graduated. */
export function pageReady(ayahs: AyahItem[]): boolean {
  return ayahs.length > 0 && ayahs.every((a) => a.graduated);
}

/** Page strength = weakest ayah interval on that page, never the average. */
export function pageStrength(ayahs: AyahItem[]): number {
  return ayahs.length ? Math.min(...ayahs.map((a) => a.interval)) : 0;
}

export function enterManzil(page: number, today: string, now: string): PageItem {
  return { page, inManzil: true, interval: MANZIL_FIRST, due: addDays(today, MANZIL_FIRST), updatedAt: now };
}

/**
 * Grade a whole manzil page. Perfect/Hesitation grow the page interval (cap 30).
 * Mistake/Blank send the error-tapped ayahs back to sabqi at 1 day and drop the page out of manzil.
 */
export function gradePage(
  p: PageItem,
  ayahs: AyahItem[],
  grade: Grade,
  errorKeys: string[],
  today: string,
  now: string,
): { page: PageItem; ayahs: AyahItem[] } {
  if (grade === "perfect" || grade === "hesitation") {
    const interval = Math.min(MANZIL_CAP, nextAyahInterval(p.interval, grade));
    return { page: { ...p, interval, due: addDays(today, interval), updatedAt: now }, ayahs };
  }
  const errs = new Set(errorKeys);
  const next = ayahs.map((a) =>
    errs.has(a.key) ? { ...a, stage: "sabqi" as Stage, graduated: false, interval: 1, due: addDays(today, 1), updatedAt: now } : a,
  );
  const page = pageReady(next) ? { ...p, updatedAt: now } : { ...p, inManzil: false, updatedAt: now };
  return { page, ayahs: next };
}

/** A word tapped as an error WORD_ERROR_PULL+ times pulls its page's review to today. */
export function pullForward(p: PageItem, wordErrorCount: number, today: string, now: string): PageItem {
  return wordErrorCount >= WORD_ERROR_PULL && p.due > today ? { ...p, due: today, updatedAt: now } : p;
}
