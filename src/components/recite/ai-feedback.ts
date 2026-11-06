import type { CheckResult, WordStatus } from "@/lib/hifz-ai/checker";
export function mapAiWords(result: CheckResult, visibleKeys: string[]) {
  const statuses: Record<string, WordStatus> = {};
  const repeated = new Set(result.extras.filter((e) => e.kind === "repeat").map((e) => e.atKey));
  const visible = new Set(visibleKeys);
  for (const word of result.words) {
    if (visible.has(word.key)) statuses[word.key] = word.status;
    if (word.text.includes(" ")) {
      const [sura, ayah, position] = word.key.split(":");
      const nextKey = `${sura}:${ayah}:${Number(position) + 1}`;
      if (visible.has(nextKey)) statuses[nextKey] = word.status;
    }
  }
  return { statuses, repeated };
}
export function newMistakes(previous: Record<string, WordStatus>, current: Record<string, WordStatus>) {
  return Object.entries(current).filter(([key, status]) => previous[key] !== status && (status === "wrong" || status === "skipped")).map(([, status]) => status === "wrong" ? "wrong" as const : "skip" as const);
}
/** Added words (extras of kind "extra") are mistakes, one per word they were said before. Repeats are not. */
export function addedWordKeys(result: Pick<CheckResult, "extras"> | null | undefined): string[] {
  return [...new Set((result?.extras ?? []).filter((e) => e.kind === "extra").map((e) => e.atKey))];
}
/** Wrong, skipped and added words count; unsure words never do. */
export function mistakeCount(result: Pick<CheckResult, "words" | "extras"> | null | undefined): number {
  return (result?.words.filter((w) => w.status === "wrong" || w.status === "skipped").length ?? 0) + addedWordKeys(result).length;
}
/** Replay window for an added-word mistake: the second before the word, where the addition was said. */
export const ADDED_CLIP = { before: 1.0, after: 0.1 } as const;
