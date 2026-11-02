/**
 * Whole-Quran voice index: find where any recited snippet is, among all 6236 ayat, in a few ms.
 * The Quran is one consonant "skeleton" string (vowels dropped, similar sounds merged, repeats collapsed)
 * with a map from every letter back to (surah, ayah, word). Search = 3-gram diagonal voting + fuzzy check.
 * Data: /hifz-ai/quran-index.json (176 KB gzipped). Used by voice search, follow-along, mutashabihat.
 */
import { cachedAsset } from "./assets";

const VOWELS = new Set(["َ", "ُ", "ِ", "ا", "ۥ", "ۦ", "ۜ", "۟"]);
const DROP = new Set(["ڇ", "ۜ", " "]);
const CANON: Record<string, string> = {
  "ں": "ن", "۾": "م", "ص": "س", "ث": "س", "ط": "ت", "ض": "د", "ظ": "د", "ذ": "د", "ز": "د",
  "ع": "ء", "أ": "ء", "إ": "ء", "ك": "ق", "ه": "ح", "خ": "ح", "ى": "ي", "ۥ": "و",
};
const N = 3;

/** Consonant skeleton of recognizer phonemes (same rules as the index). */
export function skel(ph: string): string {
  let out = "";
  for (const ch of ph) {
    if (VOWELS.has(ch) || DROP.has(ch)) continue;
    const c = CANON[ch] ?? ch;
    if (!out.endsWith(c)) out += c;
  }
  return out;
}

export interface Hit {
  start: number; // skeleton index of the match start
  end: number; // just past the match end
  cost: number; // edit distance
  score: number; // 1 = perfect
}

export interface WordRef {
  sura: number;
  aya: number;
  word: number;
}

/** Best placement of q inside seg (free start and end in seg). Returns [cost, start, end] within seg. */
export function fit(q: string[], seg: string[], early = false): [number, number, number] {
  const n = q.length;
  const m = seg.length;
  let prev = new Int32Array(m + 1);
  let sp = Int32Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = new Int32Array(m + 1);
    const sc = new Int32Array(m + 1);
    cur[0] = i;
    for (let j = 1; j <= m; j++) {
      const a = prev[j - 1] + (q[i - 1] === seg[j - 1] ? 0 : 1);
      const b = prev[j] + 1;
      const c = cur[j - 1] + 1;
      if (a <= b && a <= c) { cur[j] = a; sc[j] = sp[j - 1]; }
      else if (b <= c) { cur[j] = b; sc[j] = sp[j]; }
      else { cur[j] = c; sc[j] = sc[j - 1]; }
    }
    prev = cur;
    sp = sc;
  }
  let best = early ? 0 : m;
  for (let j = 0; j <= m; j++) {
    const better = prev[j] < prev[best] || (prev[j] === prev[best] && (early ? j < best : j > best));
    if (better) best = j;
  }
  return [prev[best], sp[best], best];
}

export class QuranIndex {
  readonly S: string[]; // skeleton letters
  readonly wordOf: Int32Array; // skeleton pos -> global word index
  readonly words: WordRef[] = [];
  readonly wordStart: number[] = [];
  readonly ayaFirstWord = new Map<string, number>(); // "s:a" -> global word index
  private grams = new Map<string, number[]>();

  constructor(data: { S: string; wl: string; ayat: [number, number, number | number[]][] }) {
    this.S = Array.from(data.S);
    this.wordOf = new Int32Array(this.S.length);
    let w = 0;
    let pos = 0;
    for (const [sura, aya, spec] of data.ayat) {
      const nums = Array.isArray(spec) ? spec : Array.from({ length: spec }, (_, i) => i + 1);
      this.ayaFirstWord.set(`${sura}:${aya}`, this.words.length);
      for (const word of nums) {
        const len = parseInt(data.wl[w], 36);
        this.wordStart.push(pos);
        for (let k = 0; k < len; k++) this.wordOf[pos + k] = w;
        pos += len;
        this.words.push({ sura, aya, word });
        w++;
      }
    }
    for (let i = 0; i + N <= this.S.length; i++) {
      const g = this.S[i] + this.S[i + 1] + this.S[i + 2];
      let list = this.grams.get(g);
      if (!list) this.grams.set(g, (list = []));
      list.push(i);
    }
  }

  where(pos: number): WordRef {
    return this.words[this.wordOf[Math.max(0, Math.min(pos, this.S.length - 1))]];
  }

  key(pos: number): string {
    const w = this.where(pos);
    return `${w.sura}:${w.aya}:${w.word}`;
  }

