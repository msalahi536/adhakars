import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useHifzBeta } from "@/lib/hifz-beta";
import { Check, ChevronLeft, Mic, Play, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Portal } from "@/components/Portal";
import { BottomNav } from "@/components/BottomNav";
import { ReciteSettings } from "@/components/recite/ReciteSettings";
import { PageNavigation } from "@/components/recite/PageNavigation";
import { loadPageFont, reciteChaptersOptions, recitePageOptions } from "@/lib/recite/data";
import { freshRecite, markedWords, nextWord, pageWords, readRecite, revealed, revealNext, saveRecite, isOpeningWord, type ReciteWord, type SavedRecite, type WordState } from "@/lib/recite/model";
import { getChapterAudio } from "@/lib/quran";
import { quranPlayer } from "@/lib/quran-player";
import { recitationPlayer } from "@/lib/recitation-player";
import { play as playFeedback, configureHifzFeedback, cancelHifzFeedback } from "@/lib/hifzHaptics";
import { MushafThemeProvider, MushafFrame, MushafLabel, MushafPageNumber, SurahCartouche, AyahMarker, toArabicDigits } from "@/components/mushaf/MushafPage";
import { RecitationMic } from "@/components/recite/RecitationMic";
import { loopResult, nextCleanPass, nextLoopItem, shouldAutoStop } from "@/components/recite/recitation-loop";
import { getPresetId, resolveVisualPhase, type VisualPhase } from "@/lib/theme-store";
import { parseTajweed, TajweedText } from "@/lib/tajweed";
import "@/components/recite/supplied-mushaf.css";
import "@/components/hifz/hifz.css";
import { mushafThemeId } from "@/components/recite/mushaf-theme";
import { CONTROLS_IDLE_MS, pageGesture, rubberBand, swipeTarget, type PagePointer } from "@/components/recite/page-gesture";
import {
  addDays, buildSession, loadState, recordReview, recordSabaq, saveState, stats, todayISO,
  type Grade, type HifzState,
} from "@/lib/hifz";
import {
  createTracker, flattenSession, loadActiveSession, quranIndexOptions, saveActiveSession,
  SELF_GRADES, type ActiveSession, type SessionItem, type Tracker,
} from "@/lib/hifz/program";
import { DrillSheet } from "@/components/hifz/DrillSheet";
import { mapAiWords } from "@/components/recite/ai-feedback";
import { useAiRecitation } from "@/components/recite/use-ai-recitation";
import { aiFailures, aiWordState, createAudioRun, saveAiWeakSpots, type AiMarks } from "@/components/recite/lesson-ai";

