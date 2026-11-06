/**
 * Recitation checker: compares what the model heard (Quran phonetic script) with what the
 * reciter should have said, word by word. Separates MEMORY mistakes (wrong / skipped words)
 * from PRONUNCIATION differences (accent, tajweed), which are only ever "unsure".
 *
 * Answer key: /hifz-ai/ayat/NNN.json  ->  { "aya": [[wordNumber, writtenText, phonemes], ...] }
 */
import { cachedAsset } from "./assets";

export type WordStatus = "pending" | "in_progress" | "correct" | "wrong" | "skipped" | "unsure";

export interface WordResult {
  key: string; // "sura:aya:word"
  text: string; // written word (may be 2+ words when the sounds can't be split)
  status: WordStatus;
  expected: string;
  heard: string;
  at?: number; // index in the heard string of this word's first sound (for timing / hesitation)
  end?: number; // index of its last sound
}

export interface ExtraSpeech {
  atKey: string;
  heard: string;
  kind: "repeat" | "extra";
}

export interface CheckResult {
  heard?: string; // unmodified recognizer emissions, attached by the live session
  conf?: number[]; // confidence per emitted character
  times?: number[]; // seconds from the start, per emitted character (for hesitation detection)
  words: WordResult[];
  extras: ExtraSpeech[];
  reachedIndex: number; // how far into the reference the recitation has got
  startIndex: number; // where the recitation began (an ayah start); words before it stay "pending"
  startKey: string; // key of the first word the reciter started from
}

interface RefWord {
  key: string;
  text: string;
  ph: string;
  s: number; // span in the normalized reference string
  e: number;
}

export interface Reference {
  words: RefWord[];
  norm: string;
}

// ---------- answer key ----------

type SurahKey = Record<string, [number, string, string][]>;
const surahCache = new Map<number, Promise<SurahKey>>();

export function loadSurah(sura: number, base = "/hifz-ai/ayat"): Promise<SurahKey> {
  if (!surahCache.has(sura)) {
    const p = cachedAsset(`${base}/${String(sura).padStart(3, "0")}.json`).then((r) => {
      if (!r.ok) throw new Error(`answer key for surah ${sura} failed to load`);
      return r.json();
    }).catch((error) => { surahCache.delete(sura); throw error; });
    surahCache.set(sura, p);
  }
  const result = surahCache.get(sura);
  if (!result) throw new Error("Answer key unavailable");
  return result;
}

const DROP = new Set(["ڇ", "ۜ", " "]);
const WASL_START = ["ءَ", "ءِ", "ءُ"];

/** Drop tajweed-only marks and collapse repeated symbols (madd length is judged elsewhere). */
export function normalize(ph: string): { s: string; idx: number[] } {
  const out: string[] = [];
  const idx: number[] = [];
  let prev: string | null = null;
  const chars = Array.from(ph);
  chars.forEach((c, i) => {
    if (DROP.has(c)) {
      if (c === " ") prev = null;
      return;
    }
    if (c === prev) return;
    out.push(c);
    idx.push(i);
    prev = c;
  });
  return { s: out.join(""), idx };
}

/** Reference for ayat first..last of a surah, recited back to back. */
export function buildReference(key: SurahKey, sura: number, first: number, last = first): Reference {
  const words: RefWord[] = [];
  const parts: string[] = [];
  let pos = 0;
  for (let a = first; a <= last; a++) {
    for (const [w, text, phRaw] of key[String(a)] ?? []) {
      let ph = phRaw;
      // reciting ayat back to back, an opening hamzat al-wasl loses its hamza
      if (w === 1 && a !== first && text.startsWith("ٱ") && WASL_START.some((p) => ph.startsWith(p))) ph = ph.slice(2);
      const n = normalize(ph).s;
      words.push({ key: `${sura}:${a}:${w}`, text, ph, s: pos, e: pos + Array.from(n).length });
      parts.push(n);
      pos += Array.from(n).length;
    }
  }
  return { words, norm: parts.join("") };
}

// ---------- letter classes ----------

