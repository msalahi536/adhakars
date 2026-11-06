/** A varied spectral silhouette driven by real sound, never a looping animation. */
export function adhkarWave(playing: boolean, sameTrack: boolean, levels: readonly number[], count: number) {
  const active = playing && sameTrack;
  // The shared circular meter tapers its outer bands; recover their energy
  // before fitting a wider strip so bass/treble bars also rise properly.
  const weights = [0.18, 0.56, 1, 1, 0.56, 0.18];
  const energy = levels.map((level, i) => Math.max(0, Math.min(1, (level - 0.12) / (0.88 * (weights[i] ?? 1)))));
  return Array.from({ length: count }, (_, i) => {
    if (!active || !levels.length) return 0.12;
    // Interleave neighboring frequency groups instead of one broad bouncing arch.
    const position = ((i * 7) % Math.max(1, count)) * (levels.length - 1) / Math.max(1, count - 1);
    const band = Math.floor(position), mix = position - band;
    const level = (energy[band] ?? 0) * (1 - mix) + (energy[Math.min(band + 1, levels.length - 1)] ?? 0) * mix;
    const contour = 0.58 + 0.42 * Math.sin((i + 1) * 1.9) ** 2;
    return 0.12 + Math.pow(level, 0.7) * 0.88 * contour;
  });
}