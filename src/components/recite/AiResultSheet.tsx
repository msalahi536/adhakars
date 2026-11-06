import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVerseByKey, type Chapter, type VerseHit } from "@/lib/quran";
import { diffAyat } from "@/lib/hifz-ai/mutashabih";
import type { Attempt } from "./ai-performance";
import { ReportProblem } from "./SampleReports";
import { addedWordKeys } from "./ai-feedback";

export function AiResultSheet({ attempt, passes, lesson, chapters, again, next, wordAudio, ayahAudio, close, recording = null, showTips = true }: {
  attempt: Attempt; passes: number; lesson: boolean; chapters: Chapter[];
  again: () => void; next: () => void; wordAudio: (key: string) => void;
  ayahAudio: (key: string) => void; close: () => void;
  recording?: Blob | null; highlight?: (key: string | null) => void; showTips?: boolean;
}) {
  const [compare, setCompare] = useState(false);
  const [ayat, setAyat] = useState<VerseHit[] | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const drift = attempt.drifts[0];
  const source = drift?.atKey.split(":").slice(0, 2).join(":");
  const destination = drift ? `${drift.wentTo.sura}:${drift.wentTo.aya}` : "";
  const name = (key: string) => { const [s, a] = key.split(":"); return `${chapters.find((c) => c.id === Number(s))?.name_simple ?? `Surah ${s}`} ${a}`; };
  useEffect(() => {
    if (!compare || !source || !destination) return;
    let canceled = false; setAyat(null); setError(false);
    void Promise.all([getVerseByKey(source), getVerseByKey(destination)]).then((v) => { if (!canceled) setAyat(v); }).catch(() => { if (!canceled) setError(true); });
    return () => { canceled = true; };
  }, [compare, source, destination, retry]);
  const diff = ayat?.[0] && ayat[1] ? diffAyat(ayat[0].text.trim().split(/\s+/), ayat[1].text.trim().split(/\s+/)) : null;
  const mistakes = attempt.result.words.filter((w) => w.status === "wrong" || w.status === "skipped");
  const added = addedWordKeys(attempt.result);
  if (compare) return <section className="rc-sheet rc-result-sheet" role="dialog" aria-modal="true" aria-label="Spot the difference">
    <header><Button variant="ghost" size="icon" aria-label="Back to result" onClick={() => setCompare(false)}><ArrowLeft /></Button><h2>Spot the difference</h2></header>
    {error ? <><p>These ayat couldn’t load.</p><Button variant="outline" onClick={() => setRetry((v) => v + 1)}>Retry</Button></> : !diff || !ayat ? <p role="status">Loading ayat…</p> : ayat.map((ayah, i) => <section className="rc-compare-ayah" key={ayah.key}>
      <header><span>{name(ayah.key)}</span><Button variant="ghost" size="icon" aria-label={`Play ${name(ayah.key)}`} title={`Play ${name(ayah.key)}`} onClick={() => ayahAudio(ayah.key)}><Play /></Button></header>
      <p dir="rtl" className="rc-arabic">{(i === 0 ? diff.a : diff.b).map((w, n) => <span key={n} className={w.same ? "" : "rc-diff-word"}>{w.text} </span>)}</p>
      <p className="rc-compare-translation">{ayah.translation}</p>
    </section>)}
  </section>;
  return <section className="rc-sheet rc-result-sheet" role="dialog" aria-modal="true" aria-label="Recitation result">
    <header><div className="rc-score" role="img" aria-label={`Mastery score ${attempt.m.score} out of 100`}><svg viewBox="0 0 44 44" aria-hidden="true"><circle className="rc-score-track" cx="22" cy="22" r="19" /><circle className="rc-score-value" cx="22" cy="22" r="19" pathLength="100" strokeDasharray={`${attempt.m.score} 100`} /></svg><span>{attempt.m.score}</span></div><h2>{attempt.m.label}</h2><Button variant="ghost" size="icon" aria-label="Close result" onClick={close}><X /></Button></header>
    {drift && <Button variant="outline" className="rc-drift-card" onClick={() => setCompare(true)}>You switched to {name(destination)}, a similar ayah<ArrowRight size={16} /></Button>}
    {lesson && <div className="rc-pass-dots" aria-label={`${passes} of 3 clean recitations`}>{[1, 2, 3].map((n) => <span key={n} className={passes >= n ? "is-filled" : ""} />)}</div>}
    {showTips && !!attempt.tips?.length && <section className="rc-tajweed-tips"><h3>Tajweed tips</h3>{attempt.tips.slice(0, 3).map((hint) => <div className="rc-ayah-tip" key={hint.key}><header><span className="rc-arabic" dir="rtl">{hint.text}</span><Button variant="ghost" size="icon" aria-label={`Hear tajweed word ${hint.key}`} onClick={() => { wordAudio(hint.key); }}><Play size={15} /></Button></header><strong>{hint.kind === "heavy" ? "Heavy letter" : hint.kind === "light" ? "Light letter" : hint.kind === "qalqalah" ? "Qalqalah" : hint.kind === "shadda" ? "Shadda" : "Madd"}</strong><p>{hint.tip}</p></div>)}<p className="hx-source">Tajweed tips are automatic and can be wrong. Learn tajweed with a qualified teacher.</p></section>}
    <ReportProblem attempt={attempt} recording={recording} passages={attempt.passages ?? []} />
    <div className="rc-result-evidence">
      {mistakes.map((w) => <div className="rc-result-word" key={w.key}><span><small>{name(w.key)} · {w.status === "skipped" ? "Skipped" : "Mistake"}</small><span className="rc-arabic" dir="rtl">{w.text}</span></span><div className="hx-word-actions"><Button variant="ghost" size="sm" aria-label={`Hear correct word ${w.key}`} onClick={() => { wordAudio(w.key); }}><Play size={13} />Correct</Button></div></div>)}
      {added.map((key) => <div className="rc-result-word rc-result-added" key={`added-${key}`}><span><small>{name(key)} · Added words</small><span>You added words before <span className="rc-arabic" dir="rtl">{attempt.result.words.find((w) => w.key === key)?.text ?? ""}</span></span></span></div>)}
      {attempt.hes.map((h) => <p className="rc-hesitation-note" key={h.key}>{h.kind === "transition" ? `Slow start of ayah ${h.key.split(":")[1]}` : h.kind === "restart" ? `Restarted before ﴿${attempt.result.words.find((w) => w.key === h.key)?.text ?? ""}﴾` : `Paused ${h.seconds}s before ﴿${attempt.result.words.find((w) => w.key === h.key)?.text ?? ""}﴾`}</p>)}
      {attempt.driftError && <p role="status">{attempt.driftError}</p>}
    </div>
    <div className="rc-result-actions"><Button variant="outline" onClick={again}>Try again</Button><Button className="rc-primary" disabled={!attempt.clean} onClick={next}>Next<ArrowRight size={16} /></Button></div>
  </section>;
}