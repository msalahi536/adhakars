/**
 * Live recitation tracker: follows the reciter word by word and judges each word once.
 *
 * Why not re-check everything on every update (check())? A single forward alignment, re-solved
 * from scratch, has two failure modes on real recitation:
 *   - re-reading a few words after a breath is cheaper to explain as "the NEXT words, said a bit
 *     wrong" than as a repeat, so it ran AHEAD; a moment later more audio flipped the answer and it
 *     jumped BACK (the glitching);
 *   - added words were absorbed as slightly-wrong neighbours instead of being reported.
 *
 * The tracker instead:
 *   1. keeps a committed part (judged words, never revisited) and only aligns the new sounds;
 *   2. aligns them with an alignment that may JUMP BACK to any earlier word start (a re-read / redo)
 *      at a small cost, so a re-read follows the reciter back instead of running ahead;
 *   3. commits a word once the reciter has clearly moved on past it (a few matched sounds after it),
 *      so mistakes appear once and never flicker;
 *   4. reports leftover sounds between words that fit no nearby text as added words ("extra").
 * The newest attempt at a word wins: a mistake corrected by going back is cleared.
 */
import { harakahIssue, strictLetterIssue, isVowel, judgeWord, lev, normalize, same, skeleton, type CheckResult, type ExtraSpeech, type Reference, type WordResult, type WordStatus } from "./checker";

/** Tunables (measured on real spliced recitations, see live.test.ts). */
export const TRACKER = {
  jump: 3, // cost of going back to an earlier word start (≈ 3 mismatched letters)
  skip: 6, // cost of jumping ahead to a later word start (skipped words; one short word can also be deleted letter by letter)
  backWords: 40, // how far back a re-read / redo may go
  startAyah: 1, // first sounds: cost of starting at a later ayah instead of the range start
  startWord: 2.5, // ... or in the middle of an ayah
  commitAfter: 4, // a word is final once this many matching consonants follow it
  minExtra: 3, // consonants of unexplained speech that count as added words
  farWords: 8, // a jump back further than this needs twice the evidence before words are judged
  aheadWords: 40, // how far ahead the reciter can be found again
  skipToSurah: 3,
  skipToAyah: 5, // leaving out the rest of an ayah / a whole ayah // finishing (or cutting short) a surah and starting the next one
  farBack: 3, // extra cost for going back many words (0.06 per word)
  sureStart: 7,
  ambiguous: 3, // another start place this close in cost: not sure where the reciter began yet // consonants needed before showing a start anywhere but the passage start
  swapConf: 0.95, // a single swapped letter is a mistake when the model is at least this sure of it
  verify: 4, // a jump back is believed once this many consonants after it match (at most 1 off)
};
/**
 * Is this leftover speech a word's worth? 3+ consonants, or 2 solid ones (وَمَا, مِن, بِمَا): soft
 * letters a breath or a restart can make (ء ه ع ح, the nasal ں) do not count towards 2.
 */
const SOFT = new Set(["ء", "ه", "ع", "ح", "ں"]);
export function wordsWorth(sk: string[]): boolean {
  const solid = sk.filter((c) => !SOFT.has(c)).length;
  return solid >= 2 || (sk.length >= TRACKER.minExtra && solid >= 1);
}
/** Exactly one letter differs, the letters are not alike or soft, and the model was sure of it. */
export function letterSwap(expected: string, heard: { c: string; p: number }[], minConf = TRACKER.swapConf): boolean {
  const nasal = (c: string) => (c === "ں" ? "ن" : c);
  const exp = skeleton(expected).map(nasal);
  const got: { c: string; p: number }[] = [];
  for (const h of heard) {
    const k = skeleton(h.c)[0];
    if (!k) continue;
    const c = nasal(k);
    if (got.length && got[got.length - 1].c === c) { got[got.length - 1].p = Math.max(got[got.length - 1].p, h.p); continue; }
    got.push({ c, p: h.p });
  }
  if (got.length !== exp.length || exp.length < 2) return false;
  const diff = exp.map((c, i) => i).filter((i) => exp[i] !== got[i].c);
  if (diff.length !== 1) return false;
  const i = diff[0], e = exp[i], h = got[i].c;
  if (same(e, h) || SOFT.has(e) || SOFT.has(h) || e === "ي" || e === "و" || h === "ي" || h === "و") return false;
  return got[i].p >= minConf;
}
const BAN = 1 << 20; // key = tail index * BAN + ref index

const subCost = (a: string, b: string) => {
  if (a === b) return 0;
  const va = isVowel(a), vb = isVowel(b);
  if (va && vb) return 0.5;
  if (va !== vb) return 2; // never let a vowel stand in for a consonant: letters stay with their own word
  return same(a, b) ? 0.5 : 1;
};
// vowels, a glottal onset (ء: restarting a word after a tiny stop) and the tanween nasal (ں) come
// and go in real recitation: cheap to add or drop, so they never pull letters across word boundaries
const gapCost = (c: string) => (isVowel(c) || c === "ء" || c === "ں" ? 0.5 : 1);

/** Edit cost of saying `heard` for `expected`, with the tracker's letter costs. */
function editCost(expected: string[], heard: string[]): number {
  let prev = [0];
  for (let j = 1; j <= heard.length; j++) prev[j] = prev[j - 1] + gapCost(heard[j - 1]);
  for (let i = 1; i <= expected.length; i++) {
    const cur = [prev[0] + gapCost(expected[i - 1])];
    for (let j = 1; j <= heard.length; j++) cur[j] = Math.min(prev[j] + gapCost(expected[i - 1]), cur[j - 1] + gapCost(heard[j - 1]), prev[j - 1] + subCost(expected[i - 1], heard[j - 1]));
    prev = cur;
  }
  return prev[heard.length];
}

/** Cheapest match of `pat` anywhere inside `text` (soft letter classes). Returns [cost, start, end]. */
function bestSub(pat: string[], text: string[]): [number] {
  let prev = new Array(text.length + 1).fill(0);
  for (let i = 1; i <= pat.length; i++) {
    const cur = [i];
    for (let j = 1; j <= text.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (same(pat[i - 1], text[j - 1]) ? 0 : 1));
    prev = cur;
  }
  return [Math.min(...prev)];
}

