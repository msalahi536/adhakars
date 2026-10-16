export type MeterLevels = [number, number, number, number, number, number];

export const restingLevels = (): MeterLevels => [0.12, 0.12, 0.12, 0.12, 0.12, 0.12];

// One measured loudness drives a coherent, tapered shape rather than six
// unrelated frequency bins. Fast attack and slower release follow the voice.
export function shapeMeter(loudness: number, previous: MeterLevels, elapsedMs: number): MeterLevels {
  const energy = Math.pow(Math.max(0, Math.min(1, loudness)), 0.72);
  const weights: MeterLevels = [0.18, 0.56, 1, 1, 0.56, 0.18];
  return weights.map((weight, index) => {
    const target = 0.12 + energy * 0.88 * weight;
    const current = previous[index];
    const responseMs = target > current ? 48 : 150;
    const blend = 1 - Math.exp(-Math.max(0, elapsedMs) / responseMs);
    return current + (target - current) * blend;
  }) as MeterLevels;
}