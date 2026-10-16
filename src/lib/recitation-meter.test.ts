import { describe, expect, test } from "bun:test";
import { restingLevels, shapeMeter } from "./recitation-meter";

describe("sound-reactive meter", () => {
  test("middle bars move substantially more than the sides", () => {
    const rest = restingLevels();
    const levels = shapeMeter(1, rest, 1000);
    expect(levels).toHaveLength(6);
    expect(levels[2] - rest[2]).toBeGreaterThan((levels[0] - rest[0]) * 5);
    expect(levels[3]).toBeGreaterThan(levels[4]);
    expect(levels[1]).toBeGreaterThan(levels[0]);
    expect(levels[0]).toBeCloseTo(levels[5]);
    expect(levels[2]).toBeCloseTo(levels[3]);
  });

  test("rises with measured loudness and settles during silence", () => {
    const rest = restingLevels();
    const quiet = shapeMeter(0.1, rest, 16);
    const loud = shapeMeter(0.9, rest, 16);
    expect(loud[2]).toBeGreaterThan(quiet[2]);
    expect(loud[2]).toBeLessThan(1);
    const release = shapeMeter(0, loud, 16);
    expect(release[2]).toBeLessThan(loud[2]);
    expect(release[2]).toBeGreaterThan(rest[2]);
    expect(shapeMeter(0, rest, 16)).toEqual(rest);
  });
});