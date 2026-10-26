// Hifz onboarding: goal + pace, already-memorized check-off, placement test, summary.
// Seeding is written only as review-log events (placement + seed), never as direct state.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Lightbulb } from "lucide-react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { getDisplay } from "@/lib/theme";
import { hifzPage, pageLines, type MChapter, type MWord } from "@/lib/hifz/mushaf";
import { ayahsOfJuz, ayahsOfPage, countLines, daysToFinish, goalAyahs, pageOfAyah, remainingGoal, surahAyahs, surahLength, type Goal } from "@/lib/hifz/layout";
import { groupByPage, inheritGrades, samplePages, seedPlan } from "@/lib/hifz/placement";
import { loadHifz, recordEvents, savePlan } from "@/lib/hifz/store";
import { forecast, type DayLoad } from "@/lib/hifz/session";
import { addDays, capGrade, localDay, type Grade } from "@/lib/hifz/scheduler";

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
  const [summary, setSummary] = useState<{ ok: number; work: number; week: DayLoad[] } | null>(null);

  const goal: Goal =
    goalType === "surahs" ? { type: "surahs", surahs }
    : goalType === "whole" ? { type: "whole", direction }
    : goalType === "custom" ? { type: "custom", from: `${from.c}:${from.a}`, to: `${to.c}:${to.a}` }
    : { type: "juz-amma" };
  const goalKeys = useMemo(() => goalAyahs(goal), [JSON.stringify(goal)]); // eslint-disable-line react-hooks/exhaustive-deps
  // Recomputed whenever the goal or what they know changes; known ayahs never count.
  const remaining = remainingGoal(goalKeys, known);
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
    // Simulated day by day assuming Perfect grades, including repeat sabqi reviews and reviews of each day's new lines.
    setSummary({
      week: forecast(loadHifz().events, localDay(new Date()), goal, pace, 7),
      ok: plan.filter((s) => s.grade === "perfect" || s.grade === "hesitation").length,
      work: plan.filter((s) => s.grade === "mistake" || s.grade === "blank").length,
    });
    setStep("finish");
  }

  function saveGoal() {
    savePlan({ targets: goalKeys.slice(0, 1), dailyNewAyahs: 0, direction: goal.type === "whole" ? direction : "backward", updatedAt: new Date().toISOString(), goal, paceLines: pace });
  }

  const fullyKnown = goalKeys.length > 0 && remaining.length === 0;
  const estimate = fullyKnown ? (
    <div className="rounded-xl p-3 text-sm" style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)" }}>
      You already know this whole goal. Pick a new goal to keep going.
      <button onClick={() => setStep("goal")} className="mt-2 min-h-11 w-full rounded-full font-semibold" style={on}>Pick a new goal</button>
    </div>
  ) : (
    <>
      <p className="text-sm" aria-live="polite">
        {remaining.length === 0 ? "Choose what to memorize." : <>About <b>{days} day{days === 1 ? "" : "s"}</b> · finish around <b>{finish.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</b></>}
      </p>
      <p className="text-xs" style={muted}>{countLines(remaining)} lines left to memorize in the real 15-line mushaf{known.size ? ", not counting what you know" : ""}.</p>
    </>
  );

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
          <div className="mt-2">{estimate}</div>
        </div>
        <button disabled={!goalKeys.length} onClick={() => { saveGoal(); setStep("known"); }} className="min-h-12 w-full rounded-full text-sm font-semibold disabled:opacity-50" style={on}>Continue</button>
      </section>
    );

  if (step === "known") return <KnownStep ammaOnly={goalType === "juz-amma"} estimate={estimate} chapters={chapters} known={known} toggle={toggle} setKnown={setKnown} pages={checkedPages.length} name={name} Steps={<Steps i={1} />}
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

  return (
    <section className="glass-card space-y-4 p-5 text-center" style={card}>
      <Steps i={3} />
      <h2 className="text-2xl font-semibold">You're all set</h2>
      {summary && summary.ok + summary.work > 0 ? (
        <p className="text-base">You know <b>{summary.ok} page{summary.ok === 1 ? "" : "s"}</b>, <b>{summary.work}</b> need work.</p>
      ) : (
        <p className="text-base">Starting fresh. Every ayah you learn will be scheduled for you.</p>
      )}
      <div className="space-y-1 rounded-2xl p-4 text-left text-sm" style={soft}>
        <div className="label-caps mb-1">Your first week</div>
        {(summary?.week ?? []).map((w, i) => (
          <div key={w.day} className="py-0.5">
            <div className="flex justify-between gap-2"><span>Day {i + 1}</span><span><b>{w.total}</b> page{w.total === 1 ? "" : "s"} review{w.newLines ? <> + <b>{pace === 0 ? "1 page" : `${w.newLines} lines`}</b> new</> : ""}</span></div>
            {w.total > 0 && <div className="text-right text-[11px]" style={muted}>{[w.manzil && `${w.manzil} manzil`, w.sabqi && `${w.sabqi} sabqi`, w.hesitationSeed && `${w.hesitationSeed} Hesitation seed`].filter(Boolean).join(" · ")}</div>}
          </div>
        ))}
      </div>
      {fullyKnown ? estimate : <button onClick={() => onDone(remaining[0] ?? null)} className="min-h-12 w-full rounded-full text-sm font-semibold" style={on}>Start today's session</button>}
    </section>
  );
}

