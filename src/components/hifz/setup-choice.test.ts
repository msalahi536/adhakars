import { expect, test } from "bun:test";
import { hasSetupChoice } from "./setup-choice";

test("no selection leaves Next disabled", () => {
  expect(hasSetupChoice([], [], false)).toBe(false);
});
test("a selected juz enables Next", () => {
  expect(hasSetupChoice([30], [], false)).toBe(true);
});
test("a selected surah enables Next", () => {
  expect(hasSetupChoice([], [114], false)).toBe(true);
});
test("explicit starting fresh enables Next", () => {
  expect(hasSetupChoice([], [], true)).toBe(true);
});