/**
 * Said around the recitation but not part of it: the isti'adha and basmala before (also Quran words:
 * the basmala's ٱللَّه matched إِلَّا مَا شَاءَ ٱللَّهُ in Al-A'la and jumped the reader to ayah 7), and
 * آمين after Al-Fatiha. They are cut out of what was heard (unless the passage itself contains them).
 */
const OPENERS = [
  "ءَعُۥۥذُبِللَااهِسسَمِۦۦعِلعَلِۦۦمِمِنَششَيطَاانِررَجِۦۦم", // a'udhu billahi s-sami'i l-'alimi mina sh-shaytani r-rajim
  "ءَعُۥۥذُبِللَااهِمِنَششَيطَاانِررَجِۦۦم", // a'udhu billahi mina sh-shaytani r-rajim
  "بِسمِللَااهِررَحمَاانِررَحِۦۦم", // bismillahi r-rahmani r-rahim
].map((o) => skeleton(o));
const FATIHA_END = skeleton("ضضَاالِۦۦن"); // ...wa la d-dallin
const AMIN = skeleton("ءَاامِۦۦن");

/** Edit distance of `q` against the best-matching stretch of `seg`: [cost, start, end). */
function fitIn(q: string[], seg: string[]): [number, number, number] {
  const m = seg.length;
  let prev = new Array(m + 1).fill(0), ps = Array.from({ length: m + 1 }, (_, j) => j);
  for (let i = 1; i <= q.length; i++) {
    const cur = [i], cs = [0];
    for (let j = 1; j <= m; j++) {
      const a = prev[j - 1] + (q[i - 1] === seg[j - 1] || same(q[i - 1], seg[j - 1]) ? 0 : 1), b = prev[j] + 1, c = cur[j - 1] + 1;
      if (a <= b && a <= c) { cur[j] = a; cs[j] = ps[j - 1]; } else if (b <= c) { cur[j] = b; cs[j] = ps[j]; } else { cur[j] = c; cs[j] = cs[j - 1]; }
    }
    prev = cur; ps = cs;
  }
  let e = 0;
  for (let j = 1; j <= m; j++) if (prev[j] < prev[e]) e = j;
  return [prev[e], ps[e], e];
}
const prefixDist = (q: string[], pat: string[]) => {
  // q against the start of pat (q may be shorter): best over prefix lengths
  let prev = Array.from({ length: pat.length + 1 }, (_, j) => j);
  for (let i = 1; i <= q.length; i++) {
    const cur = [i];
    for (let j = 1; j <= pat.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (same(q[i - 1], pat[j - 1]) ? 0 : 1));
    prev = cur;
  }
  return Math.min(...prev);
};

type Step = { op: "m" | "i" | "d" | "j"; i: number; j: number; from?: number }; // ref index i, tail index j (m = match/sub); jumps: from -> i

interface Occurrence {
  word: number; // index in reference.words
  steps: Step[];
  complete: boolean; // reached the word's last letter
  firstJ: number;
  lastJ: number; // tail index after the last sound used (exclusive)
}

interface Judged {
  result: WordResult;
  extras: ExtraSpeech[];
  inside: boolean; // a word skipped between two words said in the same go (a real skip, even in a redo)
}

export class RecitationTracker {
  private ref: string[];
  private wordStart: number[];
  private wordOf: Int32Array; // ref char -> word index
  private isWordStart: Uint8Array;
  private ayahFirst: Uint8Array;
  // committed state
  private pos = 0; // ref char index the reciter is at after the committed words
  private hcut = 0; // normalized heard index: sounds before it are committed
  private started = false;
  private committed = new Map<number, WordResult>(); // word index -> result (newest attempt)
  private extras: ExtraSpeech[] = [];
  private reached = 0; // furthest ref char ever reached
  private startWord = -1; // where the recitation began
  private dropped: [number, number][] = []; // raw heard index ranges cut out (isti'adha, basmala, amin)
  private openers: string[][];
  private amin: boolean;

  private raw: { c: string; p: number }[] = []; // everything heard, as heard (harakat + length kept)
  constructor(private reference: Reference, private finishMode: "all" | "reached" = "all", private opts: { strictHarakat?: boolean } = {}) {
    this.ref = Array.from(reference.norm);
    this.wordStart = reference.words.map((w) => w.s);
    this.wordOf = new Int32Array(this.ref.length + 1).fill(reference.words.length - 1);
    this.isWordStart = new Uint8Array(this.ref.length + 1);
    this.ayahFirst = new Uint8Array(reference.words.length);
    reference.words.forEach((w, k) => {
      for (let i = w.s; i < w.e; i++) this.wordOf[i] = k;
      this.isWordStart[w.s] = 1;
      this.ayahFirst[k] = w.key.endsWith(":1") ? 1 : 0;
    });
    const refSk = skeleton(reference.norm);
    // a passage that itself contains the basmala (Al-Fatiha 1:1, An-Naml 27:30) keeps it as text
    this.openers = OPENERS.filter((o) => fitIn(o, refSk)[0] > 1);
    this.amin = reference.words.some((w) => w.key === "1:7:9");
  }

