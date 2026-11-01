/**
 * Recitation checker: compares what the model heard (Quran phonetic script) with what the
 * reciter should have said, word by word. Separates MEMORY mistakes (wrong / skipped words)
 * from PRONUNCIATION differences (accent, tajweed), which are only ever "unsure".
 *
 * Answer key: /hifz-ai/ayat/NNN.json  ->  { "aya": [[wordNumber, writtenText, phonemes], ...] }
 */

export type WordStatus = "pending" | "in_progress" | "correct" | "wrong" | "skipped" | "unsure";

export interface WordResult {
  key: string; // "sura:aya:word"
  text: string; // written word (may be 2+ words when the sounds can't be split)
  status: WordStatus;
  expected: string;
  heard: string;
}

export interface ExtraSpeech {
  atKey: string;
  heard: string;
  kind: "repeat" | "extra";
}

export interface CheckResult {
  words: WordResult[];
  extras: ExtraSpeech[];
  reachedIndex: number; // how far into the reference the recitation has got
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
    const p = fetch(`${base}/${String(sura).padStart(3, "0")}.json`).then((r) => {
      if (!r.ok) throw new Error(`answer key for surah ${sura} failed to load`);
      return r.json();
    });
    surahCache.set(sura, p);
  }
  return surahCache.get(sura)!;
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
const same = (a: string, b: string) => a === b || (SOFT.get(a)?.has(b) ?? false);

/** Consonant skeleton: vowels dropped (except the nasal ں), repeats collapsed. */
export function skeleton(ph: string): string[] {
  const out: string[] = [];
  for (const c of ph) {
    if (VOWELS.has(c) && c !== "ں") continue;
    if (out[out.length - 1] !== c) out.push(c);
  }
  return out;
}

function lev(a: string[], b: string[], soft = true): number {
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

// ---------- alignment ----------

type Op = ["equal" | "replace" | "delete" | "insert", number, number];

function alignOps(ref: string[], rec: string[], final: boolean): [number, Op[]] {
  const n = ref.length;
  const m = rec.length;
  const d: Int32Array[] = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = 0; i <= n; i++) d[i][0] = i;
  for (let j = 0; j <= m; j++) d[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (ref[i - 1] === rec[j - 1] ? 0 : 1));
    }
  }
  let end = final ? n : 0;
  if (!final && m > 0) {
    let best = Infinity;
    for (let i = 0; i <= n; i++) if (d[i][m] <= best) { best = d[i][m]; end = i; }
  }
  const ops: Op[] = [];
  let i = end;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (ref[i - 1] === rec[j - 1] ? 0 : 1)) {
      ops.push([ref[i - 1] === rec[j - 1] ? "equal" : "replace", i - 1, j - 1]);
      i--; j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
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
  const [end, ops] = alignOps(ref, rec, final);

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
    if (w.s >= end && !final) {
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
      words.push({ key: w.key, text: w.text, status: "in_progress", expected, heard: heardTxt });
      return;
    }
    const expSk = skeleton(expected);
    const heardSk = skeleton(heardTxt);
    if (heardSk.length === 0) {
      words.push({ key: w.key, text: w.text, status: expSk.length ? "skipped" : "correct", expected, heard: heardTxt });
      return;
    }
    let [hard, a, b] = bestSubstring(expSk, heardSk);
    const soft = lev(Array.from(expected), Array.from(heardTxt));
    const wconf = js.reduce((t, j) => t + rconf[j], 0) / js.length;
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
    if (hard === 0) status = soft <= 2 ? "correct" : "unsure";
    else if (hard >= L * 0.75 && L >= 2 && a === b) status = "skipped";
    else if (hard / L >= 0.5) {
      const onlyMissing = hard === L - (b - a);
      const need = L <= 2 && !added ? 0.85 : 0.6; // a swapped sound in a 1-2 letter word needs a surer model
      status = wconf >= need && !onlyMissing ? "wrong" : "unsure";
    } else status = "unsure";
    if (hard < L) {
      for (const piece of [heardSk.slice(0, a), heardSk.slice(b)]) {
        if (piece.length < 3) continue;
        const kind = coveredByNearby(piece, ref, reference.words, k) >= 0.6 ? "repeat" : "extra";
        extras.push({ atKey: w.key, heard: piece.join(""), kind });
        if (kind === "extra" && status === "correct") status = "unsure";
      }
    }
    words.push({ key: w.key, text: w.text, status, expected, heard: heardTxt });
  });

  // a whole passage left out: stray sounds inside a run of skips are skips too
  words.forEach((wr, i) => {
    if (wr.status === "wrong" || wr.status === "unsure") {
      const near = [...words.slice(Math.max(0, i - 2), i), ...words.slice(i + 1, i + 3)];
      if (near.filter((x) => x.status === "skipped").length >= 3) wr.status = "skipped";
    }
  });
  return { words, extras, reachedIndex: end };
}
