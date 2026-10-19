import { useCallback, useEffect, useRef, useState } from "react";
import { restingLevels, shapeMeter, type MeterLevels } from "./recitation-meter";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Calm voice-like motion for audio that cannot be analysed, such as the streamed Quran recitation. */
export function proceduralLevels(t: number): MeterLevels {
  return Array.from({ length: 6 }, (_, i) => {
    const v = 0.45 + 0.3 * Math.sin(t * (3.1 + i * 0.7) + i) * Math.sin(t * 1.3 + i * 2) + 0.25 * Math.sin(t * 7.3 + i * 1.7);
    return clamp01(v);
  }) as MeterLevels;
}

/** How much of the recitation's vocal band is speaking right now: 0 (quiet) to 1 (full voice). */
export function voiceEnergy(levels: MeterLevels): number {
  const vocal = (levels[1] + levels[2] + levels[3] + levels[4]) / 4;
  return clamp01((vocal - 0.12) / 0.55);
}

/**
 * Writes a gently smoothed 0..1 voice level onto the element as `--face-pulse`, so the ring
 * around a reciter's photo swells and settles with the recitation instead of a fixed loop.
 */
export function useFacePulse<T extends HTMLElement = HTMLElement>(playing: boolean, levels?: MeterLevels) {
  const [el, setEl] = useState<T | null>(null);
  const ref = useCallback((node: T | null) => setEl(node), []);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const levelsRef = useRef(levels);
  levelsRef.current = levels;

  useEffect(() => {
    if (!el) return;
    let raf = 0;
    let last = performance.now();
    let bands = restingLevels();
    let env = 0;
    const tick = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const live = playingRef.current ? (levelsRef.current ?? proceduralLevels(now / 1000)) : restingLevels();
      bands = shapeMeter(live, bands, dt);
      const raw = playingRef.current ? voiceEnergy(bands) : 0;
      // Widen the spread so quiet passages fade out and phrases swell, instead of hovering mid-level.
      const target = clamp01((raw - 0.32) / 0.5);
      // Slower than the meter itself: the ring should breathe, never flicker.
      env += (target - env) * (1 - Math.exp(-dt / (target > env ? 260 : 520)));
      el.style.setProperty("--face-pulse", env.toFixed(3));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [el]);

  return ref;
}
