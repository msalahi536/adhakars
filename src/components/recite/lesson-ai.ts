import type { CheckResult, WordStatus } from "@/lib/hifz-ai/checker";
import type { HifzState, WeakSpot } from "@/lib/hifz/types";
import type { ReciteWord } from "@/lib/recite/model";
import { mapAiWords } from "./ai-feedback";

export type AiMarks = { source: "ai"; statuses: Record<string, WordStatus> };
export function stageResult(result: CheckResult, words: ReciteWord[]): AiMarks {
  return { source: "ai", statuses: mapAiWords(result, words.map((w) => w.key)).statuses };
}
export function aiFailures(marks: AiMarks) {
  return Object.entries(marks.statuses).filter(([, s]) => s === "wrong" || s === "skipped").map(([key]) => key);
}
export function stagePassed(marks: AiMarks, words: ReciteWord[]) {
  return words.length > 0 && aiFailures(marks).length === 0 && words.every((w) => ["correct", "unsure"].includes(marks.statuses[w.key]));
}
export function aiWordState(status?: WordStatus) {
  return status === "correct" || status === "unsure" ? "correct" : status === "wrong" || status === "skipped" ? status : "pending";
}
export function saveAiWeakSpots(state: HifzState, marks: AiMarks, words: ReciteWord[], today: string): HifzState {
  const weakSpots = { ...state.weakSpots };
  for (const key of aiFailures(marks)) {
    const word = words.find((w) => w.key === key);
    if (!word) continue;
    const previous = weakSpots[key];
    const spot: WeakSpot & { source: "ai" } = { key, kind: "word", page: word.page, fails: (previous?.fails ?? 0) + 1, passes: previous?.passes ?? 0, lastFailed: today, source: "ai" };
    weakSpots[key] = spot;
  }
  return { ...state, weakSpots };
}

/** Cancels both the outer repeat loop and its currently awaited audio segment. */
export function createAudioRun() {
  let generation = 0;
  let release: (() => void) | undefined;
  return {
    cancel() { generation++; release?.(); release = undefined; },
    token() { return generation; },
    current(token: number) { return token === generation; },
    wait(token: number, start: (finish: () => void) => void) {
      if (token !== generation) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const finish = () => { if (release === finish) release = undefined; resolve(); };
        release = finish;
        start(finish);
      });
    },
  };
}