import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy, Sahih Al-Adhkar" },
      {
        name: "description",
        content:
          "Sahih Al-Adhkar does not collect, transmit, or store any personal data. No analytics, no advertising, no tracking.",
      },
      { property: "og:title", content: "Privacy Policy, Sahih Al-Adhkar" },
      {
        property: "og:description",
        content: "No data collection. No tracking. Everything stays on your device.",
      },
    ],
  }),
  component: PrivacyPage,
});

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "WHAT IS STORED",
    body: "Your counts, streaks, lifetime totals, display preferences, and any custom adhkar you create are saved locally on your device. This information never leaves your device and is never sent to us or to anyone else.",
  },
  {
    heading: "COOKIES AND LOCAL STORAGE",
    body: "This app does not use advertising or tracking cookies. It uses your device's local storage only to remember your progress and preferences so the app works between sessions. This data stays on your device and is cleared when you reset your progress or uninstall the app.",
  },
  {
    heading: "LOCATION",
    body: "The Qibla Finder uses your device location and motion sensors to calculate the direction of the Ka'bah. This calculation happens entirely on your device. Your location is never stored, logged, or transmitted.",
  },
  {
    heading: "NOTIFICATIONS",
    body: "Daily reminders are scheduled on your device using your device clock. No reminder data is sent to any server.",
  },
  {
    heading: "DELETING YOUR DATA",
    body: "You can erase everything at any time using Reset all progress in Settings, or by uninstalling the app.",
  },
  {
    heading: "CHILDREN",
    body: "This app does not collect data from anyone, including children.",
  },
  {
    heading: "CHANGES",
    body: "If this policy changes, the updated version will appear here with a new date.",
  },
  {
    heading: "CONTACT",
    body: "Questions about privacy can be sent to msalahi536@gmail.com",
  },
];

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
          Last updated: July 2026
        </p>
        <p
          className="mt-6 text-lg leading-relaxed"
          style={{ color: "rgba(31, 61, 43, 0.85)" }}
        >
          Sahih Al-Adhkar does not collect, transmit, or store any personal
          data. There are no analytics, no advertising, and no tracking of
          any kind.
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
