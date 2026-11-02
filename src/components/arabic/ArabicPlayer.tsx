/**
 * The lesson / review / vocabulary player: renders one engine Step at a time, scores first tries,
 * and reports answers back to the route (which owns the engine state). All rules live in
 * src/lib/arabic — this file only renders and calls engine functions.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Info, X } from "lucide-react";
import {
  LETTER, LESSON, MAKHRAJ_LABEL, shapes, stepAudio, letterSoundAudio, quranWordAudio,
  VOCAB_BY_ID, AFFIX, PATTERNS, analyzeWord, understood, ayahWords, wordKeyPhonemes,
  startSay, knownWords, knownPieces,
  type Step, type ArabicState, type SayResult,
} from "@/lib/arabic";
import { startListening, AI_DISCLAIMER, type ListenSession } from "@/lib/hifz-ai";
import { play } from "@/lib/hifzHaptics";
import { Portal } from "@/components/Portal";
import { ListenButton, MicButton, MakhrajDiagram, TraceCanvas, useAudio } from "./parts";
import "./arabic.css";

const ar = { fontFamily: "var(--font-arabic)" };
const SCORED = new Set(["say", "listen-pick", "duel", "shapes", "spot", "short-long", "build", "read-word", "read-ayah", "meaning-pick", "piece-pick"]);
const POSITION_LABEL = { isolated: "on its own", initial: "at the start of a word", medial: "in the middle of a word", final: "at the end of a word" } as const;

export interface StepAnswer { correct: boolean; close?: boolean; hinted?: boolean; fast?: boolean; picked?: string }

export function ArabicPlayer({ title, steps, state, onAnswer, onDone, onExit }: {
  title: string;
  steps: Step[];
  state: ArabicState;
  onAnswer: (step: Step, a: StepAnswer) => void;
  onDone: (score: number, minutes: number) => void;
  onExit: () => void;
}) {
  const [i, setI] = useState(0);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const firstTry = useRef<Map<number, boolean>>(new Map());
  const started = useRef(Date.now());
  const step = steps[i];

  const report = (a: StepAnswer) => {
    if (!firstTry.current.has(i)) {
      firstTry.current.set(i, a.correct);
      if (SCORED.has(step.kind)) onAnswer(step, a);
    }
    play(a.correct ? "ayahComplete" : "small");
  };
  const next = () => {
    if (i + 1 < steps.length) setI(i + 1);
    else {
      play("sessionComplete");
      const scored = steps.map((s, k) => SCORED.has(s.kind) ? k : -1).filter((k) => k >= 0);
      const right = scored.filter((k) => firstTry.current.get(k)).length;
      onDone(scored.length ? right / scored.length : 1, Math.max(1, Math.round((Date.now() - started.current) / 60000)));
    }
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  return (
    <Portal>
      <div className="ab-player">
        <div className="ab-player-top">
          <button className="ab-icon-btn" aria-label="Leave lesson" onClick={() => setConfirmLeave(true)}><X size={20} /></button>
          <div className="ab-progress"><div style={{ width: `${(i / steps.length) * 100}%` }} /></div>
          <span className="ab-player-title" dir="rtl">{title}</span>
        </div>
        <StepView key={i} step={step} state={state} report={report} next={next} />
        {confirmLeave && (
          <div className="ab-dialog" role="dialog" aria-modal="true">
            <div className="ab-dialog-inner">
              <h3>Leave this lesson?</h3>
              <p>Progress in it won't be saved.</p>
              <div className="ab-dialog-actions">
                <button onClick={() => setConfirmLeave(false)}>Keep going</button>
                <button className="ab-danger" onClick={onExit}>Leave</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Portal>
  );
}

function StepView({ step, state, report, next }: { step: Step; state: ArabicState; report: (a: StepAnswer) => void; next: () => void }) {
  switch (step.kind) {
    case "meet-letter": return <MeetLetter letter={step.letter} next={next} />;
    case "meet-skill": return <MeetSkill step={step} next={next} />;
    case "say": return <SayStep text={step.text} strictLetters={step.strictLetters} kidMode={state.settings.kidMode} report={report} next={next} />;
    case "listen-pick": return <ListenPick step={step} report={report} next={next} />;
    case "duel": return <Duel step={step} report={report} next={next} />;
    case "trace": return <TraceStep step={step} next={next} />;
    case "shapes": return <ShapesStep step={step} report={report} next={next} />;
    case "spot": return <SpotStep step={step} report={report} next={next} />;
    case "short-long": return <ShortLong step={step} report={report} next={next} />;
    case "build": return <BuildStep step={step} report={report} next={next} />;
    case "read-word": return <ReadWord step={step} kidMode={state.settings.kidMode} report={report} next={next} />;
    case "read-ayah": return <ReadAyah step={step} kidMode={state.settings.kidMode} report={report} next={next} />;
    case "meet-word": return <MeetWord step={step} next={next} />;
    case "meaning-pick": return <MeaningPick step={step} report={report} next={next} />;
    case "piece-pick": return <PiecePick step={step} report={report} next={next} />;
    case "meet-piece": return <MeetPiece step={step} next={next} />;
    case "understand-ayah": return <UnderstandAyah step={step} state={state} next={next} />;
  }
}

function Body({ label, children, action }: { label: string; children: React.ReactNode; action: React.ReactNode }) {
  return (
    <>
      <div className="ab-step-body">
        <p className="ab-step-label">{label}</p>
        {children}
      </div>
      <div className="ab-player-action">{action}</div>
    </>
  );
}

/** Small AI disclaimer note under every mic step. */
function MicNotice({ kidMode }: { kidMode: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <div className="ab-info-row">
        <button className="ab-icon-btn" style={{ padding: 2 }} aria-label="About the AI check" onClick={() => setShow((s) => !s)}><Info size={13} /></button>
        {show && <span style={{ maxWidth: "18rem", textAlign: "left" }}>{AI_DISCLAIMER}</span>}
      </div>
      {kidMode && <p className="ab-kid">A parent should listen along: the AI is less reliable for children under 12.</p>}
    </>
  );
}