  /** Cut isti'adha / basmala / amin out of the not-yet-committed sounds. True = still saying one. */
  private cutOpeners(rec: string[], idx: number[], final = false): boolean {
    const sk: string[] = [], at: number[] = [];
    for (let k = this.hcut; k < rec.length; k++) {
      const c = skeleton(rec[k])[0];
      if (c && sk[sk.length - 1] !== c) { sk.push(c); at.push(k); }
    }
    const raw = (k: number) => (k < idx.length ? idx[k] : (idx[idx.length - 1] ?? 0) + 1);
    const endRaw = (e: number) => (e < at.length ? raw(at[e]) : raw(rec.length));
    for (const o of this.openers) {
      if (sk.length < o.length * 0.7) continue;
      const [cost, b, e] = fitIn(o, sk);
      // cut once it is over (its last letter arrives a moment late: wait for the next sound)
      if (e > b && cost <= Math.floor(o.length * 0.25) && (e < sk.length || final)) { this.dropped.push([raw(at[b]), endRaw(e)]); return true; }
    }
    if (this.amin && sk.length >= FATIHA_END.length + 2) {
      const pat = [...FATIHA_END, ...AMIN];
      const [cost, b, e] = fitIn(pat, sk);
      if (cost <= 1 && e - b >= pat.length - 1 && e >= sk.length - 1) {
        const from = e - AMIN.length;
        if (sk[from] === "ء" || sk[from + 1] === "م") { this.dropped.push([raw(at[from]), endRaw(e)]); return true; }
      }
    }
    // nothing placed yet and the sounds so far are the start of an opener: wait for it to finish
    if (!this.started && sk.length >= 2) {
      for (const o of this.openers) if (sk.length <= o.length + 1 && prefixDist(sk, o) <= Math.max(1, Math.floor(Math.min(sk.length, o.length) * 0.25))) { this.waiting = true; return false; }
    }
    this.waiting = false;
    return false;
  }
  private waiting = false;
  private lastCost = 0;
  /**
   * Before anything is judged: could the reciter just as well have started in another ayah? Several
   * ayat open the same way (Al-Baqarah 2:68 / 2:69 / 2:70 قَالُوا ادْعُ لَنَا رَبَّكَ يُبَيِّن لَّنَا مَا…):
   * keep following without judging until the words tell them apart.
   */
  private ambiguousStart(tail: string[], occ: Occurrence[]): boolean {
    const best = this.lastCost;
    const ayah = (k: number) => this.reference.words[k].key.split(":").slice(0, 2).join(":");
    const a0 = ayah(occ[0].word);
    const banned = new Set<number>();
    this.reference.words.forEach((w, k) => { if (ayah(k) === a0) banned.add(-1 - k); });
    this.alignOnce(tail, banned);
    const alt = this.lastCost;
    this.lastCost = best;
    return alt - best < TRACKER.ambiguous;
  }
  private superseded: WordResult[] = []; // earlier tries of words that were then re-recited
  /**
   * Went wrong, then went back and recited it right (e.g. continued into a similar ayah from
   * elsewhere, realised, and restarted the ayah): the correct re-read wins, but the wrong try is
   * still a mistake. Report it as added words where it happened, when it really differed from the
   * text (3+ real letter changes in a run of words). A word merely cut short before a breath and
   * re-read (its sounds are the word's opening) is not a wrong try.
   */
  private wrongTries(tries: WordResult[]) {
    if (!tries.length) return;
    const order = new Map(this.reference.words.map((w, i) => [w.key, i]));
    const sorted = tries.filter((t) => t.heard && t.status !== "correct").sort((a, b) => order.get(a.key)! - order.get(b.key)!);
    let run: WordResult[] = [];
    const flush = () => {
      let changes = 0;
      const heard: string[] = [];
      for (const t of run) {
        const exp = skeleton(t.expected), got = skeleton(t.heard ?? "");
        const cut = got.length < exp.length && lev(exp.slice(0, got.length), got) === 0;
        if (cut) continue;
        changes += lev(exp, got);
        heard.push(...got);
      }
      if (changes >= 3 && wordsWorth(heard) && !this.extras.some((x) => x.atKey === run[0].key && x.kind === "extra")) {
        this.extras.push({ atKey: run[0].key, heard: heard.join(""), kind: "extra" });
      }
      run = [];
    };
    for (const t of sorted) {
      if (run.length && order.get(t.key)! !== order.get(run[run.length - 1].key)! + 1) flush();
      run.push(t);
    }
    flush();
  }

  /** Going back: a few words (a breath) is cheap, far back (another surah's opening) less so. */
  private backCost(i: number) {
    const back = Math.max(0, this.wordOf[Math.min(this.pos, this.ref.length - 1)] - this.wordOf[i]);
    // redoing from the start of an ayah is the most natural way back, even a long way back
    if (this.ayahFirst[this.wordOf[i]]) return TRACKER.jump + Math.min(1, back * 0.02);
    return TRACKER.jump + Math.min(TRACKER.farBack, back * 0.06);
  }
  private surahFirst(k: number) { return this.reference.words[k].key.endsWith(":1:1"); }
  private front = -1; // word index the reciter is on (rewinds when going back)

  /** Live: everything heard so far (raw emissions), its confidence per character. */
  update(heard: string, conf?: number[]): CheckResult {
    return this.step(heard, conf, false);
  }

  /** The reciter stopped: judge whatever was said, nothing more. */
  finish(heard: string, conf?: number[]): CheckResult {
    return this.step(heard, conf, true);
  }

