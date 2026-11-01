/**
 * Hesitation detection + mastery score. "Correct" isn't the same as "solid": a long pause before a word
 * (or before an ayah) means the memory is shaky even when the word comes out right.
 *
 *   const h = findHesitations(result)        // result from startListening (has times)
 *   const m = masteryScore(result, h)        // 0..100 + FSRS grade for the hifz engine
 */
import type { CheckResult } from "./checker";

export interface Hesitation {
  key: string; // the word that was slow to come
  seconds: number; // pause before it
  kind: "pause" | "transition" | "restart"; // mid-ayah pause, slow start of an ayah, or went back and restarted
}

const isAyahStart = (key: string) => key.endsWith(":1");

/** Pauses before words that are long for this reciter. Needs result.times (added by the live session). */
export function findHesitations(result: CheckResult & { times?: number[] }): Hesitation[] {
  const t = result.times;
  const out: Hesitation[] = [];
  if (t?.length) {
    const words = result.words.filter((w) => w.status !== "pending" && w.status !== "in_progress");
    const gaps: { key: string; gap: number }[] = [];
    for (let i = 1; i < words.length; i++) {
      const prev = words[i - 1];
      const cur = words[i];
      // only between neighbours that were both heard: a missing word would look like a long pause
      if (prev.end === undefined || cur.at === undefined) continue;
      gaps.push({ key: cur.key, gap: Math.max(0, (t[cur.at] ?? 0) - (t[prev.end] ?? 0)) });
    }
    // this reciter's normal pace (between words inside an ayah)
    const inner = gaps.filter((g) => !isAyahStart(g.key)).map((g) => g.gap).sort((a, b) => a - b);
    const typical = inner.length ? inner[Math.floor(inner.length / 2)] : 0.3;
    for (const g of gaps) {
      const start = isAyahStart(g.key);
      const limit = start ? Math.max(3.5, typical * 6) : Math.max(1.5, typical * 4);
      if (g.gap >= limit) out.push({ key: g.key, seconds: Math.round(g.gap * 10) / 10, kind: start ? "transition" : "pause" });
    }
  }
  // going back to restart a phrase is a hesitation too
  for (const x of result.extras) if (x.kind === "repeat" && !out.some((h) => h.key === x.atKey)) out.push({ key: x.atKey, seconds: 0, kind: "restart" });
  return out;
}

export interface Mastery {
  score: number; // 0..100
  grade: 1 | 2 | 3 | 4; // for the hifz engine: 1 Again, 2 Hard, 3 Good, 4 Easy
  label: "Solid" | "Good" | "Shaky" | "Needs work";
  mistakes: number;
  skips: number;
  hesitations: number;
}

/** One recitation's mastery: mistakes + hesitations + flow. */
export function masteryScore(result: CheckResult, hesitations: Hesitation[]): Mastery {
  const recited = result.words.filter((w) => w.status !== "pending");
  const mistakes = recited.filter((w) => w.status === "wrong").length;
  const skips = recited.filter((w) => w.status === "skipped").length;
  const unsure = recited.filter((w) => w.status === "unsure").length;
  const pen = { pause: 5, transition: 6, restart: 4 };
  let score = 100 - 12 * mistakes - 10 * skips - Math.min(5, unsure * 0.5);
  for (const h of hesitations) score -= pen[h.kind];
  score = Math.max(0, Math.min(100, Math.round(score)));
  const grade: Mastery["grade"] =
    mistakes + skips === 0 && hesitations.length === 0 && score >= 95 ? 4
    : mistakes + skips === 0 && score >= 80 ? 3
    : mistakes + skips <= 2 && score >= 50 ? 2
    : 1;
  const label = score >= 95 ? "Solid" : score >= 80 ? "Good" : score >= 60 ? "Shaky" : "Needs work";
  return { score, grade, label, mistakes, skips, hesitations: hesitations.length };
}
