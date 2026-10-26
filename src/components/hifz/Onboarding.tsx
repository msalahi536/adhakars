// Hifz onboarding: goal + pace, already-memorized check-off, placement test, summary.
// Seeding is written only as review-log events (placement + seed), never as direct state.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Lightbulb } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { getDisplay } from "@/lib/theme";
import { hifzPage, pageLines, type MChapter, type MWord } from "@/lib/hifz/mushaf";
import { ayahsOfJuz, ayahsOfPage, countLines, daysToFinish, goalAyahs, pageOfAyah, surahAyahs, surahLength, type Goal } from "@/lib/hifz/layout";
import { groupByPage, inheritGrades, samplePages, seedPlan } from "@/lib/hifz/placement";
import { derive, loadHifz, recordEvents, savePlan } from "@/lib/hifz/store";
import { addDays, localDay, type Grade } from "@/lib/hifz/scheduler";

const PACES: { v: number; label: string }[] = [3, 5, 7, 10, 15].map((v) => ({ v, label: `${v} lines` })).concat([{ v: 0, label: "Full page" }]);
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

function buzz() {
  if (!getDisplay().haptics) return;
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => navigator.vibrate?.(15));
}

type Result = { page: number; grade: Grade; errorWords: string[] };
type Props = { chapters: MChapter[]; onSkip: () => void; onDone: (startKey: string | null) => void };

