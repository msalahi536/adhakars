/** Spread all six sound bands across the complete strip, never animate a paused card. */
export function adhkarWave(playing: boolean, sameTrack: boolean, levels: readonly number[], count: number) {
  const active = playing && sameTrack;
  return Array.from({ length: count }, (_, i) => {
    if (!active || !levels.length) return 0.12;
    const position = i * (levels.length - 1) / Math.max(1, count - 1);
    const band = Math.floor(position), mix = position - band;
    const level = (levels[band] ?? 0) * (1 - mix) + (levels[Math.min(band + 1, levels.length - 1)] ?? 0) * mix;
    return 0.12 + Math.max(0, Math.min(1, level)) * 0.88;
  });
}