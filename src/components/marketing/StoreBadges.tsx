import { useEffect, useId, useRef } from "react";
import appStoreBadge from "@/assets/badge-appstore.png.asset.json";
import googlePlayBadge from "@/assets/badge-googleplay.png.asset.json";

export const APP_STORE_URL =
  "https://apps.apple.com/us/app/sahih-al-adhkar/id6791834420";

const SOON_TEXT = "COMING SOON · ";
const STEP_MS = 11000; // ms for the text to advance by exactly one repetition

/** Thin gold border around the Google Play badge with "COMING SOON" text
 *  slowly travelling along it, looped seamlessly. */
function SoonOrbit() {
  const pathRef = useRef<SVGPathElement>(null);
  const textRef = useRef<SVGTextPathElement>(null);
  const trackId = `soon-track-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    const path = pathRef.current;
    const textPath = textRef.current;
    if (!path || !textPath || typeof path.getTotalLength !== "function") return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let unit = 0;
    let start = 0;

    // Tile the path with whole repetitions so the loop wraps seamlessly.
    const measure = () => {
      const total = path.getTotalLength();
      textPath.textContent = SOON_TEXT;
      const single = textPath.getComputedTextLength();
      if (!total || !single) return 0;
      const reps = Math.ceil(total / single) + 1;
      textPath.textContent = SOON_TEXT.repeat(reps);
      return textPath.getComputedTextLength() / reps;
    };

    const begin = () => {
      cancelAnimationFrame(raf);
      unit = measure();
      if (!unit) return;
      start = performance.now();
      const tick = (now: number) => {
        const step = (((now - start) % STEP_MS) / STEP_MS) * unit;
        textPath.setAttribute("startOffset", String(step));
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    begin();
    (document as unknown as { fonts?: { ready?: Promise<unknown> } }).fonts?.ready?.then(begin);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      className="soon-orbit"
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        ref={pathRef}
        id={trackId}
        className="soon-orbit-track"
        d="M 25 8 H 175 Q 192 8 192 25 V 75 Q 192 92 175 92 H 25 Q 8 92 8 75 V 25 Q 8 8 25 8 Z"
      />
      <text className="soon-orbit-text">
        <textPath ref={textRef} href={`#${trackId}`}>
          {SOON_TEXT}
        </textPath>
      </text>
    </svg>
  );
}

export function StoreBadges() {
  return (
    <div className="store-badges">
      <a
        className="store-badge"
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Download on the App Store"
      >
        <img
          src={appStoreBadge.url}
          alt="Download on the App Store"
          className="store-badge-img"
          loading="lazy"
          width={1152}
          height={576}
        />
      </a>
      <span className="store-badge is-soon" aria-disabled="true">
        <img
          src={googlePlayBadge.url}
          alt="Get it on Google Play"
          className="store-badge-img"
          loading="lazy"
          width={1152}
          height={576}
        />
        <SoonOrbit />
      </span>
    </div>
  );
}
