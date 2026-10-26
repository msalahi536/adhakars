// One recall prompt on the real Madani 15-line page: hidden ayahs (L4) with a first-word cue,
// optional lead-in words (transition drills), reveal, word taps and the four grades.
// A hint or any wrong word rules out Perfect.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TajweedText, useTajweed } from "@/lib/tajweed";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { getDisplay } from "@/lib/theme";
import { hifzPage, pageLines, type MWord } from "@/lib/hifz/mushaf";
import { pageOfAyah } from "@/lib/hifz/layout";
import { capGrade, type Grade } from "@/lib/hifz/scheduler";

const GRADES: { g: Grade; label: string }[] = [
  { g: "blank", label: "Blank" },
  { g: "mistake", label: "Mistake" },
  { g: "hesitation", label: "Hesitation" },
  { g: "perfect", label: "Perfect" },
];
const card = { background: "var(--surface)", border: "1px solid var(--border)" };
const soft = { background: "var(--background)", border: "1px solid var(--border)" };
const on = { background: "var(--accent)", color: "var(--accent-foreground)" };
const muted = { color: "var(--muted-foreground)" };

type Props = {
  keys: string[];
  lead?: { key: string; words: number }; // transition drill: last N words of the previous ayah stay visible
  cue?: boolean; // first word of keys[0]
  onGrade: (grade: Grade, errorWords: string[]) => void;
};

export function RecallBlock({ keys, lead, cue = true, onGrade }: Props) {
  const [byPage, setByPage] = useState<Record<number, MWord[]>>({});
  const [err, setErr] = useState("");
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const all = lead ? [lead.key, ...keys] : keys;
  const pages = [...new Set(all.map(pageOfAyah))].sort((a, b) => a - b);

  useEffect(() => {
    for (const p of pages) hifzPage(p).then((ws) => setByPage((m) => ({ ...m, [p]: ws }))).catch(() => setErr("Connect to the internet to load this page."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all.join()]);

  const loaded = pages.every((p) => byPage[p]);
  const mine = new Set(keys);
  const wid = (w: MWord) => `${w.key}:${w.pos}`;
  const words = pages.flatMap((p) => byPage[p] ?? []);
  const leadWords = lead ? words.filter((w) => w.key === lead.key && !w.end).slice(-lead.words).map(wid) : [];
  const leadSet = new Set(leadWords);
  const cueWord = cue ? words.find((w) => w.key === keys[0] && !w.end) : undefined;
  const involved = (w: MWord) => mine.has(w.key) || leadSet.has(wid(w)) || (lead && w.key === lead.key && w.end);
  const rows = loaded ? pages.flatMap((p) => pageLines(byPage[p], p).filter((l) => l.words.some(involved))) : [];

  const fitRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    el.style.fontSize = "28px";
    let f = 1;
    el.querySelectorAll<HTMLElement>("[data-line]").forEach((l) => {
      const w = [...l.children].reduce((s, ch) => s + ch.getBoundingClientRect().width, 0);
      if (w > l.clientWidth) f = Math.min(f, l.clientWidth / w);
    });
    el.style.fontSize = `${Math.max(12, Math.floor(28 * f * 0.98))}px`;
  }, [rows.length, loaded]);

  const cls = "arabic shrink-0 px-[0.15em] leading-[1.9]";
  const tajweed = useTajweed();
  const word = (w: MWord) => {
    const id = wid(w);
    if (!involved(w)) return <span key={id} aria-hidden className={cls} style={{ opacity: 0.3, filter: "blur(6px)", userSelect: "none" }}>{w.text}</span>;
    if (w.end) return <span key={id} className="arabic mx-[0.1em] inline-flex h-[1.5em] min-w-[1.5em] shrink-0 items-center justify-center rounded-full text-[0.65em]" style={{ border: "1.5px solid var(--accent)", color: "var(--accent)" }}>{w.text}</span>;
    if (leadSet.has(id)) return <span key={id} className={cls}>{w.text}</span>;
    if (checking) {
      const bad = errors.has(id);
      return (
        <button key={id} onClick={() => setErrors((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })} aria-pressed={bad} className={`${cls} min-h-12 rounded-lg`}
          style={bad ? { background: "color-mix(in oklab, var(--destructive) 18%, transparent)", color: "var(--destructive)", textDecoration: "underline" } : {}}>{!bad && tajweed && w.tj ? <TajweedText markup={w.tj} /> : w.text}</button>
      );
    }
    if (cueWord && id === wid(cueWord)) return <span key={id} className={cls} style={{ color: "var(--accent)" }}>{w.text}</span>;
    return <span key={id} aria-hidden className={cls}><span style={{ visibility: "hidden" }}>{w.text}</span></span>;
  };

  return (
    <>
      <section className="glass-card px-2 py-4" style={card}>
        {err ? <p className="p-3 text-sm" style={muted}>{err}</p> : !loaded ? <p className="p-3 text-sm" style={muted}>Loading page…</p> : (
          <div ref={fitRef} dir="rtl" lang="ar">
            {rows.map((l) => (
              <div key={l.id} data-line={l.line} className="flex flex-nowrap items-center justify-center whitespace-nowrap" style={{ minHeight: 56, borderBottom: "1px solid color-mix(in oklab, var(--border) 90%, transparent)" }}>
                {l.words.map(word)}
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 px-2 text-[11px]" style={muted}>Page {pages.join("–")} · Madani 15-line{checking ? " · Tap any word you got wrong" : ""}</p>
      </section>
      <section className="glass-card space-y-3 p-4" style={card}>
        {!checking ? (
          <button disabled={!loaded} onClick={() => setChecking(true)} className="min-h-12 w-full rounded-full text-sm font-semibold disabled:opacity-50" style={on}>Reveal and check</button>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-1.5">
              {GRADES.map((g) => {
                const off = g.g === "perfect" && errors.size > 0;
                return (
                  <button key={g.g} disabled={off} onClick={() => { if (getDisplay().haptics) Haptics.impact({ style: ImpactStyle.Medium }).catch(() => navigator.vibrate?.(15)); onGrade(capGrade(g.g, false, errors.size), [...errors]); }}
                    className="min-h-12 rounded-xl text-[12px] font-semibold disabled:opacity-40" style={g.g === "perfect" ? on : soft}>{g.label}</button>
                );
              })}
            </div>
            <p className="text-xs" style={muted}>{errors.size} word{errors.size === 1 ? "" : "s"} marked wrong{errors.size ? ", so the best grade is Hesitation" : ""}</p>
          </>
        )}
      </section>
    </>
  );
}
