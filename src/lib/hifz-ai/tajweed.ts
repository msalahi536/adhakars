/**
 * Tajweed hints: gentle pronunciation tips on words that were recited correctly from memory.
 * Only rules the model hears reliably (see the model card's limitations):
 *   heavy/light letters (ص/س, ط/ت, ض/د, ظ/ذ, ق/ك ...), missing qalqalah inside a word,
 *   a natural 2-count madd cut short, the 6-count madd lazim held too short, and a dropped shadda.
 * Never: ikhfa / idgham / ghunnah quality (the model hears the rule, not the reciter), or free-choice
 * madd lengths (munfasil / aared). Hints never count against memorization.
 * Automatic tajweed feedback can be wrong and does not replace a qualified teacher.
 */
import { buildReference, loadSurah, type CheckResult } from "./checker";

export type TajweedKind = "heavy" | "light" | "qalqalah" | "madd" | "madd-lazim" | "shadda";

export interface TajweedHint {
  key: string; // word key "sura:aya:word"
  text: string; // the written word
  kind: TajweedKind;
  letter: string; // the letter (or vowel) concerned
  heard?: string; // what it sounded like, for swaps
  tip: string; // short, friendly explanation
}

const MARKS = new Set(["َ", "ُ", "ِ", "ڇ", "ۜ", " "]); // short vowels + qalqalah/pause marks
const MADD = new Set(["ا", "ۥ", "ۦ"]);
const NASAL = new Set(["ن", "م", "ں", "۾"]);

// expected letter -> heard letter that means the letter lost (or gained) its proper quality
const SWAPS: Record<string, { heard: string; kind: "heavy" | "light"; tip: string }[]> = {
  "ص": [{ heard: "س", kind: "heavy", tip: "ص is a heavy letter: raise the back of the tongue (not س)." }],
  "ط": [{ heard: "ت", kind: "heavy", tip: "ط is heavy: full mouth, tongue pressed up (not ت)." }],
  "ض": [{ heard: "د", kind: "heavy", tip: "ض comes from the side of the tongue and is heavy (not د)." }],
  "ظ": [{ heard: "ذ", kind: "heavy", tip: "ظ is the heavy form of ذ: tongue tip between the teeth, mouth full." }, { heard: "ز", kind: "heavy", tip: "ظ: tongue tip between the teeth and heavy (not ز)." }],
  "ق": [{ heard: "ك", kind: "heavy", tip: "ق comes from deep at the back of the tongue (not ك)." }],
  "ح": [{ heard: "ه", kind: "light", tip: "ح comes from the middle of the throat, breathy and clear (not ه)." }],
  "ع": [{ heard: "ء", kind: "light", tip: "ع comes from the middle of the throat (not a plain hamza)." }],
  "ث": [{ heard: "س", kind: "light", tip: "ث: tongue tip between the teeth (not س)." }],
  "ذ": [{ heard: "ز", kind: "light", tip: "ذ: tongue tip between the teeth (not ز)." }, { heard: "د", kind: "light", tip: "ذ: tongue tip between the teeth (not د)." }],
  "س": [{ heard: "ص", kind: "light", tip: "س is a light letter here, keep it thin (not ص)." }],
  "ت": [{ heard: "ط", kind: "light", tip: "ت is light, keep it thin (not ط)." }],
  "د": [{ heard: "ض", kind: "light", tip: "د is light here (not ض)." }],
  "ك": [{ heard: "ق", kind: "light", tip: "ك is light, from the front of the tongue (not ق)." }],
};

/** Consonants in order (vowels, madd letters and marks removed, repeats collapsed). */
function consonants(ph: string): string[] {
  const out: string[] = [];
  for (const c of ph) {
    if (MARKS.has(c) || MADD.has(c)) continue;
    if (out[out.length - 1] !== c) out.push(c);
  }
  return out;
}

/** Runs of madd letters in order: [letter, length]. A consonant closes a run. */
function maddRuns(ph: string): [string, number][] {
  const runs: [string, number][] = [];
  let open = false;
  for (const c of ph) {
    if (MADD.has(c)) {
      const last = runs[runs.length - 1];
      if (open && last && last[0] === c) last[1]++;
      else runs.push([c, 1]);
      open = true;
    } else if (!MARKS.has(c) || c === "ڇ") {
      open = false;
    }
  }
  return runs;
}

// و / ي double naturally when tanween or noon merges into them (idgham), so their doubling isn't judged
const NO_SHADDA = new Set([...NASAL, "و", "ي"]);

/** Doubled (shadda) consonants inside the word (not its first letter, which depends on the join). */
function geminates(ph: string): string[] {
  const out: string[] = [];
  const chars = Array.from(ph).filter((c) => !MARKS.has(c));
  for (let i = 2; i < chars.length; i++) {
    const c = chars[i];
    if (c === chars[i - 1] && !MADD.has(c) && !NO_SHADDA.has(c) && chars[i - 2] !== c) out.push(c);
  }
  return out;
}

