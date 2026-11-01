/**
 * Bridge: AI recitation result -> the hifz engine's Performance, so every AI-checked recitation updates
 * page memory (FSRS), weak spots (words, transitions, mutashabihat) and the memory map automatically.
 *
 *   const result = await session.stop()
 *   const hes = findHesitations(result)
 *   const drifts = await findDrifts(result, ranges)
 *   recordReview(state, page, performanceFromAI(result, hes, drifts), today, "sabqi")
 */
import type { CheckResult } from "@/lib/hifz-ai/checker";
import type { Hesitation } from "@/lib/hifz-ai/fluency";
import type { Drift } from "@/lib/hifz-ai/mutashabih";
import type { Performance } from "./engine";

export function performanceFromAI(result: CheckResult & { times?: number[] }, hesitations: Hesitation[], drifts: Drift[] = []): Performance {
  const recited = result.words.filter((w) => w.status !== "pending" && w.status !== "in_progress");
  const failed = recited.filter((w) => w.status === "wrong" || w.status === "skipped");
  const transitions = new Set<string>();
  // an ayah whose first word was missed or slow to come = a weak transition into that ayah
  for (const w of failed) if (w.key.endsWith(":1")) transitions.add(w.key.slice(0, w.key.lastIndexOf(":")));
  for (const h of hesitations) if (h.kind === "transition") transitions.add(h.key.slice(0, h.key.lastIndexOf(":")));
  const t = result.times;
  const seconds = t?.length ? Math.round(t[t.length - 1] - t[0]) : undefined;
  const d = drifts[0];
  return {
    words: recited.length,
    wrong: recited.filter((w) => w.status === "wrong").length,
    skipped: recited.filter((w) => w.status === "skipped").length,
    small: 0, // tajweed hints don't count against memory
    hesitations: hesitations.length,
    blank: recited.length > 0 && recited.every((w) => w.status === "skipped"),
    seconds,
    failedKeys: [...failed.map((w) => w.key), ...hesitations.filter((h) => h.kind === "pause").map((h) => h.key)],
    failedTransitions: [...transitions],
    passedKeys: recited.filter((w) => w.status === "correct" && !hesitations.some((h) => h.key === w.key)).map((w) => w.key),
    driftTo: d ? { from: d.atKey, to: `${d.wentTo.sura}:${d.wentTo.aya}` } : undefined,
  };
}
