/**
 * Going back to repeat: a reciter often redoes an ayah or a few words ("let me try that again").
 * A single alignment can only move forward, so the second try was matched against the words AFTER
 * it and marked them wrong. Here the recitation is split into attempts:
 *   - each update checks the current attempt only;
 *   - when the latest sounds clearly match an earlier, already-recited part of the range while the
 *     forward match is failing, the current attempt is closed at its last correct word and a new
 *     attempt starts there;
 *   - results are layered: the newest attempt's judgement wins for every word it reached, earlier
 *     attempts fill in the rest (so earlier mistakes stay unless they were re-recited).
 * Word indices (at / end) always refer to the full heard string, so replay timings stay right.
 */
import { check, checkReached, skeleton, type CheckResult, type Reference, type WordResult } from "./checker";
import { fit } from "./quran-index";

const TAIL = 10; // latest consonants compared with earlier text
const BAD_RUN = 2; // the forward match must be failing for at least this many words

type Timed = CheckResult & { heard?: string; conf?: number[]; times?: number[] };

/** Consonant skeleton of a sound string, with the index in the string of each consonant. */
function skelAt(chars: string[]): { sk: string[]; at: number[] } {
  const sk: string[] = [];
  const at: number[] = [];
  chars.forEach((c, i) => {
    const k = skeleton(c)[0];
    if (k && sk[sk.length - 1] !== k) { sk.push(k); at.push(i); }
  });
  return { sk, at };
}

function shift(r: CheckResult, by: number): CheckResult {
  if (!by) return r;
  return { ...r, words: r.words.map((w) => (w.at === undefined ? w : { ...w, at: w.at + by, end: (w.end ?? w.at) + by })) };
}

/** Newest attempt wins for every word it reached; earlier attempts fill in the rest. */
function layer(old: CheckResult | null, cur: CheckResult): CheckResult {
  if (!old) return cur;
  const prev = new Map(old.words.map((w) => [w.key, w]));
  const words: WordResult[] = cur.words.map((w) => (w.status === "pending" ? prev.get(w.key) ?? w : w));
  const mine = new Set(cur.words.filter((w) => w.status !== "pending").map((w) => w.key));
  return { ...cur, words, extras: [...old.extras.filter((x) => !mine.has(x.atKey)), ...cur.extras] };
}

export class Attempts {
  private segStart = 0; // index in heard where the current attempt begins
  private done: CheckResult | null = null; // earlier attempts, layered
  private refSk: { sk: string[]; at: number[] };

  constructor(private reference: Reference, private finishMode: "all" | "reached" = "all") {
    this.refSk = skelAt(Array.from(reference.norm));
  }

  /** Live result for everything heard so far. */
  update(heard: string, conf: number[]): CheckResult {
    let seg = heard.slice(this.segStart);
    let r = check(this.reference, seg, false, conf.slice(this.segStart));
    let cut = this.backJump(seg, r);
    if (cut > 0) cut = this.giveBack(seg, r, cut, conf);
    if (cut > 0) {
      // close the attempt at its last correct word, start a new one there
      const closed = checkReached(this.reference, seg.slice(0, cut), conf.slice(this.segStart, this.segStart + cut));
      this.done = layer(this.done, shift(closed, this.segStart));
      this.segStart += cut;
      seg = heard.slice(this.segStart);
      r = check(this.reference, seg, false, conf.slice(this.segStart));
    }
    return layer(this.done, shift(r, this.segStart));
  }

  /** Final result when the reciter stops. */
  finish(heard: string, conf: number[]): CheckResult {
    const seg = heard.slice(this.segStart);
    const c = conf.slice(this.segStart);
    // after a repeat, the last attempt only covers what was re-recited
    const last = this.finishMode === "reached" || this.done ? checkReached(this.reference, seg, c) : check(this.reference, seg, true, c);
    let out = layer(this.done, shift(last, this.segStart));
    if (this.finishMode === "all" && this.done) {
      // lessons: anything never reached in any attempt still counts as skipped
      out = { ...out, words: out.words.map((w) => (w.status === "pending" || w.status === "in_progress" ? { ...w, status: w.status === "in_progress" ? "unsure" : "skipped" } : w)) };
    }
    return out;
  }

  /**
   * The redo often starts with words that also continue the old attempt (Al-Mulk 2 and 3 both
   * begin with ٱلَّذِى): those were matched forward. Hand them back to the new attempt when they are
   * exactly the words just before where the new attempt starts.
   */
  private giveBack(seg: string, r: CheckResult, cut: number, conf: number[]): number {
    const words = this.reference.words;
    const fresh = check(this.reference, seg.slice(cut), false, conf.slice(this.segStart + cut));
    let k = words.findIndex((w) => w.key === fresh.startKey);
    // the redo's own opening word may have been swallowed by the old attempt: skip past it
    const fw = fresh.words;
    while (k >= 0 && k < fw.length - 1 && fw[k].status === "skipped") k++;
    const mine = r.words.filter((w) => w.at !== undefined && (w.end ?? w.at) < cut && w.status === "correct");
    const norm = Array.from(this.reference.norm);
    let i = mine.length - 1;
    let gave = false;
    while (k > 0 && i >= 0 && mine[i].expected === norm.slice(words[k - 1].s, words[k - 1].e).join("")) {
      k--; i--; gave = true;
    }
    // everything after the last word that really belongs to the old attempt goes to the redo
    // (including the onset sounds of its first word, e.g. the ءَ of ٱلَّذِى)
    if (gave) cut = i >= 0 ? (mine[i].end ?? mine[i].at!) + 1 : cut;
    return cut;
  }

  /** Characters into the current attempt where a jump back began (0 = none). */
  private backJump(seg: string, r: CheckResult): number {
    const chars = Array.from(seg);
    const { sk, at } = skelAt(chars);
    if (sk.length < TAIL + 6) return 0;
    // the forward match is failing: the latest judged words are wrong / unsure
    const judged = r.words.filter((w) => w.status !== "pending" && w.status !== "in_progress" && w.at !== undefined);
    let run = 0;
    while (run < judged.length && judged[judged.length - 1 - run].status !== "correct") run++;
    if (run < BAD_RUN || run === judged.length) return 0;
    const lastGood = judged[judged.length - 1 - run];
    // the latest sounds match somewhere earlier in the range (before where this attempt has got to)
    const tail = sk.slice(-TAIL);
    const reachedSk = this.refSk.at.findIndex((p) => p >= r.reachedIndex);
    const limit = (reachedSk < 0 ? this.refSk.sk.length : reachedSk) - TAIL;
    if (limit < TAIL) return 0;
    const [backCost] = fit(tail, this.refSk.sk.slice(0, limit));
    const [fwdCost] = fit(tail, this.refSk.sk.slice(Math.max(0, limit - 2), limit + TAIL * 2));
    if (backCost > 1 || fwdCost - backCost < 3) return 0;
    // cut right after the last correct word of this attempt (where the repeat began)
    const cutChar = (lastGood.end ?? lastGood.at ?? 0) + 1;
    return cutChar > 0 && cutChar < chars.length && cutChar <= at[at.length - TAIL] ? cutChar : 0;
  }
}
