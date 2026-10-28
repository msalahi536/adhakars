import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronLeft, Lock, Mic, Play, Square, Volume2 } from "lucide-react";
import { CURRICULUM, LESSONS, type Item, type Lesson } from "@/lib/arabic/content";
import { buildLesson, derive, dueItems, lessonStatus, scoreOf, todayLocal, type ArabicEvent, type Step } from "@/lib/arabic/engine";
import { loadLog, record } from "@/lib/arabic/store";
import type { Grade } from "@/lib/hifz/scheduler";

export const Route = createFileRoute("/app/arabic")({
  head: () => ({
    meta: [
      { title: "Arabic Companion, Sahih Al-Adhkar" },
      { name: "description", content: "Learn to read the Quran in Arabic, step by step, with review." },
      { property: "og:title", content: "Arabic Companion, Sahih Al-Adhkar" },
      { property: "og:description", content: "Learn to read Arabic letter by letter with a teacher-style lesson loop." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ArabicCompanion,
});

const ar = { fontFamily: "var(--font-arabic)" };

function ArabicCompanion() {
  const [log, setLog] = useState<ArabicEvent[]>([]);
  const [active, setActive] = useState<Lesson | null>(null);
  useEffect(() => setLog(loadLog()), []);
  const today = todayLocal();
  const d = useMemo(() => derive(log), [log]);
  const due = dueItems(d, today).length;

  if (active)
    return (
      <LessonRunner
        lesson={active}
        steps={buildLesson(active, d, today)}
        onExit={() => {
          setActive(null);
          setLog(loadLog());
        }}
      />
    );

  return (
    <div className="min-h-screen bg-background px-4 pb-32 pt-[max(1rem,env(safe-area-inset-top))] text-foreground">
      <div className="mb-4 flex items-center gap-2">
        <Link to="/app/more" className="rounded-full p-2 hover:bg-muted" aria-label="Back"><ChevronLeft size={22} /></Link>
        <div>
          <h1 className="text-xl font-semibold">Arabic Companion</h1>
          <p className="text-xs text-muted-foreground">Beta · learn to read the Quran</p>
        </div>
      </div>
      <p className="mb-4 rounded-2xl bg-muted p-4 text-sm leading-relaxed">
        ʿUmar wrote to Abu Musa: learn the Sunnah and Arabic, and learn the Quran in Arabic, for it is Arabic.
        <span className="mt-2 block text-xs text-muted-foreground">Each lesson: listen, repeat, practice, then read real Quran words. What you learn comes back for review.</span>
      </p>
      {due > 0 && <p className="mb-4 text-sm text-primary">{due} item{due === 1 ? "" : "s"} to review — included at the start of your next lesson.</p>}
      {CURRICULUM.map((lv) => (
        <section key={lv.id} className="mb-6">
          <h2 className="text-sm font-semibold">Level {lv.id} · {lv.title}</h2>
          <p className="mb-3 text-xs text-muted-foreground">{lv.goal}</p>
          {lv.units.map((u) => (
            <div key={u.id} className="space-y-2">
              {u.lessons.map((l, i) => {
                const st = lessonStatus(d, l.id, today);
                return (
                  <button
                    key={l.id}
                    disabled={st === "locked" || st === "retry-tomorrow"}
                    onClick={() => setActive(l)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left disabled:opacity-50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm">
                      {st === "passed" ? <Check size={16} /> : st === "locked" ? <Lock size={14} /> : i + 1}
                    </span>
                    <span className="flex-1">
                      <span dir="rtl" className="block text-2xl leading-snug" style={ar}>{l.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {st === "retry-tomorrow" ? "Try again tomorrow, with fresh practice" : l.goal}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </section>
      ))}
      <p className="text-center text-xs text-muted-foreground">More levels (vowels, words, tajweed, meanings) are coming.</p>
    </div>
  );
}

function useAudio() {
  const ref = useRef<HTMLAudioElement | null>(null);
  return (url?: string) => {
    if (!url) return;
    ref.current?.pause();
    ref.current = new Audio(url);
    void ref.current.play().catch(() => {});
  };
}

function AudioButton({ item, label = "Listen" }: { item: Item; label?: string }) {
  const play = useAudio();
  if (!item.audio)
    return <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">Recorded audio coming soon. Sound: “{item.tr}”</p>;
  return (
    <button onClick={() => play(item.audio)} className="mx-auto flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-primary-foreground">
      <Volume2 size={18} /> {label}
    </button>
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
    const graded = answers.filter((a) => a.exercise !== "review");
    const score = scoreOf(graded);
    record([
      ...answers.map((a) => ({
        kind: "answer" as const, lessonId: lesson.id, itemId: a.item.id, correct: a.correct, picked: a.picked?.id, grade: a.grade,
      })),
      { kind: "lesson", lessonId: lesson.id, score },
    ]);
    setDone(score);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] text-foreground">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={onExit} className="rounded-full p-2 hover:bg-muted" aria-label="Leave lesson"><ChevronLeft size={22} /></button>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${((done !== null ? steps.length : i) / steps.length) * 100}%` }} />
        </div>
      </div>
      {done !== null ? (
        <Result score={done} lesson={lesson} onExit={onExit} />
      ) : (
        <div key={i} className="flex flex-1 flex-col items-center text-center animate-in fade-in">
          <StepView step={step} onAnswer={answer} onNext={next} />
        </div>
      )}
    </div>
  );
}

function Result({ score, lesson, onExit }: { score: number; lesson: Lesson; onExit: () => void }) {
  const pass = score >= lesson.mastery;
  const nextLesson = LESSONS[LESSONS.findIndex((l) => l.id === lesson.id) + 1];
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="text-5xl font-semibold">{Math.round(score * 100)}%</div>
      {pass ? (
        <p className="text-sm">Mastered. These letters will come back for review{nextLesson ? ", and the next lesson is open." : "."}</p>
      ) : (
        <p className="max-w-xs text-sm leading-relaxed">
          Not yet — you need {Math.round(lesson.mastery * 100)}%. It comes back tomorrow with different practice.
          <span className="mt-3 block text-xs text-muted-foreground">“The one who recites and stumbles, finding it hard, has two rewards.” (Bukhari, Muslim)</span>
        </p>
      )}
      <button onClick={onExit} className="rounded-full bg-primary px-6 py-3 text-primary-foreground">Back to lessons</button>
    </div>
  );
}

function Primary({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button disabled={disabled} onClick={onClick} className="mt-auto w-full rounded-full bg-primary py-3.5 text-primary-foreground disabled:opacity-40">{children}</button>;
}

function StepView({ step, onAnswer, onNext }: { step: Step; onAnswer: (a: Answer) => void; onNext: () => void }) {
  switch (step.kind) {
    case "model":
      return (
        <>
          <Label>New letter</Label>
          <div className="my-4 text-8xl leading-normal" style={ar}>{step.item.ar}</div>
          <p className="text-lg font-medium">“{step.item.tr}”</p>
          <p className="mb-6 text-sm text-muted-foreground">Its name is {step.item.name}</p>
          <AudioButton item={step.item} />
          <Primary onClick={onNext}>Next</Primary>
        </>
      );
    case "repeat":
      return <Repeat item={step.item} onNext={onNext} />;
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

const Label = ({ children }: { children: React.ReactNode }) => <p className="text-xs uppercase tracking-wide text-muted-foreground">{children}</p>;

function Pick({ step, onAnswer, onNext }: { step: Extract<Step, { kind: "pick" | "review" }>; onAnswer: (a: Answer) => void; onNext: () => void }) {
  const [picked, setPicked] = useState<Item | null>(null);
  const [hint, setHint] = useState(false);
  const { item } = step;
  const guided = step.kind === "pick" && step.hint;
  const choose = (o: Item) => {
    setPicked(o);
    onAnswer({ item, correct: o.id === item.id, picked: o.id === item.id ? undefined : o, exercise: step.kind === "review" ? "review" : "pick" });
  };
  return (
    <>
      <Label>{step.kind === "review" ? "Review" : guided ? "Practice" : "On your own"}</Label>
      <p className="my-4 text-lg">Which letter makes the sound “{item.tr}”?</p>
      {item.audio && <AudioButton item={item} label="Play sound" />}
      {guided && !picked && (
        hint ? <p className="mb-2 text-xs text-muted-foreground">Hint: its name is {item.name}</p>
          : <button onClick={() => setHint(true)} className="mb-2 text-xs text-primary">Show a hint</button>
      )}
      <div dir="rtl" className="mt-4 grid w-full grid-cols-3 gap-3">
        {step.options.map((o) => {
          const tone = picked ? (o.id === item.id ? "border-primary bg-primary/10" : o.id === picked.id ? "border-destructive" : "opacity-50") : "";
          return (
            <button key={o.id} disabled={!!picked} onClick={() => choose(o)} className={`rounded-2xl border border-border bg-card py-4 text-5xl leading-relaxed ${tone}`} style={ar}>{o.ar}</button>
          );
        })}
      </div>
      {picked && (
        <p className="mt-4 text-sm leading-relaxed">
          {picked.id === item.id
            ? "Correct."
            : `That was ${picked.name} (“${picked.tr}”). “${item.tr}” is ${item.name}${item.family === picked.family ? " — same shape, look at the dots" : ""}.`}
        </p>
      )}
      <Primary disabled={!picked} onClick={onNext}>Continue</Primary>
    </>
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
    <>
      <Label>Spot the dots</Label>
      <p className="my-4 text-lg">Tap every <span className="text-3xl" style={ar}>{step.target.ar}</span></p>
      <div dir="rtl" className="grid w-full grid-cols-4 gap-2">
        {step.line.map((x, k) => {
          const on = sel.has(k);
          const tone = checked ? (x.id === step.target.id ? "border-primary bg-primary/10" : on ? "border-destructive" : "") : on ? "border-primary bg-primary/10" : "";
          return (
            <button key={k} disabled={checked} onClick={() => setSel((s) => { const n = new Set(s); n.has(k) ? n.delete(k) : n.add(k); return n; })}
              className={`rounded-xl border border-border bg-card py-3 text-4xl leading-relaxed ${tone}`} style={ar}>{x.ar}</button>
          );
        })}
      </div>
      {checked ? <Primary onClick={onNext}>Continue</Primary> : <Primary disabled={!sel.size} onClick={check}>Check</Primary>}
    </>
  );
}

function useRecorder() {
  const [url, setUrl] = useState<string | null>(null);
  const [rec, setRec] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const mr = useRef<MediaRecorder | null>(null);
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
  return { url, rec, err, start, stop };
}

function Recorder() {
  const r = useRecorder();
  const play = useAudio();
  return (
    <div className="mt-4 flex flex-col items-center gap-2">
      <div className="flex gap-2">
        <button onClick={r.rec ? r.stop : r.start} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm">
          {r.rec ? <><Square size={14} /> Stop</> : <><Mic size={14} /> Record yourself</>}
        </button>
        {r.url && <button onClick={() => play(r.url!)} className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm"><Play size={14} /> My recording</button>}
      </div>
      {r.err && <p className="text-xs text-destructive">{r.err}</p>}
    </div>
  );
}

function Repeat({ item, onNext }: { item: Item; onNext: () => void }) {
  return (
    <>
      <Label>Say it back</Label>
      <div className="my-4 text-8xl leading-normal" style={ar}>{item.ar}</div>
      <p className="mb-4 text-sm text-muted-foreground">Listen, then say “{item.tr}” aloud and compare.</p>
      <AudioButton item={item} />
      <Recorder />
      <Primary onClick={onNext}>Next</Primary>
    </>
  );
}

function ReadAloud({ item, onAnswer, onNext }: { item: Item; onAnswer: (a: Answer) => void; onNext: () => void }) {
  const [shown, setShown] = useState(false);
  const [graded, setGraded] = useState(false);
  const grade = (g: Grade) => { onAnswer({ item, correct: g === "perfect" || g === "hesitation", grade: g, exercise: "read" }); setGraded(true); };
  return (
    <>
      <Label>Read a real Quran word</Label>
      <div dir="rtl" className="my-4 text-7xl leading-loose" style={ar}>{item.ar}</div>
      <p className="mb-4 text-sm text-muted-foreground">Read it aloud first, then check with the reciter.</p>
      <Recorder />
      {!shown ? (
        <button onClick={() => setShown(true)} className="mt-6 text-sm text-primary">Check</button>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-3 animate-in fade-in">
          <p className="text-lg">{item.tr} · <span className="text-muted-foreground">{item.meaning}</span></p>
          <AudioButton item={item} label="Hear the reciter" />
          {!graded ? (
            <div className="mt-2 flex gap-2">
              {([["mistake", "Needed help"], ["hesitation", "Slowly"], ["perfect", "Read it right"]] as const).map(([g, t]) => (
                <button key={g} onClick={() => grade(g)} className="rounded-full border border-border px-3 py-2 text-sm">{t}</button>
              ))}
            </div>
          ) : <p className="text-sm text-primary">Saved.</p>}
        </div>
      )}
      <Primary disabled={!graded} onClick={onNext}>Continue</Primary>
    </>
  );
}