const VOWELS = new Set(["َ", "ُ", "ِ", "ا", "ۥ", "ۦ", "ں", "ۜ", "۟"]);
const SOFT_CLASSES = ["نں", "م۾", "ں۾", "سصث", "تطث", "دضظذز", "ءعأإ", "قك", "حهخ", "يى", "وۥ"];
const SOFT = new Map<string, Set<string>>();
for (const cls of SOFT_CLASSES) for (const c of cls) {
  if (!SOFT.has(c)) SOFT.set(c, new Set());
  for (const d of cls) SOFT.get(c)!.add(d);
}
export const same = (a: string, b: string) => a === b || (SOFT.get(a)?.has(b) ?? false);
/** A vowel / length mark (the nasal ں counts as a consonant). */
export const isVowel = (c: string) => VOWELS.has(c) && c !== "ں";

/** Consonant skeleton: vowels dropped (except the nasal ں), repeats collapsed. */
export function skeleton(ph: string): string[] {
  const out: string[] = [];
  for (const c of ph) {
    if (VOWELS.has(c) && c !== "ں") continue;
    if (out[out.length - 1] !== c) out.push(c);
  }
  return out;
}

export function lev(a: string[], b: string[], soft = true): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      const sub = soft ? !same(a[i - 1], b[j - 1]) : a[i - 1] !== b[j - 1];
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (sub ? 1 : 0));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Best match of `pat` anywhere inside `text`. Returns [cost, start, end]. */
function bestSubstring(pat: string[], text: string[]): [number, number, number] {
  const n = pat.length;
  const m = text.length;
  if (n === 0) return [0, 0, 0];
  let prev = new Array(m + 1).fill(0);
  let sprev = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= n; i++) {
    const cur = [i];
    const st = [0];
    for (let j = 1; j <= m; j++) {
      const opts: [number, number][] = [
        [prev[j - 1] + (same(pat[i - 1], text[j - 1]) ? 0 : 1), sprev[j - 1]],
        [prev[j] + 1, sprev[j]],
        [cur[j - 1] + 1, st[j - 1]],
      ];
      opts.sort((x, y) => x[0] - y[0] || x[1] - y[1]);
      cur[j] = opts[0][0];
      st[j] = opts[0][1];
    }
    prev = cur;
    sprev = st;
  }
  let best = 0;
  for (let j = 0; j <= m; j++) if (prev[j] < prev[best] || (prev[j] === prev[best] && j > best)) best = j;
  return [prev[best], sprev[best], best];
}


export interface WordJudgement {
  status: WordStatus;
  /** Nothing was heard for the word at all. */
  skippedOutright: boolean;
  /** Leftover sound pieces (3+ consonants) said around the word: repeats or added speech. */
  strays: string[][];
}

/**
 * Judge one word from the sounds aligned to it. MEMORY mistakes (wrong / skipped) need clear
 * evidence; pronunciation-level differences are only ever "unsure".
 */