  /** Skeleton start of an ayah (or -1). */
  ayaStart(sura: number, aya: number): number {
    const g = this.ayaFirstWord.get(`${sura}:${aya}`);
    return g === undefined ? -1 : this.wordStart[g];
  }

  /** Find a skeleton query anywhere in the Quran. `near` (a skeleton pos) breaks ties toward it. */
  search(query: string | string[], top = 5, near?: number): Hit[] {
    const q = typeof query === "string" ? Array.from(query) : query;
    if (q.length < N + 1) return [];
    const votes = new Map<number, number>();
    for (let o = 0; o + N <= q.length; o++) {
      const list = this.grams.get(q[o] + q[o + 1] + q[o + 2]);
      if (!list) continue;
      for (const p of list) {
        const d = Math.floor((p - o) / 4);
        votes.set(d, (votes.get(d) ?? 0) + 1);
      }
    }
    const cands = [...votes.entries()].sort((a, b) => b[1] - a[1]).slice(0, Math.max(30, top * 6));
    const hits = new Map<number, Hit>();
    for (const [d] of cands) {
      const lo = Math.max(0, d * 4 - 6);
      const hi = Math.min(this.S.length, d * 4 + q.length + 10);
      const [cost, a, b] = fit(q, this.S.slice(lo, hi));
      const h = { start: lo + a, end: lo + b, cost, score: 1 - cost / q.length };
      const old = hits.get(h.start);
      if (!old || old.cost > h.cost) hits.set(h.start, h);
    }
    const out = [...hits.values()].sort((x, y) => x.cost - y.cost || (near === undefined ? 0 : Math.abs(x.start - near) - Math.abs(y.start - near)));
    const uniq: Hit[] = [];
    for (const h of out) if (uniq.every((u) => Math.abs(h.start - u.start) > 3)) uniq.push(h);
    return uniq.slice(0, top);
  }
}

let shared: Promise<QuranIndex> | null = null;

/** Load (and cache offline) the whole-Quran index once. */
export function loadQuranIndex(url = "/hifz-ai/quran-index.json"): Promise<QuranIndex> {
  shared ??= cachedAsset(url)
    .then((r) => {
      if (!r.ok) throw new Error("Quran index failed to load");
      return r.json();
    })
    .then((d) => new QuranIndex(d))
    .catch((e) => {
      shared = null;
      throw e;
    });
  return shared;
}

export interface SearchAnswer {
  confident: boolean; // true = clear answer; false = keep listening (or "recite a little more")
  matches: { sura: number; aya: number; word: number; score: number; now: WordRef }[]; // best first; now = where the recitation has reached
  samePhrase: { sura: number; aya: number; word: number }[]; // other places with exactly the same words
}

/**
 * Voice search: where in the Quran is this recitation? Only confident with enough sounds (about 3+ words)
 * and a clear lead over the next different place. Two words alone match too many ayat.
 */
export function judgeSearch(ix: QuranIndex, phonemes: string, top = 3): SearchAnswer {
  const q = Array.from(skel(phonemes)).slice(0, 48);
  const hits = q.length >= 5 ? ix.search(q, Math.max(top, 8)) : [];
  // a match can begin on the previous ayah's last letter when it equals the first one heard: skip it
  // (or on a letter shared by two words, which the index stores once under the earlier word): report the next word
  const begin = (h: Hit) => {
    const p = h.start;
    if (p + 1 >= ix.S.length) return p;
    if (ix.S[p] !== q[0] && ix.S[p + 1] === q[0]) return p + 1;
    const lastOfWord = ix.wordOf[p] !== ix.wordOf[p + 1];
    return lastOfWord && ix.S[p] === q[0] ? p + 1 : p;
  };
  const text = (h: Hit) => ix.S.slice(h.start, h.end).join("");
  const good = hits.filter((h) => h.score >= 0.6);
  const [a] = good;
  const twins = a ? good.filter((h) => h !== a && text(h) === text(a)) : [];
  const b = good.find((h) => h !== a && text(h) !== text(a));
  const matches = [a, ...good.filter((h) => h !== a && !twins.includes(h))].filter(Boolean).slice(0, top).map((h) => ({ ...ix.where(begin(h)), score: h.score, now: ix.where(Math.max(begin(h), h.end - 1)) }));
  // the same words exist in several places: keep listening, the next words usually tell them apart
  const unique = twins.length === 0 || q.length >= 30;
  const confident = !!a && q.length >= 8 && a.score >= 0.7 && unique && (!b || a.score - b.score >= 0.12);
  return { confident, matches, samePhrase: twins.map((h) => ix.where(begin(h))) };
}

export async function findInQuran(phonemes: string, top = 3): Promise<SearchAnswer> {
  return judgeSearch(await loadQuranIndex(), phonemes, top);
}
