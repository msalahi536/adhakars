import { createFileRoute } from "@tanstack/react-router";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { ConcentricCirclesPattern } from "@/components/HeaderPatterns";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service, Sahih al-Adhkar" },
      { name: "description", content: "Terms of service for the Sahih al-Adhkar app." },
    ],
  }),
  component: Terms,
});

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: "The app",
    body: "Sahih al-Adhkar is provided free of charge, as is, and without warranty of any kind. It is offered as a benefit to the community and is not a substitute for scholarly guidance. For any ruling or religious question, please return to the people of knowledge.",
  },
  {
    heading: "Accuracy",
    body: "Every adhkar in this app is presented with its source so that you can verify it. Every effort has been made to be accurate. If you find a mistake, please report it and it will be corrected.",
  },
  {
    heading: "Your content",
    body: "Custom adhkar that you create are stored on your device only. You are responsible for what you add. We do not review, store, or have access to this content.",
  },
  {
    heading: "Donations",
    body: "Donations are voluntary. They are not payment for any feature or content, they unlock nothing, and they are non refundable. Every part of this app is free whether you donate or not.",
  },
  {
    heading: "Limitation of liability",
    body: "This app is provided without warranty. We are not responsible for any loss of data, including counts, streaks, or custom adhkar.",
  },
  {
    heading: "Changes",
    body: "These terms may be updated. Continued use of the app means you accept the current terms.",
  },
  {
    heading: "Contact",
    body: "msalahi536@gmail.com",
  },
];

function Terms() {
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
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Terms of Service</h1>
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto max-w-md px-4 py-4 space-y-4 text-sm leading-relaxed">
          <p style={{ color: "var(--muted-foreground)" }}>Last updated: July 2026</p>
          <p style={{ color: "var(--foreground)" }}>
            By using Sahih al-Adhkar you agree to these terms.
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
