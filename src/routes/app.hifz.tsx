import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Check, ChevronLeft, ChevronRight, Mic, Pause, Play, RotateCcw, X, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/Portal";
import { BottomNav } from "@/components/BottomNav";
import { ReciteSettings } from "@/components/recite/ReciteSettings";
import { loadPageFont, reciteChaptersOptions, recitePageOptions } from "@/lib/recite/data";
import { freshRecite, markedWords, nextWord, pageWords, readRecite, revealed, revealAyah, revealNext, restartPage, saveRecite, isOpeningWord, type ReciteWord, type SavedRecite, type WordState } from "@/lib/recite/model";
import { getChapterAudio } from "@/lib/quran";
import { quranPlayer } from "@/lib/quran-player";
import { recitationPlayer } from "@/lib/recitation-player";
import { triggerHaptic } from "@/lib/theme";
import { MushafThemeProvider, MushafFrame, MushafLabel, MushafPageNumber, SurahCartouche, AyahMarker, toArabicDigits } from "@/components/mushaf/MushafPage";
import { ReciteStrip } from "@/components/mushaf/ReciteStrip";
import { getPresetId, resolveVisualPhase, type VisualPhase } from "@/lib/theme-store";
import { TajweedText } from "@/lib/tajweed";
import "@/components/recite/supplied-mushaf.css";
import { mushafThemeId } from "@/components/recite/mushaf-theme";
import { CONTROLS_IDLE_MS, pageGesture, type PagePointer } from "@/components/recite/page-gesture";

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
  const [paperElement, setPaperElement] = useState<HTMLDivElement | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [status, setStatus] = useState<"ready" | "active" | "paused">("ready");
  const mode = saved.settings.mode;
  const [controls, setControls] = useState(false);
  const [appTheme, setAppTheme] = useState("original");
  const [morningOrEvening, setMorningOrEvening] = useState<VisualPhase>("morning");
  const [sheet, setSheet] = useState<"settings" | "ai" | "marks" | "complete" | null>(null);
  const [gradeAyah, setGradeAyah] = useState<string | null>(null);
  const [font, setFont] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [peek, setPeek] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const pointer = useRef<PagePointer | null>(null);
  const touching = useRef(false);
  const [touchActivity, setTouchActivity] = useState(0);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pageQuery = useQuery({ ...recitePageOptions(saved.page), initialData: saved.page === 562 ? initial : undefined });
  const page = pageQuery.data;
  const words = page ? pageWords(page) : [];
  const next = nextWord(words, saved.marks);
  const visible = words.filter((w) => revealed(saved.marks[w.key])).length;

  const marks = markedWords(words, saved.marks);
  const first = page?.verses[0];
  const chapter = chapters.find((c) => c.id === first?.chapter);
  const active = status === "active";
  const update = (value: Partial<SavedRecite>) => setSaved((s) => ({ ...s, ...value }));
  useEffect(() => { setSaved(readRecite()); setHydrated(true); }, []);
  useEffect(() => {
    const sync = () => {
      setAppTheme(mushafThemeId(getPresetId()));
      setMorningOrEvening(resolveVisualPhase("/app/hifz"));
    };
    sync();
    window.addEventListener("adhkar:theme-change", sync);
    window.addEventListener("adhkar:visual-phase-change", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("adhkar:theme-change", sync); window.removeEventListener("adhkar:visual-phase-change", sync); window.removeEventListener("storage", sync); };
  }, []);
  useEffect(() => { if (hydrated) saveRecite(saved); }, [saved, hydrated]);
  useEffect(() => {
    if (!controls || sheet || gradeAyah || touching.current) return;
    const timer = setTimeout(() => setControls(false), CONTROLS_IDLE_MS);
    return () => clearTimeout(timer);
  }, [controls, sheet, gradeAyah, touchActivity]);
  useLayoutEffect(() => {
    const paper = paperElement;
    if (!paper) return;
    const fit = () => {
      paper.querySelectorAll<HTMLElement>(".rc-line").forEach((line) => {
        const baseSize = saved.settings.layout === "mushaf" ? Math.min(line.clientHeight * .72, line.clientWidth / 10.5) : saved.settings.size;
        line.style.setProperty("--rc-line-size", `${baseSize}px`);
        const items = [...line.children] as HTMLElement[];
        let size = baseSize;
        for (let attempt = 0; attempt < 5; attempt++) {
          const width = items.reduce((n, el) => n + el.getBoundingClientRect().width, 0) + Math.max(0, items.length - 1) * 2;
          if (width <= line.clientWidth) break;
          size *= (line.clientWidth - 3) / width;
          line.style.setProperty("--rc-line-size", `${size}px`);
        }
      });
    };
    fit();
    const observer = new ResizeObserver(fit); observer.observe(paper);
    return () => observer.disconnect();
  }, [paperElement, font, page, saved.settings.size, saved.settings.layout, saved.settings.tajweed]);
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
  useEffect(() => () => { audio.current?.pause(); if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);
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
    if (mode === "ai") { setSheet("ai"); return; }
    if (status === "paused") { setStatus("active"); return; }
    if (status === "ready") setStatus("active");
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
  const wordNode = (word: ReciteWord) => {
    if (word.end) return saved.settings.numbers ? <span key={word.key} className="rc-ayah-end" aria-label={`Ayah ${word.verse.split(":")[1]}`}><AyahMarker number={Number(word.verse.split(":")[1])} size={18} done={words.filter((w) => w.verse === word.verse).every((w) => revealed(saved.marks[w.key]))} /></span> : null;
    const state: WordState = saved.marks[word.key] ?? "pending";
    const hint = peek === word.key || isOpeningWord(word, words, saved.settings.hideAmount);
    return <Button variant="ghost" key={word.key} className={`rc-word rc-${state} ${hint ? "rc-peek" : ""}`} onPointerUp={(e) => {
      const start = pointer.current;
      if (mode !== "self" || !revealed(state) || !start || start.id !== e.pointerId || pageGesture(start, e.clientX, e.clientY, e.timeStamp) !== "tap") return;
      e.stopPropagation(); pointer.current = null; mark(word);
    }} onClick={(e) => { if (e.detail === 0 && mode === "self" && revealed(state)) mark(word); }} aria-label={`Word ${word.key}, ${state}`} data-word={word.key} data-state={state}>
      <span className="rc-word-ink">{saved.settings.tajweed && word.tajweed ? <span className="rc-tajweed-text"><TajweedText markup={word.tajweed} /></span> : font && saved.settings.layout === "mushaf" ? word.glyph : word.text}</span>
      {(state === "wrong" || state === "skipped" || state === "unsure") && <span className="rc-word-note">{state === "wrong" ? word.text : state === "skipped" ? "skipped" : "?"}</span>}
    </Button>;
  };
  const lineWords = (line: number) => page?.verses.flatMap((v) => v.words).filter((w) => w.line === line) ?? [];
  const renderLine = (line: number) => {
    const lineItems = lineWords(line);
    const surahStart = page?.verses.find((v) => v.number === 1 && v.words[0]?.line === line + 2);
    if (surahStart) return <div key={line} className="rc-cartouche"><SurahCartouche name={`سُورَةُ ${chapters.find((c) => c.id === surahStart.chapter)?.name_arabic ?? ""}`} height={30} /></div>;
    const bismillah = page?.verses.find((v) => v.number === 1 && v.chapter !== 9 && v.chapter !== 1 && v.words[0]?.line === line + 1);
    if (bismillah) return <div key={line} className="rc-bismillah rc-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>;
    return <div key={line} className={`rc-line ${saved.page <= 2 ? "rc-short-line" : ""}`} dir="rtl">{lineItems.map(wordNode)}</div>;
  };
  return <Portal><MushafThemeProvider theme={appTheme} mode={morningOrEvening} className={`recite-page rc-supplied rc-hide-${saved.settings.hideStyle} ${controls ? "rc-controls-visible" : ""} ${saved.settings.theme === "night" ? "rc-night" : ""}`} style={{ "--rc-size": `${saved.settings.size}px`, "--m-font-quran": "var(--font-arabic)" } as CSSProperties}><main onPointerDownCapture={() => { touching.current = true; setTouchActivity((v) => v + 1); }} onPointerUpCapture={() => { touching.current = false; setTouchActivity((v) => v + 1); }} onPointerCancelCapture={() => { touching.current = false; pointer.current = null; setTouchActivity((v) => v + 1); }}>
    <header className="rc-header" aria-hidden={!controls} inert={!controls}><Button variant="ghost" size="icon" aria-label="Exit Hifz" onClick={() => void navigate({ to: "/app/more" })}><ChevronLeft /></Button><h1>{chapter?.name_simple ?? "Quran"} · {saved.page}</h1><Button variant="ghost" size="icon" aria-label="Page settings" onClick={() => setSheet("settings")}>Aa</Button></header>
    <div className="rc-canvas" onPointerDownCapture={(e) => {
      if (!e.isPrimary || e.button !== 0) { pointer.current = null; return; }
      pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY, time: e.timeStamp, distance: 0 };
    }} onPointerMoveCapture={(e) => {
      const start = pointer.current;
      if (start?.id === e.pointerId) start.distance = Math.max(start.distance, Math.hypot(e.clientX - start.x, e.clientY - start.y));
    }} onPointerUp={(e) => {
      const start = pointer.current;
      pointer.current = null;
      if (!start || start.id !== e.pointerId) return;
      const gesture = pageGesture(start, e.clientX, e.clientY, e.timeStamp);
      if (gesture === "tap") setControls((v) => !v);
      else if (gesture === "next" || gesture === "previous") changePage(saved.page + (gesture === "next" ? 1 : -1));
    }} onPointerCancel={() => { pointer.current = null; }}>
      <div className="rc-labels"><MushafLabel text={`الجزء ${toArabicDigits(first?.juz ?? "—")}`} height={24} /><MushafLabel text={`سُورَةُ ${chapter?.name_arabic ?? "—"}`} height={24} /></div>
      <div className={`rc-paper ${saved.settings.layout !== "mushaf" ? "rc-reflow" : ""}`} ref={setPaperElement}>
        <MushafFrame scale={0.22} className="rc-art-frame">
        {pageQuery.isPending ? <div className="rc-loading">Loading mushaf page…</div> : pageQuery.isError ? <div className="rc-loading">{pageQuery.error.message}<Button variant="outline" onClick={() => void pageQuery.refetch()}>Try again</Button></div> : <div className={`rc-mushaf ${font && saved.settings.layout === "mushaf" ? "rc-glyphs" : ""}`} style={{ fontFamily: saved.settings.layout === "mushaf" ? font ?? undefined : undefined }}>
          {saved.settings.layout === "mushaf" ? Array.from({ length: 15 }, (_, i) => renderLine(i + 1)) : page?.verses.map((verse) => <section className="rc-verse" key={verse.key}><div className="rc-verse-words" dir="rtl">{verse.words.map(wordNode)}</div>{saved.settings.translation && <p className="rc-translation">{verse.translation}</p>}{saved.settings.transliteration && <p className="rc-translation">{verse.words.filter((w) => !w.end).map((w) => w.transliteration).join(" ")}</p>}</section>)}
        </div>}
        </MushafFrame>
        <div className="rc-page-badge"><MushafPageNumber page={saved.page} height={24} /></div>
      </div>
    </div>
    <div className="rc-dock">
      {controls && <div className="rc-page-select"><Button variant="ghost" size="icon" aria-label="Previous page" disabled={saved.page === 1} onClick={() => changePage(saved.page - 1)}><ChevronLeft /></Button><label>Page <input type="number" aria-label="Mushaf page number" min="1" max="604" value={saved.page} onChange={(e) => changePage(Number(e.target.value))} /> / 604</label><Button variant="ghost" size="icon" aria-label="Next page" disabled={saved.page === 604} onClick={() => changePage(saved.page + 1)}><ChevronRight /></Button></div>}
      {controls && status === "paused" && !gradeAyah && !sheet && <div className="rc-pause-tools"><Button variant="ghost" onClick={() => setStatus("active")}><Play />Resume</Button><Button variant="ghost" onClick={() => { stopAudio(); update({ marks: restartPage(words, saved.marks), grades: Object.fromEntries(Object.entries(saved.grades).filter(([key]) => !page?.verses.some((v) => v.key === key))), seconds: { ...saved.seconds, [saved.page]: 0 } }); setStatus("ready"); }}><RotateCcw />Restart page</Button><Button variant="ghost" onClick={() => void listen()}>{playing ? <Pause /> : <Play />}Qari</Button><Button variant="ghost" onClick={() => setSheet("marks")}><Flag />Marks</Button></div>}
      {audioError && <p className="rc-audio-error" role="alert">{audioError}</p>}
      <div className="rc-strip-wrap" inert={!page || pageQuery.isPending || !!gradeAyah || !!sheet}>
        <ReciteStrip state={status === "paused" ? "paused" : "idle"} label={mode === "ai" ? "Tap to recite" : status === "paused" ? "Resume recitation" : "Tap to reveal"} time={`${Math.floor((saved.seconds[saved.page] ?? 0) / 60)}:${String((saved.seconds[saved.page] ?? 0) % 60).padStart(2, "0")}`} onTap={horizon} onLongPress={() => { if (status !== "paused" && mode === "self") { setStatus("active"); commitReveal(true); } }} />
      </div>
    </div>
    <div className="rc-nav-wrap" aria-hidden={!controls} inert={!controls}><BottomNav /></div>
    {(sheet || gradeAyah) && <div className="rc-backdrop" onClick={() => { if (!gradeAyah) setSheet(null); }}>
      <div onClick={(e) => e.stopPropagation()}>
        {sheet === "settings" && <ReciteSettings settings={saved.settings} change={(settings) => setSaved((s) => ({ ...s, settings: { ...s.settings, ...settings } }))} close={() => setSheet(null)} />}
        {sheet === "ai" && <section className="rc-sheet" role="dialog" aria-modal="true" aria-label="AI check"><Mic className="rc-sheet-icon" /><h2>AI recitation checking is coming soon.</h2><p>Self check</p><Button className="rc-primary" onClick={() => { setSaved((s) => ({ ...s, settings: { ...s.settings, mode: "self" } })); setSheet(null); }}>Use self check</Button></section>}
        {gradeAyah && <section className="rc-sheet" role="dialog" aria-modal="true" aria-label="Ayah self check"><span className="rc-eyebrow">AYAH {gradeAyah}</span><h2>How did it go?</h2><div className="rc-grade-options">{(["Easy", "Okay", "Hard"] as const).map((g) => <Button variant="outline" key={g} onClick={() => grade(g)}>{g}</Button>)}</div><div className="rc-check-words" dir="rtl">{words.filter((w) => w.verse === gradeAyah).map((w) => <Button variant="ghost" className={`rc-arabic ${saved.marks[w.key] === "wrong" ? "rc-check-wrong" : ""}`} key={w.key} onClick={() => mark(w)} aria-label={`Mark ${w.key} as mistake`}>{w.text}</Button>)}</div></section>}
        {sheet === "marks" && <section className="rc-sheet rc-marks" role="dialog" aria-modal="true" aria-label="Review marks"><header><h2>Review marks</h2><Button variant="ghost" size="icon" aria-label="Close marks" onClick={() => setSheet(null)}><X /></Button></header>{!marks.length && <p>No marks on this page.</p>}{marks.map((w) => <div className="rc-mark-row" key={w.key}><Button variant="ghost" className="rc-arabic" onClick={() => void playWord(w)}>{w.text}<Play /></Button><small>{w.verse}</small><select aria-label={`State for ${w.key}`} value={saved.marks[w.key]} onChange={(e) => update({ marks: { ...saved.marks, [w.key]: e.target.value as WordState } })}>{["wrong", "skipped", "unsure", "correct"].map((s) => <option key={s}>{s}</option>)}</select></div>)}</section>}
        {sheet === "complete" && <section className="rc-sheet rc-complete" role="dialog" aria-modal="true" aria-label="Page complete"><Check className="rc-sheet-icon" /><h2>Page complete</h2><p>{visible} words · {marks.length} marks · {Math.ceil((saved.seconds[saved.page] ?? 0) / 60)} min</p><Button className="rc-primary" onClick={() => setSheet("marks")}>Review marks</Button><Button variant="outline" disabled={saved.page === 604} onClick={() => changePage(saved.page + 1)}>Next page</Button></section>}
      </div>
    </div>}
  </main></MushafThemeProvider></Portal>;
}