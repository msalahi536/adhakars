import { useId } from "react";
import appStoreBadge from "@/assets/badge-appstore.png.asset.json";
import googlePlayBadge from "@/assets/badge-googleplay.png.asset.json";

export const APP_STORE_URL =
  "https://apps.apple.com/us/app/sahih-al-adhkar/id6791834420";

/** A single "Coming soon" label — plain gold text, no pill and no
 *  border line — gliding slowly around the Google Play badge. The
 *  travel path sits just outside the badge so the words ride in the
 *  empty space above and below it rather than across the artwork. */
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
          d="M 16 -11 H 175 Q 193 -11 193 7 V 93 Q 193 111 175 111 H 16 Q -2 111 -2 93 V 7 Q -2 -11 16 -11 Z"
          fill="none"
        />
      </defs>
      <g className="soon-orbit-chip">
        <text textAnchor="middle" dominantBaseline="central">
          COMING SOON
        </text>
        <animateMotion dur="18s" repeatCount="indefinite" rotate="0">
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
