/**
 * FSRS (Free Spaced Repetition Scheduler), v4.5 formulas with the published default weights.
 * The modern successor to SM-2 / Anki's old algorithm: it models each page's
 * stability (how long it lasts) and difficulty, and schedules the next review
 * for the moment recall probability would drop to the target retention.
 *
 * Hifz-specific changes:
 *  - higher default retention (0.93): Qur'an should not be "mostly remembered"
 *  - a hard cap on intervals so no memorized page goes untouched for too long
 */
import type { Grade, MemoryState } from "./types";

const W = [
  0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793,
  0.3246, 1.587, 0.2272, 2.8755,
];
const DECAY = -0.5;
const FACTOR = 19 / 81; // makes R(S) = 0.9

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000);
}

/** Probability the page can be recited correctly `elapsed` days after the last review. */
export function retrievability(elapsed: number, stability: number): number {
  return Math.pow(1 + (FACTOR * Math.max(0, elapsed)) / stability, DECAY);
}

/** Days until retrievability falls to `retention`. */
export function intervalFor(stability: number, retention: number): number {
  return (stability / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
}

const initDifficulty = (g: Grade) => clamp(W[4] - (g - 3) * W[5], 1, 10);

function nextDifficulty(d: number, g: Grade) {
  const nd = d - W[6] * (g - 3);
  return clamp(W[7] * initDifficulty(4) + (1 - W[7]) * nd, 1, 10);
}

function recallStability(d: number, s: number, r: number, g: Grade) {
  const hard = g === 2 ? W[15] : 1;
  const easy = g === 4 ? W[16] : 1;
  return s * (Math.exp(W[8]) * (11 - d) * Math.pow(s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy + 1);
}

function forgetStability(d: number, s: number, r: number) {
  return Math.min(s, W[11] * Math.pow(d, -W[12]) * (Math.pow(s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r)));
}

export interface ScheduleOptions {
  retention: number; // target recall probability at review time
  maxInterval: number; // days
  minInterval?: number;
}

/** Apply one review and return the new memory state. */
export function review(prev: MemoryState | undefined, grade: Grade, today: string, opt: ScheduleOptions): MemoryState {
  let stability: number;
  let difficulty: number;
  let lapses = prev?.lapses ?? 0;
  if (!prev) {
    stability = W[grade - 1];
    difficulty = initDifficulty(grade);
  } else {
    const elapsed = daysBetween(prev.lastReview, today);
    const r = retrievability(elapsed, prev.stability);
    difficulty = nextDifficulty(prev.difficulty, grade);
    if (grade === 1) {
      stability = forgetStability(prev.difficulty, prev.stability, r);
      lapses += 1;
    } else if (elapsed === 0) {
      // same-day repeat: small boost only (short-term effect), never a big jump
      stability = prev.stability * (grade === 2 ? 1.0 : grade === 3 ? 1.15 : 1.3);
    } else {
      stability = recallStability(prev.difficulty, prev.stability, r, grade);
    }
  }
  stability = clamp(stability, 0.1, 36500);
  let days = intervalFor(stability, opt.retention);
  if (grade === 1) days = 1; // forgot: see it again tomorrow, no matter what
  if (grade === 2) days = Math.min(days, 3); // mistakes: come back within 3 days
  days = clamp(Math.round(days), opt.minInterval ?? 1, opt.maxInterval);
  return {
    stability,
    difficulty,
    lastReview: today,
    due: addDays(today, days),
    reps: (prev?.reps ?? 0) + 1,
    lapses,
  };
}

/** Current strength of a page (0..1) for the progress map. */
export function strength(m: MemoryState | undefined, today: string): number {
  if (!m) return 0;
  return retrievability(daysBetween(m.lastReview, today), m.stability);
}
