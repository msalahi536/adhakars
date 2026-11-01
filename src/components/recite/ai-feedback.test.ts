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
});