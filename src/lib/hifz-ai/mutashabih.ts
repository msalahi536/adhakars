/**
 * Mutashabihat catcher: when a recitation goes off the lesson, find which similar ayah elsewhere in the
 * Quran the reciter drifted into ("You went to Al-Baqarah 123"), so the app can drill the difference.
 */
import type { CheckResult, WordResult } from "./checker";
import { loadQuranIndex, skel } from "./quran-index";

export interface Drift {
  atKey: string; // first lesson word where the drift started
  wentTo: { sura: number; aya: number; word: number }; // where the recited words actually belong
  wentToEnd: { sura: number; aya: number; word: number };
  heard: string; // phonemes that drifted
  score: number; // 0..1 match quality of the other ayah
}

type Range = { sura: number; first: number; last: number };

const inRanges = (sura: number, aya: number, ranges: Range[]) =>
  ranges.some((r) => r.sura === sura && aya >= r.first && aya <= r.last);

/**
 * Look for drifts in a finished recitation. A drift = a run of wrong/skipped/unsure words containing at
 * least one wrong word, whose heard sounds match another ayah of the Quran better than the lesson.
 */
export async function findDrifts(result: CheckResult, ranges: Range[]): Promise<Drift[]> {
  const ix = await loadQuranIndex();
  const words = result.words;
  const extrasAt = new Map<string, string>();
  for (const x of result.extras) extrasAt.set(x.atKey, (extrasAt.get(x.atKey) ?? "") + x.heard);
  const drifts: Drift[] = [];
  let i = 0;
  while (i < words.length) {
    const bad = (w: WordResult) => w.status === "wrong" || w.status === "skipped" || w.status === "unsure" || extrasAt.has(w.key);
    if (!bad(words[i])) { i++; continue; }
    let j = i;
    while (j < words.length && bad(words[j])) j++;
    const run = words.slice(i, j);
    // include a few correct words on each side: similar ayat share most of their words, so the
    // shared context is what tells the two places apart
    const from = Math.max(0, i - 3);
    const to = Math.min(words.length, j + 3);
    const heard = words.slice(from, to).map((w) => w.heard + (extrasAt.get(w.key) ?? "")).join("");
    const sk = skel(heard);
    const suspicious = run.some((w) => w.status === "wrong" || extrasAt.has(w.key)) || run.filter((w) => w.status !== "correct").length >= 2;
    if (suspicious && sk.length >= 8) {
      const hits = ix.search(sk, 5);
      const other = hits.find((h) => {
        const w = ix.where(h.start);
        const e = ix.where(Math.max(h.start, h.end - 1));
        return h.score >= 0.75 && !(inRanges(w.sura, w.aya, ranges) && inRanges(e.sura, e.aya, ranges));
      });
      // the other ayah must explain the heard sounds clearly better than the lesson words did
      const expected = skel(words.slice(from, to).map((w) => w.expected).join(""));
      const lessonFit = expected.length ? 1 - levRatio(sk, expected) : 0;
      const dup = other && drifts.some((d) => d.wentTo.sura === ix.where(other.start).sura && d.wentTo.aya === ix.where(other.start).aya);
      if (other && !dup && other.score >= lessonFit + 0.1) {
        drifts.push({
          atKey: run[0].key,
          wentTo: ix.where(other.start),
          wentToEnd: ix.where(Math.max(other.start, other.end - 1)),
          heard,
          score: other.score,
        });
      }
    }
    i = j;
  }
  return drifts;
}

function levRatio(a: string, b: string): number {
  const x = Array.from(a);
  const y = Array.from(b);
  let prev = Array.from({ length: y.length + 1 }, (_, j) => j);
  for (let i = 1; i <= x.length; i++) {
    const cur = [i];
    for (let j = 1; j <= y.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[y.length] / Math.max(x.length, y.length, 1);
}

/**
 * Word-level difference between two similar ayat (for the "spot the difference" drill).
 * Returns each ayah's words with `same: false` on the words that differ.
 */
export function diffAyat(a: string[], b: string[]): { a: { text: string; same: boolean }[]; b: { text: string; same: boolean }[] } {
  const norm = (w: string) => w.replace(/[ً-ٰٟۖ-ۭـ]/g, "").replace(/[ٱأإآ]/g, "ا");
  const A = a.map(norm);
  const B = b.map(norm);
  const L = Array.from({ length: A.length + 1 }, () => new Array<number>(B.length + 1).fill(0));
  for (let i = A.length - 1; i >= 0; i--)
    for (let j = B.length - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const sa = new Array(A.length).fill(false);
  const sb = new Array(B.length).fill(false);
  let i = 0;
  let j = 0;
  while (i < A.length && j < B.length) {
    if (A[i] === B[j]) { sa[i] = sb[j] = true; i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  return { a: a.map((text, k) => ({ text, same: sa[k] })), b: b.map((text, k) => ({ text, same: sb[k] })) };
}
