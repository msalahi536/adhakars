import { describe, expect, it } from "bun:test";
import { aiFailures, aiWordState, createAudioRun, saveAiWeakSpots, stagePassed, stageResult } from "./lesson-ai";
import { DEFAULT_SETTINGS } from "@/lib/recite/model";
import type { ReciteWord } from "@/lib/recite/model";
import type { HifzState } from "@/lib/hifz/types";
import type { CheckResult, WordStatus } from "@/lib/hifz-ai/checker";
const words = [1, 2].map((position) => ({ key: `112:1:${position}`, page: 604, position, verse: "112:1", line: 3, text: "word", glyph: "", end: false, translation: "", transliteration: "", audio: null } satisfies ReciteWord));
const result = (...statuses: WordStatus[]): CheckResult => ({ words: statuses.map((status, i) => ({ key: words[i].key, status, text: "word", heard: "", expected: "" })), extras: [], reachedIndex: 2 });
describe("Hifz AI lesson rules", () => {
  it("defaults beta recitation to AI", () => expect(DEFAULT_SETTINGS.mode).toBe("ai"));
  it("correct and unsure pass; unsure never blocks", () => expect(stagePassed(stageResult(result("correct", "unsure"), words), words)).toBe(true));
  it("wrong blocks a stage pass", () => expect(stagePassed(stageResult(result("wrong", "correct"), words), words)).toBe(false));
  it("skipped blocks a stage pass", () => expect(stagePassed(stageResult(result("correct", "skipped"), words), words)).toBe(false));
  it("pending stays hidden and cannot complete a stage", () => {
    expect(aiWordState("pending")).toBe("pending");
    expect(stagePassed(stageResult(result("correct", "pending"), words), words)).toBe(false);
  });
  it("reached correct/unsure reveal normally, wrong/skipped preserve marks", () => {
    expect(["correct", "unsure", "wrong", "skipped"].map((s) => aiWordState(s as WordStatus))).toEqual(["correct", "correct", "wrong", "skipped"]);
  });
  it("only the stage range determines pass", () => {
    const extra = result("correct", "correct");
    extra.words.push({ key: "114:1:1", status: "wrong", text: "outside", heard: "", expected: "" });
    expect(stagePassed(stageResult(extra, words), words)).toBe(true);
  });
  it("AI wrong/skipped persist to weak spots with source ai without changing page marks", () => {
    const state = { weakSpots: {}, pages: {} } as HifzState;
    const marks = stageResult(result("wrong", "skipped"), words);
    const next = saveAiWeakSpots(state, marks, words, "2026-11-01");
    expect(aiFailures(marks)).toEqual(["112:1:1", "112:1:2"]);
    expect(next.weakSpots["112:1:1"]).toEqual({ key: "112:1:1", kind: "word", page: 604, fails: 1, passes: 0, lastFailed: "2026-11-01", source: "ai" });
    expect(state.weakSpots).toEqual({});
    expect(next.pages).toBe(state.pages);
  });
  it("stop cancels the repeat token and resolves the pending audio wait", async () => {
    const run = createAudioRun(); const token = run.token(); let plays = 0;
    const loop = (async () => { for (let i = 0; i < 3; i++) { if (!run.current(token)) return; await run.wait(token, () => { plays++; }); } })();
    run.cancel(); await loop;
    expect(plays).toBe(1); expect(run.current(token)).toBe(false);
  });
  it("an uncancelled listen runs exactly three plays", async () => {
    const run = createAudioRun(); const token = run.token(); let plays = 0;
    for (let i = 0; i < 3; i++) await run.wait(token, (finish) => { plays++; finish(); });
    expect(plays).toBe(3);
  });
});