  private step(heard: string, conf: number[] | undefined, final: boolean): CheckResult {
    if (this.opts.strictHarakat) this.raw = Array.from(heard).map((c, i) => ({ c, p: conf?.[i] ?? 1 }));
    const n0 = normalize(heard);
    let rec: string[] = [], idx: number[] = [], rconf: number[] = [];
    const load = () => {
      const all = Array.from(n0.s);
      const keep = (k: number) => !this.dropped.some(([a, b]) => n0.idx[k] >= a && n0.idx[k] < b);
      rec = []; idx = []; rconf = [];
      all.forEach((c, k) => { if (keep(k)) { rec.push(c); idx.push(n0.idx[k]); rconf.push(conf ? conf[n0.idx[k]] ?? 1 : 1); } });
    };
    load();
    for (let guard = 0; guard < 4 && this.cutOpeners(rec, idx, final); guard++) load();
    if (this.waiting && !final) return this.output([], rec, idx, rconf, final);
    const tail = rec.slice(this.hcut);
    // too little to place the first sounds yet
    // (breath / glottal sounds alone are never recitation: stopping after only those is no recitation)
    if (!this.started && (skeleton(tail.join("")).length < (final ? 2 : 4) || !wordsWorth(skeleton(tail.join(""))))) return this.output([], rec, idx, rconf, final);
    if (!tail.length) return this.output([], rec, idx, rconf, final);

    const path = this.align(tail);
    const occ = this.occurrences(path, tail.length);
    if (!occ.length) return this.output([], rec, idx, rconf, final);
    // first sounds placed somewhere other than the start of the passage: be sure before showing it
    // (a breath or a stray sound before the first word briefly placed the reciter in a later ayah)
    if (!this.started && !final && occ[0].word !== 0 && !this.surahFirst(occ[0].word) && skeleton(tail.join("")).length < TRACKER.sureStart) return this.output([], rec, idx, rconf, final);

    // commit everything the reciter has clearly moved past
    let upto = -1;
    if (final) upto = occ.length - 1;
    else if (!this.started && this.ambiguousStart(tail, occ)) upto = -1;
    else {
      // going far back (another ayah with the same opening, e.g. 88:8 / 88:2 وُجُوهٌ يَوْمَئِذٍ):
      // be surer before judging anything there
      const posWord = this.wordOf[Math.min(this.pos, this.ref.length - 1)];
      let farJ = -1;
      if (path.length && this.started && posWord - this.wordOf[path[0].op === "j" ? path[0].from ?? path[0].i : path[0].i] > TRACKER.farWords) farJ = 0;
      for (const st of path) if (st.op === "j" && (st.from ?? st.i) > st.i && this.wordOf[st.from ?? st.i] - this.wordOf[st.i] > TRACKER.farWords) farJ = st.j;
      for (let q = occ.length - 2; q >= 0; q--) {
        if (!occ[q].complete) continue;
        const after = path.filter((s) => s.j >= occ[q].lastJ && s.op === "m" && !isVowel(this.ref[s.i]) && subCost(this.ref[s.i], tail[s.j]) === 0).length;
        const need = farJ >= 0 && occ[q].lastJ > farJ ? TRACKER.commitAfter * 2 : TRACKER.commitAfter;
        if (after >= need) { upto = q; break; }
      }
    }
    if (upto >= 0) {
      if (!this.started) { this.started = true; this.startWord = occ[0].word; }
      const judged = this.judge(occ.slice(0, upto + 1), path, tail, rec, idx, rconf, final, occ[upto + 1]);
      const rank = (st: WordStatus) => (st === "correct" ? 0 : st === "unsure" ? 1 : 2);
      const replaced: WordResult[] = [...this.superseded];
      this.superseded = [];
      for (const [k, j] of judged) {
        const before = this.committed.get(k);
        if (before && before.status !== "correct" && rank(j.result.status) < rank(before.status)) replaced.push(before);
        // the newest attempt wins only if it is not worse: going back to fix a mistake clears it,
        // but a "worse re-read" of a word already said right is really added speech
        if (before && rank(j.result.status) > rank(before.status) && !j.inside) {
          // a clearly wrong re-read is added speech; a merely unsure one is just a re-read
          if (rank(j.result.status) === 2 && j.result.heard && skeleton(j.result.heard).length >= TRACKER.minExtra) this.extras.push({ atKey: j.result.key, heard: skeleton(j.result.heard).join(""), kind: "extra" });
          // the word keeps its earlier judgement, but speech found next to it this time still counts
          this.extras.push(...j.extras);
          continue;
        }
        this.committed.set(k, j.result);
        this.extras.push(...j.extras);
      }
      this.wrongTries(replaced);
      const last = occ[upto];
      const w = this.reference.words[last.word];
      this.pos = last.complete ? w.e : this.pos;
      this.front = last.word;
      this.reached = Math.max(this.reached, this.pos);
      this.hcut += final ? tail.length : last.lastJ;
      const rest = final ? [] : occ.slice(upto + 1).map((o) => ({ ...o, firstJ: o.firstJ - last.lastJ, lastJ: o.lastJ - last.lastJ, steps: o.steps.map((s) => ({ ...s, j: s.j - last.lastJ })) }));
      return this.output(rest, rec, idx, rconf, final);
    }
    return this.output(occ, rec, idx, rconf, final);
  }

  /**
   * Align the uncommitted sounds against the text, free end, with jumps back to word starts.
   * Returns the cheapest path (in order).
   */
  /**
   * Align, then check every jump back: a re-read must really re-read. If the words after the jump
   * do not match (a wrong or added word that only looks like an earlier one, e.g. "صَدَقَ" after
   * عَلَيهِم in Al-Fatiha looked like a re-read of "صِرَاطَ"), forbid that jump and align again.
   */
  private align(tail: string[]): Step[] {
    const banned = new Set<number>();
    let path = this.alignOnce(tail, banned);
    for (let round = 0; round < 6; round++) {
      const bad = this.badJumps(path, tail);
      if (!bad.length) break;
      for (const [j, i] of bad) for (let d = -2; d <= 2; d++) if (j + d >= 0) banned.add((j + d) * BAN + i);
      path = this.alignOnce(tail, banned);
    }
    return path;
  }

  /** Jumps back (and starts behind the reciter's position) whose following words do not match. */
  private badJumps(path: Step[], tail: string[]): [number, number][] {
    const out: [number, number][] = [];
    const check = (from: number, j: number, i: number) => {
      let good = 0, bad = 0, q = from;
      for (; q < path.length && path[q].op !== "j" && good < TRACKER.verify && bad <= 1; q++) {
        const st = path[q];
        if (st.op === "m") { if (isVowel(this.ref[st.i])) continue; if (subCost(this.ref[st.i], tail[st.j]) === 0) good++; else bad++; }
        else if (st.op === "d") { if (!isVowel(this.ref[st.i]) && gapCost(this.ref[st.i]) >= 1) bad++; }
        else if (st.op === "i") { if (gapCost(tail[st.j]) >= 1) bad++; }
      }
      const ended = q >= path.length || path[q].op === "j";
      if (bad > 1 || (ended && bad === 1 && good < 2)) out.push([j, i]);
    };
    if (this.started && path.length) {
      const f = path[0];
      const startI = f.op === "j" ? f.from ?? f.i : f.i;
      if (startI < this.pos && this.isWordStart[startI]) check(0, 0, startI);
    }
    path.forEach((st, q) => { if (st.op === "j" && (st.from ?? st.i) > st.i) check(q + 1, st.j, st.i); });
    return out;
  }

