import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { hifzPage, type MWord } from "@/lib/hifz/mushaf";
import { derive, loadHifz, type HifzState } from "@/lib/hifz/store";
import { addDays, localDay } from "@/lib/hifz/scheduler";
import { forecast } from "@/lib/hifz/session";
import { countLines, daysToFinish, goalAyahs, pageOfAyah, remainingGoal } from "@/lib/hifz/layout";
import { lastReview, pagesByJuz, pageStates, type PageInfo, type PageState } from "@/lib/hifz/progress";
import { rescheduleHifzReminder } from "@/lib/hifz/reminder";

export const Route = createFileRoute("/app/hifz_/progress")({
  head: () => ({
    meta: [
      { title: "Hifz progress and forecast, Sahih Al-Adhkar" },
      { name: "description", content: "See every mushaf page you have memorized, its strength, and the review load for the coming week." },
      { property: "og:title", content: "Hifz progress and forecast, Sahih Al-Adhkar" },
      { property: "og:description", content: "A 604-page memorization heatmap with a 7-day review forecast." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Progress,
});

const card = { background: "var(--surface)", border: "1px solid var(--border)" };
const muted = { color: "var(--muted-foreground)" };

const STYLE: Record<PageState | "none", { bg: string; fg: string; mark: string; label: string }> = {
  strong: { bg: "var(--hifz-strong)", fg: "white", mark: "", label: "Strong" },
  good: { bg: "color-mix(in oklab, var(--hifz-strong) 62%, transparent)", fg: "var(--foreground)", mark: "", label: "Good" },
  light: { bg: "color-mix(in oklab, var(--hifz-strong) 30%, transparent)", fg: "var(--foreground)", mark: "", label: "Settling" },
  weak: { bg: "var(--hifz-weak)", fg: "black", mark: "•", label: "Due soon / weak" },
  overdue: { bg: "var(--hifz-overdue)", fg: "white", mark: "!", label: "Overdue / repeated errors" },
  none: { bg: "var(--hifz-none)", fg: "var(--muted-foreground)", mark: "", label: "Not memorized" },
};
const GRADE: Record<string, string> = { blank: "Blank", mistake: "Mistake", hesitation: "Hesitation", perfect: "Perfect" };

const fmtDay = (d: string) => new Date(d + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

function Progress() {
  const [st, setSt] = useState<HifzState | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => { setSt(loadHifz()); void rescheduleHifzReminder(); }, []);
  const today = useMemo(() => localDay(new Date()), []);
  const d = useMemo(() => (st ? derive(st.events) : null), [st]);
  const states = useMemo(() => (d ? pageStates(d, today) : {}), [d, today]);
  const week = useMemo(() => (st ? forecast(st.events, today, st.plan?.goal, st.plan?.paceLines ?? 5, 7) : []), [st, today]);
  if (!st || !d) return null;

  const juz = pagesByJuz();
  const known = new Set(Object.keys(d.ayahs));
  const pace = st.plan?.paceLines ?? 5;
  const goalKeys = st.plan?.goal ? goalAyahs(st.plan.goal) : [];
  const left = remainingGoal(goalKeys, known);
  const finishDays = pace === 0 ? new Set(left.map(pageOfAyah)).size : daysToFinish(goalKeys, known, pace);
  const max = Math.max(1, ...week.map((w) => w.total));

  return (
    <>
      <header className="page-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        <HeaderBackButton />
        <div className="relative mx-auto max-w-md pb-6 pt-9 text-center" style={{ paddingLeft: 60, paddingRight: 60 }}>
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>Hifz Companion</div>
          <h1 className="app-page-title mt-2">Progress</h1>
        </div>
      </header>
      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-4 px-4 py-4" style={{ color: "var(--foreground)" }}>
          <section className="glass-card grid grid-cols-3 gap-2 p-4 text-center" style={card}>
            <Stat n={Object.keys(states).length} l="pages" />
            <Stat n={countLines([...known])} l="lines" />
            <Stat n={st.plan?.goal ? (finishDays ? fmtDay(addDays(today, finishDays)) : "Done") : "No goal"} l={st.plan?.goal ? "goal finish" : "set in Hifz"} small />
          </section>

          <section className="glass-card space-y-3 p-4" style={card}>
            <div className="flex items-baseline justify-between"><h2 className="label-caps">Next 7 days</h2><span className="text-xs" style={muted}>reviews per day, if all go well</span></div>
            <div className="flex h-32 items-end gap-2" role="list">
              {week.map((w) => (
                <div key={w.day} role="listitem" aria-label={`${fmtDay(w.day)}: ${w.total} reviews`} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs font-semibold">{w.total}</span>
                  <div className="w-full rounded-t-md" style={{ height: `${Math.max(4, (w.total / max) * 84)}px`, background: "var(--accent)" }} />
                  <span className="text-[11px]" style={muted}>{new Date(w.day + "T12:00:00").toLocaleDateString(undefined, { weekday: "narrow" })}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="glass-card space-y-3 p-4" style={card}>
            <h2 className="label-caps">All 604 pages</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-xs">
              {(["none", "strong", "good", "light", "weak", "overdue"] as const).map((k) => (
                <span key={k} className="flex items-center gap-1.5">
                  <span className="grid h-4 w-4 place-items-center rounded text-[10px] font-bold" style={{ background: STYLE[k].bg, color: STYLE[k].fg }}>{STYLE[k].mark}</span>{STYLE[k].label}
                </span>
              ))}
            </div>
            <div className="space-y-2">
              {juz.map((pages, i) => (
                <div key={i}>
                  <div className="mb-1 text-[11px] font-semibold" style={muted}>Juz {i + 1}</div>
                  <div className="grid grid-cols-10 gap-1">
                    {pages.map((p) => {
                      const info = states[p];
                      const s = STYLE[info?.state ?? "none"];
                      return (
                        <button
                          key={p}
                          onClick={() => setOpen(p)}
                          aria-label={`Page ${p}: ${s.label}`}
                          className="relative aspect-square min-h-7 rounded text-[9px] font-semibold leading-none"
                          style={{ background: s.bg, color: s.fg }}
                        >
                          {s.mark ? <span className="text-[11px] font-bold">{s.mark}</span> : <span style={{ opacity: info ? 0.9 : 0.55 }}>{p}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
          <Link to="/app/hifz/today" className="block text-center text-sm underline" style={muted}>Back to today's session</Link>
        </div>
      </main>
      {open !== null && <PageSheet page={open} info={states[open]} st={st} onClose={() => setOpen(null)} />}
    </>
  );
}

function Stat({ n, l, small }: { n: number | string; l: string; small?: boolean }) {
  return <div><div className={small ? "text-sm font-semibold leading-7" : "text-2xl font-semibold"}>{n}</div><div className="text-xs" style={muted}>{l}</div></div>;
}

function PageSheet({ page, info, st, onClose }: { page: number; info?: PageInfo; st: HifzState; onClose: () => void }) {
  const [words, setWords] = useState<MWord[]>([]);
  useEffect(() => { if (info?.errors.length) hifzPage(page).then(setWords).catch(() => {}); }, [page, info]);
  const last = lastReview(st.events, page);
  const span = info ? (info.keys.length === 1 ? info.keys[0] : `${info.keys[0]} – ${info.keys[info.keys.length - 1]}`) : "";
  const wordText = (id: string) => { const [c, a, p] = id.split(":"); return words.find((w) => w.key === `${c}:${a}` && w.pos === +p)?.text; };
  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true" aria-label={`Page ${page}`}>
      <button aria-label="Close" className="absolute inset-0" style={{ background: "color-mix(in oklab, black 45%, transparent)" }} onClick={onClose} />
      <div className="relative mx-auto max-h-[80vh] w-full max-w-md space-y-3 overflow-y-auto rounded-t-3xl p-5 pb-8" style={{ background: "var(--surface)", color: "var(--foreground)" }}>
        <div className="mx-auto h-1.5 w-10 rounded-full" style={{ background: "var(--border)" }} />
        <div className="flex items-baseline justify-between"><h2 className="text-xl font-semibold">Page {page}</h2>{info && <span className="text-sm" style={muted}>{STYLE[info.state].label}</span>}</div>
        {!info ? (
          <p className="text-sm" style={muted}>Nothing memorized on this page yet.</p>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Row k="Memorized ayahs" v={`${span} (${info.keys.length})`} />
              <Row k="Stage" v={info.stage === "manzil" ? "Manzil (long-term)" : "Sabqi (recent)"} />
              <Row k="Last review" v={last ? `${fmtDay(last.day)} · ${GRADE[last.grade]}` : "Not yet"} />
              <Row k="Next due" v={fmtDay(info.due)} />
            </dl>
            <div>
              <div className="mb-1 text-sm font-semibold">Most-tapped error words</div>
              {info.errors.length ? (
                <ul className="flex flex-wrap gap-1.5" dir="rtl">
                  {info.errors.slice(0, 6).map(([w, n]) => (
                    <li key={w} className="rounded-full px-3 py-1 text-sm" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
                      <span className="arabic">{wordText(w) ?? w}</span> <span dir="ltr" style={muted}>×{n}</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm" style={muted}>No errors in the last 30 days.</p>}
            </div>
            <Link to="/app/hifz/today" search={{ practice: page }} className="flex min-h-12 w-full items-center justify-center rounded-full text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
              Practice this page now
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="rounded-xl p-2.5" style={{ background: "var(--background)", border: "1px solid var(--border)" }}><dt className="text-xs" style={muted}>{k}</dt><dd className="font-semibold">{v}</dd></div>;
}
