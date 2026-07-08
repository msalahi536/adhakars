import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/qibla")({
  head: () => ({
    meta: [
      { title: "Qibla Finder — My Adhkar" },
      { name: "description", content: "Find the direction of the Qibla from your location." },
    ],
  }),
  component: Qibla,
});

function Qibla() {
  return (
    <>
      <header
        className="page-header"
        style={{
          background: "linear-gradient(135deg, #1f3d2b 0%, #2d5a3d 100%)",
          color: "#ffffff",
        }}
      >
        <div className="mx-auto max-w-md px-5 pb-4 pt-5">
          <div className="label-caps" style={{ color: "rgba(255,255,255,0.85)", opacity: 1 }}>
            Direction of Prayer
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Qibla Finder</h1>
          <p className="mt-2 text-xs opacity-90">
            Allow location & motion access when prompted, then face the direction shown.
          </p>
        </div>
      </header>

      <main className="scroll-area" style={{ background: "#0f1a14", padding: 0 }}>
        <div className="relative mx-auto h-full w-full max-w-md">
          <iframe
            src="https://qiblafinder.withgoogle.com"
            title="Qibla Finder"
            className="h-full w-full"
            style={{ border: 0, minHeight: "calc(100dvh - 220px)" }}
            allow="geolocation; accelerometer; gyroscope; magnetometer; camera"
          />
        </div>
      </main>
    </>
  );
}
