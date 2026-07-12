// Decorative SVG overlays for page headers.
// All patterns use currentColor so they inherit the header's foreground color
// and adapt across themes. Opacity is kept low (5–10%) and they are anchored
// to the top-right of the header block.

import type { CSSProperties } from "react";

type PatternProps = {
  /** Overall opacity of the overlay (default 0.08). */
  opacity?: number;
  /** Size of the pattern in px (default 240). */
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

/** Morning — Girih 8-point star tessellation (classic Islamic geometric). */
export function GirihStarPattern({ opacity = 0.08, size = 260, style }: PatternProps) {
  return (
    <div aria-hidden style={baseWrapStyle(size, opacity, style)}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1">
        <defs>
          <pattern id="girih8" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            {/* 8-point star built from two overlapping squares */}
            <g transform="translate(30 30)">
              <polygon points="0,-22 6,-6 22,0 6,6 0,22 -6,6 -22,0 -6,-6" />
              <polygon
                points="0,-22 6,-6 22,0 6,6 0,22 -6,6 -22,0 -6,-6"
                transform="rotate(22.5)"
              />
              {/* connecting lines to neighbors for tessellation feel */}
              <line x1="-30" y1="0" x2="-22" y2="0" />
              <line x1="30" y1="0" x2="22" y2="0" />
              <line x1="0" y1="-30" x2="0" y2="-22" />
              <line x1="0" y1="30" x2="0" y2="22" />
            </g>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#girih8)" />
      </svg>
    </div>
  );
}

/** Evening — soft interlocking arcs. */
export function InterlockingArcsPattern({ opacity = 0.09, size = 260, style }: PatternProps) {
  return (
    <div aria-hidden style={baseWrapStyle(size, opacity, style)}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1">
        <defs>
          <pattern id="arcs" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M0,20 A20,20 0 0,1 40,20" />
            <path d="M0,20 A20,20 0 0,0 40,20" />
            <path d="M-20,40 A20,20 0 0,1 20,40" />
            <path d="M20,40 A20,20 0 0,1 60,40" />
            <path d="M-20,0 A20,20 0 0,1 20,0" />
            <path d="M20,0 A20,20 0 0,1 60,0" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#arcs)" />
      </svg>
    </div>
  );
}

/** Salah — concentric circles/arcs. */
export function ConcentricCirclesPattern({ opacity = 0.09, size = 280, style }: PatternProps) {
  return (
    <div aria-hidden style={baseWrapStyle(size, opacity, style)}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1">
        {/* Anchored to top-right corner (200,0) */}
        {Array.from({ length: 9 }).map((_, i) => {
          const r = 30 + i * 22;
          return <circle key={i} cx="200" cy="0" r={r} />;
        })}
      </svg>
    </div>
  );
}

/** Tasbih — muqarnas-inspired scalloped arches. */
export function MuqarnasPattern({ opacity = 0.09, size = 260, style }: PatternProps) {
  return (
    <div aria-hidden style={baseWrapStyle(size, opacity, style)}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1">
        <defs>
          <pattern id="muqarnas" x="0" y="0" width="36" height="30" patternUnits="userSpaceOnUse">
            {/* row of scalloped arches, offset rows create the muqarnas cascade */}
            <path d="M0,30 A9,9 0 0,1 18,30" />
            <path d="M18,30 A9,9 0 0,1 36,30" />
            <path d="M-9,15 A9,9 0 0,1 9,15" />
            <path d="M9,15 A9,9 0 0,1 27,15" />
            <path d="M27,15 A9,9 0 0,1 45,15" />
            <path d="M0,0 A9,9 0 0,1 18,0" />
            <path d="M18,0 A9,9 0 0,1 36,0" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#muqarnas)" />
      </svg>
    </div>
  );
}

/** Sleep/Wake — fine diagonal lattice (khatam-style). */
export function DiagonalLatticePattern({ opacity = 0.08, size = 260, style }: PatternProps) {
  return (
    <div aria-hidden style={baseWrapStyle(size, opacity, style)}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="0.8">
        <defs>
          <pattern id="lattice" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M0,18 L18,0" />
            <path d="M-2,2 L2,-2" />
            <path d="M16,20 L20,16" />
            <path d="M0,0 L18,18" />
            <path d="M-2,16 L2,20" />
            <path d="M16,-2 L20,2" />
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#lattice)" />
      </svg>
    </div>
  );
}

/** More & Settings — sparse widely-spaced 8-point stars. */
export function SparseStarsPattern({ opacity = 0.09, size = 260, style }: PatternProps) {
  return (
    <div aria-hidden style={baseWrapStyle(size, opacity, style)}>
      <svg viewBox="0 0 200 200" width="100%" height="100%" fill="none" stroke="currentColor" strokeWidth="1">
        <defs>
          <pattern id="sparseStars" x="0" y="0" width="70" height="70" patternUnits="userSpaceOnUse">
            <g transform="translate(35 35)">
              <polygon points="0,-10 3,-3 10,0 3,3 0,10 -3,3 -10,0 -3,-3" />
              <polygon
                points="0,-10 3,-3 10,0 3,3 0,10 -3,3 -10,0 -3,-3"
                transform="rotate(22.5)"
              />
            </g>
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#sparseStars)" />
      </svg>
    </div>
  );
}