function KnownStep({ estimate, chapters, known, toggle, setKnown, pages, name, Steps, onBack, onNext, ammaOnly }: {
  estimate: React.ReactNode; chapters: MChapter[]; known: Set<string>; toggle: (k: string[]) => void; setKnown: React.Dispatch<React.SetStateAction<Set<string>>>;
  pages: number; name: (c: number) => string; Steps: React.ReactNode; onBack: () => void; onNext: () => void; ammaOnly: boolean;
}) {
  const [tab, setTab] = useState<"juz" | "surah" | "page">(ammaOnly ? "surah" : "juz");
  const [part, setPart] = useState<number | null>(null);
  const [range, setRange] = useState({ a: 1, b: 1 });
  const has = (keys: string[]) => keys.length > 0 && keys.every((k) => known.has(k));
  const some = (keys: string[]) => keys.some((k) => known.has(k));
  const juzKeys = useMemo(() => Array.from({ length: 30 }, (_, i) => ayahsOfJuz(i + 1)), []);
  const pageKeys = useMemo(() => Array.from({ length: 604 }, (_, i) => ayahsOfPage(i + 1)), []);
  const cell = (full: boolean, partial: boolean) => (full ? on : partial ? { ...soft, borderColor: "var(--accent)", boxShadow: "inset 0 0 0 1.5px var(--accent)" } : soft);
  // Juz 'Amma goal: only its surahs, An-Nas first, so nobody has to know juz or surah numbers.
  const list = ammaOnly ? chapters.filter((c) => c.id >= 78).sort((a, b) => b.id - a.id) : chapters;
  const lastTen = useMemo(() => Array.from({ length: 10 }, (_, i) => surahAyahs(105 + i)).flat(), []);
  const juzName = (j: number) => { const k = juzKeys[j - 1]?.[0]; return k ? name(+k.split(":")[0]) : ""; };

  return (
    <section className="glass-card space-y-4 p-5" style={card}>
      {Steps}
      <h2 className="text-xl font-semibold">What have you already memorized?</h2>
      <p className="text-sm" style={muted}>Tick the surahs you already know by heart. Nothing yet? Just tap Continue.</p>
      {ammaOnly ? (
        <button onClick={() => toggle(lastTen)} className="min-h-12 w-full rounded-xl text-sm font-semibold" style={cell(has(lastTen), some(lastTen))}>
          {has(lastTen) ? "✓ " : ""}I know the last 10 surahs (Al-Fil to An-Nas)
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-1.5 rounded-full p-1" style={soft}>
          {(["surah", "juz", "page"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className="min-h-10 rounded-full text-sm font-semibold capitalize" style={tab === t ? on : {}}>{t}</button>)}
        </div>
      )}

      {tab === "juz" && (
        <div className="grid grid-cols-3 gap-1.5">
          {juzKeys.map((k, i) => (
            <button key={i} onClick={() => toggle(k)} aria-pressed={has(k)} className="min-h-14 rounded-xl px-1 text-sm font-semibold leading-tight" style={cell(has(k), some(k))}>
              Juz {i + 1}<span className="block truncate text-[10px] font-normal opacity-80">starts {juzName(i + 1)}</span>
            </button>
          ))}
        </div>
      )}
      {tab === "surah" && (
        <div className="max-h-80 space-y-1 overflow-y-auto rounded-xl p-2" style={soft}>
          {list.map((c) => {
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

      <div className="rounded-xl p-3" style={soft}>{estimate}</div>
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

  // Random start ayah inside the page; recite about 3 ayahs (or to the page end). Only that span is shown and graded.
  const [startAt] = useState(() => Math.floor(Math.random() * Math.max(1, keys.length)));
  const span = keys.slice(startAt, startAt + 3);
  const mine = new Set(span);
  const wid = (w: MWord) => `${w.key}:${w.pos}`;
  const cue = words?.find((w) => mine.has(w.key) && !w.end);
  const rows = words ? pageLines(words, page).filter((l) => l.words.some((w) => mine.has(w.key))) : [];
  const [c, a] = (span[0] ?? "1:1").split(":");
  const last = span[span.length - 1]?.split(":")[1];

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
    if (!mine.has(w.key)) return <span key={id} aria-hidden className={cls} style={{ opacity: 0.3, filter: "blur(6px)", userSelect: "none" }}>{w.text}</span>;
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
          {checking ? "Tap any word you got wrong, then grade yourself." : <>Continue from here: {name(+c)}, ayah {a}{last && last !== a ? `–${last}` : ""} (page {page}). Recite aloud, then reveal.</>}
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
              {GRADES.map((g) => {
                const off = g.g === "perfect" && errors.size > 0;
                return (
                  <button key={g.g} disabled={off} onClick={() => { buzz(); onGrade({ page, grade: capGrade(g.g, false, errors.size), errorWords: [...errors] }); }} className="min-h-12 rounded-xl text-[12px] font-semibold disabled:opacity-40" style={g.g === "perfect" ? on : soft}>{g.label}</button>
                );
              })}
            </div>
            <p className="text-xs" style={muted}>{errors.size} word{errors.size === 1 ? "" : "s"} marked wrong{errors.size ? ", so the best grade is Hesitation" : ""}</p>
          </>
        )}
        <button onClick={onSkipTest} className="min-h-11 w-full text-sm underline" style={muted}>Skip the rest of the test</button>
      </section>
    </>
  );
}
