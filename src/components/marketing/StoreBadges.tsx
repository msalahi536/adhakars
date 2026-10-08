import { Apple, Play } from "lucide-react";

export const APP_STORE_URL =
  "https://apps.apple.com/us/app/sahih-al-adhkar/id6791834420";

export function StoreBadges() {
  return (
    <div className="store-badges">
      <a
        className="store-badge"
        href={APP_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Apple size={25} />
        <span className="store-badge-text">
          <span className="store-badge-eyebrow">Download on the</span>
          <span className="store-badge-name">App Store</span>
        </span>
      </a>
      <span className="store-badge is-soon" aria-disabled="true">
        <Play size={25} />
        <span className="store-badge-text">
          <span className="store-badge-eyebrow">GET IT ON</span>
          <span className="store-badge-name">Google Play</span>
        </span>
      </span>
      <span className="store-badge-soon">Coming soon</span>
    </div>
  );
}
