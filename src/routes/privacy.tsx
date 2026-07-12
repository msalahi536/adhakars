import { createFileRoute } from "@tanstack/react-router";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { ConcentricCirclesPattern } from "@/components/HeaderPatterns";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy, Adhkar as-Sahih" },
      { name: "description", content: "Privacy policy for the Adhkar as-Sahih app." },
    ],
  }),
  component: Privacy,
});

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "What is stored",
    body: "Your counts, streaks, lifetime totals, display preferences, and any custom adhkar you create are saved locally on your device. This information never leaves your device and is never sent to us or to anyone else.",
  },
  {
    heading: "Cookies and local storage",
    body: "This app does not use advertising or tracking cookies. It uses your device's local storage only to remember your progress and preferences so the app works between sessions. This data stays on your device and is cleared when you reset your progress or uninstall the app.",
  },
  {
    heading: "Location",
    body: "The Qibla Finder uses your device location and motion sensors to calculate the direction of the Ka'bah. This calculation happens entirely on your device. Your location is never stored, logged, or transmitted.",
  },
  {
    heading: "Notifications",
    body: "Daily reminders are scheduled on your device using your device clock. No reminder data is sent to any server.",
  },
  {
    heading: "Deleting your data",
    body: "You can erase everything at any time using Reset all progress in Settings, or by uninstalling the app.",
  },
  {
    heading: "Children",
    body: "This app does not collect data from anyone, including children.",
  },
  {
    heading: "Changes",
    body: "If this policy changes, the updated version will appear here with a new date.",
  },
  {
    heading: "Contact",
    body: "Questions about privacy can be sent to msalahi536@gmail.com",
  },
];

function Privacy() {
  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}
      >
        <ConcentricCirclesPattern />
        <HeaderBackButton />
        <div
          className="relative mx-auto max-w-md px-4 pb-5 pt-4"
          style={{ paddingLeft: 60, paddingRight: 60 }}
        >
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>
            Legal
          </div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Privacy Policy</h1>
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto max-w-md px-4 py-4 space-y-4 text-sm leading-relaxed">
          <p style={{ color: "var(--muted-foreground)" }}>Last updated: July 2026</p>
          <p style={{ color: "var(--foreground)" }}>
            Adhkar as-Sahih does not collect, transmit, or store any personal
            data. There are no analytics, no advertising, and no tracking of
            any kind.
          </p>
          {SECTIONS.map((s) => (
            <section key={s.heading}>
              <h2 className="label-caps mb-1">{s.heading}</h2>
              <p style={{ color: "var(--foreground)" }}>{s.body}</p>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