/** Model download progress (first use only). */
function DownloadBar({ progress }: { progress: number | null }) {
  if (progress === null) return null;
  return (
    <div className="ab-download">
      <small className="ab-mic-caption">Downloading the recitation model (one time, then it works offline)… {Math.round(progress * 100)}%</small>
      <div className="ab-progress"><div style={{ width: `${progress * 100}%` }} /></div>
    </div>
  );
}

// ---------- meet steps ----------

function MeetLetter({ letter, next }: { letter: string; next: () => void }) {
  const l = LETTER.get(letter);
  if (!l) return null;
  const sh = shapes(letter);
  const sound = letterSoundAudio(letter);
  return (
    <Body label="New letter" action={<button className="ab-primary" onClick={next}>Continue</button>}>
      <div className="ab-big-letter"><span>{l.ar}</span></div>
      <p style={{ fontSize: "1.4rem", fontWeight: 600 }}>{l.name} <span dir="rtl" style={{ ...ar, fontSize: "1.1rem", color: "var(--muted-foreground)" }}>{l.nameAr}</span></p>
      <p className="ab-tip">Sounds like “{l.sound}”</p>
      <div className="ab-shapes" dir="rtl">
        {(["initial", "medial", "final", "isolated"] as const).map((p) => (
          <div key={p} className="ab-shape"><b>{sh[p]}</b><small>{p === "isolated" ? "alone" : p}</small></div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: ".75rem", margin: ".5rem 0" }}>
        <MakhrajDiagram makhraj={l.makhraj} />
        <p className="ab-tip" style={{ textAlign: "left" }}><b>{MAKHRAJ_LABEL[l.makhraj]}</b><br />{l.tip}</p>
      </div>
      {sound ? <ListenButton url={sound} label="Hear the letter" /> : l.example ? (
        <div style={{ marginTop: ".5rem" }}>
          <p className="ab-tip">Audio coming — hear it in this Quran word instead:</p>
          <p dir="rtl" style={{ ...ar, fontSize: "2.2rem", lineHeight: 1.8 }}>{l.example.ar}</p>
          <ListenButton url={l.example.audio} label="Play reciter" />
        </div>
      ) : <p className="ab-tip">Audio coming</p>}
    </Body>
  );
}

function MeetSkill({ step, next }: { step: Extract<Step, { kind: "meet-skill" }>; next: () => void }) {
  const note = LESSON.get(step.lessonId)?.note;
  return (
    <Body label="New rule" action={<button className="ab-primary" onClick={next}>Continue</button>}>
      <div dir="rtl" style={{ display: "flex", gap: "1.5rem", margin: "1rem 0" }}>
        {step.examples.map((e) => <span key={e} style={{ ...ar, fontSize: "3rem", lineHeight: 1.8 }}>{e}</span>)}
      </div>
      {note && <p className="ab-note">{note}</p>}
    </Body>
  );
}

function MeetWord({ step, next }: { step: Extract<Step, { kind: "meet-word" }>; next: () => void }) {
  const w = VOCAB_BY_ID.get(step.wordId);
  if (!w) return null;
  return (
    <Body label="New word" action={<button className="ab-primary" onClick={next}>Continue</button>}>
      <p dir="rtl" className="ab-big-text">{w.ar}</p>
      <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>{w.en}</p>
      <p className="ab-tip">Appears {w.freq.toLocaleString()}× in the Quran</p>
      {w.root && (
        <div style={{ margin: ".75rem 0" }}>
          <div dir="rtl" style={{ display: "flex", gap: ".4rem", justifyContent: "center" }}>
            {Array.from(w.root).map((r, k) => <span key={k} style={{ ...ar, fontSize: "1.4rem", borderRadius: ".7rem", border: "1px solid var(--border)", padding: ".2rem .6rem" }}>{r}</span>)}
          </div>
          {step.family.length > 0 && (
            <>
              <p className="ab-step-label" style={{ marginTop: ".75rem" }}>One root, many words</p>
              {step.family.map((id) => {
                const f = VOCAB_BY_ID.get(id);
                return f && <p key={id} className="ab-tip"><span dir="rtl" style={ar}>{f.ar}</span> — {f.en}</p>;
              })}
            </>
          )}
        </div>
      )}
      <div style={{ marginTop: ".5rem" }}>
        <p dir="rtl" style={{ ...ar, fontSize: "1.8rem", lineHeight: 1.8 }}>{w.exText}</p>
        <ListenButton url={quranWordAudio(w.ex)} label="Hear it in the Quran" />
      </div>
    </Body>
  );
}

function MeetPiece({ step, next }: { step: Extract<Step, { kind: "meet-piece" }>; next: () => void }) {
  const affix = AFFIX.get(step.pieceId);
  const pattern = PATTERNS.find((p) => p.id === step.pieceId);
  if (!affix && !pattern) return null;
  return (
    <Body label="A small piece" action={<button className="ab-primary" onClick={next}>Continue</button>}>
      <p dir="rtl" className="ab-big-text">{affix?.ar ?? pattern!.ar}</p>
      <p style={{ fontSize: "1.1rem", fontWeight: 600 }}>{affix?.en ?? pattern!.en}</p>
      <p className="ab-tip">{affix ? `It sits ${affix.at === "front" ? "in front of" : "at the end of"} a word.` : "A verb pattern."}</p>
      {pattern && <p className="ab-note" dir="rtl" style={ar}>{pattern.example}</p>}
    </Body>
  );
}

// ---------- mic steps ----------

function useSay(text: string, opts: { strictLetters?: boolean; keyPhonemes?: string }) {
  const [level, setLevel] = useState(0);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<SayResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const session = useRef<{ stop(): void; cancel(): void } | null>(null);

  const start = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const s = await startSay({
        text, strictLetters: opts.strictLetters, keyPhonemes: opts.keyPhonemes,
        onLevel: setLevel,
        onProgress: (p) => setProgress(p < 1 ? p : null),
      });
      session.current = s;
      setListening(true); setBusy(false);
      setResult(await s.result);
    } catch {
      setError("The microphone couldn't start. Allow it in your browser settings, then try again.");
    } finally {
      setListening(false); setBusy(false); setProgress(null); session.current = null;
    }
  };
  const stop = () => session.current?.stop();
  useEffect(() => () => session.current?.cancel(), []);
  return { level, busy, listening, progress, result, error, start, stop };
}

