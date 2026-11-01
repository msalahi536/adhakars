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