import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";
import { LEGAL_UPDATED, PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/data/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy, Sahih Al-Adhkar" },
      {
        name: "description",
        content:
          "How Sahih Al-Adhkar handles local progress, microphone audio, optional submissions and external services.",
      },
      { property: "og:title", content: "Privacy Policy, Sahih Al-Adhkar" },
      {
        property: "og:description",
        content: "Privacy information for local worship progress, microphone use, external services and optional submissions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <MarketingLayout>
      <section className="mx-auto max-w-3xl px-5 pb-24 pt-14 md:px-10 md:pb-32 md:pt-20">
        <div
          className="text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: "#C9A84C" }}
        >
          Legal
        </div>
        <h1
          className="mt-3 text-4xl leading-tight tracking-tight md:text-6xl"
          style={{ fontFamily: "'Fraunces', Georgia, serif", fontWeight: 500 }}
        >
          Privacy Policy
        </h1>
        <p className="mt-6 text-sm" style={{ color: "rgba(31, 61, 43, 0.6)" }}>
          {LEGAL_UPDATED}
        </p>
        <p
          className="mt-6 text-lg leading-relaxed"
          style={{ color: "rgba(31, 61, 43, 0.85)" }}
        >
          {PRIVACY_INTRO}
        </p>

        <div className="mt-10 space-y-8">
          {PRIVACY_SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2
                className="text-xs font-semibold uppercase tracking-[0.2em]"
                style={{ color: "#8B7326" }}
              >
                {s.heading}
              </h2>
              <p
                className="mt-3 text-base leading-relaxed"
                style={{ color: "rgba(31, 61, 43, 0.85)" }}
              >
                {s.body}
              </p>
            </section>
          ))}
        </div>
      </section>
    </MarketingLayout>
  );
}