function SayVerdict({ result, tries, onRetry, onNext }: { result: SayResult; tries: number; onRetry: () => void; onNext: () => void }) {
  if (result.verdict === "silent")
    return <div className="ab-verdict ab-bad">I didn't hear anything — tap the mic and say it.</div>;
  if (result.verdict === "correct")
    return <div className="ab-verdict ab-ok"><Check size={15} style={{ verticalAlign: "-2px" }} /> Correct — well done.</div>;
  const tip = result.issues[0]?.tip;
  if (result.verdict === "close")
    return <div className="ab-verdict ab-close">Almost perfect — that counts. {tip && <span style={{ display: "block", marginTop: ".25rem" }}>{tip}</span>}</div>;
  return (
    <div className="ab-verdict ab-bad">
      {tip ?? "Not quite."}
      {tries < 3
        ? <button className="ab-link-btn" onClick={onRetry}>Try again</button>
        : <button className="ab-link-btn" onClick={onNext}>Continue</button>}
    </div>
  );
}

function SayStep({ text, strictLetters, kidMode, report, next }: { text: string; strictLetters?: boolean; kidMode: boolean; report: (a: StepAnswer) => void; next: () => void }) {
  const [tries, setTries] = useState(0);
  const say = useSay(text, { strictLetters });
  const counted = useRef(false);
  useEffect(() => {
    if (!say.result || counted.current) return;
    counted.current = true;
    const r = say.result;
    report({ correct: r.verdict === "correct" || r.verdict === "close", close: r.verdict === "close" });
  }, [say.result]);
  const retry = () => { setTries((t) => t + 1); void say.start(); };
  const done = say.result && (say.result.verdict === "correct" || say.result.verdict === "close" || tries >= 3);
  return (
    <Body label="Say it" action={<button className="ab-primary" disabled={!done} onClick={next}>Continue</button>}>
      <p dir="rtl" className="ab-big-text">{text}</p>
      <MicButton listening={say.listening} busy={say.busy} level={say.level} onTap={() => (say.listening ? say.stop() : void say.start())} />
      <DownloadBar progress={say.progress} />
      {say.error && <div className="ab-verdict ab-bad">{say.error}</div>}
      {say.result && <SayVerdict result={say.result} tries={tries} onRetry={retry} onNext={next} />}
      <MicNotice kidMode={kidMode} />
    </Body>
  );
}

