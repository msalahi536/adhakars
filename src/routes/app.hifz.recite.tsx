import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { useQuranV2 } from "@/lib/quran-v2";
import { UnifiedReader } from "@/components/quran-v2/UnifiedReader";
import { useHifzBeta } from "@/lib/hifz-beta";
import { Check, ChevronLeft, Mic, Pause, Play, RotateCcw, X, Flag, BookOpen, Repeat, Hand } from "lucide-react";
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
import { RecitationMic } from "@/components/recite/RecitationMic";
import { AiResultSheet } from "@/components/recite/AiResultSheet";
import { analyzeAttempt, recordAttempt, CLEAN_PASSES, type Attempt } from "@/components/recite/ai-performance";
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
  SELF_GRADES, TRY_FIRST_MS, type ActiveSession, type SessionItem, type Tracker,
} from "@/lib/hifz/program";
import { DrillSheet } from "@/components/hifz/DrillSheet";
import { AI_DISCLAIMER } from "@/lib/hifz-ai/notices";
import { mapAiWords } from "@/components/recite/ai-feedback";
import { Switch } from "@/components/ui/switch";
import { Understanding, WordMeaning } from "@/components/hifz/Understanding";
import { EchoMode } from "@/components/hifz/EchoMode";
import { MilestoneMoment, pendingMilestones } from "@/components/hifz/MilestoneMoment";
import type { Milestone } from "@/lib/hifz/insights";
import { pageReached, sessionPageReady } from "@/components/hifz/enhancement-rules";
import "@/components/hifz/enhancements.css";
import { useAiRecitation } from "@/components/recite/use-ai-recitation";
import { aiWordState, createAudioRun, stageResult, type AiMarks } from "@/components/recite/lesson-ai";

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

type SabaqPhase = "listen" | "read" | "recite" | "correct" | "chain";
const SABAQ_PHASES: { id: SabaqPhase; label: string; hint: string }[] = [
  { id: "listen", label: "Listen", hint: "The qari recites the new lines 3 times" },
  { id: "read", label: "Read", hint: "Read along once, looking at the words" },
  { id: "recite", label: "Recite", hint: "From memory — reveal a word only when stuck" },
  { id: "correct", label: "Correct", hint: "Check what slipped, then recite again" },
  { id: "chain", label: "Chain", hint: "Recite the new lines joined to the ones before" },
];