/** Edit distance for judging: a breathy ه / ء / ع slipped in by the model counts half. */
function judgeLev(a: string[], b: string[]): number {
  const light = (c: string) => c === "ه" || c === "ء" || c === "ع";
  let prev = [0];
  for (let j = 1; j <= b.length; j++) prev[j] = prev[j - 1] + (light(b[j - 1]) ? 0.5 : 1);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + (light(b[j - 1]) ? 0.5 : 1), prev[j - 1] + (same(a[i - 1], b[j - 1]) ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}

export function judgeWord(expected: string, heardTxt: string, wconf: number): WordJudgement {
  // the tanween / ikhfa nasal (ں) is tajweed, not memory: said or not, judge whichever fits better
  const nasal = (c: string) => (c === "ں" ? "ن" : c);
  const heardSk = skeleton(heardTxt).map(nasal);
  const full = skeleton(expected).map(nasal);
  const bare = skeleton(expected).filter((c) => c !== "ں");
  const a = judgeSkeleton(expected, full, heardTxt, heardSk, wconf);
  if (bare.length === full.length) return a;
  const b = judgeSkeleton(expected, bare, heardTxt, heardSk, wconf);
  const rank = (x: WordJudgement) => ["correct", "unsure", "wrong", "skipped"].indexOf(x.status) * 10 + x.strays.length;
  return rank(b) < rank(a) ? b : a;
}

function judgeSkeleton(expected: string, expSk: string[], heardTxt: string, heardSk: string[], wconf: number): WordJudgement {
  if (heardSk.length === 0) return { status: expSk.length ? "skipped" : "correct", skippedOutright: true, strays: [] };
  let [hard, a, b] = bestSubstring(expSk, heardSk);
  const soft = lev(Array.from(expected), Array.from(heardTxt));
  const L = Math.max(1, expSk.length);
  // one stray letter before the word is usually the tail of the previous word (طِبَاقًا مَا -> "طباقت ما")
  const stray = [...(a >= 2 ? heardSk.slice(0, a) : []), ...heardSk.slice(b)];
  const extraCons = stray.filter((c) => !"ءعيو".includes(c)).length; // hamza onsets / glides aren't new letters
  const added = hard === 0 && extraCons > 0 && extraCons <= 2;
  if (added) {
    hard = lev(expSk, heardSk); // a letter or two stuck onto the word: the word itself changed
    a = 0;
    b = heardSk.length;
  }
  let status: WordStatus;
  // one swapped letter in a long word (plus model breath noise) is pronunciation or a mishearing,
  // never a memory mistake: a long word needs 2+ real letter changes to be "wrong"
  const real = judgeLev(expSk, added ? heardSk : heardSk.slice(a, b));
  if (hard === 0) status = soft <= 2 ? "correct" : "unsure";
  else if (hard >= L * 0.75 && L >= 2 && a === b) status = "skipped";
  else if (L >= 4 && real < 2) status = "unsure";
  else if (hard / L >= 0.5) {
    const onlyMissing = hard === L - (b - a);
    const need = L <= 2 && !added ? 0.85 : 0.6; // a swapped sound in a 1-2 letter word needs a surer model
    status = wconf >= need && !onlyMissing ? "wrong" : "unsure";
  } else status = "unsure";
  const strays: string[][] = [];
  if (hard < L) for (const piece of [heardSk.slice(0, a), heardSk.slice(b)]) if (piece.length >= 3) strays.push(piece);
  return { status, skippedOutright: false, strays };
}

// ---------- alignment ----------

type Op = ["equal" | "replace" | "delete" | "insert", number, number];

/** Edit distance of `head` against the reference from s, with a free end on the reference side. */
function prefixCost(head: string[], ref: string[], s: number): number {
  const seg = ref.slice(s, s + head.length + 8);
  let prev = Array.from({ length: seg.length + 1 }, (_, j) => j);
  for (let i = 1; i <= head.length; i++) {
    const cur = new Array(seg.length + 1).fill(0);
    cur[0] = i;
    for (let j = 1; j <= seg.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (head[i - 1] === seg[j - 1] ? 0 : 1));
    prev = cur;
  }
  return Math.min(...prev);
}

/**
 * Where the reciter began: the range start unless the opening sounds clearly match a later ayah
 * start, or (when no ayah start fits) any later word start: starting in the middle of an ayah.
 */
export function findStart(ref: string[], rec: string[], starts: number[], headLen = 20, wordStarts: number[] = []): number {
  const head = rec.slice(0, headLen);
  if (head.length < 8 || !starts.length) return 0;
  const base = prefixCost(head, ref, 0);
  let best = base;
  let where = 0;
  for (const st of starts) {
    if (st > 0) {
      const c = prefixCost(head, ref, st);
      if (c < best) { best = c; where = st; }
    }
  }
  if (where && best <= 0.35 * head.length && base - best >= 0.2 * head.length) return where;
  // no ayah start fits: try every word start, but only accept a clear, close match
  let wBest = Math.min(base, where ? best : base);
  let wWhere = 0;
  for (const st of wordStarts) {
    if (st <= 0) continue;
    const c = prefixCost(head, ref, st);
    if (c < wBest) { wBest = c; wWhere = st; }
  }
  return wWhere && wBest <= 0.25 * head.length && base - wBest >= 0.3 * head.length ? wWhere : 0;
}

function alignOps(ref: string[], rec: string[], final: boolean, start = 0): [number, Op[]] {
  const n = ref.length;
  const m = rec.length;
  const INF = 1e9;
  const d: Int32Array[] = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = 0; i <= n; i++) d[i][0] = i >= start ? i - start : INF;
  for (let j = 0; j <= m; j++) d[start][j] = j;
  for (let i = start + 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ref[i - 1] === rec[j - 1] ? 0 : 1));
    }
  }
  let end = final ? n : start;
  if (!final && m > 0) {
    let best = Infinity;
    for (let i = start; i <= n; i++) if (d[i][m] <= best) { best = d[i][m]; end = i; }
  }
  const ops: Op[] = [];
  let i = end;
  let j = m;
  while (i > start || j > 0) {
    if (i > start && j > 0 && d[i][j] === d[i - 1][j - 1] + (ref[i - 1] === rec[j - 1] ? 0 : 1)) {
      ops.push([ref[i - 1] === rec[j - 1] ? "equal" : "replace", i - 1, j - 1]);
      i--; j--;
    } else if (i > start && d[i][j] === d[i - 1][j] + 1) {
      ops.push(["delete", i - 1, j]);
      i--;
    } else {
      ops.push(["insert", i, j - 1]);
      j--;
    }
  }
  ops.reverse();
  return [end, ops];
}

