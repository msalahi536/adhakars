import { expect, test } from "bun:test";
import { basmalaWordStates, liveWordState } from "./live-marks";
test("wrong, skipped and added words have the same mistake state", () => {
  const wrong = liveWordState("wrong");
  expect(liveWordState("skipped")).toEqual(wrong);
  expect(liveWordState("correct", true)).toEqual(wrong);
});
test("a re-read pending word loses its glow and hides again", () => {
  expect(liveWordState("correct").recited).toBe(true);
  expect(liveWordState("pending")).toEqual({ mistake: false, recited: false, visible: false, highlightable: false });
});
test("unsure is recited but never a mistake", () => {
  expect(liveWordState("unsure").mistake).toBe(false);
  expect(liveWordState("unsure").recited).toBe(true);
});test("basmala highlights word by word", () => {
  expect(basmalaWordStates("saying", 2)).toEqual(["done", "done", "current", "pending"]);
  expect(basmalaWordStates("said", 1)).toEqual(["done", "done", "done", "done"]);
  expect(basmalaWordStates(undefined, 3)).toEqual(["pending", "pending", "pending", "pending"]);
});
