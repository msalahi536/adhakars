import appStoreBadge from "@/assets/badge-appstore.png.asset.json";
import googlePlayBadge from "@/assets/badge-googleplay.png.asset.json";

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
      </span>
      <span className="store-badge-soon">Coming soon</span>
    </div>
  );
}
