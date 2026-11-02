/**
 * "Say it" judging for the course (pure: no audio, testable), on the phone with the same recitation model as hifz.
 *
 * A syllable, word or short phrase is turned into the model's sound alphabet (phonetic.ts), the
 * learner says it, and the two are compared sound by sound. Feedback is specific and kind:
 * which letter changed (with that letter's tip), a wrong vowel, a vowel too short / too long,
 * a missing shadda. Heavy/light swaps (ص/س) count as "close", never as a failure on their own.
 *
 * Automatic feedback can be wrong and does not replace a qualified teacher (AI_DISCLAIMER).
 */
import { toPhonemes } from "./phonetic";
import { LETTER } from "./letters";

export interface Unit {
  c: string; // consonant ("" for a vowel with no consonant)
  v: "" | "a" | "i" | "u";
  long: boolean;
  double: boolean;
}

const CONS = new Set(Array.from("ءبتثجحخدذرزسشصضطظعغفقكلمنهوي"));
const NASAL: Record<string, string> = { "ں": "ن", "۾": "م" };
const VOWEL: Record<string, Unit["v"]> = { "َ": "a", "ِ": "i", "ُ": "u" };
const LONG = new Set(["ا", "ۥ", "ۦ"]);

/** Split a sound string into syllable-like units: consonant + vowel (+ length, doubling). */
export function units(ph: string): Unit[] {
  const out: Unit[] = [];
  let longRun = 0;
  for (const raw of ph) {
    const ch = NASAL[raw] ?? raw;
    const last = out[out.length - 1];
    if (CONS.has(ch) && !(LONG.has(ch) && last?.v)) {
      longRun = 0;
      if (last && last.c === ch && !last.v) { last.double = true; continue; }
      out.push({ c: ch, v: "", long: false, double: false });
      continue;
    }
    if (VOWEL[ch]) {
      if (last && !last.v) last.v = VOWEL[ch];
      else out.push({ c: "", v: VOWEL[ch], long: false, double: false });
      longRun = 0;
      continue;
    }
    if (LONG.has(ch) && last) {
      if (!last.v) last.v = ch === "ا" ? "a" : ch === "ۥ" ? "u" : "i";
      longRun++;
      if (longRun >= 2 || ch !== "ا") last.long = true;
    }
    // qalqalah / pause marks (ڇ ۜ ۪) carry no meaning for the course
  }
  return out;
}

export type IssueKind = "letter" | "heavy-light" | "vowel" | "too-short" | "too-long" | "shadda" | "missed" | "extra";
export interface Issue {
  kind: IssueKind;
  at: number; // index of the expected unit
  expected?: string; // the letter / vowel expected
  heard?: string;
  tip: string;
}
export type Verdict = "correct" | "close" | "wrong" | "silent";
export interface SayResult {
  verdict: Verdict;
  score: number; // 0..1
  heard: string; // raw model output
  issues: Issue[];
}

// letters that are easy to swap and only differ by heaviness or place: "close", with a tip
const SOFT_PAIRS = new Set(["سص", "صس", "تط", "طت", "دض", "ضد", "ذظ", "ظذ", "زظ", "ظز", "كق", "قك", "هح", "حه", "ءع", "عء", "سث", "ثس", "زذ", "ذز", "خغ", "غخ", "نم", "من"]);
const VOWEL_NAME = { a: "fatha (a)", i: "kasra (i)", u: "damma (u)", "": "no vowel (sukoon)" } as const;

function cost(a: Unit, b: Unit): number {
  let c = 0;
  if (a.c !== b.c) c += SOFT_PAIRS.has(a.c + b.c) ? 0.4 : 1;
  if (a.v !== b.v) c += 0.6;
  if (a.long !== b.long) c += 0.25;
  if (a.double !== b.double) c += 0.25;
  return c;
}

/** Compare what was expected with what was heard. */
export function compare(expected: Unit[], heard: Unit[]): { score: number; issues: Issue[] } {
  const n = expected.length, m = heard.length;
  const D: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      D[i][j] = Math.min(D[i - 1][j] + 1, D[i][j - 1] + 1, D[i - 1][j - 1] + cost(expected[i - 1], heard[j - 1]));
  const issues: Issue[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && D[i][j] === D[i - 1][j - 1] + cost(expected[i - 1], heard[j - 1])) {
      const e = expected[i - 1], h = heard[j - 1], at = i - 1;
      if (e.c !== h.c) {
        const soft = SOFT_PAIRS.has(e.c + h.c);
        issues.push({ kind: soft ? "heavy-light" : "letter", at, expected: e.c, heard: h.c, tip: letterTip(e.c, h.c) });
      }
      if (e.v !== h.v) issues.push({ kind: "vowel", at, expected: e.v, heard: h.v, tip: `Say ${VOWEL_NAME[e.v]} on ${e.c || "this letter"}, not ${VOWEL_NAME[h.v]}.` });
      else if (e.long && !h.long) issues.push({ kind: "too-short", at, tip: "Stretch this vowel for two counts." });
      else if (!e.long && h.long) issues.push({ kind: "too-long", at, tip: "Keep this vowel short: one quick beat." });
      if (e.double && !h.double) issues.push({ kind: "shadda", at, expected: e.c, tip: `${e.c} has a shadda: hold it, as if saying it twice.` });
      i--; j--;
    } else if (i > 0 && D[i][j] === D[i - 1][j] + 1) {
      issues.push({ kind: "missed", at: i - 1, expected: expected[i - 1].c, tip: `Don't skip ${expected[i - 1].c || "this sound"}.` });
      i--;
    } else {
      issues.push({ kind: "extra", at: Math.max(0, i - 1), heard: heard[j - 1].c, tip: "Something extra was heard. Say only what is written." });
      j--;
    }
  }
  issues.reverse();
  const score = n === 0 ? 0 : Math.max(0, 1 - D[n][m] / Math.max(n, 1));
  return { score, issues };
}

function letterTip(expected: string, heard: string): string {
  const e = LETTER.get(expected);
  const said = heard ? `It sounded like ${heard}. ` : "";
  return e ? `${said}${e.ar} (${e.name}): ${e.tip}` : `${said}Say ${expected}.`;
}

const MAJOR: IssueKind[] = ["letter", "vowel", "missed", "extra"];

/** The verdict for one attempt, trying the ways a word may fairly be said (with / without stopping). */
export function judge(targets: string[], heard: string, opts: { strictLetters?: boolean } = {}): SayResult {
  const h = units(heard);
  if (!h.length) return { verdict: "silent", score: 0, heard, issues: [] };
  let best: { score: number; issues: Issue[] } | null = null;
  for (const t of targets) {
    const r = compare(units(t), h);
    if (!best || r.score > best.score) best = r;
  }
  const { score, issues } = best!;
  // in the letter-sound lessons a heavy/light swap is exactly what is being taught
  const major = issues.filter((x) => MAJOR.includes(x.kind) || (opts.strictLetters && x.kind === "heavy-light"));
  const verdict: Verdict = !issues.length ? "correct" : !major.length || (score >= 0.85 && major.length === 1 && major[0].kind === "extra") ? "close" : "wrong";
  return { verdict, score, heard, issues };
}

/** Every fair way to say a written syllable or word on its own. */
export function targetsFor(text: string, extra: string[] = []): string[] {
  const words = text.trim().split(/\s+/);
  const join = (o: { pause: boolean }) => words.map((w, i) => toPhonemes(w, { standalone: i === 0, pause: o.pause && i === words.length - 1 })).join("");
  return [...new Set([join({ pause: false }), join({ pause: true }), ...extra])];
}

