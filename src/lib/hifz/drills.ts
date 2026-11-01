/**
 * Active recall drills built from memorized pages. Each drill says what to SHOW and what the
 * student must RECALL. The recite page renders them by hiding/showing words on the real mushaf.
 *
 *  cue          show the first 1-2 words of an ayah, recall the rest
 *  transition   show the end of one ayah, recall the start of the next (incl. page and surah boundaries)
 *  randomEntry  start anywhere in the memorized portion, recite 3 ayat onward
 *  before       show an ayah, recall the ayah that comes BEFORE it
 *  pageStart    "how does page N begin?" (positional memory)
 *  listen       the qari recites up to a point and stops, the student continues
 *  mutashabih   two similar verses side by side, recall the word that differs
 */
import type { HifzState, WeakSpot } from "./types";

export interface PageVerses {
  page: number;
  verses: { key: string; words: string[] }[]; // words in reading order (from Quran.com word data)
}

export type Drill =
  | { kind: "cue"; page: number; verse: string; showWords: number }
  | { kind: "transition"; page: number; from: string; to: string; showLastWords: number; recallWords: number }
  | { kind: "randomEntry"; page: number; startVerse: string; ayat: number }
  | { kind: "before"; page: number; shown: string; answer: string }
  | { kind: "pageStart"; page: number; answerVerse: string }
  | { kind: "listen"; page: number; verse: string; stopAfterWord: number }
  | { kind: "mutashabih"; a: string; b: string };

/** Small deterministic random so the same day gives the same drills. */
function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

/**
 * Build a drill set. Weak spots come first; the rest is spread across memorized pages,
 * weighted toward weaker pages, and interleaved (no two drills in a row from the same page).
 */
export function buildDrills(s: HifzState, pages: PageVerses[], today: string, count = 8): Drill[] {
  const r = rng(today);
  const out: Drill[] = [];
  const byKey = new Map<string, { page: number; idx: number; list: PageVerses }>();
  const flat: { key: string; page: number; words: string[] }[] = [];
  for (const pv of pages) pv.verses.forEach((v, idx) => {
    byKey.set(v.key, { page: pv.page, idx, list: pv });
    flat.push({ key: v.key, page: pv.page, words: v.words });
  });
  const flatIdx = new Map(flat.map((v, i) => [v.key, i]));

  // 1. weak spots -> targeted drills
  const spots = Object.values(s.weakSpots).sort((a, b) => b.fails - b.passes - (a.fails - a.passes));
  for (const w of spots) {
    const d = drillForWeakSpot(w, flat, flatIdx);
    if (d) out.push(d);
    if (out.length >= Math.ceil(count / 2)) break;
  }

  // 2. general drills over memorized pages, weaker pages more likely
  const memorized = pages.filter((p) => s.pages[p.page]?.memory && p.verses.length);
  if (!memorized.length) return out;
  const weight = (p: PageVerses) => {
    const m = s.pages[p.page].memory!;
    return 1 + m.lapses * 2 + (10 - Math.min(10, m.stability)) / 2;
  };
  const totalW = memorized.reduce((a, p) => a + weight(p), 0);
  const pick = () => {
    let x = r() * totalW;
    for (const p of memorized) if ((x -= weight(p)) <= 0) return p;
    return memorized[memorized.length - 1];
  };
  const kinds: Drill["kind"][] = ["cue", "transition", "randomEntry", "before", "pageStart", "listen"];
  let guard = 0;
  while (out.length < count && guard++ < count * 10) {
    const pv = pick();
    const lastPage = out.length ? pageOf(out[out.length - 1]) : -1;
    if (pv.page === lastPage && memorized.length > 1) continue; // interleave
    const kind = kinds[Math.floor(r() * kinds.length)];
    const vi = Math.floor(r() * pv.verses.length);
    const v = pv.verses[vi];
    const gi = flatIdx.get(v.key)!;
    switch (kind) {
      case "cue":
        out.push({ kind, page: pv.page, verse: v.key, showWords: v.words.length > 6 ? 2 : 1 });
        break;
      case "transition": {
        const next = flat[gi + 1];
        if (!next) continue;
        out.push({ kind, page: pv.page, from: v.key, to: next.key, showLastWords: 2, recallWords: Math.min(4, next.words.length) });
        break;
      }
      case "randomEntry":
        out.push({ kind, page: pv.page, startVerse: v.key, ayat: 3 });
        break;
      case "before": {
        const prev = flat[gi - 1];
        if (!prev) continue;
        out.push({ kind, page: pv.page, shown: v.key, answer: prev.key });
        break;
      }
      case "pageStart":
        out.push({ kind, page: pv.page, answerVerse: pv.verses[0].key });
        break;
      case "listen":
        out.push({ kind, page: pv.page, verse: v.key, stopAfterWord: Math.max(1, Math.floor(v.words.length * (0.3 + r() * 0.4))) });
        break;
    }
  }
  return out;
}

const pageOf = (d: Drill) => ("page" in d ? d.page : -1);

function drillForWeakSpot(
  w: WeakSpot,
  flat: { key: string; page: number; words: string[] }[],
  idx: Map<string, number>,
): Drill | null {
  if (w.kind === "mutashabih") {
    const [a, b] = w.key.slice(2).split(">");
    return { kind: "mutashabih", a, b };
  }
  if (w.kind === "transition") {
    const to = w.key.slice(2);
    const i = idx.get(to);
    if (i === undefined || i === 0) return null;
    return { kind: "transition", page: flat[i].page, from: flat[i - 1].key, to, showLastWords: 2, recallWords: Math.min(4, flat[i].words.length) };
  }
  // word: cue the ayah right up to the failing word
  const [sura, aya, word] = w.key.split(":");
  const key = `${sura}:${aya}`;
  const i = idx.get(key);
  if (i === undefined) return null;
  return { kind: "cue", page: flat[i].page, verse: key, showWords: Math.max(0, Number(word) - 1) };
}