  private alignOnce(tail: string[], banned: Set<number>): Step[] {
    const ref = this.ref;
    const m = tail.length;
    // look back far enough for a redo: 40 words, and always the start of the previous ayah (Al-Baqarah
    // 2:25 + 2:26 are 110 words: redoing both must reach back to 2:25)
    let lowWord = this.started ? Math.max(0, this.wordOf[Math.min(this.pos, ref.length - 1)] - TRACKER.backWords) : 0;
    if (this.started) {
      let k = this.wordOf[Math.min(this.pos, ref.length - 1)], starts = 0;
      while (k > 0 && starts < 3) { if (this.ayahFirst[k]) starts++; if (starts < 3) k--; }
      lowWord = Math.min(lowWord, k);
    }
    const lo = this.started ? this.wordStart[lowWord] : 0;
    // the next surah's opening may be further ahead (the rest of this surah cut short, or a wrong
    // turn into the same opening earlier, e.g. Al-Falaq / An-Nas قُلْ أَعُوذُ بِرَبِّ): keep it in view
    let aheadTo = 0;
    const wNow = this.wordOf[Math.min(this.pos, ref.length - 1)];
    for (let k = wNow + 1; k < Math.min(this.reference.words.length, wNow + TRACKER.aheadWords); k++) {
      if (this.surahFirst(k)) { aheadTo = this.wordStart[Math.min(this.reference.words.length - 1, k + 10)] ?? ref.length; break; }
    }
    // and a whole long ayah may be left out: keep the two ayat after the current one in view
    let ayahs = 0;
    for (let k = wNow + 1; k < this.reference.words.length && k < wNow + 80; k++) {
      if (this.ayahFirst[k] && ++ayahs === 2) { aheadTo = Math.max(aheadTo, this.wordStart[Math.min(this.reference.words.length - 1, k + 4)] ?? ref.length); break; }
      if (k === this.reference.words.length - 1) aheadTo = ref.length;
    }
    const hi = Math.min(ref.length, this.started ? Math.max(this.pos + Math.ceil(m * 1.6) + 30, aheadTo) : ref.length);
    const n = hi - lo;
    const INF = 1e9;
    const D = Array.from({ length: m + 1 }, () => new Float64Array(n + 1).fill(INF));
    const B = Array.from({ length: m + 1 }, () => new Int8Array(n + 1)); // 1 m, 2 i, 3 d, 4 j, 5 start
    const J = Array.from({ length: m + 1 }, () => new Int32Array(n + 1)); // jump source
    const at = (i: number) => i - lo;
    // starting points
    if (this.started) {
      D[0][at(this.pos)] = 0; B[0][at(this.pos)] = 5;
      for (let i = lo; i < this.pos; i++) if (this.isWordStart[i] && !banned.has(i)) { D[0][at(i)] = this.backCost(i); B[0][at(i)] = 5; }
    } else {
      for (let k = 0; k < this.reference.words.length; k++) {
        if (banned.has(-1 - k)) continue; // (start word ruled out, see ambiguousStart)
        const s = this.wordStart[k];
        const c = k === 0 || this.surahFirst(k) ? 0 : this.ayahFirst[k] ? TRACKER.startAyah : TRACKER.startWord;
        const ck = c + k * 1e-4; // equally good: the earlier place
        if (s >= lo && s < hi && ck < D[0][at(s)]) { D[0][at(s)] = ck; B[0][at(s)] = 5; }
      }
    }
    const relaxRow = (j: number) => {
      const row = D[j], br = B[j];
      // skipping letters / words (deletions)
      for (let x = 1; x <= n; x++) {
        const c = row[x - 1] + gapCost(ref[lo + x - 1]);
        if (c < row[x]) { row[x] = c; br[x] = 3; }
      }
    };
    const jumpRow = (j: number) => {
      // before the first sound: where to begin is covered by the starting points, but once the
      // recitation is under way a skip can come first (82:3 left out: the وَ of 82:4's وَإِذَا must
      // not be spent on 82:3 just to be able to jump)
      if (j === 0 && !this.started) return;
      const row = D[j], br = B[j], jr = J[j];
      const snap = Float64Array.from(row);
      // going back (re-read / redo): reach any word start from a position ahead of it
      let best = INF, bestAt = -1;
      for (let x = n; x >= 0 && j > 0; x--) {
        if (this.isWordStart[lo + x] && best + this.backCost(lo + x) < row[x] && !banned.has(j * BAN + lo + x)) { row[x] = best + this.backCost(lo + x); br[x] = 4; jr[x] = bestAt; }
        if (snap[x] < best) { best = snap[x]; bestAt = x; }
      }
      // going ahead (skipped words): reach a later word start from a position before it
      best = INF; bestAt = -1;
      for (let x = 0; x <= n; x++) {
        // skipping lands on a new ayah more naturally than mid-ayah (a whole ayah left out:
        // 82:1-4 all open with وَإِذَا, so its وَإِذَا belongs to the next ayah, not the skipped one)
        const wx = this.wordOf[lo + x];
        const sk = this.surahFirst(wx) ? TRACKER.skipToSurah : this.ayahFirst[wx] ? TRACKER.skipToAyah : TRACKER.skip;
        if (this.isWordStart[lo + x] && best + sk < row[x]) { row[x] = best + sk; br[x] = 4; jr[x] = bestAt; }
        if (snap[x] < best) { best = snap[x]; bestAt = x; }
      }
    };
    relaxRow(0);
    jumpRow(0);
    relaxRow(0);
    for (let j = 1; j <= m; j++) {
      const prev = D[j - 1], row = D[j], br = B[j];
      const c = tail[j - 1];
      for (let x = 0; x <= n; x++) {
        // extra sound (insertion). Starting an ayah after a stop, the reciter says a glottal onset
        // + vowel the connected text does not have (hamzat al-wasl: "ءَ" + لَّذِينَ): free there.
        const onset = (c === "ء" || isVowel(c)) && this.isWordStart[lo + x] && this.ayahFirst[this.wordOf[lo + x]];
        let best = prev[x] + (onset ? 0.05 : gapCost(c)), how = 2;
        if (x > 0) {
          const v = prev[x - 1] + subCost(ref[lo + x - 1], c);
          if (v <= best) { best = v; how = 1; }
        }
        row[x] = best; br[x] = how;
      }
      relaxRow(j);
      jumpRow(j);
      relaxRow(j);
    }
    // free end
    let end = 0;
    for (let x = 1; x <= n; x++) if (D[m][x] < D[m][end] || (D[m][x] === D[m][end] && x > end)) end = x;
    this.lastCost = D[m][end];
    const steps: Step[] = [];
    let x = end, j = m;
    let guard = (m + 1) * (n + 1) * 2;
    while (guard-- > 0) {
      const b = B[j][x];
      if (b === 5 || (j === 0 && b === 0)) break;
      if (b === 1) { steps.push({ op: "m", i: lo + x - 1, j: j - 1 }); x--; j--; }
      else if (b === 2) { steps.push({ op: "i", i: lo + x, j: j - 1 }); j--; }
      else if (b === 3) { steps.push({ op: "d", i: lo + x - 1, j }); x--; }
      else if (b === 4) { steps.push({ op: "j", i: lo + x, j, from: lo + J[j][x] }); x = J[j][x]; }
      else break;
    }
    return steps.reverse();
  }

