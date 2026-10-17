import { ExternalLink } from "lucide-react";
import { evidenceById, type Evidence } from "@/data/zakat/evidence";
import { WHY, getRules, type MadhabId } from "@/lib/zakat/rules";
import { Muted, Sheet } from "./ui";

export function EvidenceRef({ e }: { e: Evidence }) {
  const refOnly = !e.arabic && !e.english;
  return (
    <div className="rounded-2xl px-3 py-2" style={{ border: `1px ${refOnly ? "dashed" : "solid"} var(--border)` }}>
      <div className="text-[12px] font-semibold">{e.title}</div>
      {e.arabic && <p dir="rtl" lang="ar" className="mt-1 text-base leading-loose">{e.arabic}</p>}
      {e.english && <p className="mt-1 text-[13px] leading-relaxed">{e.english}</p>}
      <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
        {e.url ? (
          <a href={e.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
            {e.source} <ExternalLink size={11} aria-hidden="true" />
          </a>
        ) : (
          <span>{e.source}</span>
        )}
        {e.grading && <span>· {e.grading}</span>}
        {refOnly && <span className="italic">reference only</span>}
      </div>
    </div>
  );
}

export function EvidenceList({ ids }: { ids: string[] }) {
  const list = ids.map(evidenceById).filter((e): e is Evidence => !!e);
  if (!list.length) return null;
  return <div className="space-y-2">{list.map((e) => <EvidenceRef key={e.id} e={e} />)}</div>;
}

export function WhySheet({ whyKey, madhab, onClose }: { whyKey: string | null; madhab: MadhabId; onClose: () => void }) {
  const w = whyKey ? WHY[whyKey] : null;
  const rules = getRules(madhab);
  return (
    <Sheet open={!!w} onClose={onClose} title="Why?">
      {w && (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed">{w.text}</p>
          <Muted>View: {rules.name}</Muted>
          <EvidenceList ids={w.evidenceIds} />
          {rules.sources.length > 0 && (
            <div>
              <div className="text-[12px] font-semibold">Source</div>
              <Muted>{rules.sources.join("; ")}</Muted>
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}
