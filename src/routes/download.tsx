import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { StoreBadges } from "@/components/marketing/StoreBadges";
import { ArrowRight, ShieldCheck, Lock, Ban } from "lucide-react";
import heroAsset from "@/assets/homepage-hero.png.asset.json";
import { homepageShareImageMeta } from "@/lib/share-preview";

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
      { name: "twitter:card", content: "summary_large_image" },
      ...homepageShareImageMeta,
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
    <MarketingLayout onePage flushFooter>
      <div className="marketing-home">
        {/* ================= HERO ================= */}
        <section className="marketing-hero download-hero" style={{ minHeight: "92vh" }}>
          <div
            className="marketing-hero-image"
            style={{ backgroundImage: `url(${heroAsset.url})` }}
          />
          <div className="marketing-hero-shade" />
          <div
            className="marketing-shell marketing-hero-copy"
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              minHeight: "92vh",
              maxWidth: 900,
              paddingTop: 96,
              paddingBottom: 72,
            }}
          >
            <p className="marketing-eyebrow">Download</p>
            <h1>
              Your daily adhkar,
              <em>one tap away.</em>
            </h1>
            <p
              className="marketing-lead"
              style={{ maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}
            >
              Free, private, and authentic. Get the app for your phone, or open
              it right here in your browser — nothing to install.
            </p>

            <div
              className="marketing-actions download-hero-badges"
              style={{ justifyContent: "center", marginTop: 36 }}
            >
              <StoreBadges />
            </div>

            <Link
              to="/app"
              className="marketing-secondary-button download-browser-link"
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
              className="marketing-quick-trust download-trust"
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
      </div>
    </MarketingLayout>
  );
}