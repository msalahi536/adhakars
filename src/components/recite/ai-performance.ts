import type { CheckResult } from "@/lib/hifz-ai/checker";
import { findHesitations, masteryScore, type Hesitation, type Mastery } from "@/lib/hifz-ai/fluency";
import { findDrifts, type Drift } from "@/lib/hifz-ai/mutashabih";
import { performanceFromAI, recordReview, recordSabaq, type HifzState } from "@/lib/hifz";
import type { SessionItem } from "@/lib/hifz/program";

export type Passage = { sura: number; first: number; last: number };
export type Attempt = { result: CheckResult; hes: Hesitation[]; m: Mastery; drifts: Drift[]; clean: boolean; driftError?: string };
export const CLEAN_PASSES = 3;
export function cleanRecitation(result: CheckResult, keys: string[]) {
  const statuses = new Map(result.words.map((w) => [w.key, w.status]));
  // A grouped answer-key word covers its following space-separated Quran words.
  for (const w of result.words) {
    const count = w.text.trim().split(/\s+/).length;
    const parts = w.key.split(":");
    for (let n = 1; n < count; n++) statuses.set(`${parts[0]}:${parts[1]}:${Number(parts[2]) + n}`, w.status);
  }
  return keys.length > 0 && keys.every((key) => ["correct", "unsure"].includes(statuses.get(key) ?? "pending"))
    && !result.words.some((w) => w.status === "wrong" || w.status === "skipped");
}
export async function analyzeAttempt(result: CheckResult, passages: Passage[], keys: string[]): Promise<Attempt> {
  const hes = findHesitations(result);
  const m = masteryScore(result, hes);
  let drifts: Drift[] = [];
  let driftError: string | undefined;
  try { drifts = await findDrifts(result, passages); }
  catch { driftError = "Similar-ayah checking is unavailable. Retry when connected."; }
  return { result, hes, m, drifts, clean: cleanRecitation(result, keys), driftError };
}
export function recordAttempt(state: HifzState, item: SessionItem, attempt: Attempt, date: string, lessonComplete: boolean) {
  const next = structuredClone(state);
  const perf = performanceFromAI(attempt.result, attempt.hes, attempt.drifts);
  if (item.kind === "sabaq") {
    // All attempts retain evidence. Only the third clean pass credits new lines, once.
    const learned = next.pages[item.page]?.linesLearned ?? 0;
    const lines = lessonComplete ? Math.max(0, item.fromLine + item.lines - learned) : 0;
    recordSabaq(next, item.page, lines, perf, date);
  } else if (item.kind === "review") recordReview(next, item.page, perf, date, item.stage);
  return next;
}