export const Route = createFileRoute("/app/hifz/recite")({
  validateSearch: (s: Record<string, unknown>) => {
    const out: { session?: string; item?: number; page?: number } = {};
    if (typeof s.session === "string") out.session = s.session;
    if (typeof s.item === "number") out.item = s.item;
    if (typeof s.page === "number") out.page = s.page;
    return out;
  },
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
  const search = Route.useSearch();
  const initial = useSuspenseQuery(recitePageOptions(562)).data;
  const chapters = useSuspenseQuery(reciteChaptersOptions).data;
  const quranIndex = useSuspenseQuery(quranIndexOptions).data;
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
  const [sheet, setSheet] = useState<"settings" | "navigation" | "ai" | "marks" | "complete" | "sessionGrade" | "drills" | "sessionEnd" | "lessonComplete" | null>(null);
  const [gradeAyah, setGradeAyah] = useState<string | null>(null);
  const [loadedFont, setLoadedFont] = useState<{ page: number; name: string } | null>(null);
  const [fontAttempt, setFontAttempt] = useState(0);
  const [fontFailed, setFontFailed] = useState(false);
  const font = loadedFont?.page === saved.page ? loadedFont.name : null;
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [peek, setPeek] = useState<string | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const audioRun = useRef(createAudioRun());
  const micBusy = useRef(false);
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

  // ---- session mode ----
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [hifzState, setHifzState] = useState<HifzState | null>(null);
  const itemIndex = search.item ?? 0;
  const sessionItem: SessionItem | undefined = activeSession?.items[itemIndex];
  const sessionTotal = activeSession?.items.length ?? 0;
  const sessionEnded = !!activeSession && itemIndex >= sessionTotal;
  const trackerRef = useRef<Tracker>(createTracker());
  const ayahStartAt = useRef(0);
  const lastAyah = useRef<string | null>(null);
  const sessionStartAt = useRef(Date.now());
  const preppedItem = useRef<string | null>(null);
  const [audioWord, setAudioWord] = useState<string | null>(null);
  const [aiCorrection, setAiCorrection] = useState<AiMarks | null>(null);
  const handledAi = useRef<unknown>(null);
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [cleanPasses, setCleanPasses] = useState(0);
  const [attemptStarted, setAttemptStarted] = useState(false);
  const [lessonPeek, setLessonPeek] = useState(false);
  const [resultClean, setResultClean] = useState(false);
  const [debugSharing, setDebugSharing] = useState(false);
  const [debugError, setDebugError] = useState("");
  const [hintVisible, setHintVisible] = useState(true);
  const acceptedAttempt = useRef(false);
  const today = todayISO();

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

  const sabaq = sessionItem?.kind === "sabaq" ? sessionItem : null;
  // Expand line goals to whole ayat; the final pass adds exactly the preceding ayah.
  const rangeVerses = sabaq && page?.page === sabaq.page ? page.verses.filter((v) => v.words.some((w) => !w.end && w.line > sabaq.fromLine && w.line <= sabaq.fromLine + sabaq.lines)) : [];
  const rangeWords = words.filter((w) => rangeVerses.some((v) => v.key === w.verse));
  const precedingIndex = page?.verses.findIndex((v) => v.key === rangeVerses[0]?.key) ?? -1;
  const previousVerse = precedingIndex > 0 ? page?.verses[precedingIndex - 1] : undefined;
  const previousPage = useQuery({ ...recitePageOptions(Math.max(1, saved.page - 1)), enabled: !!sabaq && saved.page > 1 && precedingIndex === 0 }).data;
  const linkedVerse = previousVerse ?? (precedingIndex === 0 ? previousPage?.verses.at(-1) : undefined);
  const targetWords = sabaq ? cleanPasses === 2 && linkedVerse ? [...linkedVerse.words.filter((w) => !w.end), ...rangeWords] : rangeWords : words;
  const targetKeys = new Set(targetWords.map((w) => w.key));
  const ai = useAiRecitation(saved.page, mode === "ai", targetWords.map((w) => w.key));
  const aiWords = ai.result ? mapAiWords(ai.result, targetWords.map((w) => w.key)) : null;
  const aiRanges = targetWords.reduce<{ sura: number; first: number; last: number }[]>((ranges, w) => {
    const [sura, ayah] = w.verse.split(":").map(Number);
    const last = ranges.at(-1);
    if (last?.sura === sura) last.last = Math.max(last.last, ayah);
    else ranges.push({ sura, first: ayah, last: ayah });
    return ranges;
  }, []);
  micBusy.current = ai.phase === "loading" || ai.phase === "listening" || ai.phase === "stopping";
  useEffect(() => {
    if (ai.phase === "error" && mode === "ai") fallbackToSelf("The checker couldn’t start. You can continue with Self check.");
  }, [ai.phase, mode]);
  useEffect(() => {
    if (ai.phase !== "finished" || !ai.result || handledAi.current === ai.result) return;
    handledAi.current = ai.result;
    const outcome = loopResult(ai.result, targetWords);
    setAiCorrection(outcome.marks); setResultClean(outcome.clean); acceptedAttempt.current = false;
    if (hifzState && aiFailures(outcome.marks).length) persistState(saveAiWeakSpots(hifzState, outcome.marks, targetWords, today));
    if (outcome.clean) playFeedback("pageComplete");
    setSheet("ai"); setStatus("paused");
  }, [ai.phase, ai.result]);
  useEffect(() => {
    setHintVisible(true);
    const timer = setTimeout(() => setHintVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [itemIndex, saved.page, cleanPasses]);
  useEffect(() => {
    if (mode !== "ai") return;
    if (ai.phase === "listening") setStatus("active");
    else if (ai.phase === "finished" || ai.phase === "error") setStatus("paused");
  }, [ai.phase, mode]);

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
    configureHifzFeedback({ haptics: saved.settings.haptics, sounds: false });
    return cancelHifzFeedback;
  }, [saved.settings.haptics]);
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
    const measure = () => setDimensions({ strip: 92, labels: labelsElement.current?.offsetHeight ?? 24 });
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
  useEffect(() => () => { stopAudio(); turnAnimation.current?.cancel(); if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);


  // ---- session bootstrap ----
  useEffect(() => {
    if (!search.session) { setActiveSession(null); return; }
    const s = loadActiveSession();
    setActiveSession(s && s.date === search.session ? s : null);
    setHifzState(loadState());
  }, [search.session]);

  // Free recite deep link (?page=) from the progress map.
  useEffect(() => {
    if (search.session || !search.page || !hydrated) return;
    if (search.page !== latest.current.page) changePage(search.page, false);
  }, [search.page, search.session, hydrated]);

  // Prepare each session item: jump to its page, hide the page fresh, reset the tracker.
  useEffect(() => {
    if (!sessionItem || !page || sessionEnded) return;
    const key = `${search.session}:${itemIndex}`;
    if (preppedItem.current === key) return;
    const targetPage = sessionItem.kind === "review" || sessionItem.kind === "sabaq" ? sessionItem.page : sessionItem.kind === "link" ? sessionItem.pages[0] : null;
    if (targetPage && page.page !== targetPage) { changePage(targetPage, false); return; }
    preppedItem.current = key;
    trackerRef.current = createTracker();
    setAiCorrection(null); ai.reset(); setCleanPasses(0); setAttemptStarted(false); setLessonPeek(false);
    sessionStartAt.current = Date.now();
    ayahStartAt.current = 0;
    lastAyah.current = null;
    setGradeAyah(null);
    setStatus("active");
    if (sessionItem.kind === "drills") { setSheet("drills"); return; }
    // Lesson starts readable; review starts hidden. Neither changes page geometry.
    const updated = { ...latest.current.marks };
    for (const w of words) {
      if (sessionItem.kind === "sabaq") updated[w.key] = "correct";
      else delete updated[w.key];
    }
    update({ marks: updated });
  }, [sessionItem, page, itemIndex, search.session, sessionEnded, words.length]);

  function stopAudio() {
    audioRun.current.cancel();
    const a = audio.current;
    if (a) { a.pause(); a.ontimeupdate = null; a.onended = null; a.onerror = null; a.onloadedmetadata = null; }
    setPlaying(false); setAudioWord(null);
  }
  function fallbackToSelf(message: string) {
    stopAudio(); ai.cancel(); setFallbackMessage(message);
    setSaved((s) => ({ ...s, settings: { ...s.settings, mode: "self" } }));
    setStatus("active");
  }
  function prepareAttempt() {
    stopAudio(); quranPlayer.pause(); recitationPlayer.pause(); ai.reset();
    setAiCorrection(null); setAttemptStarted(true); setLessonPeek(false); setSheet(null);
    acceptedAttempt.current = false;
    const updated = { ...latest.current.marks };
    for (const w of words) { if (targetKeys.has(w.key)) delete updated[w.key]; else if (sabaq) updated[w.key] = "correct"; }
    update({ marks: updated }); setStatus("active");
  }
  function nextAttempt(override = false) {
    if (acceptedAttempt.current) return;
    acceptedAttempt.current = true;
    const clean = resultClean || override;
    if (!clean) { prepareAttempt(); return; }
    const progress = nextCleanPass(cleanPasses, true, !sabaq);
    setCleanPasses(progress.count); setSheet(null); setAttemptStarted(false); setAiCorrection(null); ai.reset();
    if (progress.done) {
      if (sabaq) finishSabaq();
      else if (sessionItem?.kind === "review") finishReview(4);
      else if (sessionItem?.kind === "link") advance();
      else { setSheet("complete"); setStatus("paused"); }
    } else {
      const updated = { ...latest.current.marks };
      for (const w of words) updated[w.key] = "correct";
      update({ marks: updated }); setStatus("ready");
    }
  }
  function changePage(pageNumber: number, feedback = true) {
    if (pageNumber < 1 || pageNumber > 604 || pageNumber === latest.current.page) return;
    stopAudio(); ai.cancel(); setStatus("ready"); setSheet(null); setGradeAyah(null); setPeek(null); setAttemptStarted(false); setAiCorrection(null); setLessonPeek(false);
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
    if (!word.audio || micBusy.current) return;
    stopAudio(); quranPlayer.pause(); recitationPlayer.pause();
    const a = new Audio(word.audio); audio.current = a; a.playbackRate = saved.settings.speed;
    a.onended = () => setPlaying(false); a.onerror = () => { setPlaying(false); setAudioError("Audio could not play. Check your connection and try again."); };
    try { await a.play(); setPlaying(true); setAudioError(""); } catch { setAudioError("Tap again to play the qari audio."); }
  }

  /** Headphones repeats the entire selected passage three times; the token cancels every wait. */
  async function playLesson() {
    if (micBusy.current) return;
    if (playing) { stopAudio(); return; }
    stopAudio(); quranPlayer.pause(); recitationPlayer.pause();
    const verses = [...new Set(targetWords.map((w) => w.verse))];
    const token = audioRun.current.token(); setPlaying(true); setAudioError("");
    try {
      for (let round = 0; round < 3; round++) for (const verse of verses) {
        if (!audioRun.current.current(token)) return;
        const chapterAudio = await getChapterAudio(saved.settings.reciter, Number(verse.split(":")[0]));
        if (!audioRun.current.current(token)) return;
        const timing = chapterAudio.timings.find((t) => t.key === verse);
        if (!timing) throw new Error("No verse timing");
        await audioRun.current.wait(token, (resolve) => {
          const a = audio.current ?? new Audio(chapterAudio.url); audio.current = a;
          if (a.src !== chapterAudio.url) a.src = chapterAudio.url;
          a.playbackRate = saved.settings.speed;
          a.onloadedmetadata = () => { a.currentTime = timing.from / 1000; };
          if (a.readyState >= 1) a.currentTime = timing.from / 1000;
          a.ontimeupdate = () => {
            const ms = a.currentTime * 1000;
            const segment = timing.segments?.find((s) => ms >= s[1] && ms < s[2]);
            if (segment) setAudioWord(`${verse}:${segment[0]}`);
            if (ms >= timing.to) { a.pause(); resolve(); }
          };
          a.onended = resolve;
          a.onerror = () => { setAudioError("Qari audio is unavailable. Please retry."); stopAudio(); resolve(); };
          void a.play().catch(() => { setAudioError("Tap headphones again to play."); stopAudio(); resolve(); });
        });
      }
      if (audioRun.current.current(token)) { setPlaying(false); setAudioWord(null); }
    } catch { if (audioRun.current.current(token)) { stopAudio(); setAudioError("Qari audio is unavailable right now. Please retry."); } }
  }
  function horizon() {
    if (ai.phase === "listening") { void ai.stop(); return; }
    if (micBusy.current) return;
    stopAudio(); quranPlayer.pause(); recitationPlayer.pause();
    if (mode === "ai") { prepareAttempt(); micBusy.current = true; void ai.request(aiRanges); return; }
    if (!attemptStarted) prepareAttempt();
    const currentMarks = attemptStarted ? latest.current.marks : Object.fromEntries(Object.entries(latest.current.marks).filter(([key]) => !targetKeys.has(key)));
    const pending = nextWord(targetWords, currentMarks);
    if (!pending) { onAllRevealed(); return; }
    const updated = revealNext(targetWords, currentMarks);
    trackerRef.current.recordReveal(Date.now()); update({ marks: updated }); playFeedback("reveal");
    if (targetWords.filter((w) => w.page === saved.page).every((w) => revealed(updated[w.key]))) {
      setAiCorrection(null); setResultClean(!targetWords.some((w) => ["wrong", "skipped"].includes(updated[w.key])));
      acceptedAttempt.current = false; setSheet("ai"); setStatus("paused");
    }
  }
  function onAllRevealed() { setResultClean(true); acceptedAttempt.current = false; setSheet("ai"); setStatus("paused"); }
  function mark(word: ReciteWord) {
    const state = saved.marks[word.key];
    if (state === "unsure") { void playWord(word); return; }
    if (revealed(state)) { markState(word, state === "wrong" ? "correct" : "wrong"); return; }
    trackerRef.current.recordPeek();
    if (saved.settings.hints === "peek") { setPeek(word.key); setTimeout(() => setPeek(null), 1500); }
    else if (saved.settings.hints === "letter") setPeek(word.key);
  }
  function markState(word: ReciteWord, state: WordState) {
    update({ marks: { ...saved.marks, [word.key]: state } });
    trackerRef.current.recordMark(word.key, state === "wrong" ? "wrong" : state === "skipped" ? "skipped" : state === "unsure" ? "unsure" : "correct");
    if (state === "wrong") playFeedback("wrong");
    else if (state === "skipped") playFeedback("skip");
    else if (state === "unsure") playFeedback("unsure");
    else if (state === "correct") playFeedback("reveal");
  }
  function grade(value: "Easy" | "Okay" | "Hard") {
    if (!gradeAyah) return;
    update({ grades: { ...saved.grades, [gradeAyah]: value } }); setGradeAyah(null);
    if (!next) { onAllRevealed(); } else setStatus("active");
  }

  // ---- session recording ----
  function sessionSeconds() {
    return Math.max(1, Math.round((Date.now() - sessionStartAt.current) / 1000));
  }
  function persistState(next: HifzState) {
    saveState(next);
    setHifzState({ ...next });
  }
  function advance() {
    if (!activeSession) return;
    // The preceding-ayah link is already included in the third lesson pass.
    const nextIndex = nextLoopItem(itemIndex, !!sabaq, activeSession.items[itemIndex + 1]?.kind);
    const updated = { ...activeSession, done: Math.max(activeSession.done, nextIndex), seconds: activeSession.seconds + sessionSeconds() };
    saveActiveSession(updated);
    setActiveSession(updated);
    stopAudio();
    setSheet(null);
    void navigate({ to: "/app/hifz/recite", search: { session: updated.date, item: nextIndex }, replace: true });
  }
  function finishReview(selfGrade: Grade) {
    if (!sessionItem || sessionItem.kind !== "review" || !hifzState) return;
    const perf = trackerRef.current.toPerformance(words, sessionSeconds(), selfGrade);
    const next = { ...hifzState };
    recordReview(next, sessionItem.page, perf, today, sessionItem.stage);
    persistState(next);
    advance();
  }
  function finishSabaq() {
    if (!sabaq || !hifzState) return;
    const perf = trackerRef.current.toPerformance(rangeWords, sessionSeconds());
    const next = { ...hifzState };
    recordSabaq(next, sabaq.page, sabaq.lines, perf, today);
    persistState(next);
    playFeedback("pageComplete");
    setSheet("lessonComplete"); setStatus("paused");
  }
  function finishDrills(passed: string[], failed: string[]) {
    if (!hifzState) { advance(); return; }
    const next = { ...hifzState };
    const drillTargets = [...new Set([...passed, ...failed].map((k) => {
      const core = k.startsWith("t:") || k.startsWith("m:") ? k.slice(2) : k;
      const verse = core.split(">")[0].split(":").slice(0, 2).join(":");
      return page?.verses.find((v) => v.key === verse)?.words[0]?.page;
    }).filter((p): p is number => !!p))];
    const fallback = sessionItem?.kind === "drills" ? sessionItem.spots[0]?.page : undefined;
    const targets = drillTargets.length ? drillTargets : fallback ? [fallback] : [];
    let keysGiven = false;
    for (const p of targets) {
      const rec = next.pages[p];
      if (!rec?.memory) continue;
      recordReview(next, p, {
        words: 0, wrong: 0, skipped: 0, small: 0, hesitations: 0,
        passedKeys: keysGiven ? [] : passed, failedKeys: keysGiven ? [] : failed,
      }, today, "drill");
      keysGiven = true;
    }
    persistState(next);
    advance();
  }
  const wordNode = (word: ReciteWord) => {
    if (word.end) return saved.settings.numbers ? <span key={word.key} className="rc-ayah-end" aria-label={`Ayah ${word.verse.split(":")[1]}`}><AyahMarker number={Number(word.verse.split(":")[1])} size={18} done={words.filter((w) => w.verse === word.verse).every((w) => revealed(saved.marks[w.key]))} /></span> : null;
    const aiStatus = mode === "ai" && targetKeys.has(word.key) && attemptStarted ? (aiCorrection?.statuses[word.key] ?? aiWords?.statuses[word.key]) : undefined;
    const state: WordState = lessonPeek && targetKeys.has(word.key) ? "correct" : mode === "ai" && attemptStarted && targetKeys.has(word.key) ? aiWordState(aiStatus) : saved.marks[word.key] ?? "pending";
    const hint = mode === "self" && (peek === word.key || isOpeningWord(word, words, saved.settings.hideAmount));
    const placeholder = mode === "ai" && attemptStarted && targetKeys.has(word.key) && !lessonPeek && (state === "pending" || state === "in_progress");
    return <Button variant="ghost" key={word.key} className={`rc-word rc-${state} ${placeholder ? "rc-memory-placeholder" : ""} ${sheet === "ai" && aiStatus === "wrong" ? "rc-result-glow" : ""} ${aiStatus === "wrong" || aiStatus === "skipped" ? `rc-ai-${aiStatus}` : ""} ${hint ? "rc-peek" : ""} ${audioWord === word.key ? "rc-listening" : ""}`} onPointerUp={(e) => {
      const start = pointer.current;
      if (mode === "ai" && (aiStatus === "wrong" || aiStatus === "skipped") && start && start.id === e.pointerId && pageGesture(start, e.clientX, e.clientY, e.timeStamp) === "tap") { e.stopPropagation(); pointer.current = null; void playWord(word); return; }
      if (mode !== "self" || !revealed(state) || !start || start.id !== e.pointerId || pageGesture(start, e.clientX, e.clientY, e.timeStamp) !== "tap") return;
      e.stopPropagation(); pointer.current = null; mark(word);
    }} onClick={(e) => { if (e.detail === 0 && mode === "self" && revealed(state)) mark(word); if (e.detail === 0 && (aiStatus === "wrong" || aiStatus === "skipped")) void playWord(word); }} aria-label={`Word ${word.key}, ${aiStatus ?? state}`} data-word={word.key} data-state={aiStatus ?? state} data-source={aiStatus ? "ai" : "self"}>
      <span className={`rc-word-ink ${saved.settings.layout === "mushaf" && saved.settings.tajweed && word.tajweed ? `rc-qcf-tj-${parseTajweed(word.tajweed).find((segment) => segment.group)?.group ?? "none"}` : ""}`}>{saved.settings.layout === "mushaf" ? word.glyph : saved.settings.tajweed && word.tajweed ? <span className="rc-tajweed-text"><TajweedText markup={word.tajweed} /></span> : word.text}</span>
      {mode === "self" && (state === "wrong" || state === "skipped" || state === "unsure") && <span className="rc-word-note">{state === "wrong" ? word.text : state === "skipped" ? "skipped" : "?"}</span>}
      {aiStatus === "unsure" && saved.settings.showUnclearWords && <span className="rc-ai-dot" aria-label="Unclear word">·</span>}
      {mode === "ai" && aiWords?.repeated.has(word.key) && <span className="rc-ai-repeat">repeated</span>}
    </Button>;
  };
  const lineWords = (line: number) => page?.verses.flatMap((v) => v.words).filter((w) => w.line === line) ?? [];
  const renderLine = (line: number) => {
    const lineItems = lineWords(line);
    const surahStart = page?.verses.find((v) => v.number === 1 && v.words[0]?.line === line + 2);
    if (surahStart) return <div key={line} className="rc-cartouche"><SurahCartouche name={`سُورَةُ ${chapters.find((c) => c.id === surahStart.chapter)?.name_arabic ?? ""}`} height={48} /></div>;
    const bismillah = page?.verses.find((v) => v.number === 1 && v.chapter !== 9 && v.chapter !== 1 && v.words[0]?.line === line + 1);
    if (bismillah) return <div key={line} className="rc-bismillah rc-arabic" data-line={line}>بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>;
    return <div key={line} className={`rc-line ${sabaq && !attemptStarted && lineItems.some((word) => targetKeys.has(word.key)) ? "rc-lesson-highlight" : ""} ${saved.page <= 2 ? "rc-short-line" : ""}`} dir="rtl">{lineItems.map(wordNode)}</div>;
  };

  const lessonLabel = rangeVerses.map((v) => v.chapter).filter((id, i, list) => list.indexOf(id) === i).map((id) => {
    const verses = rangeVerses.filter((v) => v.chapter === id);
    return `${chapters.find((c) => c.id === id)?.name_simple ?? "Quran"} ${verses[0]?.number}–${verses.at(-1)?.number}`;
  }).join(" · ");
  const failedWords = targetWords.filter((w) => aiCorrection ? ["wrong", "skipped"].includes(aiCorrection.statuses[w.key]) : ["wrong", "skipped"].includes(saved.marks[w.key]));
  const tomorrowSession = hifzState ? buildSession(hifzState, quranIndex, addDays(today, 1)) : null;
  const nextLesson = tomorrowSession?.steps.find((step) => step.kind === "sabaq");
  const nextLessonChapter = nextLesson?.kind === "sabaq" ? quranIndex.pages.find((entry) => entry.page === nextLesson.page)?.surah : undefined;
  const nextLessonName = chapters.find((entry) => entry.id === nextLessonChapter)?.name_simple;
  const sessionStats = hifzState ? stats(hifzState, quranIndex, today) : null;

  return <Portal><MushafThemeProvider theme={appTheme} mode={morningOrEvening} className={`recite-page rc-supplied rc-hide-${saved.settings.hideStyle} ${controls ? "rc-controls-visible" : ""} ${saved.settings.theme === "night" ? "rc-night" : ""}`} style={{ "--rc-size": `${saved.settings.size}px`, "--rc-strip-height": `${dimensions.strip}px`, "--rc-label-height": `${dimensions.labels}px`, "--m-font-quran": "var(--font-arabic)" } as CSSProperties}><main onPointerDownCapture={() => { touching.current = true; setTouchActivity((v) => v + 1); }} onPointerUpCapture={() => { touching.current = false; setTouchActivity((v) => v + 1); }} onPointerCancelCapture={() => { touching.current = false; setTouchActivity((v) => v + 1); }}>
    <header className="rc-header" aria-hidden={!controls} inert={!controls}><Button variant="ghost" size="icon" aria-label="Exit Hifz" onClick={() => { saveActiveSession(null); void navigate({ to: activeSession ? "/app/hifz" : "/app/more" }); }}><ChevronLeft /></Button><Button variant="ghost" className="rc-title" aria-label="Go to page" onClick={() => setSheet("navigation")}>{chapter?.name_simple ?? "Quran"} · {saved.page}</Button><Button variant="ghost" size="icon" aria-label="Page settings" onClick={() => setSheet("settings")}>Aa</Button></header>
    {!sessionEnded && <div className="rc-lesson-heading">
      <div className="rc-lesson-pill">{sabaq ? `New lesson · ${lessonLabel}` : sessionItem ? `Review · ${chapter?.name_simple ?? "Quran"} · ${saved.page}` : `Recite · ${chapter?.name_simple ?? "Quran"}`}</div>
      {sabaq && <div className="rc-pass-dots" aria-label={`${Math.min(3, cleanPasses + (sheet === "ai" && resultClean ? 1 : 0))} of 3 clean recitations`}>{[0, 1, 2].map((dot) => <span key={dot} className={dot < cleanPasses + (sheet === "ai" && resultClean ? 1 : 0) ? "is-filled" : ""} />)}</div>}
      <p className={`rc-lesson-hint ${hintVisible ? "is-visible" : ""}`}>{cleanPasses === 2 && linkedVerse ? "Include the ayah before, then recite from memory" : "Listen, then recite from memory"}</p>
    </div>}
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
        {pageQuery.isPending ? <div className="rc-loading">Loading mushaf page…</div> : pageQuery.isError ? <div className="rc-loading">{pageQuery.error.message}<Button variant="outline" onClick={() => void pageQuery.refetch()}>Try again</Button></div> : saved.settings.layout === "mushaf" && !font ? <div className="rc-loading" role="status">Loading mushaf font…{fontFailed && <Button variant="outline" onClick={() => setFontAttempt((v) => v + 1)}>Try again</Button>}</div> : <div className={`rc-mushaf ${font && saved.settings.layout === "mushaf" ? "rc-glyphs" : ""}`} style={{ fontFamily: saved.settings.layout === "mushaf" ? font ?? undefined : undefined, gridTemplateRows: saved.settings.layout === "mushaf" ? Array.from({ length: 15 }, (_, i) => page?.verses.some((v) => v.number === 1 && v.words[0]?.line === i + 3) ? "48px" : page?.verses.some((v) => v.number === 1 && v.chapter !== 1 && v.chapter !== 9 && v.words[0]?.line === i + 2) ? "30px" : "minmax(0, 1fr)").join(" ") : undefined }}>
          {saved.settings.layout === "mushaf" ? Array.from({ length: 15 }, (_, i) => renderLine(i + 1)) : page?.verses.map((verse) => <section className="rc-verse" key={verse.key}><div className="rc-verse-words" dir="rtl">{verse.words.map(wordNode)}</div>{saved.settings.translation && <p className="rc-translation">{verse.translation}</p>}{saved.settings.transliteration && <p className="rc-translation">{verse.words.filter((w) => !w.end).map((w) => w.transliteration).join(" ")}</p>}</section>)}
        </div>}
        </MushafFrame>
        <div className="rc-page-badge"><MushafPageNumber page={saved.page} height={24} /></div>
      </div>
    </div>
    <div className="rc-mic-dock" ref={stripElement}>
      <RecitationMic stream={ai.stream} listening={ai.phase === "listening"} busy={ai.phase === "loading" || ai.phase === "stopping"} self={mode === "self"} playing={playing} peek={lessonPeek} disabled={!page || !font || !!sheet || sessionEnded} onTap={horizon} onListen={() => void playLesson()} onPeek={() => { setLessonPeek((value) => !value); trackerRef.current.recordPeek(); }} onSilence={(silence, voiced) => { if (ai.phase === "listening" && shouldAutoStop(ai.result, silence, voiced)) void ai.stop(); }} />
    </div>
    {(audioError || fallbackMessage) && <p className="rc-loop-notice" role="status">{audioError || fallbackMessage}</p>}
    <div className="rc-nav-wrap rc-loop-nav" aria-hidden={!controls} inert={!controls}><BottomNav /></div>
    {(sheet || gradeAyah) && <div className="rc-backdrop" onClick={() => { if (!gradeAyah && sheet !== "drills" && sheet !== "sessionGrade" && sheet !== "sessionEnd" && sheet !== "lessonComplete") setSheet(null); }}>
      <div onClick={(e) => e.stopPropagation()}>
        {sheet === "settings" && <ReciteSettings settings={saved.settings} change={(settings) => setSaved((s) => ({ ...s, settings: { ...s.settings, ...settings } }))} close={() => setSheet(null)} />}
        {sheet === "navigation" && <PageNavigation page={saved.page} chapter={first?.chapter} juz={first?.juz} chapters={chapters} go={changePage} close={() => setSheet(null)} />}
        {sheet === "ai" && <section className="rc-sheet rc-loop-result" role="dialog" aria-modal="true" aria-label="Recitation result">
          <div className="rc-result-handle" />
          {resultClean ? <Check className="rc-result-check" /> : <span className="rc-result-count">{failedWords.length || "…"}</span>}
          <h2>{resultClean ? "Perfect" : failedWords.length ? `${failedWords.length} ${failedWords.length === 1 ? "mistake" : "mistakes"}` : "A little more to recite"}</h2>
          {resultClean && (sabaq ? <div className="rc-pass-dots rc-result-dots" aria-label={`${Math.min(3, cleanPasses + 1)} of 3 recitations complete`}>{[0, 1, 2].map((dot) => <span key={dot} className={dot <= cleanPasses ? "is-filled" : ""} />)}</div> : <p>Recitation complete</p>)}
          {!!failedWords.length && <div className="rc-result-words">{failedWords.map((word) => <div key={word.key}><div className="rc-result-word-location"><span dir="rtl" className="rc-arabic">{word.text}</span><small>{chapters.find((entry) => entry.id === Number(word.verse.split(":")[0]))?.name_simple ?? "Quran"} · ayah {word.verse.split(":")[1]}</small></div><Button variant="ghost" size="icon" aria-label={`Hear correct word ${word.key}`} title="Hear correct word" onClick={() => void playWord(word)}><Play /></Button></div>)}</div>}
          <div className="rc-result-actions"><Button variant="outline" onClick={prepareAttempt}>Try again</Button><Button className="rc-primary" onClick={() => nextAttempt()}>Next</Button></div>
          {!resultClean && <Button variant="link" className="rc-result-override" onClick={() => nextAttempt(true)}>I recited it right</Button>}
          {ai.hasDebug && <Button variant="link" className="rc-result-override" disabled={debugSharing} onClick={async () => { setDebugSharing(true); setDebugError(""); try { await ai.shareDebug(); } catch { setDebugError("Couldn’t share debug. Please try again."); } finally { setDebugSharing(false); } }}>Share debug</Button>}
          {debugError && <p role="alert">{debugError}</p>}
        </section>}
        {sheet === "lessonComplete" && <section className="rc-sheet rc-loop-result rc-complete" role="dialog" aria-modal="true" aria-label="Lesson complete"><div className="rc-result-handle" /><Check className="rc-result-check rc-check-enter" /><h2>Lesson complete</h2><p>Review tomorrow{nextLessonName ? ` · next lesson: ${nextLessonName}` : " · daily practice continues"}</p><div className="rc-pass-dots" aria-label="3 of 3 recitations complete">{[0, 1, 2].map((dot) => <span className="is-filled" key={dot} />)}</div><Button className="rc-primary" onClick={advance}>Done</Button></section>}
        {gradeAyah && <section className="rc-sheet" role="dialog" aria-modal="true" aria-label="Ayah self check"><span className="rc-eyebrow">AYAH {gradeAyah}</span><h2>How did it go?</h2><div className="rc-grade-options">{(["Easy", "Okay", "Hard"] as const).map((g) => <Button variant="outline" key={g} onClick={() => grade(g)}>{g}</Button>)}</div><div className="rc-check-words" dir="rtl">{words.filter((w) => w.verse === gradeAyah).map((w) => <Button variant="ghost" className={`rc-arabic ${saved.marks[w.key] === "wrong" ? "rc-check-wrong" : ""}`} key={w.key} onClick={() => mark(w)} aria-label={`Mark ${w.key} as mistake`}>{w.text}</Button>)}</div></section>}
        {sheet === "marks" && <section className="rc-sheet rc-marks" role="dialog" aria-modal="true" aria-label="Review marks"><header><h2>Review marks</h2><Button variant="ghost" size="icon" aria-label="Close marks" onClick={() => setSheet(null)}><X /></Button></header>{!marks.length && <p>No marks on this page.</p>}{marks.map((w) => <div className="rc-mark-row" key={w.key}><Button variant="ghost" className="rc-arabic" onClick={() => void playWord(w)}>{w.text}<Play /></Button><small>{w.verse}</small><select aria-label={`State for ${w.key}`} value={saved.marks[w.key]} onChange={(e) => markState(w, e.target.value as WordState)}>{["wrong", "skipped", "unsure", "correct"].map((s) => <option key={s}>{s}</option>)}</select></div>)}</section>}
        {sheet === "complete" && <section className="rc-sheet rc-complete" role="dialog" aria-modal="true" aria-label="Page complete"><Check className="rc-sheet-icon" /><h2>Page complete</h2><p>{visible} words · {marks.length} marks · {Math.ceil((saved.seconds[saved.page] ?? 0) / 60)} min</p><Button className="rc-primary" onClick={() => setSheet("marks")}>Review marks</Button><Button variant="outline" disabled={saved.page === 604} onClick={() => changePage(saved.page + 1)}>Next page</Button></section>}
        {sheet === "sessionGrade" && sessionItem?.kind === "review" && <section className="rc-sheet" role="dialog" aria-modal="true" aria-label="Page review">
          <span className="rc-eyebrow">PAGE {sessionItem.page} · {sessionItem.stage.toUpperCase()}</span>
          <h2>How did it go?</h2>
          <p style={{ fontSize: 13, opacity: .75 }}>{trackerRef.current.evidence(words)}</p>
          <div className="rc-grade-options">{SELF_GRADES.map((g) => <Button variant="outline" key={g.label} onClick={() => finishReview(g.grade)}>{g.label}</Button>)}</div>
        </section>}
        {sheet === "drills" && hifzState && <DrillSheet state={hifzState} q={quranIndex} today={today} done={finishDrills} />}
        {sheet === "sessionEnd" && activeSession && <section className="rc-sheet rc-complete" role="dialog" aria-modal="true" aria-label="Lesson complete">
          <Check className="rc-sheet-icon" />
          <h2>Lesson complete</h2>
          <p>{activeSession.done} of {sessionTotal} steps · {Math.max(1, Math.round(activeSession.seconds / 60))} min{sessionStats ? ` · ${sessionStats.streak} day streak` : ""}</p>
          {tomorrowSession && <p style={{ fontSize: 12, opacity: .7 }}>Tomorrow: {tomorrowSession.steps.length} steps, about {tomorrowSession.totalMinutes} min{tomorrowSession.newPaused ? ` · ${tomorrowSession.newPaused}` : ""}</p>}
          <Button className="rc-primary" onClick={() => { saveActiveSession(null); void navigate({ to: "/app/hifz" }); }}>Done</Button>
        </section>}
      </div>
    </div>}
    {mode === "ai" && (ai.phase === "download" || ai.phase === "loading" || ai.phase === "error") && <div className="rc-backdrop"><section className="rc-sheet" role="dialog" aria-modal="true" aria-label="Recitation checker">
      <Mic className="rc-sheet-icon" />
      <h2>{ai.phase === "error" ? "Let’s try again" : ai.phase === "loading" ? ai.progress >= 1 ? "Preparing checker…" : "Downloading checker…" : "Download recitation checker"}</h2>
      {ai.phase === "download" && <><p>Download recitation checker (73 MB, one time, works offline after)</p><p>Wi-Fi recommended.</p><Button className="rc-primary" onClick={() => { stopAudio(); quranPlayer.pause(); recitationPlayer.pause(); void ai.confirm(); }}>Download &amp; start</Button><Button variant="ghost" onClick={() => fallbackToSelf("No problem — continue with Self check. You can enable AI check in Aa anytime.")}>Not now</Button></>}
      {ai.phase === "loading" && <><progress className="rc-ai-progress" aria-label="Checker download progress" max={1} value={ai.progress} /><p role="status">{Math.round(ai.progress * 100)}%</p></>}
      {ai.phase === "error" && <><p role="alert">{ai.error}</p><Button className="rc-primary" onClick={() => void ai.confirm()}>Retry</Button><Button variant="ghost" onClick={ai.cancel}>Close</Button></>}
    </section></div>}
    {sessionEnded && activeSession && !sheet && <div className="rc-backdrop"><div onClick={(e) => e.stopPropagation()}>
      <section className="rc-sheet rc-complete" role="dialog" aria-modal="true" aria-label="Lesson complete">
        <Check className="rc-sheet-icon" />
        <h2>Lesson complete</h2>
        <p>{activeSession.done} of {sessionTotal} steps · {Math.max(1, Math.round(activeSession.seconds / 60))} min{sessionStats ? ` · ${sessionStats.streak} day streak` : ""}</p>
        {tomorrowSession && <p style={{ fontSize: 12, opacity: .7 }}>Tomorrow: {tomorrowSession.steps.length} steps, about {tomorrowSession.totalMinutes} min</p>}
        <Button className="rc-primary" onClick={() => { saveActiveSession(null); void navigate({ to: "/app/hifz" }); }}>Done</Button>
      </section>
    </div></div>}
  </main></MushafThemeProvider></Portal>;
}
