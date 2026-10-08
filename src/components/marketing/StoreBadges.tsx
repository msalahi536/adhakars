import { useId } from "react";
import appStoreBadge from "@/assets/badge-appstore.png.asset.json";
import googlePlayBadge from "@/assets/badge-googleplay.png.asset.json";

export const APP_STORE_URL =
  "https://apps.apple.com/us/app/sahih-al-adhkar/id6791834420";

/** "Coming soon" as plain gold text — no pill, no border line. Two
 *  copies drift slowly past the badge, one above and one below, each
 *  fading in and out. They stay inside the badge's own width so they
 *  never collide with the App Store badge or the panel edge. */
function SoonOrbit() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  return (
    <svg
      className="soon-orbit"
      viewBox="0 0 200 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <g className="soon-orbit-chip" key={`top-${id}`}>
        <text textAnchor="middle" dominantBaseline="central">
          COMING SOON
        </text>
        <animateMotion
          path="M 45 -11 L 155 -11"
          dur="14s"
          repeatCount="indefinite"
          rotate="0"
        />
        <animate
          attributeName="opacity"
          dur="14s"
          repeatCount="indefinite"
          values="0;1;1;0"
          keyTimes="0;0.3;0.7;1"
        />
      </g>
      <g className="soon-orbit-chip" key={`bottom-${id}`}>
        <text textAnchor="middle" dominantBaseline="central">
          COMING SOON
        </text>
        <animateMotion
          path="M 45 111 L 155 111"
          dur="14s"
          begin="-7s"
          repeatCount="indefinite"
          rotate="0"
        />
        <animate
          attributeName="opacity"
          dur="14s"
          begin="-7s"
          repeatCount="indefinite"
          values="0;1;1;0"
          keyTimes="0;0.3;0.7;1"
        />
      </g>
      <text
        className="soon-orbit-chip soon-orbit-static"
        x="100"
        y="-11"
        textAnchor="middle"
        dominantBaseline="central"
      >
        COMING SOON
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
