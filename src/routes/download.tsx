import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import {
  APP_STORE_URL,
  GOOGLE_PLAY_URL,
  StoreBadges,
} from "@/components/marketing/StoreBadges";
import {
  Apple,
  Play,
  ArrowRight,
  Share,
  MoreVertical,
  Plus,
  ShieldCheck,
  Lock,
  Ban,
  Smartphone,
} from "lucide-react";
import heroAsset from "@/assets/homepage-hero.png.asset.json";

export const Route = createFileRoute("/download")({
  head: () => ({
    meta: [
      { title: "Download — Sahih Al-Adhkar" },
      {
        name: "description",
        content:
          "Get Sahih Al-Adhkar on the App Store for iPhone and Google Play for Android — or open it right in your browser. Free, private, no accounts.",
      },
      { property: "og:title", content: "Get Sahih Al-Adhkar" },
      {
        property: "og:description",
        content: "Free, private, no accounts. Now on the App Store and Google Play.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DownloadPage,
});

const TRUST = [
  { Icon: ShieldCheck, label: "Free forever" },
  { Icon: Ban, label: "No ads" },
  { Icon: Lock, label: "No accounts" },
];

function DownloadPage() {
  return (
    <MarketingLayout onePage>
      <div className="marketing-home">
        {/* ================= HERO ================= */}
        <section className="marketing-hero" style={{ minHeight: "92vh" }}>
          <div
            className="marketing-hero-image"
            style={{ backgroundImage: `url(${heroAsset.url})` }}
          />
          <div className="marketing-hero-shade" />
          <div
            className="marketing-shell"
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: "92vh",
              paddingTop: 96,
              paddingBottom: 72,
            }}
          >
            <p className="marketing-eyebrow">Download</p>
            <h1
              style={{
                maxWidth: 820,
                margin: "0 auto",
              }}
            >
              Your daily adhkar,
              <em>one tap away.</em>
            </h1>
            <p
              className="marketing-lead"
              style={{ maxWidth: 560, margin: "0 auto" }}
            >
              Free, private, and authentic. Get the app for your phone, or open
              it right here in your browser — nothing to install.
            </p>

            <div
              className="marketing-actions"
              style={{ justifyContent: "center", marginTop: 36 }}
            >
              <StoreBadges />
            </div>

            <Link
              to="/app"
              className="marketing-secondary-button"
              style={{
                marginTop: 18,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                textDecoration: "none",
              }}
            >
              Or open it right in your browser
              <ArrowRight size={15} />
            </Link>

            <div
              className="marketing-quick-trust"
              aria-label="App benefits"
              style={{ justifyContent: "center", marginTop: 34 }}
            >
              {TRUST.map(({ Icon, label }) => (
                <span key={label}>
                  <Icon />
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ================= PLATFORMS ================= */}
        <section className="marketing-section">
          <div className="marketing-shell">
            <div className="marketing-heading marketing-heading-centered">
              <p className="marketing-eyebrow">Choose your device</p>
              <h2>
                Made for iPhone<em>and Android.</em>
              </h2>
              <p>
                Native apps with prayer alerts, the adhan, and home-screen
                widgets — the same calm experience everywhere.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 20,
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                maxWidth: 880,
                margin: "0 auto",
              }}
            >
              {/* iOS card */}
              <a
                href={APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="marketing-feature-card"
                style={{
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <span className="marketing-icon">
                  <Apple />
                </span>
                <h3>iPhone &amp; iPad</h3>
                <p>
                  Prayer alerts, the full adhan, and lock-screen widgets —
                  download it free on the App Store.
                </p>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#1F3D2B",
                  }}
                >
                  Download on the App Store <ArrowRight size={15} />
                </span>
              </a>

              {/* Android card */}
              <a
                href={GOOGLE_PLAY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="marketing-feature-card"
                style={{
                  textDecoration: "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 14,
                }}
              >
                <span className="marketing-icon">
                  <Play />
                </span>
                <h3>Android</h3>
                <p>
                  Adhan notifications, home-screen widgets, and the same
                  authentic content — get it on Google Play.
                </p>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 700,
                    fontSize: 14,
                    color: "#1F3D2B",
                  }}
                >
                  Get it on Google Play <ArrowRight size={15} />
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* ================= INSTALL FROM BROWSER ================= */}
        <section className="marketing-section" style={{ paddingTop: 0 }}>
          <div className="marketing-shell">
            <div className="marketing-heading marketing-heading-centered">
              <p className="marketing-eyebrow">No store needed</p>
              <h2>
                A real app icon,<em>straight from the browser.</em>
              </h2>
              <p>
                Two taps and the app lives on your home screen — fullscreen,
                with the same feel as the native version.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gap: 20,
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                maxWidth: 880,
                margin: "0 auto",
              }}
            >
              <InstallCard
                badge="iPhone & iPad"
                title="Add to Home Screen"
                steps={[
                  {
                    Icon: Share,
                    text: "Open the app in Safari, then tap the Share icon.",
                  },
                  {
                    Icon: Plus,
                    text: 'Choose "Add to Home Screen", then tap Add.',
                  },
                ]}
              />
              <InstallCard
                badge="Android"
                title="Install app"
                steps={[
                  {
                    Icon: MoreVertical,
                    text: "Open the app in Chrome, then tap the menu.",
                  },
                  { Icon: Smartphone, text: 'Choose "Install app" and confirm.' },
                ]}
              />
            </div>
          </div>
        </section>
      </div>
    </MarketingLayout>
  );
}

function InstallCard({
  badge,
  title,
  steps,
}: {
  badge: string;
  title: string;
  steps: { Icon: typeof Share; text: string }[];
}) {
  return (
    <div
      className="marketing-feature-card"
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#8B7326",
        }}
      >
        {badge}
      </span>
      <h3>{title}</h3>
      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {steps.map(({ Icon, text }, i) => (
          <li
            key={i}
            style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
          >
            <span className="marketing-icon" style={{ width: 34, height: 34 }}>
              <Icon size={16} />
            </span>
            <span
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: "rgba(31,61,43,0.72)",
                paddingTop: 6,
              }}
            >
              {text}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
