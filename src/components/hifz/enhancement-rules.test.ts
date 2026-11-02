import { describe, expect, it } from "bun:test";
import { echoSequence, ECHO_DEFAULTS, milestoneKey, pageReached, sessionPageReady } from "./enhancement-rules";
it("a saved page 604 cannot prepare a page 602 task before hydration and the page jump", () => {
  expect(sessionPageReady(false,602,602)).toBe(false);
  expect(sessionPageReady(true,604,602)).toBe(false);
  expect(sessionPageReady(true,602,602)).toBe(true);
});
describe("Hifz enhancement rules", () => {
  it("defaults to three single repeats", () => expect(ECHO_DEFAULTS.repeats).toBe(3));
  it("defaults to two joined repeats", () => expect(ECHO_DEFAULTS.joined).toBe(2));
  it("limits single ayah repeats to ten", () => expect(echoSequence(["112:1"], 11, 0)).toHaveLength(10));
  it("allows no joined recitations", () => expect(echoSequence(["112:1", "112:2"], 1, 0)).toHaveLength(2));
  it("limits joined repeats to five", () => expect(echoSequence(["112:1"], 1, 6)).toHaveLength(6));
  it("retains surah milestone identifiers", () => expect(milestoneKey({ kind: "surah", id: 67 })).toBe("surah:67"));
  it("requires 1.5 seconds silence at the final word", () => { const r = { reachedIndex: 1, words: [{ status: "correct" }, { status: "correct" }] }; expect(pageReached(r, 1499)).toBe(false); expect(pageReached(r, 1500)).toBe(true); });
  it("does not turn before the end", () => expect(pageReached({ reachedIndex: 0, words: [{ status: "correct" }, { status: "pending" }] }, 2000)).toBe(false));
});