function ReadWord({ step, kidMode, report, next }: { step: Extract<Step, { kind: "read-word" }>; kidMode: boolean; report: (a: StepAnswer) => void; next: () => void }) {
  const [tries, setTries] = useState(0);
  const [keyPhonemes, setKeyPhonemes] = useState<string | undefined>();
  useEffect(() => { void wordKeyPhonemes(step.key).then(setKeyPhonemes); }, [step.key]);
  const say = useSay(step.text, { keyPhonemes });
  const counted = useRef(false);
  useEffect(() => {
    if (!say.result || counted.current) return;
    counted.current = true;
    const r = say.result;
    report({ correct: r.verdict === "correct" || r.verdict === "close", close: r.verdict === "close" });
  }, [say.result]);
  const retry = () => { setTries((t) => t + 1); void say.start(); };
  const done = say.result && (say.result.verdict === "correct" || say.result.verdict === "close" || tries >= 3);
  return (
    <Body label="Read a Quran word" action={<button className="ab-primary" disabled={!done} onClick={next}>Continue</button>}>
      <p dir="rtl" className="ab-big-text">{step.text}</p>
      <ListenButton url={quranWordAudio(step.key)} label="Hear it" />
      <MicButton listening={say.listening} busy={say.busy} level={say.level} onTap={() => (say.listening ? say.stop() : void say.start())} />
      <DownloadBar progress={say.progress} />
      {say.error && <div className="ab-verdict ab-bad">{say.error}</div>}
      {say.result && <SayVerdict result={say.result} tries={tries} onRetry={retry} onNext={next} />}
      <MicNotice kidMode={kidMode} />
    </Body>
  );
}

