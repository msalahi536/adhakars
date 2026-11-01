import { describe, expect, test } from "bun:test";
import { cleanRecitation, recordAttempt, type Attempt } from "./ai-performance";
import { createState, defaultPlan } from "@/lib/hifz";
import { findHesitations, masteryScore } from "@/lib/hifz-ai/fluency";
import { diffAyat } from "@/lib/hifz-ai/mutashabih";
import type { CheckResult } from "@/lib/hifz-ai/checker";

const date = "2026-11-01";
const result: CheckResult = { words: [
  { key: "112:1:1", text: "قُلْ", expected: "q", heard: "q", status: "correct", at: 0, end: 0 },
  { key: "112:1:2", text: "هُوَ", expected: "h", heard: "h", status: "correct", at: 1, end: 1 },
], times: [0, 3], extras: [], reachedIndex: 1, startIndex: 0, startKey: "112:1:1" };
function attempt(value = result): Attempt {
  const hes = findHesitations(value);
  return { result: value, hes, m: masteryScore(value, hes), drifts: [], clean: cleanRecitation(value, value.words.map((w) => w.key)) };
}
describe("AI lesson and review recording", () => {
  test("hesitations stay clean and receive Good, with no mistakes", () => {
    const a = attempt(); expect(a.hes[0].seconds).toBe(3); expect(a.clean).toBe(true);
    expect(a.m.label).toBe("Good"); expect(a.m.mistakes).toBe(0);
  });
  test("uninterrupted clean recitation receives Solid 100", () => {
    const a = attempt({ ...result, times: [0, .3] }); expect(a.m.label).toBe("Solid"); expect(a.m.score).toBe(100);
  });
  test("three clean attempts record evidence but credit five new lines only once", () => {
    let state = createState(defaultPlan(date)); const item = { kind: "sabaq" as const, page: 604, fromLine: 0, lines: 5 };
    for (let n = 1; n <= 3; n++) state = recordAttempt(state, item, attempt(), date, n === 3);
    expect(state.pages[604].history.length).toBe(3); expect(state.pages[604].linesLearned).toBe(5);
    expect(state.dayLog[date].newLines).toBe(5);
    state = recordAttempt(state, item, attempt(), date, true); expect(state.dayLog[date].newLines).toBe(5);
  });
  for (const stage of ["sabqi", "manzil"] as const) test(`${stage} review records AI evidence once without manual grading`, () => {
    const plan = defaultPlan(date); plan.alreadyMemorized = [604];
    const state = recordAttempt(createState(plan), { kind: "review", stage, page: 604 }, attempt(), date, false);
    expect(state.pages[604].history).toHaveLength(1); expect(state.pages[604].history[0].kind).toBe(stage);
    expect(state.pages[604].history[0].hesitations).toBe(1); expect(state.pages[604].history[0].mistakes).toBe(0);
  });
  test("wrong or pending words cannot pass a review", () => {
    expect(cleanRecitation({ ...result, words: [{ ...result.words[0], status: "wrong" }] }, ["112:1:1"])).toBe(false);
    expect(cleanRecitation(result, ["112:1:3"])).toBe(false);
  });
  test("drift evidence reaches the engine's similar-ayah weak spots", () => {
    const a = attempt(); a.drifts = [{ atKey: "112:1:1", wentTo: { sura: 2, aya: 123, word: 1 }, wentToEnd: { sura: 2, aya: 123, word: 3 }, heard: "x", score: .9 }];
    const state = recordAttempt(createState(defaultPlan(date)), { kind: "sabaq", page: 604, fromLine: 0, lines: 5 }, a, date, false);
    expect(state.weakSpots["m:112:1:1>2:123"].kind).toBe("mutashabih");
  });
  test("comparison marks differing words in both ayat", () => {
    const diff = diffAyat(["قُلْ", "هُوَ"], ["قُلْ", "هِيَ"]);
    expect(diff.a.map((w) => w.same)).toEqual([true, false]); expect(diff.b.map((w) => w.same)).toEqual([true, false]);
  });
});