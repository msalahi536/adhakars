/**
 * 3-minute placement: who are you, can you match sounds to letters, can you read syllables,
 * can you read real Quran words. Picks the first lesson; skipped lessons stay open to revisit.
 */
import type { ArabicState, LearnerType } from "./state";
import { enterReview } from "./scheduler";
import { LESSONS } from "./curriculum";
import { lessonItems } from "./session";

export const PLACEMENT_INTRO: { id: LearnerType; label: string; hint: string }[] = [
  { id: "beginner", label: "I've never read Arabic", hint: "Start from the very first letter." },
  { id: "speaker", label: "I speak Arabic but can't read it", hint: "You know the sounds, so we focus on the letters' shapes." },
  { id: "some-reading", label: "I can read a little", hint: "A short check finds where to start." },
];

/** Part 1: hear the sound, tap the letter (one from each look-alike group). */
export const PLACEMENT_LETTERS = ["ب", "ج", "ص", "ع", "ق", "ه"];
/** Part 2: read aloud, checked by the AI. */
export const PLACEMENT_SYLLABLES = ["بَ", "تِ", "سُ", "قَا", "مِي"];
/** Part 3: real Quran words: shadda, sukoon, ٱلْ + Uthmani spelling. */
export const PLACEMENT_WORDS = [
  { key: "1:2:3", text: "رَبِّ" },
  { key: "112:1:1", text: "قُلْ" },
  { key: "1:2:1", text: "ٱلْحَمْدُ" },
  { key: "1:3:1", text: "ٱلرَّحْمَـٰنِ" },
];

export interface PlacementAnswers {
  learner: LearnerType;
  letters?: number; // right out of PLACEMENT_LETTERS.length
  syllables?: number; // passed out of PLACEMENT_SYLLABLES.length
  words?: number; // passed out of PLACEMENT_WORDS.length
}

/** Which parts to run: beginners can stop after part 1. */
export function nextPart(a: PlacementAnswers): "letters" | "syllables" | "words" | "done" {
  if (a.letters === undefined) return a.learner === "beginner" ? "done" : "letters";
  if (a.letters < 5) return "done";
  if (a.syllables === undefined) return "syllables";
  if (a.syllables < 4) return "done";
  if (a.words === undefined) return "words";
  return "done";
}

/** First lesson day for these answers. */
export function startDay(a: PlacementAnswers): number {
  if (a.learner === "beginner" || (a.letters ?? 0) < 5) return 1;
  if ((a.syllables ?? 0) < 4) return 6; // knows letters, not yet joining and vowels
  const w = a.words ?? 0;
  if (w <= 1) return 16; // reads short vowels, not yet long vowels / sukoon / shadda
  if (w === 2) return 22; // up to shadda
  if (w === 3) return 26; // up to Quran spelling
  return 28; // reads Quran words already: straight to reading surahs
}

/** Save the result. Skipped lessons' letters and sounds join review, lightly, so they stay fresh. */
export function applyPlacement(s: ArabicState, a: PlacementAnswers, day: string): number {
  const start = startDay(a);
  s.learner = a.learner;
  s.placement = { on: day, startDay: start };
  for (const l of LESSONS) if (l.day < start) enterReview(s, lessonItems(l).filter((id) => id.startsWith("l:") || id.startsWith("k:")), day);
  return start;
}
