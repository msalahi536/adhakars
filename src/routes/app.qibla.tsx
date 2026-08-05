import { createFileRoute } from "@tanstack/react-router";
import { HeaderSettingsButton } from "@/components/HeaderSettingsButton";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { Compass } from "lucide-react";

export const Route = createFileRoute("/app/qibla")({
  head: () => ({
    meta: [
      { title: "Qibla Finder, Sahih Al-Adhkar" },
      { name: "description", content: "Find the direction of the Qibla from your location." },
    ],
  }),
  component: Qibla,
});

function Qibla() {
  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}
      >
        <HeaderBackButton />
        <HeaderSettingsButton />
        <div className="mx-auto max-w-md px-5 pb-4 pt-5" style={{ paddingLeft: 60, paddingRight: 60 }}>
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>
            Direction of Prayer
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Qibla Finder</h1>
          <p className="mt-2 text-xs" style={{ color: "var(--header-sub)" }}>
            Point your phone flat. The arrow will point toward the Kaaba.
          </p>
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center px-5 py-10">
          <div
            className="flex w-full flex-col items-center justify-center gap-5 rounded-3xl p-8 text-center"
            style={{
              background: "var(--card)",
              color: "var(--card-foreground)",
              boxShadow: "var(--card-shadow)",
            }}
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: "var(--muted)" }}
            >
              <Compass size={32} style={{ color: "var(--accent)" }} />
            </div>
            <h2 className="text-lg font-bold tracking-tight">Qibla Finder is coming soon.</h2>
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              This feature will be available in the next update.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