export function HifzOnboarding({ chapters, onSkip, onDone }: Props) {
  const [step, setStep] = useState<"goal" | "known" | "test" | "finish">("goal");
  const [goalType, setGoalType] = useState<Goal["type"]>("juz-amma");
  const [surahs, setSurahs] = useState<number[]>([]);
  const [direction, setDirection] = useState<"forward" | "backward">("backward");
  const [from, setFrom] = useState({ c: 1, a: 1 });
  const [to, setTo] = useState({ c: 1, a: 7 });
  const [pace, setPace] = useState(5);
  const [known, setKnown] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<Result[]>([]);
  const [summary, setSummary] = useState<{ ok: number; work: number; review: number } | null>(null);

  const goal: Goal =
    goalType === "surahs" ? { type: "surahs", surahs }
    : goalType === "whole" ? { type: "whole", direction }
    : goalType === "custom" ? { type: "custom", from: `${from.c}:${from.a}`, to: `${to.c}:${to.a}` }
    : { type: "juz-amma" };
  const goalKeys = useMemo(() => goalAyahs(goal), [JSON.stringify(goal)]); // eslint-disable-line react-hooks/exhaustive-deps
  const remaining = goalKeys.filter((k) => !known.has(k));
  const days = pace === 0 ? new Set(remaining.map(pageOfAyah)).size : daysToFinish(goalKeys, known, pace);
  const finish = new Date(addDays(localDay(new Date()), days) + "T12:00:00");

  const pageKeys = useMemo(() => groupByPage([...known]), [known]);
  const checkedPages = Object.keys(pageKeys).map(Number);
  const samples = useMemo(() => samplePages(checkedPages), [pageKeys]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (keys: string[]) =>
    setKnown((s) => {
      const n = new Set(s);
      const all = keys.every((k) => n.has(k));
      for (const k of keys) if (all) n.delete(k); else n.add(k);
      return n;
    });

  function finishSeeding(res: Result[]) {
    const tested: Record<number, Grade> = Object.fromEntries(res.map((r) => [r.page, r.grade]));
    const plan = seedPlan(pageKeys, inheritGrades(pageKeys, tested));
    recordEvents([
      ...res.map((r) => ({ kind: "placement" as const, session: "placement" as const, key: String(r.page), page: r.page, grade: r.grade, errorWords: r.errorWords })),
      ...plan.map((s) => ({ kind: "seed" as const, session: "seed" as const, key: String(s.page), page: s.page, grade: s.grade, keys: s.keys, dueOffset: s.dueOffset })),
    ]);
    const d = derive(loadHifz().events);
    const today = localDay(new Date()), end = addDays(today, 30);
    const due30 = Object.values(d.pages).filter((p) => p.inManzil && p.due <= end).length;
    setSummary({
      ok: plan.filter((s) => s.grade === "perfect" || s.grade === "hesitation").length,
      work: plan.filter((s) => s.grade === "mistake" || s.grade === "blank").length,
      review: Math.round((due30 / 30) * 10) / 10,
    });
    setStep("finish");
  }

  function saveGoal() {
    savePlan({ targets: goalKeys.slice(0, 1), dailyNewAyahs: 0, direction: goal.type === "whole" ? direction : "backward", updatedAt: new Date().toISOString(), goal, paceLines: pace });
  }

  const name = (c: number) => chapters.find((x) => x.id === c)?.name ?? `Surah ${c}`;
  const Skip = () => (
    <button onClick={onSkip} className="min-h-11 text-sm underline" style={muted}>Skip setup</button>
  );
  const Steps = ({ i }: { i: number }) => (
    <div className="flex items-center justify-between">
      <div className="flex gap-1.5">{[0, 1, 2, 3].map((n) => <span key={n} className="h-1.5 w-7 rounded-full" style={{ background: n <= i ? "var(--accent)" : "var(--border)" }} />)}</div>
      {step !== "finish" && <Skip />}
    </div>
  );

  if (step === "goal")
    return (
      <section className="glass-card space-y-4 p-5" style={card}>
        <Steps i={0} />
        <h2 className="text-xl font-semibold">What would you like to memorize next?</h2>
        <div className="space-y-2">
          {([
            ["juz-amma", "Juz 'Amma", "From An-Nas backward"],
            ["surahs", "Specific surahs", "Pick one or more"],
            ["whole", "Whole Quran", "Forward from Al-Baqarah or backward from An-Nas"],
            ["custom", "Custom range", "Any start and end ayah"],
          ] as const).map(([t, title, sub]) => (
            <button key={t} onClick={() => setGoalType(t)} className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-4 py-3 text-left" style={goalType === t ? { ...soft, borderColor: "var(--accent)", boxShadow: "0 0 0 1.5px var(--accent)" } : soft}>
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full" style={{ border: "2px solid var(--accent)" }}>{goalType === t && <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--accent)" }} />}</span>
              <span><span className="block text-sm font-semibold">{title}</span><span className="block text-xs" style={muted}>{sub}</span></span>
            </button>
          ))}
        </div>

        {goalType === "surahs" && (
          <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl p-2" style={soft}>
            {chapters.map((c) => (
              <label key={c.id} className="flex min-h-11 items-center gap-3 px-2 text-sm">
                <input type="checkbox" checked={surahs.includes(c.id)} onChange={() => setSurahs((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))} />
                <span className="flex-1">{c.id}. {c.name}</span><span className="arabic">{c.arabic}</span>
              </label>
            ))}
          </div>
        )}
        {goalType === "whole" && (
          <div className="grid grid-cols-2 gap-2">
            {(["forward", "backward"] as const).map((d) => (
              <button key={d} onClick={() => setDirection(d)} className="min-h-12 rounded-xl text-sm font-semibold" style={direction === d ? on : soft}>{d === "forward" ? "From Al-Baqarah" : "From An-Nas"}</button>
            ))}
          </div>
        )}
        {goalType === "custom" && (
          <div className="space-y-2">
            {([["From", from, setFrom], ["To", to, setTo]] as const).map(([l, v, set]) => (
              <div key={l} className="grid grid-cols-[3rem_1fr_5rem] items-center gap-2 text-sm">
                <span>{l}</span>
                <select value={v.c} onChange={(e) => set({ c: +e.target.value, a: 1 })} className="min-h-11 rounded-xl px-2" style={{ ...soft, color: "var(--foreground)" }}>
                  {chapters.map((c) => <option key={c.id} value={c.id}>{c.id}. {c.name}</option>)}
                </select>
                <input type="number" min={1} max={surahLength(v.c)} value={v.a} onChange={(e) => set({ c: v.c, a: Math.min(surahLength(v.c), Math.max(1, +e.target.value || 1)) })} className="min-h-11 rounded-xl px-2" style={{ ...soft, color: "var(--foreground)" }} aria-label={`${l} ayah`} />
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="mb-1.5 text-sm font-semibold">Daily pace</div>
          <div className="grid grid-cols-3 gap-1.5">
            {PACES.map((p) => <button key={p.v} onClick={() => setPace(p.v)} className="min-h-11 rounded-xl text-sm font-semibold" style={pace === p.v ? on : soft}>{p.label}</button>)}
          </div>
          <p className="mt-2 text-sm" aria-live="polite">
            {remaining.length === 0 ? "Choose what to memorize." : <>About <b>{days} day{days === 1 ? "" : "s"}</b> · finish around <b>{finish.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</b></>}
          </p>
          <p className="text-xs" style={muted}>Based on the real 15-line mushaf ({countLines(remaining)} lines to go).</p>
        </div>
        <button disabled={!goalKeys.length} onClick={() => { saveGoal(); setStep("known"); }} className="min-h-12 w-full rounded-full text-sm font-semibold disabled:opacity-50" style={on}>Continue</button>
      </section>
    );

  if (step === "known") return <KnownStep chapters={chapters} known={known} toggle={toggle} setKnown={setKnown} pages={checkedPages.length} name={name} Steps={<Steps i={1} />}
    onBack={() => setStep("goal")}
    onNext={() => { saveGoal(); if (checkedPages.length) setStep("test"); else finishSeeding([]); }} />;

  if (step === "test")
    return (
      <PlacementTest
        key={results.length}
        steps={<Steps i={2} />}
        page={samples[results.length]}
        keys={pageKeys[samples[results.length]] ?? []}
        index={results.length}
        total={samples.length}
        name={name}
        onSkipTest={() => finishSeeding(results)}
        onGrade={(r) => {
          const next = [...results, r];
          setResults(next);
          if (next.length >= samples.length) finishSeeding(next);
        }}
      />
    );

  const lines = pace === 0 ? "1 new page" : `${pace} new lines`;
  return (
    <section className="glass-card space-y-4 p-5 text-center" style={card}>
      <Steps i={3} />
      <h2 className="text-2xl font-semibold">You're all set</h2>
      {summary && summary.ok + summary.work > 0 ? (
        <p className="text-base">You know <b>{summary.ok} page{summary.ok === 1 ? "" : "s"}</b>, <b>{summary.work}</b> need work.</p>
      ) : (
        <p className="text-base">Starting fresh. Every ayah you learn will be scheduled for you.</p>
      )}
      <div className="rounded-2xl p-4 text-sm" style={soft}>
        Daily load: about <b>{summary?.review ?? 0} page{summary?.review === 1 ? "" : "s"} review</b> + <b>{lines}</b>
      </div>
      <button onClick={() => onDone(remaining[0] ?? null)} className="min-h-12 w-full rounded-full text-sm font-semibold" style={on}>Start today's session</button>
    </section>
  );
}

function KnownStep({ chapters, known, toggle, setKnown, pages, name, Steps, onBack, onNext }: {
  chapters: MChapter[]; known: Set<string>; toggle: (k: string[]) => void; setKnown: React.Dispatch<React.SetStateAction<Set<string>>>;
  pages: number; name: (c: number) => string; Steps: React.ReactNode; onBack: () => void; onNext: () => void;
}) {
  const [tab, setTab] = useState<"juz" | "surah" | "page">("juz");
  const [part, setPart] = useState<number | null>(null);
  const [range, setRange] = useState({ a: 1, b: 1 });
  const has = (keys: string[]) => keys.length > 0 && keys.every((k) => known.has(k));
  const some = (keys: string[]) => keys.some((k) => known.has(k));
  const juzKeys = useMemo(() => Array.from({ length: 30 }, (_, i) => ayahsOfJuz(i + 1)), []);
  const pageKeys = useMemo(() => Array.from({ length: 604 }, (_, i) => ayahsOfPage(i + 1)), []);
  const cell = (full: boolean, partial: boolean) => (full ? on : partial ? { ...soft, borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1.5px var(--accent)" } : soft);

  return (
    <section className="glass-card space-y-4 p-5" style={card}>
      {Steps}
      <h2 className="text-xl font-semibold">What have you already memorized?</h2>
      <p className="text-sm" style={muted}>Check what you know. A short test next sets how strong each page starts.</p>
      <div className="grid grid-cols-3 gap-1.5 rounded-full p-1" style={soft}>
        {(["juz", "surah", "page"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className="min-h-10 rounded-full text-sm font-semibold capitalize" style={tab === t ? on : {}}>{t}</button>)}
      </div>

      {tab === "juz" && (
        <div className="grid grid-cols-5 gap-1.5">
          {juzKeys.map((k, i) => <button key={i} onClick={() => toggle(k)} aria-pressed={has(k)} className="min-h-12 rounded-xl text-sm font-semibold" style={cell(has(k), some(k))}>{i + 1}</button>)}
        </div>
      )}
      {tab === "surah" && (
        <div className="max-h-80 space-y-1 overflow-y-auto rounded-xl p-2" style={soft}>
          {chapters.map((c) => {
            const keys = surahAyahs(c.id);
            return (
              <div key={c.id}>
                <div className="flex min-h-11 items-center gap-3 px-2 text-sm">
                  <input type="checkbox" checked={has(keys)} ref={(el) => { if (el) el.indeterminate = !has(keys) && some(keys); }} onChange={() => toggle(keys)} aria-label={c.name} />
                  <span className="flex-1">{c.id}. {c.name}</span>
                  <button onClick={() => { setPart(part === c.id ? null : c.id); setRange({ a: 1, b: c.verses }); }} className="min-h-9 rounded-full px-3 text-xs font-semibold" style={soft}>Part</button>
                </div>
                {part === c.id && (
                  <div className="flex items-center gap-2 px-2 pb-2 text-sm">
                    Ayah
                    <input type="number" min={1} max={c.verses} value={range.a} onChange={(e) => setRange({ ...range, a: +e.target.value || 1 })} className="min-h-10 w-16 rounded-lg px-2" style={{ ...soft, color: "var(--foreground)" }} aria-label="From ayah" />
                    to
                    <input type="number" min={1} max={c.verses} value={range.b} onChange={(e) => setRange({ ...range, b: +e.target.value || 1 })} className="min-h-10 w-16 rounded-lg px-2" style={{ ...soft, color: "var(--foreground)" }} aria-label="To ayah" />
                    <button
                      onClick={() => { setKnown((s) => { const n = new Set([...s].filter((k) => !k.startsWith(`${c.id}:`))); for (const k of surahAyahs(c.id, Math.min(range.a, range.b), Math.max(range.a, range.b))) n.add(k); return n; }); setPart(null); }}
                      className="min-h-10 rounded-full px-3 text-xs font-semibold" style={on}
                    >Set</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {tab === "page" && (
        <div className="grid max-h-80 grid-cols-6 gap-1.5 overflow-y-auto rounded-xl p-2" style={soft}>
          {pageKeys.map((k, i) => <button key={i} onClick={() => toggle(k)} aria-pressed={has(k)} className="min-h-11 rounded-lg text-xs font-semibold" style={cell(has(k), some(k))}>{i + 1}</button>)}
        </div>
      )}

      <p className="text-sm">{known.size ? <>{pages} page{pages === 1 ? "" : "s"} · {known.size} ayahs checked</> : <span style={muted}>Nothing yet? That's fine, tap Continue.</span>}</p>
      {part === null && known.size > 0 && tab === "surah" && <p className="text-xs" style={muted}>Partly memorized surahs: tap Part to set an ayah range.</p>}
      <div className="grid grid-cols-[auto_1fr] gap-2">
        <button onClick={onBack} className="min-h-12 rounded-full px-5 text-sm font-semibold" style={soft}>Back</button>
        <button onClick={onNext} className="min-h-12 rounded-full text-sm font-semibold" style={on}>{known.size ? "Continue to quick test" : "Continue"}</button>
      </div>
    </section>
  );
}

function PlacementTest({ steps, page, keys, index, total, name, onGrade, onSkipTest }: {
  steps: React.ReactNode; page: number; keys: string[]; index: number; total: number; name: (c: number) => string;
  onGrade: (r: Result) => void; onSkipTest: () => void;
}) {
  const [words, setWords] = useState<MWord[] | null>(null);
  const [err, setErr] = useState("");
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  useEffect(() => { hifzPage(page).then(setWords).catch(() => setErr("Connect to the internet to load this page.")); }, [page]);

  const mine = new Set(keys);
  const wid = (w: MWord) => `${w.key}:${w.pos}`;
  const cue = words?.find((w) => mine.has(w.key) && !w.end);
  const rows = words ? pageLines(words, page).filter((l) => l.words.some((w) => mine.has(w.key))) : [];
  const [c, a] = (keys[0] ?? "1:1").split(":");

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
  }, [rows.length, words]);

  const cls = "arabic shrink-0 px-[0.15em] leading-[1.9]";
  const word = (w: MWord) => {
    const id = wid(w);
    if (!mine.has(w.key)) return <span key={id} aria-hidden className={cls} style={{ opacity: 0.28, filter: "blur(1.2px)" }}>{w.text}</span>;
    if (w.end) return <span key={id} className="arabic mx-[0.1em] inline-flex h-[1.5em] min-w-[1.5em] shrink-0 items-center justify-center rounded-full text-[0.65em]" style={{ border: "1.5px solid var(--accent)", color: "var(--accent)" }}>{w.text}</span>;
    if (checking) {
      const bad = errors.has(id);
      return (
        <button key={id} onClick={() => setErrors((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; })} aria-pressed={bad} className={`${cls} min-h-12 rounded-lg`}
          style={bad ? { background: "color-mix(in oklab, var(--destructive) 18%, transparent)", color: "var(--destructive)", textDecoration: "underline" } : {}}>{w.text}</button>
      );
    }
    if (cue && id === wid(cue)) return <span key={id} className={cls} style={{ color: "var(--accent)" }}>{w.text}</span>;
    return <span key={id} aria-hidden className={cls}><span style={{ visibility: "hidden" }}>{w.text}</span></span>;
  };

  return (
    <>
      <section className="glass-card space-y-3 p-5" style={card}>
        {steps}
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Quick check</h2>
          <span className="text-sm" style={muted}>{index + 1} of {total}</span>
        </div>
        <p className="text-sm" style={muted}>
          <Lightbulb size={14} className="mr-1 inline" />
          {checking ? "Tap any word you got wrong, then grade yourself." : <>Continue from here: {name(+c)}, ayah {a} (page {page}). Recite aloud, then reveal.</>}
        </p>
      </section>
      <section className="glass-card px-2 py-4" style={card}>
        {err ? <p className="p-3 text-sm" style={muted}>{err}</p> : !words ? <p className="p-3 text-sm" style={muted}>Loading page…</p> : (
          <div ref={fitRef} dir="rtl" lang="ar">
            {rows.map((l) => (
              <div key={l.id} data-line={l.line} className="flex flex-nowrap items-center justify-center whitespace-nowrap" style={{ minHeight: 56, borderBottom: "1px solid color-mix(in oklab, var(--border) 90%, transparent)" }}>
                {l.words.map(word)}
              </div>
            ))}
          </div>
        )}
        <p className="mt-2 px-2 text-[11px]" style={muted}>Page {page} · Madani 15-line</p>
      </section>
      <section className="glass-card space-y-3 p-4" style={card}>
        {!checking ? (
          <button disabled={!words} onClick={() => setChecking(true)} className="min-h-12 w-full rounded-full text-sm font-semibold disabled:opacity-50" style={on}>Reveal and check</button>
        ) : (
          <>
            <div className="grid grid-cols-4 gap-1.5">
              {GRADES.map((g) => (
                <button key={g.g} onClick={() => { buzz(); onGrade({ page, grade: g.g, errorWords: [...errors] }); }} className="min-h-12 rounded-xl text-[12px] font-semibold" style={g.g === "perfect" ? on : soft}>{g.label}</button>
              ))}
            </div>
            <p className="text-xs" style={muted}>{errors.size} word{errors.size === 1 ? "" : "s"} marked wrong</p>
          </>
        )}
        <button onClick={onSkipTest} className="min-h-11 w-full text-sm underline" style={muted}>Skip the rest of the test</button>
      </section>
    </>
  );
}
