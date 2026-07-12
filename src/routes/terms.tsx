import { createFileRoute } from "@tanstack/react-router";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { ConcentricCirclesPattern } from "@/components/HeaderPatterns";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — My Adhkar" },
      { name: "description", content: "Terms of service for the My Adhkar app." },
    ],
  }),
  component: Terms,
});

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
        <div className="mx-auto max-w-md px-4 py-4 space-y-3 text-sm leading-relaxed">
          <p style={{ color: "var(--foreground)" }}>
            My Adhkar is provided free of charge for personal, non-commercial
            use. The app is offered "as is" without warranty of any kind.
          </p>
          <p style={{ color: "var(--muted-foreground)" }}>
            {/* TODO: Replace with the full terms of service. */}
            Full terms of service coming soon.
          </p>
        </div>
      </main>
    </>
  );
}
