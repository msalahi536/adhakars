/**
 * Arabic Companion progress: one plain JSON object in device storage (key "arabic_state_v2").
 * Replaces the old log ("arabic:log:v1"), which is left untouched.
 *
 * Item ids:
 *   l:ب   a letter           s:بَ   a syllable        k:fatha  a reading skill
 *   w:1:2:1 a Quran word read aloud                    v:v12   a vocabulary family
 *   a:wa  a front/end piece  g:ya  a verb pattern
 */
import type { MemoryState } from "@/lib/hifz/types";

export type Track = "read" | "understand";
export type LearnerType = "beginner" | "speaker" | "some-reading";

export interface LessonAttempt {
  lessonId: string; // "r7" or "u12" (vocabulary day 12)
  on: string; // yyyy-mm-dd
  score: number; // 0..1
  minutes: number;
}

export interface ArabicState {
  version: 2;
  createdOn: string;
  learner?: LearnerType;
  placement?: { on: string; startDay: number };
  /** Reading lessons passed: lessonId -> first day passed. */
  passed: Record<string, string>;
  attempts: LessonAttempt[];
  /** Vocabulary days completed: day number -> date. */
  vocabDone: Record<number, string>;
  /** Memory of every item that has entered review. */
  memory: Record<string, MemoryState>;
  /** "l:ح>l:ه" -> times the first was mistaken for the second. */
  confusions: Record<string, number>;
  milestones: Record<string, string>; // id -> date reached
  /** Minutes practised per day, for the streak and the Today card. */
  days: Record<string, number>;
  settings: {
    dailyMinutes: 10 | 15 | 20 | 30;
    kidMode: boolean; // a parent listens along (the AI is weaker for under-12s)
    sounds: boolean; // single-tone feedback, off by default
    showMeanings: boolean; // known words show their meaning faintly in the reader
  };
}

export const STORAGE_KEY = "arabic_state_v2";

export function newState(today: string): ArabicState {
  return {
    version: 2,
    createdOn: today,
    passed: {},
    attempts: [],
    vocabDone: {},
    memory: {},
    confusions: {},
    milestones: {},
    days: {},
    settings: { dailyMinutes: 15, kidMode: false, sounds: false, showMeanings: true },
  };
}

export function loadState(today: string, storage: Pick<Storage, "getItem"> | undefined = globalThis.localStorage): ArabicState {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return newState(today);
    const s = JSON.parse(raw) as ArabicState;
    if (s.version !== 2) return newState(today);
    return { ...newState(today), ...s, settings: { ...newState(today).settings, ...s.settings } };
  } catch {
    return newState(today);
  }
}

export function saveState(s: ArabicState, storage: Pick<Storage, "setItem"> | undefined = globalThis.localStorage): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage full or blocked: progress stays in memory for this session */
  }
}

export function localDay(d = new Date()): string {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}
