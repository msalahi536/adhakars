// Decorative SVG overlays for page headers.
// A single concentric-circles motif is used across the entire app so headers
// share the same subtle texture. All named exports alias the same component
// for backwards compatibility with existing imports.
//
// Opacity is intentionally very low (~3–5%) so the pattern reads as texture
// rather than a visible graphic.

import type { CSSProperties } from "react";

type PatternProps = {
  /** Overall opacity of the overlay (default 0.04). */
  opacity?: number;
  /** Size of the pattern in px (default 280). */
  size?: number;
  /** Extra style overrides. */
  style?: CSSProperties;
};

const baseWrapStyle = (size: number, opacity: number, style?: CSSProperties): CSSProperties => ({
  position: "absolute",
  top: 0,
  right: 0,
  width: size,
  height: size,
  pointerEvents: "none",
  color: "currentColor",
  opacity,
  ...style,
});

/** Unified app header pattern — concentric circles anchored to the top-right. */
export function ConcentricCirclesPattern({ opacity = 0.04, size = 280, style }: PatternProps) {
  return (
    <div aria-hidden style={baseWrapStyle(size, opacity, style)}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1">
        {Array.from({ length: 9 }).map((_, i) => {
          const r = 30 + i * 22;
          return <circle key={i} cx="200" cy="0" r={r} />;
        })}
      </svg>
    </div>
  );
}

// Aliases — all previous pattern names now render the same concentric motif.
export const GirihStarPattern = ConcentricCirclesPattern;
export const InterlockingArcsPattern = ConcentricCirclesPattern;
export const MuqarnasPattern = ConcentricCirclesPattern;
export const DiagonalLatticePattern = ConcentricCirclesPattern;
export const SparseStarsPattern = ConcentricCirclesPattern;
