import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, Lock, Mic, Play, Square, Volume2, X, Sparkles, RotateCcw } from "lucide-react";
import { CURRICULUM, LESSONS, ITEMS, type Item, type Lesson } from "@/lib/arabic/content";
import { buildLesson, derive, dueItems, lessonStatus, scoreOf, todayLocal, type ArabicEvent, type Step } from "@/lib/arabic/engine";
import { loadLog, record } from "@/lib/arabic/store";
import type { Grade } from "@/lib/hifz/scheduler";
import { Portal } from "@/components/Portal";

export const Route = createFileRoute("/app/arabic")({
  head: () => ({
    meta: [
      { title: "Arabic Companion, Sahih Al-Adhkar" },
      { name: "description", content: "Learn to read the Quran in Arabic, step by step, with real recitation and review." },
      { property: "og:title", content: "Arabic Companion, Sahih Al-Adhkar" },
      { property: "og:description", content: "Learn to read Arabic letter by letter with a teacher-style lesson loop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ArabicCompanion,
});

const ar = { fontFamily: "var(--font-arabic)" };
const glow = { background: "radial-gradient(circle at 50% 35%, color-mix(in oklab, var(--primary) 16%, transparent), transparent 70%)" };

function ArabicCompanion() {
  const [log, setLog] = useState<ArabicEvent[]>([]);
  const [active, setActive] = useState<Lesson | null>(null);
  useEffect(() => setLog(loadLog()), []);
  const today = todayLocal();
  const d = useMemo(() => derive(log), [log]);
  const due = dueItems(d, today).length;
  const passed = LESSONS.filter((l) => d.passed.has(l.id)).length;
  const next = LESSONS.find((l) => lessonStatus(d, l.id, today) === "open");
  const pct = Math.round((passed / LESSONS.length) * 100);

  return (
    <div className="min-h-screen bg-background px-4 pb-36 pt-[max(1rem,env(safe-area-inset-top))] text-foreground">
      <div className="mb-5 flex items-center gap-2">
        <Link to="/app/more" className="rounded-full p-2 hover:bg-muted" aria-label="Back"><ChevronLeft size={22} /></Link>
        <h1 className="text-xl font-semibold">Arabic Companion</h1>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">Beta</span>
      </div>

      <section className="relative mb-5 overflow-hidden rounded-3xl border border-border bg-card p-5" style={{ boxShadow: "0 18px 40px -24px color-mix(in oklab, var(--primary) 45%, transparent)" }}>
        <div className="pointer-events-none absolute inset-0" style={glow} />
        <div className="relative flex items-center gap-4">
          <Ring pct={pct} />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Your goal</p>
            <p className="font-semibold leading-snug">Read al-Fatihah by yourself</p>
            <p className="text-xs text-muted-foreground">{passed} of {LESSONS.length} lessons mastered</p>
          </div>
        </div>
        {next && (
          <button onClick={() => setActive(next)} className="relative mt-4 flex w-full items-center justify-between rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground">
            <span className="text-left">
              <span className="block text-[11px] opacity-80">{due ? `Continue · ${due} to review first` : "Continue"}</span>
              <span className="text-sm font-medium">{next.goal}</span>
            </span>
            <span dir="rtl" className="text-2xl" style={ar}>{next.title}</span>
          </button>
        )}
      </section>

      <p className="mb-6 px-1 text-center text-xs italic leading-relaxed text-muted-foreground">
        “Learn the Sunnah and Arabic, and learn the Quran in Arabic, for it is Arabic.” — ʿUmar to Abu Musa
      </p>

      {CURRICULUM.map((lv) => (
        <section key={lv.id} className="mb-6">
          <p className="text-[11px] uppercase tracking-wider text-primary">Level {lv.id}</p>
          <h2 className="mb-3 text-lg font-semibold">{lv.title}</h2>
          <div className="relative space-y-2.5 pl-5">
            <div className="absolute bottom-4 left-[9px] top-4 w-px bg-border" />
            {lv.units.flatMap((u) => u.lessons).map((l) => {
              const st = lessonStatus(d, l.id, today);
              const isNext = next?.id === l.id;
              return (
                <button
                  key={l.id}
                  disabled={st === "locked" || st === "retry-tomorrow"}
                  onClick={() => setActive(l)}
                  className={`relative flex w-full items-center gap-3 rounded-2xl border bg-card p-3.5 text-left transition active:scale-[0.98] disabled:opacity-55 ${isNext ? "border-primary" : "border-border"}`}
                >
                  <span className={`absolute -left-[19px] flex h-4 w-4 items-center justify-center rounded-full border-2 ${st === "passed" ? "border-primary bg-primary text-primary-foreground" : isNext ? "border-primary bg-background" : "border-border bg-background"}`}>
                    {st === "passed" && <Check size={9} strokeWidth={4} />}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{l.goal}</span>
                    <span className="text-xs text-muted-foreground">
                      {st === "retry-tomorrow" ? "Back tomorrow with fresh practice" : st === "passed" ? "Mastered" : st === "locked" ? "Unlocks after the lesson above" : `${l.newItems.length} letters · about 8 min`}
                    </span>
                  </span>
                  {st === "locked" ? <Lock size={14} className="text-muted-foreground" /> : <span dir="rtl" className="text-2xl" style={ar}>{l.title}</span>}
                </button>
              );
            })}
          </div>
        </section>
      ))}
      <p className="text-center text-xs text-muted-foreground">Next: vowels, real words, tajweed and meanings.</p>

      {active && (
        <LessonRunner
          lesson={active}
          steps={buildLesson(active, d, today)}
          onExit={() => { setActive(null); setLog(loadLog()); }}
        />
      )}
    </div>
  );
}

function Ring({ pct }: { pct: number }) {
  const r = 26, c = 2 * Math.PI * r;
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--muted)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">{pct}%</span>
    </div>
  );
}

function useAudio() {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const play = (url?: string) => {
    if (!url) return;
    ref.current?.pause();
    const a = new Audio(url);
    ref.current = a;
    a.onended = () => setPlaying(false);
    setPlaying(true);
    void a.play().catch(() => setPlaying(false));
  };
  useEffect(() => () => ref.current?.pause(), []);
  return { play, playing };
}

/** The example word with its first letter highlighted. */
function ExampleWord({ text, className = "" }: { text: string; className?: string }) {
  // One run of text: splitting it into spans breaks letter joining on phones.
  return <span dir="rtl" className={className} style={ar}>{text}</span>;
}

function ListenButton({ url, label }: { url?: string; label: string }) {
  const { play, playing } = useAudio();
  if (!url) return null;
  return (
    <button onClick={() => play(url)} className="flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm text-primary-foreground shadow-sm active:scale-95">
      <Volume2 size={18} className={playing ? "animate-pulse" : ""} /> {label}
    </button>
  );
}

/** Letter sound card: the letter-alone clip when recorded, plus a real recited Quran word that starts with it. */
function LetterSound({ item }: { item: Item }) {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      {item.audio && <ListenButton url={item.audio} label="Hear the letter" />}
      {item.example ? (
        <div className="w-full rounded-2xl border border-border bg-card p-4">
          <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Hear it in the Quran</p>
          <ExampleWord text={item.example.ar} className="block text-5xl leading-loose" />
          <p className="mb-3 text-xs text-muted-foreground">{item.example.tr} · {item.example.en}</p>
          <div className="flex justify-center"><ListenButton url={item.example.audio} label="Play reciter" /></div>
        </div>
      ) : (
        !item.audio && <p className="text-xs text-muted-foreground">Alif never starts a word — you'll hear it stretching vowels in Level 2.</p>
      )}
    </div>
  );
}

type Answer = { item: Item; correct: boolean; picked?: Item; grade?: Grade; exercise: string };

function LessonRunner({ lesson, steps, onExit }: { lesson: Lesson; steps: Step[]; onExit: () => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [done, setDone] = useState<number | null>(null);
  const step = steps[i];
  const answer = (a: Answer) => setAnswers((x) => [...x, a]);
  const next = () => {
    if (i + 1 < steps.length) return setI(i + 1);
    const score = scoreOf(answers.filter((a) => a.exercise !== "review"));
    record([
      ...answers.map((a) => ({ kind: "answer" as const, lessonId: lesson.id, itemId: a.item.id, correct: a.correct, picked: a.picked?.id, grade: a.grade })),
      { kind: "lesson", lessonId: lesson.id, score },
    ]);
    setDone(score);
  };
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <Portal>
      <div className="fixed inset-0 flex flex-col bg-background text-foreground" style={{ zIndex: 300 }}>
        <div className="flex items-center gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button onClick={onExit} className="rounded-full p-2 hover:bg-muted" aria-label="Leave lesson"><X size={20} /></button>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${((done !== null ? steps.length : i) / steps.length) * 100}%` }} />
          </div>
          <span dir="rtl" className="text-lg" style={ar}>{lesson.title}</span>
        </div>
        {done !== null ? (
          <Result score={done} lesson={lesson} onExit={onExit} />
        ) : (
          <StepView key={i} step={step} onAnswer={answer} onNext={next} />
        )}
      </div>
    </Portal>
  );
}

/** Scrollable body with the main action pinned above the home indicator. */
function Screen({ label, children, action }: { label: string; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <>
      <div className="flex flex-1 flex-col items-center overflow-y-auto px-5 pb-6 pt-4 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-primary">{label}</p>
        {children}
      </div>
      <div className="border-t border-border px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">{action}</div>
    </>
  );
}

function Primary({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button disabled={disabled} onClick={onClick} className="w-full rounded-full bg-primary py-4 font-medium text-primary-foreground transition active:scale-[0.98] disabled:opacity-35">{children}</button>;
}

function BigLetter({ item }: { item: Item }) {
  return (
    <div className="relative my-3 flex h-44 w-44 items-center justify-center rounded-[2.5rem] border border-border bg-card">
      <div className="pointer-events-none absolute inset-0 rounded-[2.5rem]" style={glow} />
      <span className="relative text-8xl leading-none" style={ar}>{item.ar}</span>
    </div>
  );
}

function Result({ score, lesson, onExit }: { score: number; lesson: Lesson; onExit: () => void }) {
  const pass = score >= lesson.mastery;
  return (
    <Screen label={pass ? "Lesson mastered" : "Almost there"} action={<Primary onClick={onExit}>Back to lessons</Primary>}>
      <div className="my-6 flex h-32 w-32 items-center justify-center rounded-full border-4 border-primary text-4xl font-semibold">{Math.round(score * 100)}%</div>
      <div dir="rtl" className="mb-4 flex gap-3 text-4xl" style={ar}>{lesson.newItems.map((id) => <span key={id}>{ITEMS[id]?.ar}</span>)}</div>
      {pass ? (
        <p className="max-w-xs text-sm leading-relaxed"><Sparkles size={14} className="mr-1 inline text-primary" />You can now recognise these letters. They'll come back for a quick review so they stay with you.</p>
      ) : (
        <p className="max-w-xs text-sm leading-relaxed">
          You need {Math.round(lesson.mastery * 100)}% to move on. Tomorrow this lesson returns with different practice.
          <span className="mt-4 block rounded-2xl bg-muted p-3 text-xs text-muted-foreground">“The one who recites and finds it hard, stumbling over it, has two rewards.” — Bukhari & Muslim</span>
        </p>
      )}
    </Screen>
  );
}

function StepView({ step, onAnswer, onNext }: { step: Step; onAnswer: (a: Answer) => void; onNext: () => void }) {
  switch (step.kind) {
    case "model":
      return (
        <Screen label="New letter" action={<Primary onClick={onNext}>Next</Primary>}>
          <BigLetter item={step.item} />
          <p className="text-2xl font-semibold">{step.item.name}</p>
          <p className="mb-5 text-sm text-muted-foreground">Sounds like “{step.item.tr}”</p>
          <LetterSound item={step.item} />
        </Screen>
      );
    case "repeat":
      return (
        <Screen label="Say it back" action={<Primary onClick={onNext}>Next</Primary>}>
          <BigLetter item={step.item} />
          <p className="mb-5 max-w-xs text-sm text-muted-foreground">Listen to the reciter, then say “{step.item.tr}” aloud. Record yourself and compare.</p>
          {step.item.example && <ListenButton url={step.item.example.audio} label="Reciter" />}
          <Recorder />
        </Screen>
      );
    case "review":
    case "pick":
      return <Pick step={step} onAnswer={onAnswer} onNext={onNext} />;
    case "dots":
      return <Dots step={step} onAnswer={onAnswer} onNext={onNext} />;
    case "apply":
    case "read":
      return <ReadAloud item={step.item} onAnswer={onAnswer} onNext={onNext} />;
  }
}

function Pick({ step, onAnswer, onNext }: { step: Extract<Step, { kind: "pick" | "review" }>; onAnswer: (a: Answer) => void; onNext: () => void }) {
  const [picked, setPicked] = useState<Item | null>(null);
  const [hint, setHint] = useState(false);
  const { item } = step;
  const guided = step.kind === "pick" && step.hint;
  const choose = (o: Item) => {
    setPicked(o);
    navigator.vibrate?.(o.id === item.id ? 15 : [20, 40, 20]);
    onAnswer({ item, correct: o.id === item.id, picked: o.id === item.id ? undefined : o, exercise: step.kind === "review" ? "review" : "pick" });
  };
  const ok = picked?.id === item.id;
  return (
    <Screen label={step.kind === "review" ? "Quick review" : guided ? "Practice" : "On your own"} action={<Primary disabled={!picked} onClick={onNext}>Continue</Primary>}>
      <p className="mb-4 mt-2 text-xl font-medium">Which letter says “{item.tr}”?</p>
      {item.example && !picked && guided && <ListenButton url={item.example.audio} label="Hear it in a word" />}
      {guided && !picked && (
        hint ? <p className="mt-3 text-xs text-muted-foreground">Hint: it's called {item.name}</p>
          : <button onClick={() => setHint(true)} className="mt-3 text-xs text-primary underline-offset-2 hover:underline">Need a hint?</button>
      )}
      <div dir="rtl" className={`mt-6 grid w-full gap-3 ${step.options.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
        {step.options.map((o) => {
          const tone = picked ? (o.id === item.id ? "border-primary bg-primary/10 scale-[1.02]" : o.id === picked.id ? "border-destructive bg-destructive/5" : "opacity-40") : "";
          return (
            <button key={o.id} disabled={!!picked} onClick={() => choose(o)} className={`flex h-28 items-center justify-center rounded-3xl border-2 border-border bg-card text-6xl transition-all active:scale-95 ${tone}`} style={ar}>{o.ar}</button>
          );
        })}
      </div>
      {picked && (
        <div className={`mt-5 w-full rounded-2xl p-4 text-left text-sm leading-relaxed animate-in fade-in ${ok ? "bg-primary/10" : "bg-muted"}`}>
          {ok ? <><b>Correct.</b> That's {item.name}.</> : (
            <>That was <b>{picked.name}</b> (“{picked.tr}”). “{item.tr}” is <b>{item.name}</b> <span style={ar} className="text-xl">{item.ar}</span>
              {item.family === picked.family ? " — same shape, so look at the dots." : "."}</>
          )}
        </div>
      )}
    </Screen>
  );
}

function Dots({ step, onAnswer, onNext }: { step: Extract<Step, { kind: "dots" }>; onAnswer: (a: Answer) => void; onNext: () => void }) {
  const [sel, setSel] = useState<Set<number>>(new Set());
  const [checked, setChecked] = useState(false);
  const want = step.line.map((x, k) => (x.id === step.target.id ? k : -1)).filter((k) => k >= 0);
  const check = () => {
    setChecked(true);
    const correct = want.length === sel.size && want.every((k) => sel.has(k));
    const wrong = [...sel].map((k) => step.line[k]).find((x) => x.id !== step.target.id);
    onAnswer({ item: step.target, correct, picked: wrong, exercise: "dots" });
  };
  return (
    <Screen label="Spot the dots" action={checked ? <Primary onClick={onNext}>Continue</Primary> : <Primary disabled={!sel.size} onClick={check}>Check</Primary>}>
      <p className="mb-6 mt-2 text-xl font-medium">Tap every <span className="mx-1 text-4xl text-primary" style={ar}>{step.target.ar}</span></p>
      <div dir="rtl" className="grid w-full grid-cols-4 gap-2.5">
        {step.line.map((x, k) => {
          const on = sel.has(k);
          const tone = checked ? (x.id === step.target.id ? "border-primary bg-primary/10" : on ? "border-destructive" : "opacity-40") : on ? "border-primary bg-primary/10" : "";
          return (
            <button key={k} disabled={checked} onClick={() => setSel((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; })}
              className={`flex h-20 items-center justify-center rounded-2xl border-2 border-border bg-card text-5xl transition active:scale-95 ${tone}`} style={ar}>{x.ar}</button>
          );
        })}
      </div>
    </Screen>
  );
}

function Recorder() {
  const [url, setUrl] = useState<string | null>(null);
  const [rec, setRec] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const mr = useRef<MediaRecorder | null>(null);
  const { play } = useAudio();
  const start = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks: Blob[] = [];
      const r = new MediaRecorder(s);
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => { s.getTracks().forEach((t) => t.stop()); setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType }))); };
      r.start(); mr.current = r; setRec(true); setErr(null);
    } catch {
      setErr("Microphone is blocked. Allow it in your phone's Settings to record yourself.");
    }
  };
  const stop = () => { mr.current?.stop(); setRec(false); };
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="flex gap-2">
        <button onClick={rec ? stop : start} className={`flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm ${rec ? "border-destructive text-destructive" : "border-border"}`}>
          {rec ? <><Square size={14} className="animate-pulse" /> Stop</> : url ? <><RotateCcw size={14} /> Record again</> : <><Mic size={14} /> Record yourself</>}
        </button>
        {url && !rec && <button onClick={() => play(url)} className="flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm"><Play size={14} /> Hear yourself</button>}
      </div>
      {err && <p className="max-w-xs text-xs text-destructive">{err}</p>}
    </div>
  );
}

function ReadAloud({ item, onAnswer, onNext }: { item: Item; onAnswer: (a: Answer) => void; onNext: () => void }) {
  const [shown, setShown] = useState(false);
  const [graded, setGraded] = useState(false);
  const grade = (g: Grade) => { onAnswer({ item, correct: g === "perfect" || g === "hesitation", grade: g, exercise: "read" }); setGraded(true); };
  return (
    <Screen
      label="Read a real Quran word"
      action={!shown ? <Primary onClick={() => setShown(true)}>Check with the reciter</Primary> : <Primary disabled={!graded} onClick={onNext}>Continue</Primary>}
    >
      <div className="relative my-4 w-full rounded-3xl border border-border bg-card px-4 py-8">
        <div className="pointer-events-none absolute inset-0 rounded-3xl" style={glow} />
        <div dir="rtl" className="relative text-7xl leading-loose" style={ar}>{item.ar}</div>
      </div>
      <p className="text-sm text-muted-foreground">Read it aloud using the letters you've learned.</p>
      <Recorder />
      {shown && (
        <div className="mt-5 flex w-full flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <p className="text-lg"><b>{item.tr}</b> <span className="text-muted-foreground">· {item.meaning}</span></p>
          <ListenButton url={item.audio} label="Hear the reciter" />
          {!graded ? (
            <div className="mt-2 grid w-full grid-cols-3 gap-2">
              {([["mistake", "Needed help"], ["hesitation", "Slowly"], ["perfect", "Read it right"]] as const).map(([g, t]) => (
                <button key={g} onClick={() => grade(g)} className="rounded-2xl border border-border bg-card px-2 py-3 text-sm active:scale-95">{t}</button>
              ))}
            </div>
          ) : <p className="flex items-center gap-1 text-sm text-primary"><Check size={14} /> Saved</p>}
        </div>
      )}
    </Screen>
  );
}