function coveredByNearby(piece: string[], ref: string[], words: RefWord[], k: number): number {
  const covered = new Array(piece.length).fill(false);
  for (const x of words.slice(Math.max(0, k - 5), k + 3)) {
    const sk = skeleton(ref.slice(x.s, x.e).join(""));
    if (sk.length < 2) continue;
    for (let st = 0; st + sk.length <= piece.length; st++) {
      if (lev(sk, piece.slice(st, st + sk.length)) <= Math.floor(sk.length / 3)) {
        for (let t = st; t < st + sk.length; t++) covered[t] = true;
      }
    }
  }
  return covered.filter(Boolean).length / Math.max(1, piece.length);
}

/**
 * Check a recitation.
 * heard: everything the model has emitted so far (phoneme string), conf: confidence per character (optional).
 * final = false while reciting (words not reached stay pending), true when the user finished.
 */
export function check(reference: Reference, heard: string, final: boolean, conf?: number[]): CheckResult {
  const { s: recStr, idx } = normalize(heard);
  const rec = Array.from(recStr);
  const heardChars = Array.from(heard);
  const rconf = conf ? idx.map((i) => conf[i] ?? 1) : rec.map(() => 1);
  const ref = Array.from(reference.norm);
  if (!final && rec.length < 8) {
    // too little heard to know where the reciter began: judge nothing yet
    const words = reference.words.map((w) => ({ key: w.key, text: w.text, status: "pending" as WordStatus, expected: ref.slice(w.s, w.e).join(""), heard: "" }));
    return { words, extras: [], reachedIndex: 0, startIndex: 0, startKey: reference.words[0]?.key ?? "" };
  }
  // the reciter may start at any ayah of the range
  const ayahStarts: number[] = [];
  const seen = new Set<string>();
  for (const w of reference.words) {
    const aya = w.key.slice(0, w.key.lastIndexOf(":"));
    if (!seen.has(aya)) { seen.add(aya); ayahStarts.push(w.s); }
  }
  const start = findStart(ref, rec, ayahStarts, 20, reference.words.map((w) => w.s));
  const [end, ops] = alignOps(ref, rec, final, start);

  const heardJ = new Array(ref.length).fill(-1);
  const insBefore = new Map<number, number[]>();
  for (const [op, i, j] of ops) {
    if (op === "equal" || op === "replace") heardJ[i] = j;
    else if (op === "insert") {
      if (!insBefore.has(i)) insBefore.set(i, []);
      insBefore.get(i)!.push(j);
    }
  }
  void heardChars;

  const words: WordResult[] = [];
  const extras: ExtraSpeech[] = [];
  reference.words.forEach((w, k) => {
    const expected = ref.slice(w.s, w.e).join("");
    if ((w.s >= end && !final) || w.e <= start) {
      words.push({ key: w.key, text: w.text, status: "pending", expected, heard: "" });
      return;
    }
    const eEff = Math.min(w.e, end);
    const jsSet = new Set<number>();
    for (let i = w.s; i < eEff; i++) if (heardJ[i] >= 0) jsSet.add(heardJ[i]);
    for (let i = w.s; i < eEff + (eEff === w.e ? 1 : 0); i++) for (const j of insBefore.get(i) ?? []) jsSet.add(j);
    const js = [...jsSet].sort((a, b) => a - b);
    const heardTxt = js.map((j) => rec[j]).join("");
    if (!final && w.e > end) {
      // "in progress" only once real speech matches the word's opening letters: a breath or a
      // stray sound must not reveal a hidden word before it is said
      const exp = skeleton(expected);
      const got = skeleton(heardTxt);
      const need = Math.min(2, exp.length);
      let match = 0;
      while (match < need && match < got.length && same(exp[match], got[match])) match++;
      const started = js.length > 0 && match >= need;
      words.push({ key: w.key, text: w.text, status: started ? "in_progress" : "pending", expected, heard: started ? heardTxt : "", ...(started ? { at: idx[js[0]], end: idx[js[js.length - 1]] } : {}) });
      return;
    }
    const wconf = js.length ? js.reduce((t, j) => t + rconf[j], 0) / js.length : 1;
    const jw = judgeWord(expected, heardTxt, wconf);
    if (jw.skippedOutright) {
      words.push({ key: w.key, text: w.text, status: jw.status, expected, heard: heardTxt });
      return;
    }
    let status = jw.status;
    for (const piece of jw.strays) {
      const kind = coveredByNearby(piece, ref, reference.words, k) >= 0.6 ? "repeat" : "extra";
      extras.push({ atKey: w.key, heard: piece.join(""), kind });
      if (kind === "extra" && status === "correct") status = "unsure";
    }
    words.push({ key: w.key, text: w.text, status, expected, heard: heardTxt, ...(js.length ? { at: idx[js[0]], end: idx[js[js.length - 1]] } : {}) });
  });

  // a whole passage left out: stray sounds inside a run of skips are skips too
  words.forEach((wr, i) => {
    if (wr.status === "wrong" || wr.status === "unsure") {
      const near = [...words.slice(Math.max(0, i - 2), i), ...words.slice(i + 1, i + 3)];
      if (near.filter((x) => x.status === "skipped").length >= 3) wr.status = "skipped";
    }
  });
  // The model can drop a short word right after a pause (ayah start). One short word missing there,
  // with its neighbours recited, is "unsure", not a skip: never accuse a correct reciter.
  words.forEach((wr, i) => {
    const near = [...words.slice(Math.max(0, i - 1), i), ...words.slice(i + 1, i + 2)];
    if (wr.status === "skipped" && wr.key.endsWith(":1") && skeleton(wr.expected).length <= 3 &&
        near.every((x) => x.status !== "skipped" && x.status !== "pending")) wr.status = "unsure";
  });
  const startKey = reference.words.find((w) => w.s >= start)?.key ?? reference.words[0]?.key ?? "";
  return { words, extras, reachedIndex: end, startIndex: start, startKey };
}

/**
 * Final check for free reading: judge only as far as the reciter actually got.
 * check(..., final = true) assumes the whole range was meant to be recited, so stopping half way
 * down a page would mark every remaining word "skipped" (and can pull already-correct words at
 * the end into that skip). Here the range is cut where the live alignment reached, and the rest
 * stays "pending".
 */
export function checkReached(reference: Reference, heard: string, conf?: number[]): CheckResult {
  const live = check(reference, heard, false, conf);
  let cut = 0;
  live.words.forEach((w, i) => { if (w.status !== "pending") cut = i + 1; });
  if (cut === 0 || cut >= reference.words.length) return check(reference, heard, true, conf);
  const words = reference.words.slice(0, cut);
  const sub: Reference = { words, norm: Array.from(reference.norm).slice(0, words[words.length - 1].e).join("") };
  const done = check(sub, heard, true, conf);
  const rest = live.words.slice(cut);
  return { ...done, words: [...done.words, ...rest] };
}
