import { createFileRoute } from "@tanstack/react-router";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { OSS_LICENSES } from "@/data/licenses";

export const Route = createFileRoute("/app/licenses")({
  head: () => ({
    meta: [
      { title: "Open-source licenses, Sahih Al-Adhkar" },
      { name: "description", content: "Open-source components used in Sahih Al-Adhkar and their licenses." },
      { property: "og:title", content: "Open-source licenses, Sahih Al-Adhkar" },
      { property: "og:description", content: "Open-source components and license texts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Licenses,
});

function Licenses() {
  return (
    <>
      <header className="page-header relative overflow-hidden" style={{ background: "var(--background)", color: "var(--foreground)" }}>
        <HeaderBackButton />
        <div className="relative mx-auto max-w-md pb-6 pt-9 text-center" style={{ paddingLeft: 60, paddingRight: 60 }}>
          <div className="label-caps">About</div>
          <h1 className="app-page-title mt-2">Open-source licenses</h1>
        </div>
      </header>
      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-4 px-4 py-4" style={{ color: "var(--foreground)" }}>
          {OSS_LICENSES.map((l) => (
            <section key={l.name} className="glass-card p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-sm leading-relaxed">
                {l.component}:{" "}
                <a href={l.source} target="_blank" rel="noopener noreferrer" className="underline">{l.name}</a>{" "}
                (Hugging Face), licensed under {l.license}
              </p>
              {l.modified && <p className="mt-2 text-sm">{l.modified}</p>}
              {l.notice && <pre className="mt-3 whitespace-pre-wrap text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{l.notice}</pre>}
              <pre className="mt-4 whitespace-pre-wrap break-words text-[11px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{l.text}</pre>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}
