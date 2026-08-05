import { ExternalLink } from "lucide-react";
import { ConcentricCirclesPattern } from "@/components/HeaderPatterns";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { LEGAL_UPDATED, SITE_ORIGIN, type LegalSection } from "@/data/legal";

type Props = {
  title: string;
  intro: string;
  sections: LegalSection[];
  webPath: string;
};

export function LegalScreen({ title, intro, sections, webPath }: Props) {
  return (
    <>
      <header
        className="page-header relative overflow-hidden"
        style={{ background: "var(--background)", color: "var(--foreground)" }}
      >
        <ConcentricCirclesPattern />
        <HeaderBackButton />
        <div
          className="relative mx-auto max-w-md px-4 pb-5 pt-4"
          style={{ paddingLeft: 60, paddingRight: 60 }}
        >
          <div className="label-caps">Legal</div>
          <h1 className="mt-1 text-2xl font-bold">{title}</h1>
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto max-w-md px-4 py-4" style={{ color: "var(--foreground)" }}>
          <div
            className="rounded-[24px] p-4"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {LEGAL_UPDATED}
            </p>
            <p className="mt-3 text-sm leading-relaxed">{intro}</p>

            <div className="mt-5 space-y-5">
              {sections.map((s) => (
                <section key={s.heading}>
                  <h2 className="label-caps" style={{ opacity: 1 }}>
                    {s.heading}
                  </h2>
                  <p
                    className="mt-1.5 text-sm leading-relaxed"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    {s.body}
                  </p>
                </section>
              ))}
            </div>
          </div>

          <a
            href={`${SITE_ORIGIN}${webPath}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            View on our website <ExternalLink size={14} />
          </a>
        </div>
      </main>
    </>
  );
}