  /** Split the path into visits of words (a word visited twice = two attempts). */
  private occurrences(path: Step[], m: number): Occurrence[] {
    const out: Occurrence[] = [];
    let cur: Occurrence | null = null;
    let nextJ = 0;
    for (const s of path) {
      if (s.op === "j") {
        const from = s.from ?? s.i;
        if (from < s.i) {
          // jumped ahead: the rest of the current word and every word up to the target were skipped
          if (cur && cur.word === this.wordOf[Math.min(from, this.ref.length - 1)]) cur.complete = true;
          for (let k = this.wordOf[Math.min(from, this.ref.length - 1)]; k < this.wordOf[Math.min(s.i, this.ref.length - 1)]; k++) {
            if (this.reference.words[k].s >= from) out.push({ word: k, steps: [], complete: true, firstJ: nextJ, lastJ: nextJ });
          }
        }
        cur = null;
        continue;
      }
      if (s.op === "i") { if (cur) cur.steps.push(s); nextJ = s.j + 1; continue; }
      const w = this.wordOf[s.i];
      if (!cur || cur.word !== w || (s.i === this.wordStart[w] && cur.steps.some((x) => x.op !== "i" && x.i === s.i))) {
        // trailing insertions of the previous word belong between words, not to it
        if (cur) {
          while (cur.steps.length && cur.steps[cur.steps.length - 1].op === "i") cur.steps.pop();
          cur.lastJ = Math.max(cur.firstJ, ...cur.steps.filter((x) => x.op === "m").map((x) => x.j + 1));
        }
        cur = { word: w, steps: [], complete: false, firstJ: s.op === "m" ? s.j : nextJ, lastJ: nextJ };
        out.push(cur);
      }
      cur.steps.push(s);
      if (s.op === "m") nextJ = s.j + 1;
      if (s.i === this.reference.words[w].e - 1) cur.complete = true;
    }
    if (cur) {
      while (cur.steps.length && cur.steps[cur.steps.length - 1].op === "i") cur.steps.pop();
    }
    for (const o of out) {
      const ms = o.steps.filter((x) => x.op !== "d");
      o.firstJ = ms.length ? Math.min(...ms.map((x) => x.j)) : o.firstJ;
      o.lastJ = ms.length ? Math.max(...ms.map((x) => x.j)) + 1 : o.firstJ;
    }
    void m;
    return out;
  }

