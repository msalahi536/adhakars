import { expect, test } from "bun:test";
import { loopResult, nextCleanPass, shouldAutoStop } from "./recitation-loop";
import type { CheckResult } from "@/lib/hifz-ai/checker";
import type { ReciteWord } from "@/lib/recite/model";
const keys = ["112:1:1", "112:2:1", "112:3:1"];
const words = keys.map((key) => ({ key } as ReciteWord));
const result: CheckResult = { words: keys.map((key, i) => ({ key, text: "word", expected: "abc", heard: i ? "abc" : "", status: i ? "correct" : "pending" })), extras: [], startKey: keys[1], startIndex: 3, reachedIndex: 9 };
test("starting at ayah two excludes preceding hidden ayah from judgment", () => {
  expect(loopResult(result, words).clean).toBe(true);
  expect(loopResult(result, words).marks.statuses[keys[0]]).toBeUndefined();
});
test("three clean lesson passes required and third links previous ayah", () => {
  expect(nextCleanPass(0, true, false)).toEqual({ count: 1, done: false, linking: false });
  expect(nextCleanPass(1, true, false)).toEqual({ count: 2, done: false, linking: true });
  expect(nextCleanPass(2, true, false)).toEqual({ count: 3, done: true, linking: false });
});
test("one clean review passes", () => expect(nextCleanPass(0, true, true).done).toBe(true));
test("mistake does not increment clean count", () => expect(nextCleanPass(1, false, false).count).toBe(1));
test("unsure never blocks clean result", () => expect(loopResult({ ...result, words: result.words.map((w, i) => i === 2 ? { ...w, status: "unsure" } : w) }, words).clean).toBe(true));
test("stop only after end and at least 1500ms actual silence following voice", () => {
  expect(shouldAutoStop(result, 1499, true)).toBe(false);
  expect(shouldAutoStop(result, 1500, true)).toBe(true);
  expect(shouldAutoStop(result, 1500, false)).toBe(false);
  expect(shouldAutoStop({ ...result, reachedIndex: 8 }, 2000, true)).toBe(false);
});