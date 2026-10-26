// Tajweed coloring from Quran.com's `text_uthmani_tajweed` markup, in the Dar al-Ma'rifah color scheme.
// The markup is parsed into plain text segments (never injected as HTML).
import { Fragment, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getDisplay } from "@/lib/theme";

/** Dar al-Ma'rifah color groups. Colors are CSS tokens in styles.css (--tj-*). */
export const TAJWEED_GROUPS = [
  { id: "necessary", label: "Necessary prolongation", sub: "6 vowels" },
  { id: "obligatory", label: "Obligatory prolongation", sub: "4 or 5 vowels" },
  { id: "permissible", label: "Permissible prolongation", sub: "2, 4 or 6 vowels" },
  { id: "normal", label: "Normal prolongation", sub: "2 vowels" },
  { id: "ghunnah", label: "Nasalization (ghunnah)", sub: "Ikhfa', iqlab, idgham with ghunnah, 2 vowels" },
  { id: "qalqalah", label: "Qalqalah", sub: "Echoing sound" },
  { id: "silent", label: "Not pronounced", sub: "Hamzat al-wasl, lam shamsiyyah, silent letters, idgham without ghunnah" },
] as const;
export type TajweedGroup = (typeof TAJWEED_GROUPS)[number]["id"];

/** Quran.com rule class → Dar al-Ma'rifah group. */
export const RULE_GROUP: Record<string, TajweedGroup> = {
  madda_necessary: "necessary",
  madda_obligatory: "obligatory",
  madda_obligatory_mottasel: "obligatory",
  madda_obligatory_monfasel: "obligatory",
  madda_permissible: "permissible",
  madda_normal: "normal",
  ghunnah: "ghunnah",
  ikhafa: "ghunnah",
  ikhafa_shafawi: "ghunnah",
  iqlab: "ghunnah",
  idgham_ghunnah: "ghunnah",
  idgham_shafawi: "ghunnah",
  qalaqah: "qalqalah",
  ham_wasl: "silent",
  laam_shamsiyah: "silent",
  slnt: "silent",
  idgham_wo_ghunnah: "silent",
  idgham_mutajanisayn: "silent",
  idgham_mutaqaribayn: "silent",
};

export type TajweedSegment = { text: string; group?: TajweedGroup };

/** `أَحَ<rule class=qalaqah>د</rule>ٌ` → [{text:"أَحَ"}, {text:"د", group:"qalqalah"}, {text:"ٌ"}]. Unknown classes stay plain. */
export function parseTajweed(markup: string): TajweedSegment[] {
  const out: TajweedSegment[] = [];
  const re = /<(rule|tajweed)\s+class=["']?([a-z_]+)["']?\s*>([\s\S]*?)<\/\1>/g;
  const plain = (s: string) => s.replace(/<[^>]+>/g, "");
  let last = 0;
  for (let m: RegExpExecArray | null; (m = re.exec(markup)); ) {
    if (m.index > last) out.push({ text: plain(markup.slice(last, m.index)) });
    out.push({ text: plain(m[3]), group: RULE_GROUP[m[2]] });
    last = re.lastIndex;
  }
  if (last < markup.length) out.push({ text: plain(markup.slice(last)) });
  return out.filter((s) => s.text);
}

export function TajweedText({ markup }: { markup: string }) {
  return (
    <>
      {parseTajweed(markup).map((s, i) =>
        s.group ? <span key={i} style={{ color: `var(--tj-${s.group})` }}>{s.text}</span> : <Fragment key={i}>{s.text}</Fragment>,
      )}
    </>
  );
}

/** Reader preference (off by default); read after mount so server and first client render match. */
export function useTajweed(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const read = () => setOn(!!getDisplay().quranTajweed);
    read();
    window.addEventListener("adhkar:display-update", read);
    return () => window.removeEventListener("adhkar:display-update", read);
  }, []);
  return on;
}

export function TajweedLegend({ onClose }: { onClose: () => void }) {
  return createPortal(
    <div className="fixed inset-0 flex items-end" style={{ zIndex: 400 }} role="dialog" aria-modal="true" aria-label="Tajweed colors">
      <button aria-label="Close" className="absolute inset-0" style={{ background: "color-mix(in oklab, black 45%, transparent)" }} onClick={onClose} />
      <div className="relative mx-auto max-h-[80vh] w-full max-w-md space-y-3 overflow-y-auto rounded-t-3xl p-5" style={{ background: "var(--surface)", color: "var(--foreground)", paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)" }}>
        <div className="mx-auto h-1.5 w-10 rounded-full" style={{ background: "var(--border)" }} />
        <h2 className="text-lg font-semibold">Tajweed colors</h2>
        <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Dar al-Ma'rifah color scheme.</p>
        <ul className="space-y-2">
          {TAJWEED_GROUPS.map((g) => (
            <li key={g.id} className="flex items-center gap-3">
              <span className="h-5 w-5 shrink-0 rounded-full" style={{ background: `var(--tj-${g.id})` }} />
              <span><span className="block text-sm font-semibold">{g.label}</span><span className="block text-xs" style={{ color: "var(--muted-foreground)" }}>{g.sub}</span></span>
            </li>
          ))}
        </ul>
        <button onClick={onClose} className="min-h-11 w-full rounded-full text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>Done</button>
      </div>
    </div>,
    document.body,
  );
}
