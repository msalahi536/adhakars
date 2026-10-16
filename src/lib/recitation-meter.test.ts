import { describe, expect, test } from "bun:test";
import { createBandSampler, restingLevels, shapeMeter, type MeterLevels } from "./recitation-meter";

const all = (value: number): MeterLevels => [value, value, value, value, value, value];

describe("sound-reactive meter", () => {
  test("middle bars move substantially more than the sides", () => {
    const rest = restingLevels();
    const levels = shapeMeter(all(1), rest, 1000);
    expect(levels).toHaveLength(6);
    expect(levels[2] - rest[2]).toBeGreaterThan((levels[0] - rest[0]) * 5);
    expect(levels[3]).toBeGreaterThan(levels[4]);
    expect(levels[1]).toBeGreaterThan(levels[0]);
    expect(levels[0]).toBeCloseTo(levels[5]);
    expect(levels[2]).toBeCloseTo(levels[3]);
  });

  test("rises with measured loudness and settles during silence", () => {
    const rest = restingLevels();
    const quiet = shapeMeter(all(0.1), rest, 16);
    const loud = shapeMeter(all(0.9), rest, 16);
    expect(loud[2]).toBeGreaterThan(quiet[2]);
    expect(loud[2]).toBeLessThan(1);
    const release = shapeMeter(all(0), loud, 16);
    expect(release[2]).toBeLessThan(loud[2]);
    expect(release[2]).toBeGreaterThan(rest[2]);
    expect(shapeMeter(all(0), rest, 16)).toEqual(rest);
  });

  test("each of six bars responds only to its own tone band", () => {
    for (let band = 0; band < 6; band++) {
      const energy = all(0);
      energy[band] = 1;
      const levels = shapeMeter(energy, restingLevels(), 1000);
      expect(levels[band]).toBeGreaterThan(0.25);
      levels.forEach((level, index) => {
        if (index !== band) expect(level).toBe(0.12);
      });
    }
  });

  test("real low and high tones drive different bars, not shared inflation", () => {
    const sampleRate = 48000;
    const sample = createBandSampler(sampleRate);
    const tone = (hz: number) => Float32Array.from({ length: 2048 }, (_, i) => 0.3 * Math.sin(2 * Math.PI * hz * i / sampleRate));
    const bass = sample(tone(120), 0);
    const treble = sample(tone(4800), 0);
    expect(bass[0]).toBeGreaterThan(0.5);
    expect(bass[5]).toBeLessThan(0.01);
    expect(treble[5]).toBeGreaterThan(0.5);
    expect(treble[0]).toBeLessThan(0.01);
    expect(sample(new Float32Array(2048), 0)).toEqual(all(0));
  });
});