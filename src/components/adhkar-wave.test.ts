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