  /** Judge visits being committed; unexplained speech between them becomes "extra". */
  private judge(occ: Occurrence[], path: Step[], tail: string[], rec: string[], idx: number[], rconf: number[], final: boolean, next?: Occurrence): Map<number, Judged> {
    const out = new Map<number, Judged>();
    const words = this.reference.words;
    const base = this.hcut;
    const wordsJudged: { k: number; o: Occurrence; res: WordResult }[] = [];
    this.resplit(occ, tail);
    const used = new Set<number>();
    for (const s of path) if (s.op === "m") used.add(s.j);
    const trimmed = this.trim(occ, tail, used);
    for (const j of trimmed) used.delete(j);
    const said = (o?: Occurrence) => !!o && o.steps.some((s) => s.op !== "d");
    for (let q = 0; q < occ.length; q++) {
      const o = occ[q];
      const w = words[o.word];
      const expected = this.ref.slice(w.s, w.e).join("");
      const js = o.steps.filter((s) => s.op !== "d").map((s) => s.j);
      if (!o.complete && final) {
        // stopped in the middle of a word: judge it only if most of it was said
        const said = skeleton(js.map((j) => tail[j]).join("")).length;
        if (said < Math.max(1, Math.ceil(skeleton(expected).length * 0.6))) continue;
      }
      const heardTxt = js.map((j) => tail[j]).join("");
      const wconf = js.length ? js.reduce((t, j) => t + rconf[base + j], 0) / js.length : 1;
      const jw = judgeWord(expected, heardTxt, wconf);
      let status: WordStatus = jw.status;
      // one clear letter swapped (ٱلصِّرَاطَ said with ز): the word judge leaves a single change in a
      // longer word as "unsure" (the model mishears now and then), but when the model is sure of the
      // swapped-in letter and the two letters don't sound alike, it is a mistake
      if (status === "unsure" && letterSwap(expected, js.map((j) => ({ c: tail[j], p: rconf[base + j] })))) status = "wrong";
      const extras: ExtraSpeech[] = [];
      for (const piece of jw.strays) {
        const kind = this.nearby(piece, o.word) ? "repeat" : "extra";
        extras.push({ atKey: w.key, heard: piece.join(""), kind });
        if (kind === "extra" && status === "correct") status = "unsure";
      }
      const res: WordResult = { key: w.key, text: w.text, status, expected, heard: heardTxt, ...(js.length ? { at: idx[base + js[0]], end: idx[base + js[js.length - 1]] } : {}) };
      // strict harakat: right letters, wrong harakah / vowel length (e.g. مَلِكِ for Hafs's مَالِكِ)
      if (this.opts.strictHarakat && (status === "correct" || status === "unsure") && res.at !== undefined && res.end !== undefined) {
        let to = res.end + 1;
        // the word's sounds run on through vowels and the imalah / ishmam marks after its last letter
        while (to < this.raw.length && (isVowel(this.raw[to].c) || "۪ىؙ".includes(this.raw[to].c))) to++;
        const span = this.raw.slice(res.at, to);
        const issue = strictLetterIssue(w.ph, span) ?? (status === "correct" ? harakahIssue(w.ph, span) : undefined);
        if (issue) { res.status = "wrong"; res.issue = issue; }
      }
      wordsJudged.push({ k: o.word, o, res });
      // a real skip inside a redo: a short run of skipped words, right after words said in this go
      let run = 1;
      for (let r = q - 1; r >= 0 && !said(occ[r]); r--) run++;
      for (let r = q + 1; r < occ.length && !said(occ[r]); r++) run++;
      const inside = res.status === "skipped" && run <= 3 && occ.slice(Math.max(0, q - 3), q).some(said) && (occ.slice(q + 1).some(said) || said(next));
      const earlier = out.get(o.word);
      if (earlier) this.superseded.push(earlier.result); // visited again in this go (went back): keep the first try
      out.set(o.word, { result: res, extras, inside });
    }
    // a short word dropped right after a pause (ayah start), with its neighbours said: "unsure", never a skip
    wordsJudged.forEach(({ k, res }, n) => {
      const prev = wordsJudged[n - 1]?.res, nxt = wordsJudged[n + 1]?.res ?? (next ? { status: "correct" } as WordResult : undefined);
      if (res.status === "skipped" && this.ayahFirst[k] && skeleton(res.expected).length <= 3 && prev && prev.status !== "skipped" && nxt && nxt.status !== "skipped") res.status = "unsure";
    });
    // speech between visits that is not a word of the text
    const lastJ = occ.length ? occ[occ.length - 1].lastJ : 0;
    let runStart = -1;
    const flush = (endJ: number) => {
      if (runStart < 0) return;
      const piece = skeleton(tail.slice(runStart, endJ).join(""));
      const before = [...wordsJudged].reverse().find((x) => x.o.lastJ <= runStart);
      const after = wordsJudged.find((x) => x.o.firstJ >= endJ) ?? (next && next.firstJ >= endJ ? { k: next.word } : undefined);
      // only inside the recitation (between two said words), never noise before / after it
      if (wordsWorth(piece) && (before || this.committed.size) && after) {
        const atWord = after.k;
        const kind = this.nearby(piece, atWord) ? "repeat" : "extra";
        const j = out.get(atWord) ?? (before ? out.get(before.k) : undefined);
        const atKey = words[atWord].key;
        if (j) j.extras.push({ atKey, heard: piece.join(""), kind });
        else this.extras.push({ atKey, heard: piece.join(""), kind });
        if (kind === "extra" && j && j.result.status === "correct") j.result.status = "unsure";
      }
      runStart = -1;
    };
    const inWord = new Set<number>();
    for (const o of occ) for (const s of o.steps) if (s.op !== "d") inWord.add(s.j);
    for (let j = 0; j < (final ? tail.length : lastJ); j++) {
      if (!inWord.has(j) && !used.has(j)) { if (runStart < 0) runStart = j; }
      else flush(j);
    }
    flush(final ? tail.length : lastJ);
    void rec;
    return out;
  }

  /**
   * An added word right before / after a word can get glued onto it ("ٱلمَوتَ" + added "يَنقَلِب" ->
   * a "wrong" ٱلمَوت + 2 leftover letters, both too small to report). When the word itself was said
   * exactly and the glued-on sounds, together with the leftover speech beside them, are a word's
   * worth of consonants, peel them off: the word is correct and the whole added piece is reported.
   * Returns the tail indices peeled off.
   */
  private trim(occ: Occurrence[], tail: string[], used: Set<number>): number[] {
    const peeled: number[] = [];
    const inAny = new Set<number>();
    for (const o of occ) for (const s of o.steps) if (s.op !== "d") inAny.add(s.j);
    const free = (j: number) => j >= 0 && j < tail.length && !inAny.has(j) && !used.has(j);
    const cons = (js: number[]) => js.filter((j) => !isVowel(tail[j]) && tail[j] !== "ں" && tail[j] !== "ء").length;
    for (const o of occ) {
      if (!o.complete) continue;
      const js = o.steps.filter((s) => s.op !== "d").map((s) => s.j);
      if (js.length < 2) continue;
      const w = this.reference.words[o.word];
      const exp = this.ref.slice(w.s, w.e);
      const heard = (a: number, b: number) => js.slice(a, b).map((j) => tail[j]);
      if (editCost(exp, heard(0, js.length)) === 0) continue;
      let best: [number, number] | null = null;
      for (let a = 0; a < js.length && !best; a++) {
        for (let b = js.length; b > a; b--) {
          if (a === 0 && b === js.length) continue;
          if (editCost(exp, heard(a, b)) > 0.5) continue;
          // the peeled sounds plus the free speech next to them must be a word's worth
          const left = js.slice(0, a), right = js.slice(b);
          let l = js[0] - 1; const lRun: number[] = []; while (free(l)) lRun.push(l--);
          let r = js[js.length - 1] + 1; const rRun: number[] = []; while (free(r)) rRun.push(r++);
          const sk = (a: number[]) => skeleton([...a].sort((x, y) => x - y).map((j) => tail[j]).join(""));
          const okL = !left.length || wordsWorth(sk([...lRun, ...left]));
          const okR = !right.length || wordsWorth(sk([...right, ...rRun]));
          if (okL && okR) { best = [a, b]; break; }
        }
      }
      if (!best) continue;
      const keep = new Set(js.slice(best[0], best[1]));
      for (const j of js) if (!keep.has(j)) peeled.push(j);
      o.steps = o.steps.filter((s) => s.op === "d" || keep.has(s.j));
      o.firstJ = js[best[0]]; o.lastJ = js[best[1] - 1] + 1;
    }
    for (const j of peeled) inAny.delete(j);
    return peeled;
  }

