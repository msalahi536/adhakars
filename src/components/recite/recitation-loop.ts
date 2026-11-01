import type { CheckResult } from "@/lib/hifz-ai/checker";
import type { ReciteWord } from "@/lib/recite/model";
import { stageResult, aiFailures } from "./lesson-ai";

export const CLEAN_LESSON_PASSES = 3;
export const END_SILENCE_MS = 1500;
export function nextLoopItem(index: number, newLesson: boolean, nextKind?: string) {
  return index + (newLesson && nextKind === "link" ? 2 : 1);
}
export function attemptedWords(result: CheckResult, words: ReciteWord[]) {
  const start = words.findIndex((w) => w.key === result.startKey);
  return words.slice(Math.max(0, start));
}
export function loopResult(result: CheckResult, words: ReciteWord[]) {
  const attempted = attemptedWords(result, words);
  const marks = stageResult(result, attempted);
  const failures = aiFailures(marks);
  const clean = attempted.length > 0 && !failures.length && attempted.every((w) => ["correct", "unsure"].includes(marks.statuses[w.key]));
  return { marks, failures, clean };
}
export function reachedRangeEnd(result: CheckResult | null) {
  if (!result || !result.words.length) return false;
  const length = result.words.reduce((n, w) => n + Array.from(w.expected).length, 0);
  return length > 0 && result.reachedIndex >= length;
}
export function shouldAutoStop(result: CheckResult | null, silence: number, heardVoice: boolean) {
  return heardVoice && silence >= END_SILENCE_MS && reachedRangeEnd(result);
}
export function nextCleanPass(current: number, clean: boolean, review: boolean) {
  const target = review ? 1 : CLEAN_LESSON_PASSES;
  const count = Math.min(target, current + (clean ? 1 : 0));
  return { count, done: count >= target, linking: !review && count === 2 };
}