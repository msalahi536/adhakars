import { describe, expect, it } from "bun:test";
import { mapAiWords, newMistakes } from "./ai-feedback";
import { DEFAULT_SETTINGS } from "@/lib/recite/model";
describe("AI word feedback", () => {
  it("matches exact verse word keys and a spaced result covers the next word", () => {
    const mapped = mapAiWords({ words: [{ key: "67:1:2", text: "two words", status: "wrong", expected: "", heard: "" }], extras: [], reachedIndex: 0 }, ["67:1:2", "67:1:3", "67:2:2"]);
    expect(mapped.statuses).toEqual({ "67:1:2": "wrong", "67:1:3": "wrong" });
  });
  it("repeats have a chip but do not generate haptics", () => {
    const mapped = mapAiWords({ words: [], extras: [{ atKey: "67:1:2", kind: "repeat", heard: "x" }, { atKey: "67:1:3", kind: "extra", heard: "y" }], reachedIndex: 0 }, []);
    expect([...mapped.repeated]).toEqual(["67:1:2"]);
    expect(newMistakes({}, mapped.statuses)).toEqual([]);
  });
  it("only new wrong/skipped states generate mistake feedback", () => {
    expect(newMistakes({ a: "wrong" }, { a: "wrong", b: "skipped", c: "unsure", d: "correct", e: "pending", f: "in_progress" })).toEqual(["skip"]);
  });
  it("unclear marks are off by default", () => { expect(DEFAULT_SETTINGS.showUnclearWords).toBe(false); });
});import { addedWordKeys, mistakeCount, ADDED_CLIP } from "./ai-feedback";
describe("added words", () => {
  const r = { words: [{ key: "1:1:1", text: "a", status: "unsure" as const, expected: "", heard: "" }, { key: "1:1:2", text: "b", status: "wrong" as const, expected: "", heard: "" }],
    extras: [{ atKey: "1:1:3", kind: "extra" as const, heard: "x" }, { atKey: "1:1:3", kind: "extra" as const, heard: "y" }, { atKey: "1:1:4", kind: "repeat" as const, heard: "z" }], reachedIndex: 1 };
  it("extras of kind extra are mistakes before their atKey, repeats are not", () => expect(addedWordKeys(r)).toEqual(["1:1:3"]));
  it("counts wrong + added, never unsure", () => expect(mistakeCount(r)).toBe(2));
  it("marks an added word's atKey wrong without changing repeats", () => {
    expect(mapAiWords(r, ["1:1:3", "1:1:4"]).statuses).toEqual({ "1:1:3": "wrong" });
  });
  it("added clip covers 1s before and 0.1s after", () => expect(ADDED_CLIP).toEqual({ before: 1.0, after: 0.1 }));
});
