import { expect, test } from "bun:test";
import { adhkarWave } from "./adhkar-wave";
test("paused audio and other cards leave all 17 bars inactive", () => {
  expect(adhkarWave(false, true, [1, 1, 1, 1, 1, 1], 17)).toEqual(Array(17).fill(0.12));
  expect(adhkarWave(true, false, [1, 1, 1, 1, 1, 1], 17)).toEqual(Array(17).fill(0.12));
});
test("every bar responds to playback levels, not only a subset", () => {
  const quiet = adhkarWave(true, true, [0, 0, 0, 0, 0, 0], 17);
  const loud = adhkarWave(true, true, [1, 1, 1, 1, 1, 1], 17);
  expect(loud).toHaveLength(17);
  for (let i = 0; i < 17; i++) expect(loud[i]).toBeGreaterThan(quiet[i]);
});
test("outer bars stay low and the middle carries bounded peaks", () => {
  const bars = adhkarWave(true, true, [1, 1, 1, 1, 1, 1], 17);
  expect(bars[0]).toBeLessThanOrEqual(0.26);
  expect(bars[16]).toBeLessThanOrEqual(0.26);
  expect(bars[8]).toBeGreaterThan(bars[0] ?? 0);
  expect(bars[8]).toBeGreaterThan(bars[16] ?? 0);
  for (const bar of bars) expect(bar).toBeLessThanOrEqual(0.72);
});