function Recite() {
  const {enabled:quranV2}=useQuranV2();
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
  const [sheet, setSheet] = useState<"settings" | "navigation" | "ai" | "marks" | "complete" | "sessionGrade" | "drills" | "sessionEnd" | null>(null);
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
  const [tryFirst, setTryFirst] = useState(false);
  const [sabaqPhase, setSabaqPhase] = useState<SabaqPhase>("listen");
  const [audioWord, setAudioWord] = useState<string | null>(null);
  const [aiCorrection, setAiCorrection] = useState<AiMarks | null>(null);
  const correctionPhase = useRef<"recite" | "chain">("recite");
  const handledAi = useRef<unknown>(null);
  const [fallbackMessage, setFallbackMessage] = useState("");
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [cleanPasses, setCleanPasses] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const analysisRun = useRef(0);
  const latestState = useRef(hifzState); latestState.current = hifzState;
  const liveResult = useRef<import("@/lib/hifz-ai/checker").CheckResult | null>(null);
  const today = todayISO();
  const [handsFree, setHandsFree] = useState(false);
  const [handsPaused, setHandsPaused] = useState(false);
  const autoResume = useRef(false);
  const [reviewSummary, setReviewSummary] = useState<{page:number; attempt:Attempt}[]>([]);
  const [showReviewSummary, setShowReviewSummary] = useState(false);
  const [understand, setUnderstand] = useState(false);
  const [echo, setEcho] = useState(false);
  const [meaning, setMeaning] = useState<ReciteWord | null>(null);
  const [celebrations, setCelebrations] = useState<Milestone[]>([]);
  const mutateHighlight = (key: string | null) => {
    paperElement?.querySelectorAll<HTMLElement>("[data-replay]").forEach((el) => el.removeAttribute("data-replay"));
    if (key) paperElement?.querySelectorAll<HTMLElement>("[data-word]").forEach((el) => { if (el.dataset.word === key) el.dataset.replay = "true"; });
  };
  const echoHighlight = (keys: string[], hidden: boolean) => {
    paperElement?.querySelectorAll<HTMLElement>("[data-word]").forEach((el) => { if (keys.some((key) => el.dataset.word?.startsWith(key + ":"))) el.dataset.echo = "true"; else el.removeAttribute("data-echo"); });
    paperElement?.closest(".recite-page")?.classList.toggle("rc-echo-hidden", hidden);
  };

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
  const rangeWords = sabaq && page?.page === sabaq.page ? words.filter((w) => w.line > sabaq.fromLine && w.line <= sabaq.fromLine + sabaq.lines) : [];
  const firstLessonVerse = rangeWords[0]?.verse;
  const precedingVerse = page?.verses[(page.verses.findIndex((v) => v.key === firstLessonVerse)) - 1]?.key;
  const chainWords = sabaq && page?.page === sabaq.page ? words.filter((w) => rangeWords.some((r) => r.verse === w.verse) || w.verse === precedingVerse) : [];
  const recallMode = !!sessionItem && (sessionItem.kind === "review" || sessionItem.kind === "link" || (sessionItem.kind === "sabaq" && (sabaqPhase === "recite" || sabaqPhase === "chain")));
  const ai = useAiRecitation(saved.page, mode === "ai", words.map((w) => w.key), handsFree);
  liveResult.current = ai.result;
  const aiWords = ai.result ? mapAiWords(ai.result, words.map((w) => w.key)) : null;
  const aiRanges = [...new Set(page?.verses.map((v) => v.chapter) ?? [])].map((sura) => {
    const targetWords = sabaqPhase === "chain" ? chainWords : rangeWords;
    const verses = page?.verses.filter((v) => v.chapter === sura && (!sabaq || v.words.some((w) => targetWords.some((r) => r.key === w.key)))) ?? [];
    if (!verses.length) return null;
    return { sura, first: verses[0]?.number ?? 1, last: verses.at(-1)?.number ?? 1 };
  }).filter((r): r is { sura: number; first: number; last: number } => r !== null);
  const [aiRangeIndex, setAiRangeIndex] = useState(0);
  useEffect(() => { setAiRangeIndex(0); }, [saved.page]);
  micBusy.current = ai.phase === "loading" || ai.phase === "listening" || ai.phase === "stopping";
  useEffect(() => {
    if (ai.phase === "error" && mode === "ai") fallbackToSelf("The checker couldn’t start. You can continue with Self check.");
  }, [ai.phase, mode]);
  useEffect(() => {
    if (ai.phase !== "finished" || !ai.result || handledAi.current === ai.result) return;
    handledAi.current = ai.result;
    const id = ++analysisRun.current;
    const target = sabaq ? (cleanPasses >= 2 ? chainWords : rangeWords) : words;
    const result = ai.result;
    setAnalyzing(true);
    void analyzeAttempt(result, aiRanges, target.map((w) => w.key)).then((value) => {
      if (id !== analysisRun.current) return;
      const passes = value.clean ? Math.min(CLEAN_PASSES, cleanPasses + 1) : cleanPasses;
      setAttempt(value); setCleanPasses(passes);
      const state = latestState.current;
      if (state && sessionItem) persistState(recordAttempt(state, sessionItem, value, today, !!sabaq && passes === CLEAN_PASSES));
      setAiCorrection(stageResult(result, target));
      if (handsFree && sessionItem?.kind === "review") {
        setReviewSummary((entries) => [...entries, {page:sessionItem.page, attempt:value}]);
        const nextItem = activeSession?.items[itemIndex + 1];
        if (!handsPaused && nextItem?.kind === "review") { autoResume.current = true; playFeedback("pageTurn"); advance(); }
        else { setShowReviewSummary(true); setHandsPaused(true); setStatus("paused"); }
      } else { setSheet("ai"); setStatus("paused"); }
      if (value.drifts.length) playFeedback("drift");
      else if (value.clean) playFeedback("ayahComplete");
    }).finally(() => { if (id === analysisRun.current) setAnalyzing(false); });
  }, [ai.phase, ai.result]);
  useEffect(() => () => { analysisRun.current++; }, []);
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
    configureHifzFeedback({ haptics: saved.settings.haptics, sounds: true });
    return cancelHifzFeedback;
  }, [saved.settings.haptics]);
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
  useEffect(() => () => { stopAudio(); turnAnimation.current?.cancel(); if (transitionTimer.current) clearTimeout(transitionTimer.current); }, []);
  useEffect(() => { stopAudio(); }, [sabaqPhase]);

  // ---- session bootstrap ----
  useEffect(() => {
    if (!search.session) { setActiveSession(null); return; }
    const s = loadActiveSession();
    setActiveSession(s && s.date === search.session ? s : null);
    setHifzState(loadState());
  }, [search.session]);

  useEffect(() => {
    if (!autoResume.current || !handsFree || handsPaused || sessionItem?.kind !== "review" || !page || page.page !== sessionItem.page || !font || ai.phase !== "idle") return;
    const timer = setTimeout(() => { if (handsPaused) return; autoResume.current = false; stopAudio(); quranPlayer.pause(); recitationPlayer.pause(); void ai.request(aiRanges); }, 100);
    return () => clearTimeout(timer);
  }, [saved.page, page, font, ai.phase, itemIndex, handsPaused, handsFree]);
  useEffect(() => { if (sheet !== "ai") { ai.discardRecording(); mutateHighlight(null); } }, [sheet]);

  // Free recite deep link (?page=) from the progress map.
  useEffect(() => {
    if (search.session || !search.page || !hydrated) return;
    if (search.page !== latest.current.page) changePage(search.page, false);
  }, [search.page, search.session, hydrated]);

  // Prepare each session item: jump to its page, hide the page fresh, reset the tracker.
  useEffect(() => {
    if (!hydrated || !sessionItem || !page || sessionEnded) return;
    const key = `${search.session}:${itemIndex}`;
    if (preppedItem.current === key) return;
    const targetPage = sessionItem.kind === "review" || sessionItem.kind === "sabaq" ? sessionItem.page : sessionItem.kind === "link" ? sessionItem.pages[0] : null;
    if (targetPage && page.page !== targetPage) { changePage(targetPage, false); return; }
    if (!sessionPageReady(hydrated, page.page, targetPage ?? null)) return;
    preppedItem.current = key;
    trackerRef.current = createTracker();
    setAiCorrection(null); setAttempt(null); setCleanPasses(0); analysisRun.current++; ai.reset();
    sessionStartAt.current = Date.now();
    ayahStartAt.current = 0;
    lastAyah.current = null;
    setGradeAyah(null);
    setStatus("active");
    if (sessionItem.kind === "drills") { setSheet("drills"); return; }
    if (sessionItem.kind === "sabaq") {
      setSabaqPhase("recite");
      // New lines visible for listening; everything else on the page stays as it was.
      const updated = { ...latest.current.marks };
      for (const w of words) if (w.line > sessionItem.fromLine && w.line <= sessionItem.fromLine + sessionItem.lines) updated[w.key] = "correct";
      update({ marks: updated });
      return;
    }
    // review / link: the whole page starts hidden
    update({ marks: restartPage(words, latest.current.marks) });
  }, [hydrated, sessionItem, page, itemIndex, search.session, sessionEnded, words.length]);

  // Desirable difficulty: the 3 second "try first" window starts with each new ayah.
  useEffect(() => {
    if (!recallMode) return;
    const verse = next?.verse ?? null;
    if (verse && verse !== lastAyah.current) {
      lastAyah.current = verse;
      ayahStartAt.current = Date.now();
    }
  }, [next?.verse, recallMode]);

  // Sabaq: recite phase completes when the new lines are revealed; chain when all joined lines are.
  useEffect(() => {
    if (mode !== "self" || !sabaq || !rangeWords.length) return;
    if (sabaqPhase === "recite" && rangeWords.every((w) => revealed(saved.marks[w.key]))) {
      setSabaqPhase("correct");
      playFeedback("ayahComplete");
    } else if (sabaqPhase === "chain" && chainWords.every((w) => revealed(saved.marks[w.key]))) {
      finishSabaq();
    }
  }, [saved.marks, sabaqPhase, sabaq?.page, mode]);

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
  function startRecall(phase: "recite" | "chain") {
    stopAudio(); ai.reset(); setAiCorrection(null);
    const updated = { ...latest.current.marks };
    for (const w of phase === "chain" ? chainWords : rangeWords) delete updated[w.key];
    update({ marks: updated }); ayahStartAt.current = Date.now(); setSabaqPhase(phase); setStatus("active");
  }
  function completeAiStage(phase: "recite" | "chain") {
    stopAudio(); setAiCorrection(null);
    if (phase === "chain") { if (mode === "ai") advance(); else finishSabaq(); }
    else { playFeedback("ayahComplete"); startRecall("chain"); }
  }
  function changePage(pageNumber: number, feedback = true) {
    if (pageNumber < 1 || pageNumber > 604 || pageNumber === latest.current.page) return;
    stopAudio(); if (!handsFree || !autoResume.current) ai.cancel(); analysisRun.current++; setAttempt(null); setCleanPasses(0); setStatus("ready"); setSheet(null); setGradeAyah(null); setPeek(null);
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

  async function playAyah(key: string) {
    if (micBusy.current) return;
    stopAudio(); quranPlayer.pause(); recitationPlayer.pause();
    const token = audioRun.current.token();
    try {
      const data = await getChapterAudio(saved.settings.reciter, Number(key.split(":")[0]));
      if (!audioRun.current.current(token)) return;
      const timing = data.timings.find((t) => t.key === key);
      if (!timing) throw new Error("Audio unavailable");
      const a = new Audio(data.url); audio.current = a;
      a.onloadedmetadata = () => { a.currentTime = timing.from / 1000; };
      a.ontimeupdate = () => { if (a.currentTime >= timing.to / 1000) stopAudio(); };
      a.onended = () => setPlaying(false); a.onerror = () => { setPlaying(false); setAudioError("Ayah audio couldn’t play. Please retry."); };
      await a.play(); setPlaying(true);
    } catch { setAudioError("Ayah audio couldn’t play. Please retry."); }
  }

  /** Sabaq listen phase: the qari recites each verse in the new lines 3 times, highlighting words. */
  async function playSabaqListen() {
    if (!sabaq || !page || micBusy.current) return;
    const verses = page.verses.filter((v) => v.words.some((w) => !w.end && w.line > sabaq.fromLine && w.line <= sabaq.fromLine + sabaq.lines));
    stopAudio(); quranPlayer.pause(); recitationPlayer.pause();
    const token = audioRun.current.token();
    setPlaying(true); setAudioError("");
    try {
      for (const verse of verses) {
        if (!audioRun.current.current(token)) return;
        const chapterAudio = await getChapterAudio(saved.settings.reciter, verse.chapter);
        if (!audioRun.current.current(token)) return;
        const timing = chapterAudio.timings.find((t) => t.key === verse.key);
        if (!timing) continue;
        for (let round = 0; round < 3; round++) {
          if (!audioRun.current.current(token)) return;
          await audioRun.current.wait(token, (resolve) => {
            const a = audio.current ?? new Audio(chapterAudio.url);
            audio.current = a;
            if (a.src !== chapterAudio.url) a.src = chapterAudio.url;
            a.playbackRate = saved.settings.speed;
            a.onloadedmetadata = () => { a.currentTime = timing.from / 1000; };
            if (a.readyState >= 1) a.currentTime = timing.from / 1000;
            a.ontimeupdate = () => {
              const ms = a.currentTime * 1000;
              const segment = timing.segments?.find((s) => ms >= s[1] && ms < s[2]);
              if (segment) setAudioWord(`${verse.key}:${segment[0]}`);
              if (a.currentTime >= timing.to / 1000) { a.pause(); resolve(); }
            };
            a.onerror = () => { setAudioError("Qari audio is unavailable. You can skip listening."); resolve(); };
            a.onended = () => resolve();
            void a.play().catch(() => resolve());
          });
        }
      }
      if (!audioRun.current.current(token)) return;
      setPlaying(false); setAudioWord(null);
      setSabaqPhase("read");
    } catch {
      setPlaying(false); setAudioWord(null);
      setAudioError("Qari audio is unavailable right now. Please try again.");
    }
  }

  async function listen() {
    if (micBusy.current) return;
    if (playing) { stopAudio(); return; }
    const verse = next?.verse ?? first?.key;
    if (!verse) return;
    stopAudio(); quranPlayer.pause(); recitationPlayer.pause();
    const token = audioRun.current.token();
    try {
      const chapterAudio = await getChapterAudio(saved.settings.reciter, Number(verse.split(":")[0]));
      if (!audioRun.current.current(token) || micBusy.current) return;
      const timing = chapterAudio.timings.find((t) => t.key === verse);
      if (!timing) throw new Error("No verse timing");
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
    trackerRef.current.recordReveal(Date.now());
    const updated = all ? revealAyah(words, current.marks) : revealNext(words, current.marks);
    update({ marks: updated }); playFeedback("reveal");
    if (words.filter((w) => w.verse === pending.verse).every((w) => revealed(updated[w.key]))) {
      if (sessionItem) { playFeedback("ayahComplete"); return; }
      setStatus("paused"); setGradeAyah(pending.verse); playFeedback("ayahComplete");
    }
  }
  function horizon() {
    if (analyzing) return;
    if (mode === "self" && sabaq && (sabaqPhase === "listen" || sabaqPhase === "read" || sabaqPhase === "correct")) return;
    if (mode === "ai") {
      if (ai.phase === "listening") { void ai.stop(); return; }
      if (ai.phase === "loading" || ai.phase === "stopping") return;
      stopAudio(); quranPlayer.pause(); recitationPlayer.pause();
      const range = aiRanges[aiRangeIndex];
      if (range) { micBusy.current = true; void ai.request(sessionItem ? aiRanges : range); }
      return;
    }
    if (recallMode && next && Date.now() - ayahStartAt.current < TRY_FIRST_MS) {
      setTryFirst(true);
      setTimeout(() => setTryFirst(false), 1200);
      return;
    }
    if (status === "paused") { setStatus("active"); return; }
    if (status === "ready") setStatus("active");
    if (!next) { onAllRevealed(); return; }
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    if (!saved.settings.mist) { commitReveal(false); return; }
    update({ marks: { ...saved.marks, [next.key]: "in_progress" } });
    transitionTimer.current = setTimeout(() => commitReveal(false), 220);
  }
  /** Everything on the page is revealed: free mode opens the page summary, session mode advances. */
  function onAllRevealed() {
    if (sessionItem?.kind === "review") { setSheet("sessionGrade"); setStatus("paused"); playFeedback("pageComplete"); return; }
    if (sessionItem?.kind === "link") { playFeedback("pageComplete"); advance(); return; }
    if (sessionItem) return; // sabaq finishes through its phase machine
    setSheet("complete"); setStatus("paused"); playFeedback("pageComplete");
  }
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
    latestState.current = next;
    setHifzState({ ...next });
    const names = Object.fromEntries(chapters.map((c) => [c.id, c.name_simple]));
    setCelebrations(pendingMilestones(next, quranIndex, names));
  }
  function advance() {
    if (!activeSession) return;
    const updated = { ...activeSession, done: Math.max(activeSession.done, itemIndex + 1), seconds: activeSession.seconds + sessionSeconds() };
    saveActiveSession(updated);
    setActiveSession(updated);
    stopAudio();
    setSheet(null);
    void navigate({ to: "/app/hifz/recite", search: { session: updated.date, item: itemIndex + 1 }, replace: true });
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
    advance();
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
  function blankOut() {
    trackerRef.current.recordBlank();
    const updated = { ...latest.current.marks };
    for (const w of words) if (!revealed(updated[w.key])) updated[w.key] = "correct";
    update({ marks: updated });
    onAllRevealed();
  }

  const wordNode = (word: ReciteWord) => {
    if (word.end) return saved.settings.numbers ? <span key={word.key} className="rc-ayah-end" aria-label={`Ayah ${word.verse.split(":")[1]}`}><AyahMarker number={Number(word.verse.split(":")[1])} size={18} done={words.filter((w) => w.verse === word.verse).every((w) => revealed(saved.marks[w.key]))} /></span> : null;
    const aiStatus = mode === "ai" ? (aiCorrection?.statuses[word.key] ?? aiWords?.statuses[word.key]) : undefined;
    const targetWords = sabaq ? (cleanPasses >= 2 ? chainWords : rangeWords) : words;
    const memoryTest = targetWords.some((w) => w.key === word.key);
    const hesitated = sheet === "ai" && attempt?.hes.some((h) => h.key === word.key);
    const tipped = sheet === "ai" && saved.settings.tajweedTips && attempt?.tips?.some((h) => h.key === word.key);
    const state: WordState = mode === "ai" && memoryTest ? aiWordState(aiStatus) : (mode === "ai" && !memoryTest ? "correct" : saved.marks[word.key] ?? "pending");
    const hint = peek === "all" || (mode === "self" && (peek === word.key || isOpeningWord(word, words, saved.settings.hideAmount)));
    return <Button variant="ghost" key={word.key} className={`rc-word rc-${state} ${aiStatus === "wrong" || aiStatus === "skipped" ? `rc-ai-${aiStatus}` : ""} ${hesitated ? "rc-hesitated" : ""} ${tipped ? "rc-tipped" : ""} ${hint ? "rc-peek" : ""} ${audioWord === word.key ? "rc-listening" : ""}`} onPointerUp={(e) => {
      const start = pointer.current;
      if (!micBusy.current && start && start.id === e.pointerId && pageGesture(start, e.clientX, e.clientY, e.timeStamp) === "tap" && mode === "ai" && aiStatus !== "wrong" && aiStatus !== "skipped") {
        e.stopPropagation(); pointer.current = null; setMeaning(word); return;
      }
      if (mode === "ai" && (aiStatus === "wrong" || aiStatus === "skipped") && start && start.id === e.pointerId && pageGesture(start, e.clientX, e.clientY, e.timeStamp) === "tap") { e.stopPropagation(); pointer.current = null; void playWord(word); return; }
      if (mode !== "self" || !revealed(state) || !start || start.id !== e.pointerId || pageGesture(start, e.clientX, e.clientY, e.timeStamp) !== "tap") return;
      e.stopPropagation(); pointer.current = null; mark(word);
    }} onClick={(e) => { if (e.detail === 0 && !micBusy.current && mode === "ai" && aiStatus !== "wrong" && aiStatus !== "skipped") { setMeaning(word); return; } if (e.detail === 0 && mode === "self" && revealed(state)) mark(word); if (e.detail === 0 && (aiStatus === "wrong" || aiStatus === "skipped")) void playWord(word); }} aria-label={`Word ${word.key}, ${aiStatus ?? state}`} data-word={word.key} data-state={aiStatus ?? state} data-source={aiStatus ? "ai" : "self"}>
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
    if (bismillah) return <div key={line} className="rc-bismillah rc-arabic">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>;
    return <div key={line} className={`rc-line ${saved.page <= 2 ? "rc-short-line" : ""}`} dir="rtl">{lineItems.map(wordNode)}</div>;
  };

  const phaseInfo = sabaq ? SABAQ_PHASES.find((p) => p.id === sabaqPhase) : null;
  const correctWrongs = sabaq ? rangeWords.filter((w) => saved.marks[w.key] === "wrong" || saved.marks[w.key] === "skipped") : [];
  const tomorrowSession = hifzState ? buildSession(hifzState, quranIndex, addDays(today, 1)) : null;
  const sessionStats = hifzState ? stats(hifzState, quranIndex, today) : null;

  if(quranV2) return <UnifiedReader initialPage={saved.page} back={()=>{saveActiveSession(null);void navigate({to:activeSession?"/app/hifz":"/app/more"});}} lesson={{
    pill:<>{chapter?.name_simple} · {sessionItem?.kind === "review" ? "Review" : "Lesson"}{sabaq&&<span className="rc-pass-dots" aria-label={`${cleanPasses} of 3 clean recitations`}>{[1,2,3].map(n=><i key={n} className={cleanPasses>=n?"is-filled":""}/>)}</span>}</>,
    marks:mode==="ai"?Object.fromEntries(words.map(w=>[w.key,aiWordState(aiCorrection?.statuses[w.key]??aiWords?.statuses[w.key])])):saved.marks,
    hidden:status==="active",stream:ai.stream,busy:analyzing||ai.phase==="loading"||ai.phase==="stopping",mic:horizon,
    listen:()=>{if(playing)stopAudio();else if(sabaq)void playSabaqListen();else void listen();},peek:()=>{setPeek("all");setTimeout(()=>setPeek(null),1500);},onWord:w=>{if(mode==="self")mark(w);else if(w.audio)void playWord(w);},highlight:audioWord,
    peeked:peek==="all",keys:new Set((sabaq?(cleanPasses>=2?chainWords:rangeWords):words).map(w=>w.key)),onPage:changePage,
    onSilence:last=>{const result=liveResult.current;if(ai.phase==="listening"&&!handsPaused&&result&&pageReached(result,Date.now()-last))void ai.stop();},
    tools:<>{sabaq&&<Button variant="outline" size="sm" onClick={()=>setUnderstand(true)}><BookOpen size={14}/>Meaning</Button>}{sabaq&&<Button variant="outline" size="sm" onClick={()=>{stopAudio();setEcho(true);}}><Repeat size={14}/>Echo</Button>}{sessionItem?.kind==="review"&&<><Switch aria-label="Hands-free" checked={handsFree} onCheckedChange={setHandsFree}/><Button variant="ghost" onClick={()=>{if(handsPaused){setHandsPaused(false);ai.resumeStream();}else{setHandsPaused(true);ai.pauseStream();}}}>{handsPaused?"Resume":"Pause"}</Button></>}</>,
    overlays:<>    {(sheet || gradeAyah) && <div className="rc-backdrop" onClick={() => { if (!gradeAyah && sheet !== "drills" && sheet !== "sessionGrade" && sheet !== "sessionEnd") setSheet(null); }}>
      <div onClick={(e) => e.stopPropagation()}>
        {sheet === "settings" && <ReciteSettings settings={saved.settings} change={(settings) => setSaved((s) => ({ ...s, settings: { ...s.settings, ...settings } }))} close={() => setSheet(null)} />}
        {sheet === "navigation" && <PageNavigation page={saved.page} chapter={first?.chapter} juz={first?.juz} chapters={chapters} go={changePage} close={() => setSheet(null)} />}
        {sheet === "ai" && attempt && <AiResultSheet attempt={attempt} passes={cleanPasses} lesson={!!sabaq} chapters={chapters} recording={ai.recording} showTips={saved.settings.tajweedTips} highlight={mutateHighlight} close={() => setSheet(null)} again={() => { setAttempt(null); setAiCorrection(null); ai.reset(); setSheet(null); if (sabaq) setSabaqPhase(cleanPasses >= 2 ? "chain" : "recite"); }} next={() => {
          if (sabaq && cleanPasses < CLEAN_PASSES) { setAttempt(null); setAiCorrection(null); ai.reset(); setSheet(null); setSabaqPhase(cleanPasses >= 2 ? "chain" : "recite"); }
          else if (activeSession) { playFeedback("pageComplete"); advance(); }
          else { ai.reset(); setAttempt(null); setSheet(null); }
        }} wordAudio={(key) => { const word = words.find((w) => w.key === key); if (word) void playWord(word); }} ayahAudio={(key) => void playAyah(key)} />}
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
        {sheet === "sessionEnd" && activeSession && <section className="rc-sheet rc-complete" role="dialog" aria-modal="true" aria-label="Session complete">
          <Check className="rc-sheet-icon" />
          <h2>Session complete</h2>
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
    {understand && <Understanding keys={[...new Set(rangeWords.map((w) => w.verse))]} close={() => setUnderstand(false)} />}
    {echo && <EchoMode keys={[...new Set(rangeWords.map((w) => w.verse))]} reciter={saved.settings.reciter} close={() => setEcho(false)} highlight={echoHighlight} />}
    {meaning && <WordMeaning word={meaning} play={() => void playWord(meaning)} close={() => setMeaning(null)} />}
    {celebrations[0] && !handsFree && !sheet && <MilestoneMoment moment={celebrations[0]} done={() => setCelebrations((m) => m.slice(1))} />}
    {showReviewSummary && <div className="rc-backdrop"><section className="rc-sheet rc-result-sheet" role="dialog" aria-label="Hands-free summary"><h2>Review summary</h2>{reviewSummary.map((entry, n) => <section key={n} className="hx-ayah-block"><h3>Page {entry.page} · {entry.attempt.m.label} {entry.attempt.m.score}</h3>{entry.attempt.result.words.filter((w) => w.status === "wrong" || w.status === "skipped").map((w) => <p key={w.key} dir="rtl">{w.text} · {w.key}</p>)}{entry.attempt.clean && <p>Clean recitation</p>}</section>)}<Button onClick={() => { setShowReviewSummary(false); setHandsFree(false); ai.cancel(); advance(); }}>Continue</Button></section></div>}
    {sessionEnded && activeSession && !sheet && <div className="rc-backdrop"><div onClick={(e) => e.stopPropagation()}>
      <section className="rc-sheet rc-complete" role="dialog" aria-modal="true" aria-label="Session complete">
        <Check className="rc-sheet-icon" />
        <h2>Session complete</h2>
        <p>{activeSession.done} of {sessionTotal} steps · {Math.max(1, Math.round(activeSession.seconds / 60))} min{sessionStats ? ` · ${sessionStats.streak} day streak` : ""}</p>
        {tomorrowSession && <p style={{ fontSize: 12, opacity: .7 }}>Tomorrow: {tomorrowSession.steps.length} steps, about {tomorrowSession.totalMinutes} min</p>}
        <Button className="rc-primary" onClick={() => { saveActiveSession(null); void navigate({ to: "/app/hifz" }); }}>Done</Button>
      </section>
    </div></div>}
</>
  }}/>;

  return <Portal><MushafThemeProvider theme={appTheme} mode={morningOrEvening} className={`recite-page rc-supplied rc-hide-${saved.settings.hideStyle} ${controls ? "rc-controls-visible" : ""} ${saved.settings.theme === "night" ? "rc-night" : ""}`} style={{ "--rc-size": `${saved.settings.size}px`, "--rc-strip-height": `${dimensions.strip}px`, "--rc-label-height": `${dimensions.labels}px`, "--m-font-quran": "var(--font-arabic)" } as CSSProperties}><main onPointerDownCapture={() => { touching.current = true; setTouchActivity((v) => v + 1); }} onPointerUpCapture={() => { touching.current = false; setTouchActivity((v) => v + 1); }} onPointerCancelCapture={() => { touching.current = false; setTouchActivity((v) => v + 1); }}>
    <header className="rc-header" aria-hidden={!controls} inert={!controls}><Button variant="ghost" size="icon" aria-label="Exit Hifz" onClick={() => { saveActiveSession(null); void navigate({ to: activeSession ? "/app/hifz" : "/app/more" }); }}><ChevronLeft /></Button><Button variant="ghost" className="rc-title" aria-label="Go to page" onClick={() => setSheet("navigation")}>{chapter?.name_simple ?? "Quran"} · {saved.page}</Button><Button variant="ghost" size="icon" aria-label="Page settings" onClick={() => setSheet("settings")}>Aa</Button></header>
    {activeSession && !sessionEnded && !handsFree && <div className="rc-lesson-pill">{chapter?.name_simple} · {sessionItem?.kind === "review" ? "Review" : "Lesson"}{sabaq && <span className="rc-pass-dots" aria-label={`${cleanPasses} of 3 clean recitations`}>{[1, 2, 3].map((n) => <i key={n} className={cleanPasses >= n ? "is-filled" : ""} />)}</span>}</div>}
    <div className="hx-mini-tools">
      {sabaq && <><Button variant="ghost" size="sm" title="Meaning" aria-label="Meaning" disabled={micBusy.current} onClick={() => setUnderstand(true)}><BookOpen size={16}/>Meaning</Button><Button variant="ghost" size="sm" title="Echo" aria-label="Echo" disabled={micBusy.current} onClick={() => { stopAudio(); setEcho(true); }}><Repeat size={16}/>Echo</Button></>}
      {mode === "ai" && sessionItem?.kind === "review" && <><Switch aria-label="Hands-free" checked={handsFree} disabled={ai.phase === "listening" || ai.phase === "loading"} onCheckedChange={(v) => { setHandsFree(v); setHandsPaused(false); if (!v) ai.cancel(); }}/>{handsFree && <Button variant="ghost" size="icon" aria-label={handsPaused ? "Resume hands-free" : "Pause hands-free"} disabled={ai.phase === "loading" || ai.phase === "stopping"} onClick={() => { if (handsPaused) { setHandsPaused(false); if (ai.phase === "listening") ai.resumeStream(); else { quranPlayer.pause(); recitationPlayer.pause(); void ai.request(aiRanges); } } else { setHandsPaused(true); ai.pauseStream(); } }}>{handsPaused ? <Play size={16}/> : <Pause size={16}/>}</Button>}</>}
    </div>
    {handsFree && sessionItem?.kind === "review" && <div className="rc-lesson-pill">Hands-free · page {reviewSummary.length + 1} of {activeSession?.items.filter((i) => i.kind === "review").length}</div>}
    {mode === "self" && sabaq && phaseInfo && !sessionEnded && <div className="hz-phase-bar" role="status">
      <span>{phaseInfo.label}</span><small>{phaseInfo.hint}</small>
      {sabaqPhase === "listen" && <Button variant="ghost" size="sm" onClick={() => { stopAudio(); setSabaqPhase("read"); }}>Skip</Button>}
      {sabaqPhase === "read" && <Button variant="ghost" size="sm" onClick={() => {
        startRecall("recite");
      }}>Hide & recite</Button>}
      {sabaqPhase === "correct" && aiCorrection && <><Button variant="ghost" size="sm" onClick={() => startRecall(correctionPhase.current)}>Recite again</Button><Button variant="ghost" size="sm" onClick={() => completeAiStage(correctionPhase.current)}>I recited it right, continue</Button></>}
      {sabaqPhase === "correct" && !aiCorrection && (correctWrongs.length ? <Button variant="ghost" size="sm" onClick={() => {
        const updated = { ...latest.current.marks };
        for (const w of rangeWords) delete updated[w.key];
        update({ marks: updated });
        ayahStartAt.current = Date.now();
        setSabaqPhase("recite");
      }}>Recite again</Button> : <Button variant="ghost" size="sm" onClick={() => {
        const updated = { ...latest.current.marks };
        for (const w of chainWords) delete updated[w.key];
        update({ marks: updated });
        ayahStartAt.current = Date.now();
        setSabaqPhase("chain");
      }}>Chain</Button>)}
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
        {pageQuery.isPending ? <div className="rc-loading">Loading mushaf page…</div> : pageQuery.isError ? <div className="rc-loading">{pageQuery.error.message}<Button variant="outline" onClick={() => void pageQuery.refetch()}>Try again</Button></div> : saved.settings.layout === "mushaf" && !font ? <div className="rc-loading" role="status">Loading mushaf font…{fontFailed && <Button variant="outline" onClick={() => setFontAttempt((v) => v + 1)}>Try again</Button>}</div> : <div className={`rc-mushaf ${font && saved.settings.layout === "mushaf" ? "rc-glyphs" : ""}`} style={{ fontFamily: saved.settings.layout === "mushaf" ? font ?? undefined : undefined, gridTemplateRows: saved.settings.layout === "mushaf" ? Array.from({ length: 15 }, (_, i) => page?.verses.some((v) => v.number === 1 && v.words[0]?.line === i + 3) ? "48px" : "minmax(0, 1fr)").join(" ") : undefined }}>
          {saved.settings.layout === "mushaf" ? Array.from({ length: 15 }, (_, i) => renderLine(i + 1)) : page?.verses.map((verse) => <section className="rc-verse" key={verse.key}><div className="rc-verse-words" dir="rtl">{verse.words.map(wordNode)}</div>{saved.settings.translation && <p className="rc-translation">{verse.translation}</p>}{saved.settings.transliteration && <p className="rc-translation">{verse.words.filter((w) => !w.end).map((w) => w.transliteration).join(" ")}</p>}</section>)}
        </div>}
        </MushafFrame>
        <div className="rc-page-badge"><MushafPageNumber page={saved.page} height={24} /></div>
      </div>
    </div>
    {tryFirst && <div className="hz-try-first" role="status">Try first</div>}
    <div className="rc-dock">
      {controls && status === "paused" && !gradeAyah && !sheet && <div className="rc-pause-tools"><Button variant="ghost" onClick={() => setStatus("active")}><Play />Resume</Button><Button variant="ghost" onClick={() => { stopAudio(); update({ marks: restartPage(words, saved.marks), grades: Object.fromEntries(Object.entries(saved.grades).filter(([key]) => !page?.verses.some((v) => v.key === key))), seconds: { ...saved.seconds, [saved.page]: 0 } }); setStatus("ready"); }}><RotateCcw />Restart page</Button><Button variant="ghost" onClick={() => void listen()}>{playing ? <Pause /> : <Play />}Qari</Button><Button variant="ghost" onClick={() => setSheet("marks")}><Flag />Marks</Button></div>}
      {audioError && <p className="rc-audio-error" role="alert">{audioError}</p>}
      {fallbackMessage && <p className="rc-audio-error" role="status">{fallbackMessage}</p>}
      {sabaq && sabaqPhase === "listen" && !playing && <Button variant="outline" onClick={() => void playSabaqListen()}><Play size={15} /> Play the new lines 3×</Button>}
      {mode === "self" && recallMode && sessionItem?.kind === "review" && next && <Button variant="ghost" onClick={blankOut} style={{ fontSize: 12, opacity: .8 }}>I can't recall</Button>}
      <div className="rc-strip-wrap" ref={stripElement} aria-hidden={controls} inert={controls || !page || pageQuery.isPending || (saved.settings.layout === "mushaf" && !font) || !!gradeAyah || !!sheet}>
        <RecitationMic stream={ai.stream} busy={analyzing || ai.phase === "loading" || ai.phase === "stopping"} playing={playing} start={horizon} listen={() => { if (playing) stopAudio(); else if (sabaq) void playSabaqListen(); else void listen(); }} peek={() => { const target = sabaq ? (cleanPasses >= 2 ? chainWords : rangeWords) : words; setPeek("all"); setTimeout(() => setPeek(null), 1500); if (mode === "self" && target[0]) mark(target[0]); }} onSilence={(lastVoice) => {
          const result = liveResult.current;
          if (ai.phase !== "listening" || handsPaused || !result || Date.now() - lastVoice < 1500) return;
          const target = sabaq ? (cleanPasses >= 2 ? chainWords : rangeWords) : words;
          if (target.length && pageReached(result, Date.now() - lastVoice)) void ai.stop();
        }} />
      </div>
      {mode === "ai" && <div className="rc-ai-footer">
        {!sessionItem && aiRanges.length > 1 && <select aria-label="Passage to check" disabled={ai.phase === "listening" || ai.phase === "loading" || ai.phase === "stopping"} value={aiRangeIndex} onChange={(e) => setAiRangeIndex(Number(e.target.value))}>{aiRanges.map((r, i) => <option key={r.sura} value={i}>{chapters.find((c) => c.id === r.sura)?.name_simple} · {r.first}–{r.last}</option>)}</select>}
        <p>{AI_DISCLAIMER}</p>
      </div>}
    </div>
    <div className="rc-nav-wrap" aria-hidden={!controls} inert={!controls}><BottomNav /></div>
    {(sheet || gradeAyah) && <div className="rc-backdrop" onClick={() => { if (!gradeAyah && sheet !== "drills" && sheet !== "sessionGrade" && sheet !== "sessionEnd") setSheet(null); }}>
      <div onClick={(e) => e.stopPropagation()}>
        {sheet === "settings" && <ReciteSettings settings={saved.settings} change={(settings) => setSaved((s) => ({ ...s, settings: { ...s.settings, ...settings } }))} close={() => setSheet(null)} />}
        {sheet === "navigation" && <PageNavigation page={saved.page} chapter={first?.chapter} juz={first?.juz} chapters={chapters} go={changePage} close={() => setSheet(null)} />}
        {sheet === "ai" && attempt && <AiResultSheet attempt={attempt} passes={cleanPasses} lesson={!!sabaq} chapters={chapters} recording={ai.recording} showTips={saved.settings.tajweedTips} highlight={mutateHighlight} close={() => setSheet(null)} again={() => { setAttempt(null); setAiCorrection(null); ai.reset(); setSheet(null); if (sabaq) setSabaqPhase(cleanPasses >= 2 ? "chain" : "recite"); }} next={() => {
          if (sabaq && cleanPasses < CLEAN_PASSES) { setAttempt(null); setAiCorrection(null); ai.reset(); setSheet(null); setSabaqPhase(cleanPasses >= 2 ? "chain" : "recite"); }
          else if (activeSession) { playFeedback("pageComplete"); advance(); }
          else { ai.reset(); setAttempt(null); setSheet(null); }
        }} wordAudio={(key) => { const word = words.find((w) => w.key === key); if (word) void playWord(word); }} ayahAudio={(key) => void playAyah(key)} />}
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
        {sheet === "sessionEnd" && activeSession && <section className="rc-sheet rc-complete" role="dialog" aria-modal="true" aria-label="Session complete">
          <Check className="rc-sheet-icon" />
          <h2>Session complete</h2>
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
    {understand && <Understanding keys={[...new Set(rangeWords.map((w) => w.verse))]} close={() => setUnderstand(false)} />}
    {echo && <EchoMode keys={[...new Set(rangeWords.map((w) => w.verse))]} reciter={saved.settings.reciter} close={() => setEcho(false)} highlight={echoHighlight} />}
    {meaning && <WordMeaning word={meaning} play={() => void playWord(meaning)} close={() => setMeaning(null)} />}
    {celebrations[0] && !handsFree && !sheet && <MilestoneMoment moment={celebrations[0]} done={() => setCelebrations((m) => m.slice(1))} />}
    {showReviewSummary && <div className="rc-backdrop"><section className="rc-sheet rc-result-sheet" role="dialog" aria-label="Hands-free summary"><h2>Review summary</h2>{reviewSummary.map((entry, n) => <section key={n} className="hx-ayah-block"><h3>Page {entry.page} · {entry.attempt.m.label} {entry.attempt.m.score}</h3>{entry.attempt.result.words.filter((w) => w.status === "wrong" || w.status === "skipped").map((w) => <p key={w.key} dir="rtl">{w.text} · {w.key}</p>)}{entry.attempt.clean && <p>Clean recitation</p>}</section>)}<Button onClick={() => { setShowReviewSummary(false); setHandsFree(false); ai.cancel(); advance(); }}>Continue</Button></section></div>}
    {sessionEnded && activeSession && !sheet && <div className="rc-backdrop"><div onClick={(e) => e.stopPropagation()}>
      <section className="rc-sheet rc-complete" role="dialog" aria-modal="true" aria-label="Session complete">
        <Check className="rc-sheet-icon" />
        <h2>Session complete</h2>
        <p>{activeSession.done} of {sessionTotal} steps · {Math.max(1, Math.round(activeSession.seconds / 60))} min{sessionStats ? ` · ${sessionStats.streak} day streak` : ""}</p>
        {tomorrowSession && <p style={{ fontSize: 12, opacity: .7 }}>Tomorrow: {tomorrowSession.steps.length} steps, about {tomorrowSession.totalMinutes} min</p>}
        <Button className="rc-primary" onClick={() => { saveActiveSession(null); void navigate({ to: "/app/hifz" }); }}>Done</Button>
      </section>
    </div></div>}
  </main></MushafThemeProvider></Portal>;
}
