import { createFileRoute } from "@tanstack/react-router";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { ConcentricCirclesPattern } from "@/components/HeaderPatterns";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy, My Adhkar" },
      { name: "description", content: "Privacy policy for the My Adhkar app." },
    ],
  }),
  component: Privacy,
});

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
        <div className="mx-auto max-w-md px-4 py-4 space-y-3 text-sm leading-relaxed">
          <p style={{ color: "var(--foreground)" }}>
            My Adhkar stores your counts, streaks, preferences, and any custom
            adhkar you create locally on your device. Nothing is uploaded to a
            server and no personal data is collected.
          </p>
          <p style={{ color: "var(--muted-foreground)" }}>
            {/* TODO: Replace with the full privacy policy. */}
            Full privacy policy coming soon.
          </p>
        </div>
      </main>
    </>
  );
}