function ReadAyah({ step, kidMode, report, next }: { step: Extract<Step, { kind: "read-ayah" }>; kidMode: boolean; report: (a: StepAnswer) => void; next: () => void }) {
  const [words, setWords] = useState<{ key: string; text: string }[]>([]);
  const [status, setStatus] = useState<Record<string, string>>({});
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const session = useRef<ListenSession | null>(null);
  const reported = useRef(false);

  useEffect(() => {
    let live = true;
    void (async () => {
      const all: { key: string; text: string }[] = [];
      for (let a = step.first; a <= step.last; a++) all.push(...await ayahWords(step.sura, a));
      if (live) setWords(all);
    })();
    return () => { live = false; void session.current?.stop(); };
  }, [step.sura, step.first, step.last]);

  const start = async () => {
    setBusy(true); setError(null);
    try {
      const s = await startListening({
        sura: step.sura, first: step.first, last: step.last,
        onProgress: (p) => setProgress(p < 1 ? p : null),
        onUpdate: (r) => setStatus(Object.fromEntries(r.words.map((w) => [w.key, w.status]))),
        onError: () => setError("The microphone couldn't start. Allow it in your browser settings, then try again."),
      });
      session.current = s;
      setListening(true);
    } catch {
      setError("The microphone couldn't start. Allow it in your browser settings, then try again.");
    } finally { setBusy(false); setProgress(null); }
  };
  const stop = async () => {
    const s = session.current;
    if (!s) return;
    setBusy(true);
    const r = await s.stop();
    session.current = null;
    setListening(false); setBusy(false); setFinished(true);
    if (!reported.current) {
      reported.current = true;
      const read = r.words.filter((w) => w.status !== "pending");
      const ok = r.words.filter((w) => w.status === "correct").length;
      const score = r.words.length ? ok / r.words.length : 0;
      report({ correct: score >= 0.85, close: score >= 0.6 && score < 0.85, hinted: read.length < r.words.length });
    }
  };

  return (
    <Body label="Read the ayah" action={<button className="ab-primary" disabled={!finished} onClick={next}>Continue</button>}>
      <div className="ab-ayah">
        {words.map((w) => {
          const st = status[w.key];
          return <span key={w.key} className={`ab-w ${st === "correct" ? "ab-w-ok" : st === "wrong" || st === "skipped" ? "ab-w-bad" : ""}`}>{w.text}</span>;
        })}
      </div>
      <MicButton listening={listening} busy={busy} level={0} onTap={() => (listening ? void stop() : void start())} label={listening ? "Listening… tap to stop" : busy ? "Checking…" : "Tap the mic and read"} />
      <DownloadBar progress={progress} />
      {error && <div className="ab-verdict ab-bad">{error}</div>}
      {finished && <div className="ab-verdict ab-ok">Saved. Green words were read clearly; red ones will come back in review.</div>}
      <MicNotice kidMode={kidMode} />
    </Body>
  );
}

// ---------- choice steps ----------

function Choices({ options, answer, render, onPick, picked }: {
  options: string[];
  answer: string;
  render: (o: string) => React.ReactNode;
  onPick: (o: string) => void;
  picked: string | null;
}) {
  return (
    <div className="ab-choices" dir="rtl">
      {options.map((o) => {
        const tone = picked ? (o === answer ? "ab-right" : o === picked ? "ab-wrong" : "ab-faded") : "";
        return <button key={o} disabled={!!picked} onClick={() => onPick(o)} className={`ab-choice ${tone}`}>{render(o)}</button>;
      })}
    </div>
  );
}

function usePick(answer: string, report: (a: StepAnswer) => void, pickedId: (o: string) => string) {
  const [picked, setPicked] = useState<string | null>(null);
  const pick = (o: string) => {
    setPicked(o);
    report({ correct: o === answer, picked: o === answer ? undefined : pickedId(o) });
  };
  return { picked, pick };
}

