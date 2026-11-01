import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Check, ChevronLeft, ChevronRight, Mic, Pause, Play, RotateCcw, X, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/Portal";
import { BottomNav } from "@/components/BottomNav";
import { Choice, ReciteSettings } from "@/components/recite/ReciteSettings";
import { loadPageFont, reciteChaptersOptions, recitePageOptions } from "@/lib/recite/data";
import { freshRecite, markedWords, nextWord, pageWords, readRecite, revealed, revealAyah, revealNext, restartPage, saveRecite, WORD_STATES, type ReciteWord, type SavedRecite, type WordState } from "@/lib/recite/model";
import { getChapterAudio } from "@/lib/quran";
import { quranPlayer } from "@/lib/quran-player";
import { recitationPlayer } from "@/lib/recitation-player";
import { triggerHaptic } from "@/lib/theme";
import { DEFAULT_BACKGROUNDS } from "@/lib/backgrounds";

export const Route = createFileRoute("/app/hifz")({
  head: () => ({ meta: [
    { title: "Hifz · Recite, Sahih Al-Adhkar" }, { name: "description", content: "A quiet Madani mushaf recitation page with self-check, word marks and qari audio." },
    { property: "og:title", content: "Hifz · Recite, Sahih Al-Adhkar" }, { property: "og:description", content: "Practice Quran recitation one word at a time on a real Madani mushaf page." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: async ({ context }) => { await Promise.all([context.queryClient.ensureQueryData(recitePageOptions(562)), context.queryClient.ensureQueryData(reciteChaptersOptions)]); },
  component: Recite,
});

function Recite() {
  const navigate = useNavigate();
  const initial = useSuspenseQuery(recitePageOptions(562)).data;
  const chapters = useSuspenseQuery(reciteChaptersOptions).data;
  const [saved, setSaved] = useState<SavedRecite>(freshRecite);
  const latest = useRef(saved);
  latest.current = saved;
  const paperRef = useRef<HTMLDivElement | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<"ready" | "active" | "paused">("ready");
  const [mode, setMode] = useState("self");
  const [sheet, setSheet] = useState<"settings" | "ai" | "marks" | "complete" | null>(null);
  const [gradeAyah, setGradeAyah] = useState<string | null>(null);
  const [font, setFont] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [peek, setPeek] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const longTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longUsed = useRef(false);
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [devStep, setDevStep] = useState(-1);
  const pageQuery = useQuery({ ...recitePageOptions(saved.page), initialData: saved.page === 562 ? initial : undefined });
  const page = pageQuery.data;
  const words = page ? pageWords(page) : [];
  const next = nextWord(words, saved.marks);
  const visible = words.filter((w) => revealed(saved.marks[w.key])).length;
  const progress = words.length ? visible / words.length : 0;
  const marks = markedWords(words, saved.marks);
  const first = page?.verses[0];
  const chapter = chapters.find((c) => c.id === first?.chapter);
  const active = status === "active";
  const update = (value: Partial<SavedRecite>) => setSaved((s) => ({ ...s, ...value }));
  useEffect(() => { setSaved(readRecite()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) saveRecite(saved); }, [saved, hydrated]);
  useLayoutEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const fit = () => {
      paper.querySelectorAll<HTMLElement>(".rc-line").forEach((line) => {
        line.style.setProperty("--rc-line-size", `${saved.settings.size}px`);
        const items = [...line.children] as HTMLElement[];
        const width = items.reduce((n, el) => n + el.scrollWidth, 0) + Math.max(0, items.length - 1) * 5;
        if (width > line.clientWidth) line.style.setProperty("--rc-line-size", `${Math.max(16, saved.settings.size * line.clientWidth / width)}px`);
      });
    };
    fit();
    const observer = new ResizeObserver(fit); observer.observe(paper);
    return () => observer.disconnect();
  }, [font, page, saved.settings.size, saved.settings.layout]);
  useEffect(() => {
    let canceled = false;
    setFont(null);
    void loadPageFont(saved.page).then((name) => { if (!canceled) setFont(name); });
    return () => { canceled = true; };
  }, [saved.page]);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSaved((s) => ({ ...s, seconds: { ...s.seconds, [s.page]: (s.seconds[s.page] ?? 0) + 1 } })), 1000);
    return () => clearInterval(id);
  }, [active]);
  useEffect(() => () => { audio.current?.pause(); if (transitionTimer.current) clearTimeout(transitionTimer.current); if (longTimer.current) clearTimeout(longTimer.current); }, []);
  function stopAudio() { audio.current?.pause(); setPlaying(false); }
  function changePage(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > 604) return;
    stopAudio(); setStatus("ready"); setSheet(null); setGradeAyah(null); setPeek(null);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    update({ page: pageNumber });
  }
  async function playWord(word: ReciteWord) {
    if (!word.audio) return;
    stopAudio(); quranPlayer.pause(); recitationPlayer.pause();
    const a = new Audio(word.audio); audio.current = a; a.playbackRate = saved.settings.speed;
    a.onended = () => setPlaying(false); a.onerror = () => { setPlaying(false); setAudioError("Audio could not play. Check your connection and try again."); };
    try { await a.play(); setPlaying(true); setAudioError(""); } catch { setAudioError("Tap again to play the qari audio."); }
  }
  async function listen() {
    if (playing) { stopAudio(); return; }
    const verse = next?.verse ?? first?.key;
    if (!verse) return;
    try {
      const chapterAudio = await getChapterAudio(saved.settings.reciter, Number(verse.split(":")[0]));
      const timing = chapterAudio.timings.find((t) => t.key === verse);
      if (!timing) throw new Error("No verse timing");
      stopAudio(); quranPlayer.pause(); recitationPlayer.pause();
      const a = new Audio(chapterAudio.url); audio.current = a; a.playbackRate = saved.settings.speed;
      let repeats = 0;
      a.onloadedmetadata = () => { a.currentTime = timing.from / 1000; };
      a.ontimeupdate = () => {
        if (a.currentTime >= timing.to / 1000) {
          repeats++;
          if (saved.settings.repeat === "∞" || repeats < Number(saved.settings.repeat)) a.currentTime = timing.from / 1000;
          else { a.pause(); setPlaying(false); }
        }
      };
      a.onerror = () => { setPlaying(false); setAudioError("Audio could not play. Please try again."); };
      await a.play(); setPlaying(true); setAudioError("");
    } catch { setAudioError("Qari audio is unavailable right now. Please try again."); }
  }
  function commitReveal(all: boolean) {
    const current = latest.current;
    const pending = nextWord(words, current.marks);
    if (!pending || !page) return;
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    const updated = all ? revealAyah(words, current.marks) : revealNext(words, current.marks);
    update({ marks: updated }); void triggerHaptic("light");
    if (words.filter((w) => w.verse === pending.verse).every((w) => revealed(updated[w.key]))) {
      setStatus("paused"); setGradeAyah(pending.verse);
    }
  }
  function horizon() {
    if (longUsed.current) { longUsed.current = false; return; }
    if (mode === "ai") { setSheet("ai"); return; }
    if (status !== "active") { setStatus("active"); return; }
    if (!next) { setSheet("complete"); setStatus("paused"); return; }
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    if (!saved.settings.mist) { commitReveal(false); return; }
    update({ marks: { ...saved.marks, [next.key]: "in_progress" } });
    transitionTimer.current = setTimeout(() => commitReveal(false), 220);
  }
  function mark(word: ReciteWord) {
    const state = saved.marks[word.key];
    if (state === "unsure") { void playWord(word); return; }
    if (revealed(state)) { update({ marks: { ...saved.marks, [word.key]: state === "wrong" ? "correct" : "wrong" } }); return; }
    if (saved.settings.hints === "peek") { setPeek(word.key); setTimeout(() => setPeek(null), 1500); }
    else if (saved.settings.hints === "letter") setPeek(word.key);
  }
  function grade(value: "Easy" | "Okay" | "Hard") {
    if (!gradeAyah) return;
    update({ grades: { ...saved.grades, [gradeAyah]: value } }); setGradeAyah(null);
    if (!next) { setSheet("complete"); setStatus("paused"); } else setStatus("active");
  }
  function devPreview() {
    const n = (devStep + 1) % 6; setDevStep(n);
    const updated = { ...saved.marks }; words.forEach((w, i) => { updated[w.key] = WORD_STATES[(n + i) % 6]; });
    update({ marks: updated });
  }
  const wordNode = (word: ReciteWord) => {
    if (word.end) return saved.settings.numbers ? <span key={word.key} className={`rc-ayah-end ${words.filter((w) => w.verse === word.verse).every((w) => revealed(saved.marks[w.key])) ? "is-finished" : ""}`} aria-label={`Ayah ${word.text}`}>{font ? word.glyph : `۝${word.text}`}</span> : null;
    const state: WordState = saved.marks[word.key] ?? "pending";
    const hint = peek === word.key;
    return <Button variant="ghost" key={word.key} className={`rc-word rc-${state} ${hint ? "rc-peek" : ""}`} onClick={() => mark(word)} aria-label={`Word ${word.key}, ${state}`} data-word={word.key} data-state={state}>
      <span className="rc-word-ink">{hint && saved.settings.hints === "letter" ? word.text.replace(/[\u064b-\u065f\u0670]/g, "").slice(0, 1) : font ? word.glyph : word.text}</span>
      {(state === "wrong" || state === "skipped" || state === "unsure") && <span className="rc-word-note">{state === "wrong" ? word.text : state === "skipped" ? "skipped" : "?"}</span>}
    </Button>;
  };
  const lineWords = (line: number) => page?.verses.flatMap((v) => v.words).filter((w) => w.line === line) ?? [];
  const renderLine = (line: number) => {
    const lineItems = lineWords(line);
    const surahStart = page?.verses.find((v) => v.number === 1 && v.words[0]?.line === line + 2);
    if (surahStart) return <div key={line} className="rc-surah-frame"><span className="rc-rosette">۞</span><span className="rc-arabic">سُورَةُ {chapters.find((c) => c.id === surahStart.chapter)?.name_arabic}</span><span className="rc-rosette">۞</span></div>;
    const bismillah = page?.verses.find((v) => v.number === 1 && v.chapter !== 9 && v.chapter !== 1 && v.words[0]?.line === line + 1);
    if (bismillah) return <div key={line} className="rc-bismillah rc-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>;
    return <div key={line} className={`rc-line ${lineItems.length < 5 ? "rc-short-line" : ""}`} dir="rtl">{lineItems.map(wordNode)}</div>;
  };
  return <Portal><main className={`recite-page ${active ? "rc-focus" : ""} ${!saved.settings.mist ? "rc-no-motion" : ""}`} style={{ "--rc-size": `${saved.settings.size}px` } as CSSProperties}>
    <div className="rc-canvas">
      <div className="rc-landscape"><img src={DEFAULT_BACKGROUNDS.morning} width={1536} height={1024} alt="" /></div>
      <header className="rc-header"><Button variant="ghost" size="icon" aria-label={active ? "Pause recitation" : "Exit Hifz"} onClick={() => active ? (setStatus("paused"), stopAudio()) : void navigate({ to: "/app/more" })}>{active ? <X /> : <ChevronLeft />}</Button><div><span className="rc-eyebrow">{active ? "" : "HIFZ · RECITE"}</span><h1>{chapter?.name_simple ?? "Quran"} <span>· p.{saved.page}</span></h1></div><Button variant="ghost" size="icon" aria-label="Page settings" onClick={() => { if (active) setStatus("paused"); setSheet("settings"); }}>Aa</Button></header>
      {!active && <div className="rc-top-controls"><Choice label="Recitation mode" value={mode} onChange={setMode} options={[{ value: "self", label: "Self check" }, { value: "ai", label: "AI check · soon" }]} /><div className="rc-page-select"><Button variant="ghost" size="icon" aria-label="Previous page" disabled={saved.page === 1} onClick={() => changePage(saved.page - 1)}><ChevronLeft /></Button><label>Page <input type="number" aria-label="Mushaf page number" min="1" max="604" value={saved.page} onChange={(e) => changePage(Number(e.target.value))} /> / 604</label><Button variant="ghost" size="icon" aria-label="Next page" disabled={saved.page === 604} onClick={() => changePage(saved.page + 1)}><ChevronRight /></Button></div></div>}
      <div className="rc-paper" ref={paperRef} onTouchStart={(e) => { const t = e.touches[0]; swipe.current = { x: t.clientX, y: t.clientY }; }} onTouchEnd={(e) => { const start = swipe.current; const t = e.changedTouches[0]; if (start && Math.abs(t.clientX - start.x) > 65 && Math.abs(t.clientY - start.y) < 65) changePage(saved.page + (t.clientX < start.x ? 1 : -1)); swipe.current = null; }}>
        <div className="rc-margins"><span>الجزء {first?.juz ?? "—"}</span><span>{saved.page}</span></div>
        {pageQuery.isPending ? <div className="rc-loading">Loading mushaf page…</div> : pageQuery.isError ? <div className="rc-loading">{pageQuery.error.message}<Button variant="outline" onClick={() => void pageQuery.refetch()}>Try again</Button></div> : <>
          <div className={`rc-mushaf ${font ? "rc-glyphs" : ""}`} style={{ fontFamily: font ?? undefined }}>
            {saved.settings.layout === "mushaf" ? Array.from({ length: 15 }, (_, i) => renderLine(i + 1)) : page?.verses.map((verse) => <section className="rc-verse" key={verse.key}><div className="rc-verse-words" dir="rtl">{verse.words.map(wordNode)}</div>{(saved.settings.translation || saved.settings.layout === "translation") && <p className="rc-translation">{verse.translation}</p>}{saved.settings.transliteration && <p className="rc-translation">{verse.words.filter((w) => !w.end).map((w) => w.transliteration).join(" ")}</p>}</section>)}
          </div>
          {saved.settings.layout === "mushaf" && (saved.settings.translation || saved.settings.transliteration) && <div className="rc-caption">{saved.settings.translation && <p>{page?.verses.find((v) => v.key === (next?.verse ?? first?.key))?.translation}</p>}{saved.settings.transliteration && <p>{page?.verses.find((v) => v.key === (next?.verse ?? first?.key))?.words.filter((w) => !w.end).map((w) => w.transliteration).join(" ")}</p>}</div>}
        </>}
        <footer className="rc-disclaimer">AI feedback can be wrong and does not replace a qualified teacher.</footer>
      </div>
      {import.meta.env.DEV && <details className="rc-dev"><summary>Developer preview</summary><Button variant="outline" onClick={devPreview}>Cycle six word states</Button></details>}
    </div>
    <div className="rc-dock">
      {status === "paused" && !gradeAyah && !sheet && <div className="rc-pause-tools"><Button variant="ghost" onClick={() => setStatus("active")}><Play />Resume</Button><Button variant="ghost" onClick={() => { stopAudio(); update({ marks: restartPage(words, saved.marks), grades: Object.fromEntries(Object.entries(saved.grades).filter(([key]) => !page?.verses.some((v) => v.key === key))), seconds: { ...saved.seconds, [saved.page]: 0 } }); setStatus("ready"); }}><RotateCcw />Restart page</Button><Button variant="ghost" onClick={() => void listen()}>{playing ? <Pause /> : <Play />}Qari</Button><Button variant="ghost" onClick={() => setSheet("marks")}><Flag />Marks</Button></div>}
      {audioError && <p className="rc-audio-error" role="alert">{audioError}</p>}
      <Button className="rc-horizon" disabled={!page || pageQuery.isPending || !!gradeAyah || !!sheet} onClick={horizon}
        onPointerDown={() => { longUsed.current = false; if (active && mode === "self") longTimer.current = setTimeout(() => { longUsed.current = true; commitReveal(true); }, 650); }}
        onPointerUp={() => { if (longTimer.current) clearTimeout(longTimer.current); }} onPointerLeave={() => { if (longTimer.current) clearTimeout(longTimer.current); }} onPointerCancel={() => { if (longTimer.current) clearTimeout(longTimer.current); }}>
        <span className="rc-horizon-bars" aria-hidden="true">{Array.from({ length: 37 }, (_, i) => <i key={i} style={{ height: `${5 + Math.sin(i * 0.6) ** 2 * 16}px` }} />)}</span><span>{mode === "ai" ? <><Mic />Tap to recite</> : status === "ready" ? "Tap to begin" : status === "paused" ? "Resume" : "Reveal next word"}</span><span className="rc-dock-progress">{Math.round(progress * 100)}% · {Math.floor((saved.seconds[saved.page] ?? 0) / 60)}:{String((saved.seconds[saved.page] ?? 0) % 60).padStart(2, "0")}</span>
      </Button>
      <div className="rc-nav-wrap"><BottomNav /></div>
    </div>
    {(sheet || gradeAyah) && <div className="rc-backdrop" onClick={() => { if (!gradeAyah) setSheet(null); }}>
      <div onClick={(e) => e.stopPropagation()}>
        {sheet === "settings" && <ReciteSettings settings={saved.settings} change={(settings) => setSaved((s) => ({ ...s, settings: { ...s.settings, ...settings } }))} close={() => setSheet(null)} />}
        {sheet === "ai" && <section className="rc-sheet" role="dialog" aria-modal="true" aria-label="AI check"><Mic className="rc-sheet-icon" /><h2>AI recitation checking is coming soon.</h2><p>Self check</p><Button className="rc-primary" onClick={() => { setMode("self"); setSheet(null); }}>Use self check</Button></section>}
        {gradeAyah && <section className="rc-sheet" role="dialog" aria-modal="true" aria-label="Ayah self check"><span className="rc-eyebrow">AYAH {gradeAyah}</span><h2>How did it go?</h2><div className="rc-grade-options">{(["Easy", "Okay", "Hard"] as const).map((g) => <Button variant="outline" key={g} onClick={() => grade(g)}>{g}</Button>)}</div><div className="rc-check-words" dir="rtl">{words.filter((w) => w.verse === gradeAyah).map((w) => <Button variant="ghost" className={`rc-arabic ${saved.marks[w.key] === "wrong" ? "rc-check-wrong" : ""}`} key={w.key} onClick={() => mark(w)} aria-label={`Mark ${w.key} as mistake`}>{w.text}</Button>)}</div></section>}
        {sheet === "marks" && <section className="rc-sheet rc-marks" role="dialog" aria-modal="true" aria-label="Review marks"><header><h2>Review marks</h2><Button variant="ghost" size="icon" aria-label="Close marks" onClick={() => setSheet(null)}><X /></Button></header>{!marks.length && <p>No marks on this page.</p>}{marks.map((w) => <div className="rc-mark-row" key={w.key}><Button variant="ghost" className="rc-arabic" onClick={() => void playWord(w)}>{w.text}<Play /></Button><small>{w.verse}</small><select aria-label={`State for ${w.key}`} value={saved.marks[w.key]} onChange={(e) => update({ marks: { ...saved.marks, [w.key]: e.target.value as WordState } })}>{["wrong", "skipped", "unsure", "correct"].map((s) => <option key={s}>{s}</option>)}</select></div>)}</section>}
        {sheet === "complete" && <section className="rc-sheet rc-complete" role="dialog" aria-modal="true" aria-label="Page complete"><Check className="rc-sheet-icon" /><h2>Page complete</h2><p>{visible} words · {marks.length} marks · {Math.ceil((saved.seconds[saved.page] ?? 0) / 60)} min</p><Button className="rc-primary" onClick={() => setSheet("marks")}>Review marks</Button><Button variant="outline" disabled={saved.page === 604} onClick={() => changePage(saved.page + 1)}>Next page</Button></section>}
      </div>
    </div>}
  </main></Portal>;
}