  /**
   * Between two neighbouring words, the alignment can split the sounds in several equally cheap
   * ways (لِيَبلُوَكُم / ءَيُّكُم both end in كُم: "2:5 whole, 2:6 dropped" costs the same as "both
   * half-said"). Prefer the split that makes the most words exact, like a teacher would.
   */
  private resplit(occ: Occurrence[], tail: string[]) {
    for (let n = 0; n + 1 < occ.length; n++) {
      const A = occ[n], B = occ[n + 1];
      if (B.word !== A.word + 1 || !A.complete || !B.complete) continue;
      const ja = A.steps.filter((s) => s.op !== "d").map((s) => s.j);
      const jb = B.steps.filter((s) => s.op !== "d").map((s) => s.j);
      const js = [...ja, ...jb];
      if (js.length < 2) continue;
      const wa = this.reference.words[A.word], wb = this.reference.words[B.word];
      const ea = this.ref.slice(wa.s, wa.e), eb = this.ref.slice(wb.s, wb.e);
      const part = (e: string[], from: number, to: number) => editCost(e, js.slice(from, to).map((j) => tail[j]));
      const cur = ja.length;
      const score = (p: number) => { const ca = part(ea, 0, p), cb = part(eb, p, js.length); return { c: ca + cb, exact: Number(ca === 0) + Number(cb === 0) }; };
      let best = cur, bs = score(cur);
      for (let p = 0; p <= js.length; p++) {
        const sc = score(p);
        if (sc.c < bs.c - 1e-9 || (Math.abs(sc.c - bs.c) < 1e-9 && sc.exact > bs.exact)) { best = p; bs = sc; }
      }
      if (best === cur) continue;
      const toStep = (j: number): Step => ({ op: "m", i: -1, j });
      A.steps = js.slice(0, best).map(toStep);
      B.steps = js.slice(best).map(toStep);
      A.firstJ = A.steps.length ? A.steps[0].j : A.firstJ; A.lastJ = A.steps.length ? A.steps[A.steps.length - 1].j + 1 : A.firstJ;
      B.firstJ = B.steps.length ? B.steps[0].j : A.lastJ; B.lastJ = B.steps.length ? B.steps[B.steps.length - 1].j + 1 : B.firstJ;
    }
  }

  /**
   * Is this leftover sound a stutter of the words just said (said again), rather than added words?
   * Longer re-reads are already explained by jumping back, so this only needs to catch short ones,
   * and it must be strict: with 2-3 letter words almost anything would "match" loosely.
   */
  private nearby(piece: string[], k: number): boolean {
    const recent = this.reference.words.slice(Math.max(0, k - 4), k + 1).map((x) => skeleton(this.ref.slice(x.s, x.e).join(""))).flat();
    if (!recent.length) return false;
    const [cost] = bestSub(piece, recent);
    return cost <= Math.floor(piece.length * 0.2);
  }

  /** Committed words + the live, not yet final, words of the current path. */
  private output(live: Occurrence[], rec: string[], idx: number[], rconf: number[], final: boolean): CheckResult {
    const words = this.reference.words;
    const shown = new Map<number, WordResult>(this.committed);
    const base = this.hcut;
    let furthest = this.pos;
    let liveAt = -1; // the word the reciter is on now (latest word shown from live sounds)
    if (!final) {
      for (const o of live) {
        const w = words[o.word];
        const expected = this.ref.slice(w.s, w.e).join("");
        const js = o.steps.filter((s) => s.op !== "d").map((s) => s.j);
        const heardTxt = js.map((j) => rec[base + j] ?? "").join("");
        const range = js.length ? { at: idx[base + js[0]], end: idx[base + js[js.length - 1]] } : {};
        furthest = Math.max(furthest, o.complete ? w.e : w.s + 1);
        if (!o.complete) {
          // the word being said: "in progress" once real speech matches its opening letters
          const exp = skeleton(expected), got = skeleton(heardTxt);
          const need = Math.min(2, exp.length);
          let k = 0;
          while (k < need && k < got.length && same(exp[k], got[k])) k++;
          if (js.length && k >= need) { shown.set(o.word, { key: w.key, text: w.text, status: "in_progress", expected, heard: heardTxt, ...range }); liveAt = o.word; }
          continue;
        }
        const wconf = js.length ? js.reduce((t, j) => t + rconf[base + j], 0) / js.length : 1;
        const jw = judgeWord(expected, heardTxt, wconf);
        // not final yet: a mistake shows once the reciter has moved past it (committed)
        if (jw.status === "correct") { shown.set(o.word, { key: w.key, text: w.text, status: "correct", expected, heard: heardTxt, ...range }); liveAt = o.word; }
        else if (!jw.skippedOutright) { shown.set(o.word, { key: w.key, text: w.text, status: "unsure", expected, heard: heardTxt, ...range }); liveAt = o.word; }
      }
    }
    // going back (a breath and a re-read, or a redo): rewind the highlight to where the reciter is,
    // as if starting again from there. The words after it come back as they are re-read (and all
    // come back when the reciter stops).
    if (liveAt >= 0) this.front = liveAt;
    if (!final && this.front >= 0) for (const k of [...shown.keys()]) if (k > this.front) shown.delete(k);
    this.reached = Math.max(this.reached, furthest);
    const startIndex = this.startWord >= 0 ? words[this.startWord].s : 0;
    const anything = this.committed.size > 0;
    const result: WordResult[] = words.map((w, k) => {
      const r = shown.get(k);
      if (r) return r;
      const expected = this.ref.slice(w.s, w.e).join("");
      // lessons: the whole range must be recited, so on stopping, words never reached are skipped
      // (but only if anything was recited at all: starting and stopping the mic is not a mistake)
      if (final && this.finishMode === "all" && anything && w.s >= startIndex) return { key: w.key, text: w.text, status: "skipped", expected, heard: "" };
      return { key: w.key, text: w.text, status: "pending", expected, heard: "" };
    });
    return { words: result, extras: [...this.extras], reachedIndex: this.reached, startIndex, startKey: words[Math.max(0, this.startWord)]?.key ?? "" };
  }
}
