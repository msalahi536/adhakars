import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { buildDrills, drillRange, type Drill, type HifzState, type QuranIndex } from "@/lib/hifz";
import { PracticeVoice } from "./PracticeVoice";
import { drillPages, pageVersesFrom } from "@/lib/hifz/program";
import { recitePageOptions } from "@/lib/recite/data";

/**
 * Weak-spot and mixed drills. Each drill shows just enough words on screen and asks
 * the student to recall the rest; pass/fail feeds the engine's weak-spot tracking.
 */
export function DrillSheet({ state, q, today, done }: {
  state: HifzState;
  q: QuranIndex;
  today: string;
  done: (passed: string[], failed: string[]) => void;
}) {
  const pages = useMemo(() => drillPages(state, q, today), [state, q, today]);
  const queries = useQueries({ queries: pages.map((p) => recitePageOptions(p)) });
  const ready = queries.every((r) => r.isSuccess);
  const drills = useMemo(() => {
    if (!ready) return [];
    const pv = queries.flatMap((r) => r.data ? [pageVersesFrom(r.data)] : []);
    return buildDrills(state, pv, today, 8);
  }, [ready, state, today]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [passed, setPassed] = useState<string[]>([]);
  const [failed, setFailed] = useState<string[]>([]);

  if (!ready) return <section className="hz-sheet" role="dialog" aria-modal="true" aria-label="Drills"><p>Loading drills…</p></section>;
  if (!drills.length) return <section className="hz-sheet" role="dialog" aria-modal="true" aria-label="Drills"><p>No drills for today.</p><Button className="hz-start" onClick={() => done([], [])}>Continue</Button></section>;

  const drill = drills[Math.min(index, drills.length - 1)];
  const range = drillRange(drill);
  const answerKeys = queries.flatMap((r) => (r.data?.verses ?? []).filter((v) => range && v.chapter === range.sura && v.number >= range.first && v.number <= range.last).flatMap((v) => v.words.filter((w) => !w.end).map((w) => w.key)));
  const verseWords = (key: string): string[] => {
    for (const r of queries) for (const v of r.data?.verses ?? []) if (v.key === key) return v.words.filter((w) => !w.end).map((w) => w.text);
    return [];
  };

  function answer(ok: boolean) {
    const key = drillKey(drill);
    if (ok) setPassed((l) => [...l, key]);
    else setFailed((l) => [...l, key]);
    setRevealed(false);
    if (index + 1 >= drills.length) {
      done(ok ? [...passed, key] : passed, ok ? failed : [...failed, key]);
    } else setIndex((i) => i + 1);
  }

  return (
    <section className="hz-sheet" role="dialog" aria-modal="true" aria-label={`Drill ${index + 1} of ${drills.length}`}>
      <header>
        <h2>Drill {index + 1} of {drills.length}</h2>
        <span className="label-caps">{drillTitle(drill)}</span>
      </header>
      <div className="hz-drill">
        <DrillBody drill={drill} revealed={revealed} verseWords={verseWords} />
        {range && <PracticeVoice key={index} ranges={[range]} wordKeys={answerKeys} onCorrect={()=>answer(true)}/>}
        {!revealed ? (
          <Button className="hz-start" onClick={() => setRevealed(true)}>Show the answer</Button>
        ) : (
          <div className="hz-drill-actions">
            <Button variant="outline" onClick={() => answer(false)}><X size={16} /> Missed it</Button>
            <Button className="hz-primary" onClick={() => answer(true)}><Check size={16} /> Got it</Button>
          </div>
        )}
      </div>
    </section>
  );
}

function drillKey(d: Drill): string {
  switch (d.kind) {
    case "cue": return d.verse;
    case "transition": return `t:${d.to}`;
    case "randomEntry": return d.startVerse;
    case "before": return d.answer;
    case "pageStart": return d.answerVerse;
    case "listen": return d.verse;
    case "mutashabih": return `m:${d.a}>${d.b}`;
  }
}

function drillTitle(d: Drill): string {
  switch (d.kind) {
    case "cue": return "Continue the ayah";
    case "transition": return "Into the next ayah";
    case "randomEntry": return "Start anywhere";
    case "before": return "What comes before?";
    case "pageStart": return "How does the page begin?";
    case "listen": return "Continue after the qari";
    case "mutashabih": return "Similar verses";
  }
}

function DrillBody({ drill, revealed, verseWords }: { drill: Drill; revealed: boolean; verseWords: (key: string) => string[] }) {
  const words = (key: string, shown: number, total?: number) => {
    const list = verseWords(key);
    return list.map((w, i) => {
      const hide = !revealed && i >= shown && (total === undefined || i < shown + total);
      return <span key={i} className={hide ? "hz-hidden-word" : ""}> {w}</span>;
    });
  };
  switch (drill.kind) {
    case "cue":
      return <p className="hz-drill-words">{words(drill.verse, drill.showWords)}</p>;
    case "transition": {
      const from = verseWords(drill.from);
      return (
        <p className="hz-drill-words">
          {from.slice(-drill.showLastWords).map((w, i) => <span key={`f${i}`}> {w}</span>)}
          <span aria-hidden="true"> ۝ </span>
          {words(drill.to, revealed ? 999 : 0, drill.recallWords)}
        </p>
      );
    }
    case "randomEntry":
      return <p className="hz-drill-words">{words(drill.startVerse, revealed ? 999 : 1)}<small style={{ display: "block", fontSize: 12, opacity: .6 }}>Recite {drill.ayat} ayat onward from here</small></p>;
    case "before":
      return (
        <p className="hz-drill-words">
          {!revealed && <small style={{ display: "block", fontSize: 12, opacity: .6 }}>Which ayah comes before this one?</small>}
          {revealed && <span style={{ display: "block" }}>{words(drill.answer, 999)}</span>}
          <span style={{ opacity: .55, display: "block" }}>{words(drill.shown, 999)}</span>
        </p>
      );
    case "pageStart":
      return (
        <p className="hz-drill-words">
          <small style={{ display: "block", fontSize: 12, opacity: .6 }}>How does page {drill.page} begin?</small>
          {revealed ? words(drill.answerVerse, 999) : <span className="hz-hidden-word"> …</span>}
        </p>
      );
    case "listen":
      return <p className="hz-drill-words">{words(drill.verse, drill.stopAfterWord)}</p>;
    case "mutashabih": {
      const a = verseWords(drill.a);
      const b = verseWords(drill.b);
      const diff = new Set<number>();
      for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) diff.add(i);
      return (
        <div>
          <p className="hz-drill-words">{a.map((w, i) => <span key={`a${i}`} className={revealed && diff.has(i) ? "hz-diff" : ""}> {w}</span>)}</p>
          <p className="hz-drill-words">{b.map((w, i) => <span key={`b${i}`} className={revealed && diff.has(i) ? "hz-diff" : ""}> {w}</span>)}</p>
        </div>
      );
    }
  }
}
