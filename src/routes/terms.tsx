import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service, Sahih Al-Adhkar" },
      {
        name: "description",
        content:
          "Terms of service for Sahih Al-Adhkar. Free, provided as is, no warranty.",
      },
      { property: "og:title", content: "Terms of Service, Sahih Al-Adhkar" },
      { property: "og:description", content: "Terms of service for Sahih Al-Adhkar." },
    ],
  }),
  component: TermsPage,
});

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "THE APP",
    body: "Sahih Al-Adhkar is provided free of charge, as is, and without warranty of any kind. It is offered as a benefit to the community and is not a substitute for scholarly guidance. For any ruling or religious question, please return to the people of knowledge.",
  },
  {
    heading: "ACCURACY",
    body: "Every adhkar in this app is presented with its source so that you can verify it. Every effort has been made to be accurate. If you find a mistake, please report it and it will be corrected.",
  },
  {
    heading: "YOUR CONTENT",
    body: "Custom adhkar that you create are stored on your device only. You are responsible for what you add. We do not review, store, or have access to this content.",
  },
  {
    heading: "DONATIONS",
    body: "Donations are voluntary. They are not payment for any feature or content, they unlock nothing, and they are non refundable. Every part of this app is free whether you donate or not.",
  },
  {
    heading: "LIMITATION OF LIABILITY",
    body: "This app is provided without warranty. We are not responsible for any loss of data, including counts, streaks, or custom adhkar.",
  },
  {
    heading: "CHANGES",
    body: "These terms may be updated. Continued use of the app means you accept the current terms.",
  },
  {
    heading: "CONTACT",
    body: "msalahi536@gmail.com",
  },
];

function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="mt-6 text-sm" style={{ color: "rgba(31, 61, 43, 0.6)" }}>
          Last updated: July 2026
        </p>
        <p
          className="mt-6 text-lg leading-relaxed"
          style={{ color: "rgba(31, 61, 43, 0.85)" }}
        >
          By using Sahih Al-Adhkar you agree to these terms.
        </p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
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