function ListenPick({ step, report, next }: { step: Extract<Step, { kind: "listen-pick" }>; report: (a: StepAnswer) => void; next: () => void }) {
  const url = stepAudio(step);
  const { play: playAudio } = useAudio();
  const { picked, pick } = usePick(step.answer, report, (o) => (o.length === 1 ? `l:${o}` : o));
  useEffect(() => { const t = setTimeout(() => playAudio(url), 400); return () => clearTimeout(t); }, [url]);
  return (
    <Body label="Listen" action={<button className="ab-primary" disabled={!picked} onClick={next}>Continue</button>}>
      <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>Which one makes this sound?</p>
      <ListenButton url={url} label="Replay" />
      <Choices options={step.choices} answer={step.answer} picked={picked} onPick={pick} render={(o) => <span style={ar}>{o}</span>} />
    </Body>
  );
}

function Duel({ step, report, next }: { step: Extract<Step, { kind: "duel" }>; report: (a: StepAnswer) => void; next: () => void }) {
  const [round, setRound] = useState(0);
  const [answer, setAnswer] = useState(step.answer);
  const [picked, setPicked] = useState<string | null>(null);
  const mistakes = useRef(0);
  const { play: playAudio } = useAudio();
  const done = round >= step.rounds;

  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => playAudio(letterSoundAudio(answer)), Math.max(300, 900 - round * 100));
    return () => clearTimeout(t);
  }, [round, answer, done]);

  const pick = (o: string) => {
    if (picked || done) return;
    setPicked(o);
    if (o !== answer) { mistakes.current++; play("small"); }
    setTimeout(() => {
      setPicked(null);
      setAnswer(Math.random() < 0.5 ? step.a : step.b);
      setRound((r) => r + 1);
    }, 500);
  };
  useEffect(() => { if (done) report({ correct: mistakes.current === 0, fast: mistakes.current === 0 }); }, [done]);

  return (
    <Body label={`Quick duel · ${Math.min(round + 1, step.rounds)} of ${step.rounds}`} action={<button className="ab-primary" disabled={!done} onClick={next}>Continue</button>}>
      <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>Tap the letter you hear</p>
      <div className="ab-choices" dir="rtl" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {[step.a, step.b].map((o) => {
          const tone = picked ? (o === answer ? "ab-right" : o === picked ? "ab-wrong" : "") : "";
          return <button key={o} onClick={() => pick(o)} className={`ab-choice ${tone}`} style={{ minHeight: "8rem", fontSize: "4rem" }}><span style={ar}>{o}</span></button>;
        })}
      </div>
    </Body>
  );
}

function TraceStep({ step, next }: { step: Extract<Step, { kind: "trace" }>; next: () => void }) {
  const [passed, setPassed] = useState(false);
  return (
    <Body label="Trace it" action={<button className="ab-primary" disabled={!passed} onClick={next}>Continue</button>}>
      <p style={{ fontSize: "1rem" }}>Trace the letter with your finger</p>
      <TraceCanvas text={shapes(step.letter)[step.position]} onPass={() => { play("ayahComplete"); setPassed(true); }} />
      {passed && <div className="ab-verdict ab-ok"><Check size={15} style={{ verticalAlign: "-2px" }} /> Beautiful.</div>}
    </Body>
  );
}

function ShapesStep({ step, report, next }: { step: Extract<Step, { kind: "shapes" }>; report: (a: StepAnswer) => void; next: () => void }) {
  const { picked, pick } = usePick(step.letter, report, (o) => `l:${o}`);
  return (
    <Body label="Shapes" action={<button className="ab-primary" disabled={!picked} onClick={next}>Continue</button>}>
      <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>Which is <span style={{ ...ar, fontSize: "1.6rem" }}>{step.letter}</span> {POSITION_LABEL[step.position]}?</p>
      <Choices options={step.choices} answer={step.letter} picked={picked} onPick={pick} render={(o) => <span style={ar}>{shapes(o)[step.position]}</span>} />
    </Body>
  );
}

