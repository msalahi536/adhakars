import { describe, expect, test } from "bun:test";
import { clipFor, mergeResults, wordTimeline, MAX_WORD, REPORT_DELAY } from "./replay";
import type { CheckResult, WordResult } from "./checker";

const w = (key: string, status: WordResult["status"], at?: number, end?: number): WordResult => ({ key, text: key, status, expected: "", heard: "", at, end });
const result = (words: WordResult[], heard: string, times: number[]) => ({ words, extras: [], reachedIndex: 0, startIndex: 0, startKey: words[0].key, heard, conf: times.map(() => 1), times }) as CheckResult & { heard: string; times: number[] };

describe("replay across pages", () => {
  // page 1 recited from second 0, page 2's AI restarted 30 s into the same recording
  const page1 = result([w("1:1:1", "correct", 0, 1), w("1:1:2", "wrong", 2, 3)], "abcd", [1, 1.3, 2, 2.3]);
  const page2 = result([w("2:1:1", "correct", 0, 1), w("2:1:2", "skipped"), w("2:1:3", "correct", 2, 3)], "efgh", [1, 1.3, 4, 4.3]);
  const merged = mergeResults(mergeResults(null, page1, 0), page2, 30);

  test("earlier pages' mistakes stay, timings follow the recording", () => {
    expect(merged.words.map((x) => x.key)).toEqual(["1:1:1", "1:1:2", "2:1:1", "2:1:2", "2:1:3"]);
    const t = wordTimeline(merged);
    expect(t.find((s) => s.key === "1:1:2")!.start).toBeCloseTo(2 - REPORT_DELAY);
    expect(t.find((s) => s.key === "2:1:1")!.start).toBeCloseTo(31 - REPORT_DELAY);
  });
  test("a skipped word on page 2 plays the gap on page 2, not page 1", () => {
    const c = clipFor(wordTimeline(merged), merged, "2:1:2")!;
    expect(c.from).toBeGreaterThan(29);
    expect(c.to).toBeLessThan(35);
  });
  test("re-reciting a word replaces the old attempt", () => {
    const again = result([w("1:1:2", "correct", 0, 1)], "xy", [1, 1.2]);
    const m = mergeResults(merged, again, 60);
    expect(m.words.filter((x) => x.key === "1:1:2").map((x) => x.status)).toEqual(["correct"]);
  });
});

describe("clip length", () => {
  test("a word said completely differently plays only its start", () => {
    // the 'wrong' word soaked up 12 s of other speech
    const r = result([w("1:1:1", "correct", 0, 0), w("1:1:2", "wrong", 1, 2), w("1:1:3", "correct", 3, 3)], "abcd", [1, 2, 14, 15]);
    const c = clipFor(wordTimeline(r), r, "1:1:2")!;
    expect(c.to - c.from).toBeLessThanOrEqual(1.2 + MAX_WORD + 0.6 + 0.01);
  });
});
