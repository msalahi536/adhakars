import { useId } from "react";
import appStoreBadge from "@/assets/badge-appstore.png.asset.json";
import googlePlayBadge from "@/assets/badge-googleplay.png.asset.json";

export const APP_STORE_URL =
  "https://apps.apple.com/us/app/sahih-al-adhkar/id6791834420";

/** Thin gold border around the Google Play badge with a single
 *  "Coming soon" tag gliding slowly around it. */
function SoonOrbit() {
  const trackId = `soon-track-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg
      className="soon-orbit"
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <path
          id={trackId}
          d="M 26 7 H 174 Q 193 7 193 26 V 74 Q 193 93 174 93 H 26 Q 7 93 7 74 V 26 Q 7 7 26 7 Z"
          fill="none"
        />
      </defs>
      <use className="soon-orbit-track" href={`#${trackId}`} />
      <g className="soon-orbit-chip">
        <rect x="-48" y="-10" width="96" height="20" rx="10" />
        <text textAnchor="middle" dominantBaseline="central">
          COMING SOON
        </text>
        <animateMotion dur="16s" repeatCount="indefinite" rotate="0">
          <mpath href={`#${trackId}`} />
        </animateMotion>
      </g>
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
