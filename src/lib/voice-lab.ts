// Pure helpers for the hidden Voice Lab: Arabic normalization and word-level comparison.

/** Strips harakat, Quranic marks and tatweel, and unifies letter variants, so only the letters are compared. */
export function normalizeArabic(s: string): string {
  return s
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\u0621-\u064A\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type WordResult = { word: string; status: "ok" | "missed" };
export type DiffResult = { words: WordResult[]; extra: string[]; accuracy: number };

/** Aligns expected words to heard words (longest common subsequence on normalized letters). */
export function compareWords(expected: string, heard: string): DiffResult {
  const exp = expected.split(/\s+/).filter((w) => normalizeArabic(w));
  const e = exp.map(normalizeArabic);
  const h = normalizeArabic(heard).split(" ").filter(Boolean);
  const dp = Array.from({ length: e.length + 1 }, () => new Array<number>(h.length + 1).fill(0));
  for (let i = e.length - 1; i >= 0; i--)
    for (let j = h.length - 1; j >= 0; j--)
      dp[i][j] = e[i] === h[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const words: WordResult[] = [];
  const extra: string[] = [];
  let i = 0, j = 0;
  while (i < e.length || j < h.length) {
    if (i < e.length && j < h.length && e[i] === h[j]) { words.push({ word: exp[i], status: "ok" }); i++; j++; }
    else if (j < h.length && (i >= e.length || dp[i][j + 1] >= dp[i + 1][j])) { extra.push(h[j]); j++; }
    else { words.push({ word: exp[i], status: "missed" }); i++; }
  }
  const ok = words.filter((w) => w.status === "ok").length;
  return { words, extra, accuracy: e.length ? ok / e.length : 0 };
}
