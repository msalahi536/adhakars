/**
 * Quran structure for planning (Madani 15-line mushaf, 604 pages).
 * Build it once from Quran.com:  GET https://api.quran.com/api/v4/chapters  -> chapters[].pages = [first, last]
 */
import type { MemorizationOrder, QuranIndex, QuranPage } from "./types";

export const TOTAL_PAGES = 604;

/** Juz that starts on or before this page (Madani: juz 1 on page 1, juz n on page 2 + 20(n-1), juz 30 on 582). */
export function juzOfPage(page: number): number {
  if (page < 22) return 1;
  return Math.min(30, Math.floor((page - 2) / 20) + 1);
}

export function juzPages(juz: number): [number, number] {
  const first = juz === 1 ? 1 : 2 + 20 * (juz - 1);
  const last = juz === 30 ? TOTAL_PAGES : 1 + 20 * juz;
  return [first, last];
}

/** Lines of text per page. Pages 1 and 2 (Al-Fatiha, start of Al-Baqarah) are shorter in the Madani print. */
export function linesOnPage(page: number): number {
  return page <= 2 ? 8 : 15;
}

export function buildQuranIndex(chapters: { id: number; pages: [number, number] }[]): QuranIndex {
  const surahPages: Record<number, [number, number]> = {};
  const starts: Record<number, number[]> = {};
  for (const c of chapters) {
    surahPages[c.id] = c.pages;
    (starts[c.pages[0]] ??= []).push(c.id);
  }
  const pages: QuranPage[] = [];
  for (let p = 1; p <= TOTAL_PAGES; p++) {
    pages.push({ page: p, juz: juzOfPage(p), lines: linesOnPage(p), verseKeys: [], surahStarts: starts[p] ?? [] });
  }
  return { pages, surahPages };
}

export const totalLines = (q: QuranIndex) => q.pages.reduce((a, p) => a + p.lines, 0);

/** The pages in the order the student will memorize them. */
export function memorizationSequence(q: QuranIndex, order: MemorizationOrder): number[] {
  const seq: number[] = [];
  const push = (p: number) => {
    if (!seq.includes(p)) seq.push(p);
  };
  switch (order.kind) {
    case "forward":
      for (let p = order.fromPage; p <= TOTAL_PAGES; p++) push(p);
      for (let p = 1; p < order.fromPage; p++) push(p);
      break;
    case "backwardJuz":
      for (let j = 30; j >= 1; j--) {
        const [a, b] = juzPages(j);
        for (let p = a; p <= b; p++) push(p);
      }
      break;
    case "juzAmmaFirst": {
      // Juz 30 the traditional way: short surahs first (An-Nas, Al-Falaq ... An-Naba), then juz 29, 28 ... 1.
      const [a, b] = juzPages(30);
      for (let p = b; p >= a; p--) push(p);
      for (let j = 29; j >= 1; j--) {
        const [x, y] = juzPages(j);
        for (let p = x; p <= y; p++) push(p);
      }
      break;
    }
    case "surahs":
      for (const s of order.surahs) {
        const r = q.surahPages[s];
        if (!r) continue;
        for (let p = r[0]; p <= r[1]; p++) push(p);
      }
      break;
  }
  return seq;
}
