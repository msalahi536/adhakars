import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useHifzBeta } from "@/lib/hifz-beta";
import { Check, ChevronLeft, Mic, Pause, Play, RotateCcw, X, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/Portal";
import { BottomNav } from "@/components/BottomNav";
import { ReciteSettings } from "@/components/recite/ReciteSettings";
import { PageNavigation } from "@/components/recite/PageNavigation";
import { loadPageFont, reciteChaptersOptions, recitePageOptions } from "@/lib/recite/data";
import { freshRecite, markedWords, nextWord, pageWords, readRecite, revealed, revealAyah, revealNext, restartPage, saveRecite, isOpeningWord, type ReciteWord, type SavedRecite, type WordState } from "@/lib/recite/model";
import { getChapterAudio } from "@/lib/quran";
import { quranPlayer } from "@/lib/quran-player";
import { recitationPlayer } from "@/lib/recitation-player";
import { play as playFeedback, configureHifzFeedback, cancelHifzFeedback } from "@/lib/hifzHaptics";
import { MushafThemeProvider, MushafFrame, MushafLabel, MushafPageNumber, SurahCartouche, AyahMarker, toArabicDigits } from "@/components/mushaf/MushafPage";
import { ReciteStrip } from "@/components/mushaf/ReciteStrip";
import { getPresetId, resolveVisualPhase, type VisualPhase } from "@/lib/theme-store";
import { parseTajweed, TajweedText } from "@/lib/tajweed";
import "@/components/recite/supplied-mushaf.css";
import { mushafThemeId } from "@/components/recite/mushaf-theme";
import { CONTROLS_IDLE_MS, pageGesture, rubberBand, swipeTarget, type PagePointer } from "@/components/recite/page-gesture";

export const Route = createFileRoute("/app/hifz")({
  head: () => ({ meta: [
    { title: "Hifz · Recite, Sahih Al-Adhkar" }, { name: "description", content: "A quiet Madani mushaf recitation page with self-check, word marks and qari audio." },
    { property: "og:title", content: "Hifz · Recite, Sahih Al-Adhkar" }, { property: "og:description", content: "Practice Quran recitation one word at a time on a real Madani mushaf page." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: HiddenRecite,
});

function HiddenRecite() {
  const { enabled, checked } = useHifzBeta();
  const navigate = useNavigate();
  useEffect(() => { if (checked && !enabled) void navigate({ to: "/app/more", replace: true }); }, [checked, enabled, navigate]);
  return enabled ? <Suspense fallback={null}><Recite /></Suspense> : null;
}

function Recite() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [sheet, setSheet] = useState<"settings" | "navigation" | "ai" | "marks" | "complete" | null>(null);
  const [gradeAyah, setGradeAyah] = useState<string | null>(null);
  const [loadedFont, setLoadedFont] = useState<{ page: number; name: string } | null>(null);
  const [fontAttempt, setFontAttempt] = useState(0);
  const [fontFailed, setFontFailed] = useState(false);
  const font = loadedFont?.page === saved.page ? loadedFont.name : null;
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [peek, setPeek] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const pointer = useRef<PagePointer | null>(null);
  const touching = useRef(false);
  const [touchActivity, setTouchActivity] = useState(0);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stripElement = useRef<HTMLDivElement | null>(null);
  const labelsElement = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ strip: 92, labels: 24 });
  const drag = useRef<{ axis: "pending" | "horizontal" | "vertical"; lastX: number; lastTime: number; velocity: number } | null>(null);
  const turning = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const turnAnimation = useRef<Animation | null>(null);

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
    configureHifzFeedback({ haptics: saved.settings.haptics, sounds: saved.settings.sounds });
    return cancelHifzFeedback;
  }, [saved.settings.haptics, saved.settings.sounds]);
  useEffect(() => {
    const pulse = () => {
      const strip = stripElement.current;
      if (!strip) return;
      strip.classList.remove("rc-feedback-pulse");
      void strip.offsetWidth;
      strip.classList.add("rc-feedback-pulse");
    };
    window.addEventListener("hifz:feedback-pulse", pulse);
    return () => window.removeEventListener("hifz:feedback-pulse", pulse);
  }, []);
  useLayoutEffect(() => {
    const measure = () => setDimensions({ strip: stripElement.current?.offsetHeight ?? 92, labels: labelsElement.current?.offsetHeight ?? 24 });
    const observer = new ResizeObserver(measure);
    for (const el of [stripElement.current, labelsElement.current]) if (el) observer.observe(el);
    measure();
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    for (const neighbor of [saved.page - 1, saved.page + 1]) {
      if (neighbor < 1 || neighbor > 604) continue;
      void queryClient.prefetchQuery(recitePageOptions(neighbor));
      void loadPageFont(neighbor);
    }
  }, [saved.page, queryClient]);
  useEffect(() => {
    if (!controls || sheet || gradeAyah || touching.current) return;
    const timer = setTimeout(() => setControls(false), CONTROLS_IDLE_MS);
    return () => clearTimeout(timer);
  }, [controls, sheet, gradeAyah, touchActivity]);
  useLayoutEffect(() => {
    const paper = paperElement;
    if (!paper || (saved.settings.layout === "mushaf" && !font)) return;
    const fit = () => {
      const lines = [...paper.querySelectorAll<HTMLElement>(".rc-line")];
      if (!lines.length) return;
      const apply = (size: number) => lines.forEach((line) => line.style.setProperty("--rc-line-size", `${size}px`));
      const fits = () => lines.every((line) => [...line.children].reduce((width, child) => width + child.getBoundingClientRect().width, 0) <= line.clientWidth);
      let low = 1;
      let high = paper.clientWidth;
      // One size for the entire page: the widest authentic line determines it.
      for (let attempt = 0; attempt < 18; attempt++) {
        const size = (low + high) / 2;
        apply(size);
        if (fits()) low = size; else high = size;
      }
      apply(low);
    };
    fit();
    const observer = new ResizeObserver(fit); observer.observe(paper);
    return () => observer.disconnect();
  }, [paperElement, font, page, saved.settings.size, saved.settings.layout, saved.settings.tajweed]);
  useEffect(() => {
    let canceled = false;
    setFontFailed(false);
    void loadPageFont(saved.page).then((name) => {
      if (canceled) return;
      if (name) setLoadedFont({ page: saved.page, name });
      else setFontFailed(true);
    });
    return () => { canceled = true; };
  }, [saved.page, fontAttempt]);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSaved((s) => ({ ...s, seconds: { ...s.seconds, [s.page]: (s.seconds[s.page] ?? 0) + 1 } })), 1000);
    return () => clearInterval(id);
  }, [active]);
  useEffect(() => () => { audio.current?.pause(); turnAnimation.current?.cancel(); if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);
  function stopAudio() { audio.current?.pause(); setPlaying(false); }
  function changePage(pageNumber: number, feedback = true) {
    if (pageNumber < 1 || pageNumber > 604 || pageNumber === latest.current.page) return;
    stopAudio(); setStatus("ready"); setSheet(null); setGradeAyah(null); setPeek(null);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    update({ page: pageNumber });
    if (feedback) playFeedback("pageTurn");
  }
  async function finishDrag(target: number | null, dx: number, width: number) {
    const paper = paperElement;
    if (!paper) { setDragX(0); return; }
    turning.current = true;
    setDragging(false);
    if (target) playFeedback("pageTurn");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 0 : target ? 200 : 380;
    const end = target ? Math.sign(dx) * width : 0;
    const animation = paper.animate([{ transform: `translateX(${dx}px)`, opacity: 1 }, { transform: `translateX(${end}px)`, opacity: target ? 0 : 1 }], { duration, easing: target ? "cubic-bezier(.22,.7,.3,1)" : "cubic-bezier(.18,1.2,.3,1)", fill: "forwards" });
    turnAnimation.current = animation;
    try {
      await Promise.all([animation.finished, target ? queryClient.ensureQueryData(recitePageOptions(target)) : Promise.resolve(), target ? loadPageFont(target) : Promise.resolve()]);
      if (target) {
        changePage(target, false);
        const name = await loadPageFont(target);
        if (name) setLoadedFont({ page: target, name });
      }
      animation.cancel(); setDragX(0);
      if (target) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        const entrance = paper.animate([{ transform: `translateX(${-Math.sign(dx) * width * .12}px)`, opacity: 0 }, { transform: "translateX(0)", opacity: 1 }], { duration: reduced ? 0 : 200, easing: "cubic-bezier(.22,1,.36,1)" });
        turnAnimation.current = entrance;
        await entrance.finished;
      }
    } catch { animation.cancel(); setDragX(0); }
    finally { turning.current = false; }
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
    update({ marks: updated }); playFeedback("reveal");
    if (words.filter((w) => w.verse === pending.verse).every((w) => revealed(updated[w.key]))) {
      setStatus("paused"); setGradeAyah(pending.verse); playFeedback("ayahComplete");
    }
  }
  function horizon() {
    if (mode === "ai") { setSheet("ai"); return; }
    if (status === "paused") { setStatus("active"); return; }
    if (status === "ready") setStatus("active");
    if (!next) { setSheet("complete"); setStatus("paused"); playFeedback("pageComplete"); return; }
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    if (!saved.settings.mist) { commitReveal(false); return; }
    update({ marks: { ...saved.marks, [next.key]: "in_progress" } });
    transitionTimer.current = setTimeout(() => commitReveal(false), 220);
  }
  function mark(word: ReciteWord) {
    const state = saved.marks[word.key];
    if (state === "unsure") { void playWord(word); return; }
    if (revealed(state)) { markState(word, state === "wrong" ? "correct" : "wrong"); return; }
    if (saved.settings.hints === "peek") { setPeek(word.key); setTimeout(() => setPeek(null), 1500); }
    else if (saved.settings.hints === "letter") setPeek(word.key);
  }
  function markState(word: ReciteWord, state: WordState) {
    update({ marks: { ...saved.marks, [word.key]: state } });
    if (state === "wrong") playFeedback("wrong");
    else if (state === "skipped") playFeedback("skip");
    else if (state === "unsure") playFeedback("unsure");
    else if (state === "correct") playFeedback("reveal");
  }
  function grade(value: "Easy" | "Okay" | "Hard") {
    if (!gradeAyah) return;
    update({ grades: { ...saved.grades, [gradeAyah]: value } }); setGradeAyah(null);
    if (!next) { setSheet("complete"); setStatus("paused"); playFeedback("pageComplete"); } else setStatus("active");
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
      <span className={`rc-word-ink ${saved.settings.layout === "mushaf" && saved.settings.tajweed && word.tajweed ? `rc-qcf-tj-${parseTajweed(word.tajweed).find((segment) => segment.group)?.group ?? "none"}` : ""}`}>{saved.settings.layout === "mushaf" ? word.glyph : saved.settings.tajweed && word.tajweed ? <span className="rc-tajweed-text"><TajweedText markup={word.tajweed} /></span> : word.text}</span>
      {(state === "wrong" || state === "skipped" || state === "unsure") && <span className="rc-word-note">{state === "wrong" ? word.text : state === "skipped" ? "skipped" : "?"}</span>}
    </Button>;
  };
  const lineWords = (line: number) => page?.verses.flatMap((v) => v.words).filter((w) => w.line === line) ?? [];
  const renderLine = (line: number) => {
    const lineItems = lineWords(line);
    const surahStart = page?.verses.find((v) => v.number === 1 && v.words[0]?.line === line + 2);
    if (surahStart) return <div key={line} className="rc-cartouche"><SurahCartouche name={`سُورَةُ ${chapters.find((c) => c.id === surahStart.chapter)?.name_arabic ?? ""}`} height={48} /></div>;
    const bismillah = page?.verses.find((v) => v.number === 1 && v.chapter !== 9 && v.chapter !== 1 && v.words[0]?.line === line + 1);
    if (bismillah) return <div key={line} className="rc-bismillah rc-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>;
    return <div key={line} className={`rc-line ${saved.page <= 2 ? "rc-short-line" : ""}`} dir="rtl">{lineItems.map(wordNode)}</div>;
  };
  return <Portal><MushafThemeProvider theme={appTheme} mode={morningOrEvening} className={`recite-page rc-supplied rc-hide-${saved.settings.hideStyle} ${controls ? "rc-controls-visible" : ""} ${saved.settings.theme === "night" ? "rc-night" : ""}`} style={{ "--rc-size": `${saved.settings.size}px`, "--rc-strip-height": `${dimensions.strip}px`, "--rc-label-height": `${dimensions.labels}px`, "--m-font-quran": "var(--font-arabic)" } as CSSProperties}><main onPointerDownCapture={() => { touching.current = true; setTouchActivity((v) => v + 1); }} onPointerUpCapture={() => { touching.current = false; setTouchActivity((v) => v + 1); }} onPointerCancelCapture={() => { touching.current = false; setTouchActivity((v) => v + 1); }}>
    <header className="rc-header" aria-hidden={!controls} inert={!controls}><Button variant="ghost" size="icon" aria-label="Exit Hifz" onClick={() => void navigate({ to: "/app/more" })}><ChevronLeft /></Button><Button variant="ghost" className="rc-title" aria-label="Go to page" onClick={() => setSheet("navigation")}>{chapter?.name_simple ?? "Quran"} · {saved.page}</Button><Button variant="ghost" size="icon" aria-label="Page settings" onClick={() => setSheet("settings")}>Aa</Button></header>
    <div className="rc-canvas" onPointerDownCapture={(e) => {
      if (!e.isPrimary || e.button !== 0 || turning.current) { pointer.current = null; return; }
      pointer.current = { id: e.pointerId, x: e.clientX, y: e.clientY, time: e.timeStamp, distance: 0 };
      drag.current = { axis: "pending", lastX: e.clientX, lastTime: e.timeStamp, velocity: 0 };
    }} onPointerMoveCapture={(e) => {
      const start = pointer.current;
      const current = drag.current;
      if (!start || start.id !== e.pointerId || !current) return;
      const dx = e.clientX - start.x, dy = e.clientY - start.y;
      start.distance = Math.max(start.distance, Math.hypot(dx, dy));
      if (current.axis === "pending" && start.distance >= 10) {
        current.axis = Math.abs(dx) > Math.abs(dy) * 1.3 ? "horizontal" : "vertical";
        if (current.axis === "horizontal") { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); }
      }
      const elapsed = e.timeStamp - current.lastTime;
      if (elapsed > 0) current.velocity = (e.clientX - current.lastX) / elapsed;
      current.lastX = e.clientX; current.lastTime = e.timeStamp;
      if (current.axis === "horizontal") setDragX(rubberBand(dx, saved.page, saved.settings.swipeDirection));
    }} onPointerUp={(e) => {
      const start = pointer.current;
      const current = drag.current;
      pointer.current = null;
      drag.current = null;
      if (!start || start.id !== e.pointerId) return;
      if (current?.axis === "horizontal") {
        const dx = e.clientX - start.x, dy = e.clientY - start.y, width = e.currentTarget.clientWidth;
        const velocity = e.timeStamp - current.lastTime > 100 ? 0 : current.velocity;
        void finishDrag(swipeTarget(saved.page, dx, dy, width, velocity, saved.settings.swipeDirection), rubberBand(dx, saved.page, saved.settings.swipeDirection), width);
      } else if (current?.axis !== "vertical" && pageGesture(start, e.clientX, e.clientY, e.timeStamp) === "tap") setControls((v) => !v);
    }} onPointerCancel={() => { pointer.current = null; drag.current = null; if (dragging) void finishDrag(null, dragX, paperElement?.clientWidth ?? 390); }}>
      <div className="rc-labels" ref={labelsElement}><MushafLabel text={`الجزء ${toArabicDigits(first?.juz ?? "—")}`} height={24} /><MushafLabel text={`سُورَةُ ${chapter?.name_arabic ?? "—"}`} height={24} /></div>
      <div className={`rc-paper ${dragging ? "rc-dragging" : ""} ${saved.settings.layout !== "mushaf" ? "rc-reflow" : ""}`} ref={setPaperElement} style={{ transform: `translateX(${dragX}px)` }}>
        <MushafFrame scale={0.5} className="rc-art-frame">
        {pageQuery.isPending ? <div className="rc-loading">Loading mushaf page…</div> : pageQuery.isError ? <div className="rc-loading">{pageQuery.error.message}<Button variant="outline" onClick={() => void pageQuery.refetch()}>Try again</Button></div> : saved.settings.layout === "mushaf" && !font ? <div className="rc-loading" role="status">Loading mushaf font…{fontFailed && <Button variant="outline" onClick={() => setFontAttempt((v) => v + 1)}>Try again</Button>}</div> : <div className={`rc-mushaf ${font && saved.settings.layout === "mushaf" ? "rc-glyphs" : ""}`} style={{ fontFamily: saved.settings.layout === "mushaf" ? font ?? undefined : undefined, gridTemplateRows: saved.settings.layout === "mushaf" ? Array.from({ length: 15 }, (_, i) => page?.verses.some((v) => v.number === 1 && v.words[0]?.line === i + 3) ? "48px" : "minmax(0, 1fr)").join(" ") : undefined }}>
          {saved.settings.layout === "mushaf" ? Array.from({ length: 15 }, (_, i) => renderLine(i + 1)) : page?.verses.map((verse) => <section className="rc-verse" key={verse.key}><div className="rc-verse-words" dir="rtl">{verse.words.map(wordNode)}</div>{saved.settings.translation && <p className="rc-translation">{verse.translation}</p>}{saved.settings.transliteration && <p className="rc-translation">{verse.words.filter((w) => !w.end).map((w) => w.transliteration).join(" ")}</p>}</section>)}
        </div>}
        </MushafFrame>
        <div className="rc-page-badge"><MushafPageNumber page={saved.page} height={24} /></div>
      </div>
    </div>
    <div className="rc-dock">
      {controls && status === "paused" && !gradeAyah && !sheet && <div className="rc-pause-tools"><Button variant="ghost" onClick={() => setStatus("active")}><Play />Resume</Button><Button variant="ghost" onClick={() => { stopAudio(); update({ marks: restartPage(words, saved.marks), grades: Object.fromEntries(Object.entries(saved.grades).filter(([key]) => !page?.verses.some((v) => v.key === key))), seconds: { ...saved.seconds, [saved.page]: 0 } }); setStatus("ready"); }}><RotateCcw />Restart page</Button><Button variant="ghost" onClick={() => void listen()}>{playing ? <Pause /> : <Play />}Qari</Button><Button variant="ghost" onClick={() => setSheet("marks")}><Flag />Marks</Button></div>}
      {audioError && <p className="rc-audio-error" role="alert">{audioError}</p>}
      <div className="rc-strip-wrap" ref={stripElement} aria-hidden={controls} inert={controls || !page || pageQuery.isPending || (saved.settings.layout === "mushaf" && !font) || !!gradeAyah || !!sheet}>
        <ReciteStrip state={status === "paused" ? "paused" : "idle"} label={mode === "ai" ? "Tap to recite" : status === "paused" ? "Resume recitation" : "Tap to reveal"} time={`${Math.floor((saved.seconds[saved.page] ?? 0) / 60)}:${String((saved.seconds[saved.page] ?? 0) % 60).padStart(2, "0")}`} onTap={horizon} onLongPress={() => { if (status !== "paused" && mode === "self") { setStatus("active"); commitReveal(true); } }} />
      </div>
    </div>
    <div className="rc-nav-wrap" aria-hidden={!controls} inert={!controls}><BottomNav /></div>
    {(sheet || gradeAyah) && <div className="rc-backdrop" onClick={() => { if (!gradeAyah) setSheet(null); }}>
      <div onClick={(e) => e.stopPropagation()}>
        {sheet === "settings" && <ReciteSettings settings={saved.settings} change={(settings) => setSaved((s) => ({ ...s, settings: { ...s.settings, ...settings } }))} close={() => setSheet(null)} />}
        {sheet === "navigation" && <PageNavigation page={saved.page} chapter={first?.chapter} juz={first?.juz} chapters={chapters} go={changePage} close={() => setSheet(null)} />}
        {sheet === "ai" && <section className="rc-sheet" role="dialog" aria-modal="true" aria-label="AI check"><Mic className="rc-sheet-icon" /><h2>AI recitation checking is coming soon.</h2><p>Self check</p><Button className="rc-primary" onClick={() => { setSaved((s) => ({ ...s, settings: { ...s.settings, mode: "self" } })); setSheet(null); }}>Use self check</Button></section>}
        {gradeAyah && <section className="rc-sheet" role="dialog" aria-modal="true" aria-label="Ayah self check"><span className="rc-eyebrow">AYAH {gradeAyah}</span><h2>How did it go?</h2><div className="rc-grade-options">{(["Easy", "Okay", "Hard"] as const).map((g) => <Button variant="outline" key={g} onClick={() => grade(g)}>{g}</Button>)}</div><div className="rc-check-words" dir="rtl">{words.filter((w) => w.verse === gradeAyah).map((w) => <Button variant="ghost" className={`rc-arabic ${saved.marks[w.key] === "wrong" ? "rc-check-wrong" : ""}`} key={w.key} onClick={() => mark(w)} aria-label={`Mark ${w.key} as mistake`}>{w.text}</Button>)}</div></section>}
        {sheet === "marks" && <section className="rc-sheet rc-marks" role="dialog" aria-modal="true" aria-label="Review marks"><header><h2>Review marks</h2><Button variant="ghost" size="icon" aria-label="Close marks" onClick={() => setSheet(null)}><X /></Button></header>{!marks.length && <p>No marks on this page.</p>}{marks.map((w) => <div className="rc-mark-row" key={w.key}><Button variant="ghost" className="rc-arabic" onClick={() => void playWord(w)}>{w.text}<Play /></Button><small>{w.verse}</small><select aria-label={`State for ${w.key}`} value={saved.marks[w.key]} onChange={(e) => markState(w, e.target.value as WordState)}>{["wrong", "skipped", "unsure", "correct"].map((s) => <option key={s}>{s}</option>)}</select></div>)}</section>}
        {sheet === "complete" && <section className="rc-sheet rc-complete" role="dialog" aria-modal="true" aria-label="Page complete"><Check className="rc-sheet-icon" /><h2>Page complete</h2><p>{visible} words · {marks.length} marks · {Math.ceil((saved.seconds[saved.page] ?? 0) / 60)} min</p><Button className="rc-primary" onClick={() => setSheet("marks")}>Review marks</Button><Button variant="outline" disabled={saved.page === 604} onClick={() => changePage(saved.page + 1)}>Next page</Button></section>}
      </div>
    </div>}
  </main></MushafThemeProvider></Portal>;
}