/** Letter-for-letter substitutions between two consonant sequences (edit-distance alignment). */
function substitutions(a: string[], b: string[]): [string, string][] {
  const n = a.length;
  const m = b.length;
  const d = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  const out: [string, string][] = [];
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (d[i][j] === d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)) {
      if (a[i - 1] !== b[j - 1]) out.push([a[i - 1], b[j - 1]]);
      i--; j--;
    } else if (d[i][j] === d[i - 1][j] + 1) i--;
    else j--;
  }
  return out;
}

const madName = (c: string) => (c === "ا" ? "ا" : c === "ۥ" ? "و" : "ي");

/**
 * Tajweed hints for a finished recitation. `result` must carry `heard` and `conf` (the live session adds them).
 * `passages` = the ayah ranges that were recited (same as for startListening).
 */
export async function tajweedHints(
  result: CheckResult & { heard?: string; conf?: number[] },
  passages: { sura: number; first: number; last: number }[],
  max = 3,
): Promise<TajweedHint[]> {
  const heard = result.heard ?? "";
  if (!heard) return [];
  const conf = result.conf ?? [];
  const refs = await Promise.all(passages.map(async (p) => buildReference(await loadSurah(p.sura), p.sura, p.first, p.last)));
  const ph = new Map<string, string>();
  const lastOfAyah = new Set<string>();
  for (const r of refs) {
    r.words.forEach((w, i) => {
      ph.set(w.key, w.ph);
      const next = r.words[i + 1];
      if (!next || next.key.slice(0, next.key.lastIndexOf(":")) !== w.key.slice(0, w.key.lastIndexOf(":"))) lastOfAyah.add(w.key);
    });
  }
  const hints: (TajweedHint & { weight: number })[] = [];
  for (const w of result.words) {
    if ((w.status !== "correct" && w.status !== "unsure") || w.at === undefined || w.end === undefined) continue;
    const exp = ph.get(w.key);
    if (!exp) continue;
    // the checker merges repeated sounds (اا -> ا): take the repeats back so madd and shadda keep their length
    let end = w.end;
    while (end + 1 < heard.length && heard[end + 1] === heard[w.end]) end++;
    const said = heard.slice(w.at, end + 1);
    const c = conf.slice(w.at, end + 1);
    const sure = c.length ? c.reduce((a, b) => a + b, 0) / c.length : 1;
    if (sure < 0.7) continue; // unclear audio: say nothing
    const add = (h: TajweedHint, weight: number) => hints.push({ ...h, weight: weight * sure });

    // 1. heavy / light letters (same consonant skeleton length, one letter's quality changed)
    const ec = consonants(exp);
    const hc = consonants(said);
    const subs = substitutions(ec, hc);
    if (subs.length <= 2) {
      for (const [e, h] of subs) {
        const swap = SWAPS[e]?.find((s) => s.heard === h);
        if (swap) add({ key: w.key, text: w.text, kind: swap.kind, letter: e, heard: h, tip: swap.tip }, 3);
      }
    }
    // 2. qalqalah inside the word (not the stop at the end, which depends on pausing)
    const qi = exp.indexOf("ڇ");
    if (qi > 0 && qi < exp.length - 1 && !said.includes("ڇ")) {
      const letter = Array.from(exp.slice(0, qi)).reverse().find((x) => !MARKS.has(x)) ?? "";
      add({ key: w.key, text: w.text, kind: "qalqalah", letter, tip: `Give ${letter} a light bounce (qalqalah) when it has a sukoon.` }, 2);
    }
    // 3/4. madd: natural 2 counts cut to 1; madd lazim (6) held 3 or less. Free-choice madd is never judged.
    const er = maddRuns(exp);
    const hr = maddRuns(said);
    if (er.length === hr.length) {
      er.forEach(([m, n], i) => {
        const got = hr[i][0] === m ? hr[i][1] : n;
        if (n === 2 && got === 1) add({ key: w.key, text: w.text, kind: "madd", letter: madName(m), tip: `Stretch the ${madName(m)} for 2 counts: a short vowel here can change the meaning.` }, 2);
        if (n === 6 && got <= 3 && !lastOfAyah.has(w.key)) add({ key: w.key, text: w.text, kind: "madd-lazim", letter: madName(m), tip: "This madd (lazim) is held for 6 counts." }, 2);
      });
    }
    // 5. shadda dropped on a non-nasal letter
    const eg = geminates(exp);
    if (eg.length) {
      const hg = geminates(said);
      for (const g of eg) if (!hg.includes(g) && consonants(said).includes(g)) {
        add({ key: w.key, text: w.text, kind: "shadda", letter: g, tip: `Hold the shadda on ${g}: press it a moment longer.` }, 1);
        break;
      }
    }
  }
  // gentle: at most `max`, strongest first, one per word
  const seen = new Set<string>();
  return hints
    .sort((a, b) => b.weight - a.weight)
    .filter((h) => (seen.has(h.key) ? false : (seen.add(h.key), true)))
    .slice(0, max)
    .map(({ weight: _w, ...h }) => h);
}
