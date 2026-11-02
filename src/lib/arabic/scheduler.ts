/**
 * Spaced review for letters, syllables, skills, words and pieces, using the same FSRS memory
 * model as hifz (src/lib/hifz/fsrs.ts) with course settings: 90% target recall, max 6 months.
 */
import { review, strength, type ScheduleOptions } from "@/lib/hifz/fsrs";
import type { Grade } from "@/lib/hifz/types";
import type { ArabicState } from "./state";

export const COURSE_SCHEDULE: ScheduleOptions = { retention: 0.9, maxInterval: 180 };

export interface Answer {
  correct: boolean;
  close?: boolean; // right idea, small slip (heavy/light, length)
  hinted?: boolean; // needed the hint or a replay
  fast?: boolean; // answered quickly and surely
}

/** 1 forgot, 2 hard, 3 good, 4 easy — the same scale as hifz. */
export function gradeFor(a: Answer): Grade {
  if (!a.correct && !a.close) return 1;
  if (a.close || a.hinted) return 2;
  return a.fast ? 4 : 3;
}

/** Start reviewing items the learner has just been taught (first review tomorrow-ish). */
export function enterReview(s: ArabicState, ids: string[], today: string): void {
  for (const id of ids) if (!s.memory[id]) s.memory[id] = review(undefined, 3, today, COURSE_SCHEDULE);
}

/**
 * Record one answer. Items not yet in review (still being taught) are not scheduled, but a
 * wrong pick is still remembered as a confusion so look-alike drills can target it.
 */
export function recordAnswer(s: ArabicState, id: string, a: Answer, today: string, picked?: string): void {
  if (!a.correct && picked && picked !== id) {
    const k = `${id}>${picked}`;
    s.confusions[k] = (s.confusions[k] ?? 0) + 1;
  }
  const m = s.memory[id];
  if (m) s.memory[id] = review(m, gradeFor(a), today, COURSE_SCHEDULE);
}

const typeOf = (id: string) => id.slice(0, id.indexOf(":"));

/**
 * Items due today, weakest first, then interleaved by type (letter, word, meaning…) so a review
 * never runs through one kind in order.
 */
export function dueItems(s: ArabicState, today: string, max = 20): string[] {
  const due = Object.entries(s.memory)
    .filter(([, m]) => m.due <= today)
    .sort((a, b) => strength(a[1], today) - strength(b[1], today))
    .map(([id]) => id)
    .slice(0, max);
  const groups = new Map<string, string[]>();
  for (const id of due) {
    const t = typeOf(id);
    if (!groups.has(t)) groups.set(t, []);
    groups.get(t)!.push(id);
  }
  const out: string[] = [];
  while (out.length < due.length) for (const g of groups.values()) if (g.length) out.push(g.shift()!);
  return out;
}

/** Look-alike pairs this learner actually mixes up, most often first. */
export function topConfusions(s: ArabicState, max = 3): [string, string][] {
  return Object.entries(s.confusions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([k]) => k.split(">") as [string, string]);
}

/** Memory strength 0..1 of an item (for the progress map). */
export function itemStrength(s: ArabicState, id: string, today: string): number {
  return strength(s.memory[id], today);
}
