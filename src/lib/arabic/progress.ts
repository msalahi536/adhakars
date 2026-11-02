/**
 * Progress shown to the learner: measured in Quran, not points.
 * Al-Fatiha meter, share of Quran words recognised, letters known, milestones, streak.
 */
import { LESSONS, fatihaMeter, knownAfter } from "./curriculum";
import { coverageOf } from "./vocab";
import { lessonStatus } from "./session";
import type { ArabicState } from "./state";
import { addDays } from "@/lib/hifz/fsrs";

/** The highest reading lesson passed (or skipped by placement). */
export function readingDay(s: ArabicState): number {
  let day = 0;
  for (const l of LESSONS) if (lessonStatus(s, l) === "passed") day = l.day; else break;
  return day;
}

export function knownWords(s: ArabicState): Set<string> {
  return new Set(Object.keys(s.memory).filter((k) => k.startsWith("v:")).map((k) => k.slice(2)));
}
export function knownPieces(s: ArabicState): Set<string> {
  return new Set(Object.keys(s.memory).filter((k) => k.startsWith("a:") || k.startsWith("g:")));
}

export interface Overview {
  readingDay: number; // 0..30
  fatiha: { readable: number; total: number };
  lettersKnown: number; // 0..28 (+ hamza)
  wordsKnown: number; // vocabulary families learned
  quranCoverage: number; // 0..1 share of Quran words recognised
  streak: number; // days in a row with practice
}

export function overview(s: ArabicState, today: string): Overview {
  const day = readingDay(s);
  const known = knownAfter(day);
  const f = fatihaMeter(known);
  const words = knownWords(s);
  return {
    readingDay: day,
    fatiha: { readable: f.readable, total: f.total },
    lettersKnown: known.letters.size,
    wordsKnown: words.size,
    quranCoverage: coverageOf(words),
    streak: streak(s, today),
  };
}

/** Days in a row with practice, ending today (or yesterday, so the streak survives until tonight). */
export function streak(s: ArabicState, today: string): number {
  let d = (s.days[today] ?? 0) > 0 ? today : addDays(today, -1);
  let n = 0;
  while ((s.days[d] ?? 0) > 0) { n++; d = addDays(d, -1); }
  return n;
}

export interface Milestone {
  id: string;
  title: string;
  detail: string;
}

export const MILESTONES: (Milestone & { reached: (s: ArabicState, o: Overview) => boolean })[] = [
  { id: "first-letter", title: "Your first letter", detail: "The journey to reading the Quran has begun.", reached: (_, o) => o.readingDay >= 1 },
  { id: "all-letters", title: "All 28 letters", detail: "You know every letter of the Quran.", reached: (_, o) => o.readingDay >= 5 },
  { id: "first-word", title: "Your first Quran word", detail: "You read a real word of the Quran.", reached: (_, o) => o.readingDay >= 9 },
  { id: "fatiha-half", title: "Half of Al-Fatiha", detail: "You can read half of its words.", reached: (_, o) => o.fatiha.readable * 2 >= o.fatiha.total },
  { id: "fatiha-all", title: "Every word of Al-Fatiha", detail: "You can read every word of the surah you pray with.", reached: (_, o) => o.fatiha.readable === o.fatiha.total },
  { id: "fatiha-alone", title: "Al-Fatiha, read alone", detail: "You read Al-Fatiha on your own. Read it to a teacher too.", reached: (s) => !!s.passed["r30"] },
  { id: "words-100", title: "100 Quran words", detail: "More than half of the Quran's words are now familiar.", reached: (_, o) => o.wordsKnown >= 100 },
  { id: "words-250", title: "250 Quran words", detail: "About 7 in 10 words of the Quran.", reached: (_, o) => o.wordsKnown >= 250 },
  { id: "words-500", title: "500 Quran words", detail: "About 4 in 5 words of the Quran.", reached: (_, o) => o.wordsKnown >= 500 },
  { id: "streak-7", title: "A week in a row", detail: "Small and steady is the way.", reached: (_, o) => o.streak >= 7 },
  { id: "streak-30", title: "30 days in a row", detail: "Thirty days of steady learning.", reached: (_, o) => o.streak >= 30 },
];

/** Milestones reached now that were not reached before (saved into the state). */
export function newMilestones(s: ArabicState, today: string): Milestone[] {
  const o = overview(s, today);
  const out: Milestone[] = [];
  for (const m of MILESTONES) {
    if (s.milestones[m.id] || !m.reached(s, o)) continue;
    s.milestones[m.id] = today;
    out.push({ id: m.id, title: m.title, detail: m.detail });
  }
  return out;
}
