/**
 * Arabic Companion (v2): home, placement and settings. All curriculum, scoring and review logic
 * lives in src/lib/arabic — this screen only renders engine data and calls engine functions.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, Lock, Settings2 } from "lucide-react";
import {
  LESSONS, LESSON, VOCAB_PLAN, PLACEMENT_INTRO, PLACEMENT_LETTERS, PLACEMENT_SYLLABLES, PLACEMENT_WORDS,
  nextPart, startDay, applyPlacement, today as todayPlan, lessonSteps, vocabSteps, lessonStatus,
  understandOpen, overview, fatihaMeter, knownAfter, recordAnswer, finishLesson, finishVocabDay,
  newMilestones, loadState, saveState, localDay, letterSoundAudio, LETTER, LETTERS, LOOKALIKES, SOUNDALIKES,
  startSay, wordKeyPhonemes, quranWordAudio,
  type ArabicState, type LearnerType, type Step, type Milestone, type PlacementAnswers,
} from "@/lib/arabic";
import { useHifzBeta } from "@/lib/hifz-beta";
import { configureHifzFeedback, play } from "@/lib/hifzHaptics";
import { ArabicPlayer, type StepAnswer } from "@/components/arabic/ArabicPlayer";
import { ArabicMilestone } from "@/components/arabic/ArabicMilestone";
import { ListenButton, MicButton, useAudio } from "@/components/arabic/parts";
import "@/components/arabic/arabic.css";

export const Route = createFileRoute("/app/arabic")({
  head: () => ({
    meta: [
      { title: "Arabic Companion, Sahih Al-Adhkar" },
      { name: "description", content: "Learn to read the Quran in Arabic, step by step, with real recitation and review." },
      { property: "og:title", content: "Arabic Companion, Sahih Al-Adhkar" },
      { property: "og:description", content: "Read the Quran, then understand it — letter by letter, word by word." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HiddenArabicCompanion,
});

const ar = { fontFamily: "var(--font-arabic)" };

function HiddenArabicCompanion() {
  const { enabled, checked } = useHifzBeta();
  const navigate = useNavigate();
  useEffect(() => { if (checked && !enabled) void navigate({ to: "/app/more", replace: true }); }, [checked, enabled, navigate]);
  return enabled ? <ArabicHome /> : null;
}

type Session =
  | { kind: "lesson"; title: string; steps: Step[]; lessonId: string }
  | { kind: "vocab"; title: string; steps: Step[]; dayNo: number }
  | { kind: "review"; title: string; steps: Step[] };

function ArabicHome() {
  const day = localDay();
  const [state, setState] = useState<ArabicState>(() => loadState(day));
  const [session, setSession] = useState<Session | null>(null);
  const [result, setResult] = useState<{ passed: boolean; score: number; label: string; unlocked?: string; fatihaGrew: boolean } | null>(null);
  const [milestone, setMilestone] = useState<Milestone | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => { configureHifzFeedback({ sounds: state.settings.sounds }); }, [state.settings.sounds]);

  const plan = useMemo(() => todayPlan(state, day), [state, day]);
  const ov = useMemo(() => overview(state, day), [state, day]);
  const meter = useMemo(() => fatihaMeter(knownAfter(ov.readingDay)), [ov.readingDay]);
  const needsPlacement = !state.placement && Object.keys(state.passed).length === 0;

  const update = (fn: (s: ArabicState) => void) => {
    const s = { ...state };
    fn(s);
    saveState(s);
    setState(s);
  };

  const start = () => {
    const steps: Step[] = [...plan.reviewSteps];
    if (plan.lesson) {
      setSession({ kind: "lesson", title: plan.lesson.title, steps: [...steps, ...lessonSteps(plan.lesson, state, day)], lessonId: plan.lesson.id });
    } else if (plan.vocabDay) {
      setSession({ kind: "vocab", title: `Day ${plan.vocabDay.day}: ${plan.vocabDay.theme}`, steps: [...steps, ...vocabSteps(plan.vocabDay, state, day)], dayNo: plan.vocabDay.day });
    } else if (steps.length) {
      setSession({ kind: "review", title: "Review", steps });
    }
  };
  const openLesson = (lessonId: string) => {
    const lesson = LESSON.get(lessonId);
    if (lesson) setSession({ kind: "lesson", title: lesson.title, steps: lessonSteps(lesson, state, day), lessonId });
  };

  const onAnswer = (step: Step, a: StepAnswer) => {
    if (!("itemId" in step)) return;
    update((s) => recordAnswer(s, step.itemId as string, a, day, a.picked));
  };

  const onDone = (score: number, minutes: number) => {
    if (!session) return;
    const before = meter.readable;
    let passed = true;
    let unlocked: string | undefined;
    let label = "Review done";
    if (session.kind === "lesson") {
      const f = finishLesson(state, session.lessonId, score, minutes, day);
      passed = f.passed; unlocked = f.unlocked;
      label = `${LESSON.get(session.lessonId)?.title ?? "Lesson"}`;
    } else if (session.kind === "vocab") {
      const f = finishVocabDay(state, session.dayNo, score, minutes, day);
      passed = f.passed; unlocked = f.unlocked;
      label = `Day ${session.dayNo}`;
    } else {
      state.days[day] = (state.days[day] ?? 0) + minutes;
    }
    const found = newMilestones(state, day);
    saveState(state);
    setState({ ...state });
    setSession(null);
    const after = fatihaMeter(knownAfter(overview(state, day).readingDay)).readable;
    setResult({ passed, score, label, unlocked, fatihaGrew: after > before });
    if (found.length) setMilestone(found[0]);
  };

  if (needsPlacement) return <Placement state={state} onDone={(s) => { saveState(s); setState({ ...s }); }} />;

  return (
    <div className="ab-page">
      <div className="ab-header">
        <Link to="/app/more" className="ab-icon-btn" aria-label="Back"><ChevronLeft size={22} /></Link>
        <h1>Arabic Companion</h1>
        <span className="ab-beta">Beta</span>
        <button className="ab-icon-btn" aria-label="Settings" onClick={() => setSettingsOpen(true)}><Settings2 size={19} /></button>
      </div>

      <section className="ab-card">
        <div className="ab-glow" />
        <p className="ab-today-title">Today</p>
        <p className="ab-today-main">
          {plan.lesson ? `Lesson ${plan.lesson.day}: ${plan.lesson.title}` : plan.vocabDay ? `Understand · Day ${plan.vocabDay.day}` : plan.reviews.length ? "Review day" : "All done for today"}
        </p>
        <p className="ab-today-sub">{plan.minutes} min{plan.reviews.length ? ` · ${plan.reviews.length} reviews due` : ""}</p>
        {(plan.lesson || plan.vocabDay || plan.reviews.length > 0) && (
          <button className="ab-start" onClick={start}>{plan.doneToday ? "Practise again" : "Start"}</button>
        )}
      </section>

      <section className="ab-card">
        <p className="ab-today-title">Al-Fatiha</p>
        <div className="ab-meter">
          {meter.words.map((w) => <span key={w.key} className={`ab-meter-word ${w.ok ? "" : "ab-dim"}`}>{w.text}</span>)}
        </div>
        <p className="ab-today-sub">You can read {meter.readable} of {meter.total} words of Al-Fatiha</p>
        <div className="ab-stats">
          <div className="ab-stat"><b>{ov.lettersKnown}</b><small>letters known</small></div>
          <div className="ab-stat"><b>{ov.wordsKnown}</b><small>words · ≈{Math.round(ov.quranCoverage * 100)}% of the Quran</small></div>
          <div className="ab-stat"><b>{ov.streak}</b><small>day streak</small></div>
        </div>
      </section>

      <p className="ab-section-title">Read · 30 lessons</p>
      <div className="ab-path">
        {LESSONS.map((l) => {
          const st = lessonStatus(state, l);
          const isNext = plan.lesson?.id === l.id;
          return (
            <button key={l.id} disabled={st === "locked"} onClick={() => openLesson(l.id)} className={`ab-lesson ${isNext ? "ab-next" : ""}`}>
              <span className={`ab-dot ${st === "passed" ? "ab-passed" : st === "open" ? "ab-open" : ""}`}>{st === "passed" && <Check size={9} strokeWidth={4} />}</span>
              <span className="ab-lesson-main">
                <b>{l.day}. {l.title}</b>
                <small>{st === "passed" ? "Passed — tap to revisit" : st === "locked" ? "Unlocks after the lesson above" : l.goal}</small>
              </span>
              {st === "locked" && <Lock size={14} style={{ color: "var(--muted-foreground)" }} />}
            </button>
          );
        })}
      </div>

      <p className="ab-section-title">Understand · 60 days</p>
      {!understandOpen(state) && <p className="ab-today-sub" style={{ marginBottom: ".5rem" }}>Opens after lesson 26</p>}
      <div className="ab-path">
        {VOCAB_PLAN().map((d) => {
          const done = !!state.vocabDone[d.day];
          const open = understandOpen(state);
          return (
            <button key={d.day} disabled={!open} className="ab-lesson" onClick={() => open && setSession({ kind: "vocab", title: `Day ${d.day}: ${d.theme}`, steps: vocabSteps(d, state, day), dayNo: d.day })}>
              <span className={`ab-dot ${done ? "ab-passed" : open ? "ab-open" : ""}`}>{done && <Check size={9} strokeWidth={4} />}</span>
              <span className="ab-lesson-main">
                <b>Day {d.day}: {d.theme}</b>
                <small>{done ? "Learned — tap to revisit" : open ? `${d.words.length} words` : "Locked"}</small>
              </span>
              {!open && <Lock size={14} style={{ color: "var(--muted-foreground)" }} />}
            </button>
          );
        })}
      </div>

      <p className="ab-teacher-line">
        Learning from a teacher is the way the Quran has always been passed on. Use this alongside a teacher or masjid class when you can.
      </p>

      {session && (
        <ArabicPlayer
          title={session.title}
          steps={session.steps}
          state={state}
          onAnswer={onAnswer}
          onDone={onDone}
          onExit={() => setSession(null)}
        />
      )}

      {result && !milestone && (
        <div className="ab-dialog" role="dialog" aria-modal="true">
          <div className="ab-dialog-inner">
            <div className="ab-result-ring" style={{ margin: "0 auto 1rem" }}>{Math.round(result.score * 100)}%</div>
            <h3>{result.passed ? `${result.label} passed` : "Almost!"}</h3>
            <p>
              {result.passed
                ? `${result.unlocked ? "The next step is open. " : ""}${result.fatihaGrew ? "You can read more of Al-Fatiha now. " : ""}What you learned will come back for quick reviews.`
                : `${Math.round(result.score * 100)}%. Practise again now or tomorrow — no penalty.`}
            </p>
            <div className="ab-dialog-actions">
              {!result.passed && <button onClick={() => { setResult(null); start(); }}>Practise again</button>}
              <button className="ab-danger" onClick={() => setResult(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
      {milestone && <ArabicMilestone milestone={milestone} done={() => setMilestone(null)} />}

      {settingsOpen && (
        <div className="ab-sheet" onClick={(e) => { if (e.target === e.currentTarget) setSettingsOpen(false); }}>
          <div className="ab-sheet-inner">
            <h2>Arabic Companion settings</h2>
            <div className="ab-setting-row">
              <span>Daily minutes</span>
              <span className="ab-segments">
                {([10, 15, 20, 30] as const).map((m) => (
                  <button key={m} className={state.settings.dailyMinutes === m ? "ab-on" : ""} onClick={() => update((s) => { s.settings.dailyMinutes = m; })}>{m}</button>
                ))}
              </span>
            </div>
            <div className="ab-setting-row">
              <span>Kid mode<small>A parent should listen along: the AI is less reliable for children under 12</small></span>
              <input type="checkbox" checked={state.settings.kidMode} onChange={(e) => update((s) => { s.settings.kidMode = e.target.checked; })} />
            </div>
            <div className="ab-setting-row">
              <span>Sounds<small>Off by default; vibrations stay on</small></span>
              <input type="checkbox" checked={state.settings.sounds} onChange={(e) => update((s) => { s.settings.sounds = e.target.checked; })} />
            </div>
            <div className="ab-setting-row">
              <span>Show meanings of words I know in the Quran reader</span>
              <input type="checkbox" checked={state.settings.showMeanings} onChange={(e) => update((s) => { s.settings.showMeanings = e.target.checked; })} />
            </div>
            <button className="ab-link-btn" onClick={() => { update((s) => { delete s.placement; }); setSettingsOpen(false); }}>Redo placement test</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- placement ----------

function Placement({ state, onDone }: { state: ArabicState; onDone: (s: ArabicState) => void }) {
  const day = localDay();
  const [answers, setAnswers] = useState<PlacementAnswers | null>(null);
  const [finished, setFinished] = useState<number | null>(null);

  if (finished !== null) {
    const lesson = LESSONS.find((l) => l.day === finished);
    return (
      <div className="ab-page" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div className="ab-card" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
          <div className="ab-glow" />
          <p className="ab-today-title">You're ready</p>
          <p className="ab-today-main" style={{ fontSize: "1.2rem" }}>You start at lesson {finished}: {lesson?.title}</p>
          <p className="ab-today-sub">You can open earlier lessons anytime.</p>
          <button className="ab-start" onClick={() => onDone(state)}>Start learning</button>
        </div>
      </div>
    );
  }

  if (!answers) {
    return (
      <div className="ab-page" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <p className="ab-step-label" style={{ textAlign: "center" }}>Arabic Companion</p>
        <h1 style={{ textAlign: "center", fontSize: "1.4rem", fontWeight: 600, marginBottom: "1.5rem" }}>Where should you start?</h1>
        {PLACEMENT_INTRO.map((o) => (
          <button key={o.id} className="ab-card" style={{ width: "100%", textAlign: "left", cursor: "pointer", color: "inherit" }}
            onClick={() => setAnswers({ learner: o.id })}>
            <b style={{ display: "block", fontSize: "1rem" }}>{o.label}</b>
            <small style={{ color: "var(--muted-foreground)" }}>{o.hint}</small>
          </button>
        ))}
        <button className="ab-link-btn" style={{ alignSelf: "center" }}
          onClick={() => { const start = applyPlacement(state, { learner: "beginner" }, day); setFinished(start); }}>
          Skip, start from the first letter
        </button>
      </div>
    );
  }

  const part = nextPart(answers);
  if (part === "done") {
    const start = applyPlacement(state, answers, day);
    play("sessionComplete");
    setFinished(start);
    return null;
  }
  return <PlacementPart key={part} part={part} answers={answers} onPart={(n) => setAnswers({ ...answers, [part]: n })} />;
}

function PlacementPart({ part, answers, onPart }: { part: "letters" | "syllables" | "words"; answers: PlacementAnswers; onPart: (right: number) => void }) {
  const [i, setI] = useState(0);
  const right = useRef(0);
  const items = part === "letters" ? PLACEMENT_LETTERS : part === "syllables" ? PLACEMENT_SYLLABLES : PLACEMENT_WORDS;
  const advance = (ok: boolean) => {
    if (ok) right.current++;
    if (i + 1 < items.length) setI(i + 1);
    else onPart(right.current);
  };
  if (part === "letters") return <PlacementLetter letter={PLACEMENT_LETTERS[i]} index={i} total={items.length} onAnswer={advance} />;
  if (part === "syllables") return <PlacementSay text={PLACEMENT_SYLLABLES[i]} index={i} total={items.length} onAnswer={advance} />;
  const w = PLACEMENT_WORDS[i];
  return <PlacementSay text={w.text} wordKey={w.key} index={i} total={items.length} onAnswer={advance} />;
}

function PlacementLetter({ letter, index, total, onAnswer }: { letter: string; index: number; total: number; onAnswer: (ok: boolean) => void }) {
  const l = LETTER.get(letter)!;
  const sound = letterSoundAudio(letter);
  const { play: playAudio } = useAudio();
  const [picked, setPicked] = useState<string | null>(null);
  const choices = useMemo(() => {
    const alikes = [...LOOKALIKES, ...SOUNDALIKES].filter((p) => p.includes(letter)).map((p) => (p[0] === letter ? p[1] : p[0]));
    const pool = [...new Set([...alikes, ...LETTERS.map((x) => x.ar)])].filter((x) => x !== letter);
    return [letter, ...pool.slice(0, 3)].sort(() => 0.5 - Math.random());
  }, [letter]);
  useEffect(() => { const t = setTimeout(() => playAudio(sound ?? l.example?.audio), 400); return () => clearTimeout(t); }, [letter]);
  return (
    <div className="ab-page" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <p className="ab-step-label" style={{ textAlign: "center" }}>Placement · {index + 1} of {total}</p>
      <h2 style={{ textAlign: "center", fontSize: "1.15rem", fontWeight: 600 }}>{sound ? "Which letter makes this sound?" : "Which letter does this word start with?"}</h2>
      <div style={{ display: "flex", justifyContent: "center", margin: "1rem 0" }}>
        <ListenButton url={sound ?? l.example?.audio} label="Replay" />
      </div>
      {!sound && l.example && <p dir="rtl" style={{ ...ar, textAlign: "center", fontSize: "2rem" }}>{l.example.ar}</p>}
      <div className="ab-choices" dir="rtl" style={{ alignSelf: "center" }}>
        {choices.map((c) => {
          const tone = picked ? (c === letter ? "ab-right" : c === picked ? "ab-wrong" : "ab-faded") : "";
          return <button key={c} disabled={!!picked} className={`ab-choice ${tone}`} onClick={() => { setPicked(c); setTimeout(() => onAnswer(c === letter), 600); }}><span style={ar}>{c}</span></button>;
        })}
      </div>
    </div>
  );
}

function PlacementSay({ text, wordKey, index, total, onAnswer }: { text: string; wordKey?: string; index: number; total: number; onAnswer: (ok: boolean) => void }) {
  const [keyPhonemes, setKeyPhonemes] = useState<string | undefined>();
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [level, setLevel] = useState(0);
  const session = useRef<{ stop(): void; cancel(): void } | null>(null);
  useEffect(() => { if (wordKey) void wordKeyPhonemes(wordKey).then(setKeyPhonemes); }, [wordKey]);
  useEffect(() => () => session.current?.cancel(), []);
  const start = async () => {
    setBusy(true);
    try {
      const s = await startSay({ text, keyPhonemes, onLevel: setLevel });
      session.current = s;
      setListening(true); setBusy(false);
      const r = await s.result;
      onAnswer(r.verdict === "correct" || r.verdict === "close");
    } catch {
      onAnswer(false);
    } finally { setListening(false); setBusy(false); session.current = null; }
  };
  return (
    <div className="ab-page" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
      <p className="ab-step-label">Placement · {index + 1} of {total}</p>
      <h2 style={{ fontSize: "1.15rem", fontWeight: 600 }}>Read this aloud</h2>
      <p dir="rtl" className="ab-big-text">{text}</p>
      {wordKey && <ListenButton url={quranWordAudio(wordKey)} label="Hear it first" />}
      <MicButton listening={listening} busy={busy} level={level} onTap={() => (listening ? session.current?.stop() : void start())} />
      <button className="ab-link-btn" onClick={() => onAnswer(false)}>I can't read this yet</button>
    </div>
  );
}