function SpotStep({ step, report, next }: { step: Extract<Step, { kind: "spot" }>; report: (a: StepAnswer) => void; next: () => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const pick = (key: string) => { setPicked(key); report({ correct: key === step.answer }); };
  return (
    <Body label="Spot it" action={<button className="ab-primary" disabled={!picked} onClick={next}>Continue</button>}>
      <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>Which word has <span style={{ ...ar, fontSize: "1.6rem" }}>{step.letter}</span>?</p>
      <div className="ab-choices" dir="rtl" style={{ gridTemplateColumns: "1fr" }}>
        {step.choices.map((c) => {
          const tone = picked ? (c.key === step.answer ? "ab-right" : c.key === picked ? "ab-wrong" : "ab-faded") : "";
          return <button key={c.key} disabled={!!picked} onClick={() => pick(c.key)} className={`ab-choice ${tone}`}><span style={ar}>{c.text}</span></button>;
        })}
      </div>
    </Body>
  );
}

function ShortLong({ step, report, next }: { step: Extract<Step, { kind: "short-long" }>; report: (a: StepAnswer) => void; next: () => void }) {
  const url = stepAudio(step);
  const { play: playAudio } = useAudio();
  const { picked, pick } = usePick(step.answer, report, (o) => o);
  useEffect(() => { const t = setTimeout(() => playAudio(url), 400); return () => clearTimeout(t); }, [url]);
  return (
    <Body label="Short or long?" action={<button className="ab-primary" disabled={!picked} onClick={next}>Continue</button>}>
      <ListenButton url={url} label="Replay" />
      <div className="ab-choices" dir="rtl">
        {[step.short, step.long].map((o) => {
          const tone = picked ? (o === step.answer ? "ab-right" : o === picked ? "ab-wrong" : "ab-faded") : "";
          return (
            <button key={o} disabled={!!picked} onClick={() => pick(o)} className={`ab-choice ${tone}`}>
              <span style={ar}>{o}</span>
              <small style={{ fontFamily: "var(--font-sans)", fontSize: ".7rem", color: "var(--muted-foreground)" }}>{o === step.short ? "short" : "long"}</small>
            </button>
          );
        })}
      </div>
    </Body>
  );
}

function BuildStep({ step, report, next }: { step: Extract<Step, { kind: "build" }>; report: (a: StepAnswer) => void; next: () => void }) {
  const url = stepAudio(step);
  const { play: playAudio } = useAudio();
  const [letter, setLetter] = useState<string | null>(null);
  const [mark, setMark] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const correct = checked && letter !== null && mark !== null && letter + mark === step.target;
  useEffect(() => { const t = setTimeout(() => playAudio(url), 400); return () => clearTimeout(t); }, [url]);
  const check = () => { setChecked(true); report({ correct: letter + mark === step.target }); };
  return (
    <Body label="Build it" action={checked ? <button className="ab-primary" onClick={next}>Continue</button> : <button className="ab-primary" disabled={!letter || !mark} onClick={check}>Check</button>}>
      <p style={{ fontSize: "1.1rem", fontWeight: 500 }}>Build what you hear</p>
      <ListenButton url={url} label="Replay" />
      <p className="ab-step-label" style={{ marginTop: "1rem" }}>Letter</p>
      <div className="ab-choices" dir="rtl" style={{ gridTemplateColumns: "repeat(3, 1fr)", marginTop: ".25rem" }}>
        {step.letters.map((l) => (
          <button key={l} onClick={() => setLetter(l)} className={`ab-choice ${letter === l ? "ab-right" : ""} ${checked && l === step.target[0] ? "ab-right" : ""}`} style={{ minHeight: "4rem", fontSize: "2rem" }}><span style={ar}>{l}</span></button>
        ))}
      </div>
      <p className="ab-step-label" style={{ marginTop: ".75rem" }}>Mark</p>
      <div className="ab-choices" dir="rtl" style={{ gridTemplateColumns: `repeat(${step.marks.length}, 1fr)`, marginTop: ".25rem" }}>
        {step.marks.map((m) => (
          <button key={m} onClick={() => setMark(m)} className={`ab-choice ${mark === m ? "ab-right" : ""}`} style={{ minHeight: "4rem", fontSize: "2rem" }}><span style={ar}>◌{m}</span></button>
        ))}
      </div>
      {checked && <div className={`ab-verdict ${correct ? "ab-ok" : "ab-bad"}`}>{correct ? "Correct." : <>It was <span dir="rtl" style={ar}>{step.target}</span>.</>}</div>}
    </Body>
  );
}

// ---------- vocabulary choice steps ----------

function MeaningPick({ step, report, next }: { step: Extract<Step, { kind: "meaning-pick" }>; report: (a: StepAnswer) => void; next: () => void }) {
  const w = VOCAB_BY_ID.get(step.wordId);
  const { picked, pick } = usePick(step.wordId, report, (o) => `v:${o}`);
  if (!w) return null;
  return (
    <Body label="What does it mean?" action={<button className="ab-primary" disabled={!picked} onClick={next}>Continue</button>}>
      <p dir="rtl" className="ab-big-text">{w.ar}</p>
      <div className="ab-choices" style={{ gridTemplateColumns: "1fr" }}>
        {step.choices.map((id) => {
          const c = VOCAB_BY_ID.get(id);
          const tone = picked ? (id === step.wordId ? "ab-right" : id === picked ? "ab-wrong" : "ab-faded") : "";
          return <button key={id} disabled={!!picked} onClick={() => pick(id)} className={`ab-choice ab-text ${tone}`}>{c?.en}</button>;
        })}
      </div>
    </Body>
  );
}

function PiecePick({ step, report, next }: { step: Extract<Step, { kind: "piece-pick" }>; report: (a: StepAnswer) => void; next: () => void }) {
  const piece = AFFIX.get(step.pieceId) ?? PATTERNS.find((p) => p.id === step.pieceId);
  const meaningOf = (id: string) => AFFIX.get(id)?.en ?? PATTERNS.find((p) => p.id === id)?.en ?? id;
  const { picked, pick } = usePick(step.pieceId, report, (o) => o);
  if (!piece) return null;
  return (
    <Body label="What does this piece mean?" action={<button className="ab-primary" disabled={!picked} onClick={next}>Continue</button>}>
      <p dir="rtl" className="ab-big-text">{piece.ar}</p>
      <div className="ab-choices" style={{ gridTemplateColumns: "1fr" }}>
        {step.choices.map((id) => {
          const tone = picked ? (id === step.pieceId ? "ab-right" : id === picked ? "ab-wrong" : "ab-faded") : "";
          return <button key={id} disabled={!!picked} onClick={() => pick(id)} className={`ab-choice ab-text ${tone}`}>{meaningOf(id)}</button>;
        })}
      </div>
    </Body>
  );
}

function UnderstandAyah({ step, state, next }: { step: Extract<Step, { kind: "understand-ayah" }>; state: ArabicState; next: () => void }) {
  const [sura, aya] = step.key.split(":").map(Number);
  const [rows, setRows] = useState<{ key: string; text: string; known: boolean; meaning?: string }[]>([]);
  useEffect(() => {
    void ayahWords(sura, aya).then((ws) => {
      const u = understood(ws.map((w) => w.text), knownWords(state), knownPieces(state));
      setRows(ws.map((w, k) => ({ ...w, known: u.each[k], meaning: analyzeWord(w.text).word?.en })));
    });
  }, [sura, aya, state]);
  const known = rows.filter((r) => r.known).length;
  return (
    <Body label="Read with understanding" action={<button className="ab-primary" onClick={next}>Continue</button>}>
      <div className="ab-ayah">
        {rows.map((w) => (
          <span key={w.key} className={`ab-w ${w.known ? "" : "ab-w-dim"}`}>
            {w.text}
            {w.known && w.meaning && <span className="ab-meaning">{w.meaning}</span>}
          </span>
        ))}
      </div>
      {rows.length > 0 && <p className="ab-tip">You understood {known} of {rows.length} words.</p>}
    </Body>
  );
}
