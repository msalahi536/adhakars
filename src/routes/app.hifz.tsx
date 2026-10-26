import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Eye, Lightbulb, Pause, Play, RotateCcw, Square } from "lucide-react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { findReciter, getChapterAudio, reciterName, type ChapterAudio, type Timing } from "@/lib/quran";
import { quranPlayer } from "@/lib/quran-player";
import { getDisplay } from "@/lib/theme";
import { fadeHidden, firstLetter, hifzChapters, hifzPage, hifzWords, pageLines, type MChapter, type MWord } from "@/lib/hifz/mushaf";
import { derive, loadHifz, recordEvent } from "@/lib/hifz/store";
import type { Grade } from "@/lib/hifz/scheduler";

export const Route = createFileRoute("/app/hifz")({
  head: () => ({
    meta: [
      { title: "Hifz Companion, Sahih Al-Adhkar" },
      { name: "description", content: "Memorize the Quran with active recall: listen, hide step by step, recite from memory and grade yourself." },
      { property: "og:title", content: "Hifz Companion, Sahih Al-Adhkar" },
      { property: "og:description", content: "Active-recall Quran memorization, ayah by ayah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Hifz,
});

const REPEATS = [1, 3, 5, 10, 20];
const SPEEDS = [0.75, 1, 1.25, 1.5];
const GRADES: { g: Grade; label: string }[] = [
  { g: "blank", label: "Blank" },
  { g: "mistake", label: "Mistake" },
  { g: "hesitation", label: "Hesitation" },
  { g: "perfect", label: "Perfect" },
];
const LEVELS = ["Full text", "First letters", "Fading", "Hidden"];

function savedReciter(): number {
  try {
    return JSON.parse(localStorage.getItem("adhkar:quran:last") || "{}").r ?? 7;
  } catch {
    return 7;
  }
}

function buzz() {
  if (!getDisplay().haptics) return;
  Haptics.impact({ style: ImpactStyle.Medium }).catch(() => navigator.vibrate?.(15));
}

type Phase = "study" | "check" | "chainOffer" | "chain" | "chainCheck" | "done";

function Hifz() {
  const [chapters, setChapters] = useState<MChapter[]>([]);
  const [chapter, setChapter] = useState(1);
  const [start, setStart] = useState(1);
  const [size, setSize] = useState(1);
  const [words, setWords] = useState<MWord[] | null>(null);
  const [err, setErr] = useState("");
  const [begun, setBegun] = useState(false);
  const [reciterId, setReciterId] = useState(7);

  useEffect(() => {
    setReciterId(savedReciter());
    hifzChapters().then(setChapters).catch(() => setErr("Connect to the internet once to load the surah list."));
  }, []);
  useEffect(() => {
    setWords(null);
    setErr("");
    hifzWords(chapter).then(setWords).catch(() => setErr("Connect to the internet once to load this surah. After that it works offline."));
  }, [chapter]);

  const ch = chapters.find((c) => c.id === chapter);
  const max = ch?.verses ?? 7;

  return (
    <>
      <header className="page-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        <HeaderBackButton />
        <div className="relative mx-auto max-w-md pb-6 pt-9 text-center" style={{ paddingLeft: 60, paddingRight: 60 }}>
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>Memorization</div>
          <h1 className="app-page-title mt-2">Hifz Companion</h1>
        </div>
      </header>
      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-4 px-4 py-4" style={{ color: "var(--foreground)" }}>
          {!begun ? (
            <section className="glass-card space-y-4 p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h2 className="label-caps">Choose what to memorize</h2>
              <label className="block text-sm">
                Surah
                <select
                  className="mt-1 w-full rounded-xl px-3 py-3 text-base"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  value={chapter}
                  onChange={(e) => { setChapter(+e.target.value); setStart(1); }}
                >
                  {(chapters.length ? chapters : [{ id: 1, name: "Al-Fatihah", arabic: "", verses: 7 }]).map((c) => (
                    <option key={c.id} value={c.id}>{c.id}. {c.name} {c.arabic}</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Starting ayah
                <input
                  type="number" min={1} max={max} value={start}
                  onChange={(e) => setStart(Math.min(max, Math.max(1, +e.target.value || 1)))}
                  className="mt-1 w-full rounded-xl px-3 py-3 text-base"
                  style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </label>
              <div className="text-sm">
                Ayahs per chunk
                <div className="mt-1 grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((n) => (
                    <Chip key={n} on={size === n} onClick={() => setSize(n)}>{n}</Chip>
                  ))}
                </div>
              </div>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Reciter: {reciterName(findReciter(reciterId))} (your current Quran reciter)</p>
              {err && <p className="text-sm" style={{ color: "var(--destructive)" }}>{err}</p>}
              <button
                disabled={!words}
                onClick={() => setBegun(true)}
                className="w-full rounded-full py-3.5 text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
              >
                {words ? "Start" : "Loading surah…"}
              </button>
            </section>
          ) : (
            words && (
              <Workspace
                key={`${chapter}-${start}-${size}`}
                chapter={chapter}
                maxAyah={max}
                start={start}
                size={size}
                words={words}
                reciterId={reciterId}
                onNext={() => setStart((s) => Math.min(max, s + size))}
                onExit={() => setBegun(false)}
              />
            )
          )}
        </div>
      </main>
    </>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="min-h-11 rounded-full px-3 text-sm font-semibold"
      style={on ? { background: "var(--accent)", color: "var(--accent-foreground)" } : { background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
    >
      {children}
    </button>
  );
}

type Props = { chapter: number; maxAyah: number; start: number; size: number; words: MWord[]; reciterId: number; onNext: () => void; onExit: () => void };

function Workspace({ chapter, maxAyah, start, size, words, reciterId, onNext, onExit }: Props) {
  const keysFor = (from: number, n: number) => Array.from({ length: n }, (_, i) => from + i).filter((a) => a >= 1 && a <= maxAyah).map((a) => `${chapter}:${a}`);
  const keys = keysFor(start, size);
  const prevKeys = start > 1 ? keysFor(Math.max(1, start - size), Math.min(size, start - 1)) : [];
  const prevLearned = useMemo(() => {
    const d = derive(loadHifz().events);
    return prevKeys.length > 0 && prevKeys.every((k) => d.ayahs[k]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start]);

  const [phase, setPhase] = useState<Phase>("study");
  const [level, setLevel] = useState(1);
  const [pass, setPass] = useState(1);
  const [suggest, setSuggest] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [aids, setAids] = useState(false);
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<string>("");
  const [outlines, setOutlines] = useState(false);
  const fitRef = useRef<HTMLDivElement | null>(null);
  const [fit, setFit] = useState(24);
  const [pageWords, setPageWords] = useState<Record<number, MWord[]>>({});
  useEffect(() => {
    const pages = [...new Set(words.filter((w) => w.key.startsWith(`${chapter}:`) && [...prevKeys, ...keys].includes(w.key)).map((w) => w.page))];
    for (const p of pages) hifzPage(p).then((ws) => setPageWords((m) => ({ ...m, [p]: ws }))).catch(() => { /* offline: falls back to this surah's words */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, size, chapter]);

  const chain = phase === "chain" || phase === "chainCheck";
  const activeKeys = chain ? [...prevKeys, ...keys] : keys;
  const chunkWords = words.filter((w) => activeKeys.includes(w.key));
  const spoken = chunkWords.filter((w) => !w.end);
  const wid = (w: MWord) => `${w.key}:${w.pos}`;
  const effLevel = chain ? 4 : level;
  const checking = phase === "check" || phase === "chainCheck";
  const nextHidden = spoken.find((w) => !revealed.has(wid(w)));
  const curKey = nextHidden?.key ?? activeKeys[activeKeys.length - 1];

  // ---- audio ----
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audio, setAudio] = useState<ChapterAudio | null>(null);
  const [audioErr, setAudioErr] = useState("");
  const [repeat, setRepeat] = useState(3);
  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(0);
  const stopAt = useRef<{ from: number; to: number; times: number; done: number } | null>(null);

  useEffect(() => {
    getChapterAudio(reciterId, chapter).then(setAudio).catch(() => setAudioErr("Audio needs an internet connection."));
    return () => { audioRef.current?.pause(); };
  }, [reciterId, chapter]);
  const timing = (k: string): Timing | undefined => audio?.timings.find((t) => t.key === k);
  const hasTimings = activeKeys.every((k) => timing(k));
  const hasWordTimings = hasTimings && activeKeys.every((k) => (timing(k)?.segments.length ?? 0) > 0);

  function playRange(from: number, to: number, times: number) {
    if (!audio) return;
    quranPlayer.pause();
    let el = audioRef.current;
    if (!el) {
      el = new Audio();
      audioRef.current = el;
      el.ontimeupdate = () => {
        const s = stopAt.current;
        if (!s || !el) return;
        if (el.currentTime * 1000 >= s.to) {
          s.done += 1;
          setLoop(s.done);
          if (s.done < s.times) el.currentTime = s.from / 1000;
          else { el.pause(); setPlaying(false); stopAt.current = null; }
        }
      };
      el.onpause = () => setPlaying(false);
      el.onplay = () => setPlaying(true);
    }
    if (el.src !== audio.url) el.src = audio.url;
    el.playbackRate = rate;
    stopAt.current = { from, to, times, done: 0 };
    setLoop(0);
    const go = () => { el!.currentTime = from / 1000; el!.play().catch(() => setAudioErr("Couldn't play audio. Check your connection.")); };
    if (el.readyState >= 1) go(); else el.onloadedmetadata = go;
  }
  const stop = () => { audioRef.current?.pause(); stopAt.current = null; };
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = rate; }, [rate]);

  const playChunk = (times: number) => {
    const a = timing(activeKeys[0]), b = timing(activeKeys[activeKeys.length - 1]);
    if (a && b) playRange(a.from, b.to, times);
  };

  // Pause-and-continue: play the current ayah up to the next hidden word, then stop so you carry on.
  const pauseAndContinue = () => {
    const t = timing(curKey);
    if (!t) return;
    const pos = nextHidden && nextHidden.key === curKey ? nextHidden.pos : 1;
    const seg = t.segments.find((s) => s[0] === pos) ?? t.segments[0];
    setAids(true);
    playRange(t.from, seg ? seg[2] : t.from + 1500, 1);
  };

  // ---- actions ----
  const reveal = (ids: string[]) => setRevealed((r) => new Set([...r, ...ids]));
  const peek = () => { if (nextHidden) { reveal([wid(nextHidden)]); setAids(true); } };
  const firstWord = () => {
    const w = spoken.find((x) => x.key === curKey && x.pos === 1) ?? spoken.find((x) => x.key === curKey);
    if (w) { reveal([wid(w)]); setAids(true); }
  };
  const toggleError = (id: string) => setErrors((e) => { const n = new Set(e); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const resetRecall = () => { setRevealed(new Set()); setAids(false); setErrors(new Set()); stop(); };

  function practiceGrade(g: Grade) {
    buzz();
    if (g === "perfect" && level < 4) setSuggest(true);
    if (level === 3 && g !== "perfect") setPass((p) => p);
  }

  function logGrade(g: Grade) {
    buzz();
    const errWords = [...errors];
    const pageOf = (k: string) => words.find((w) => w.key === k)?.page ?? 0;
    if (chain) {
      for (const k of activeKeys) recordEvent({ kind: "chain", key: k, page: pageOf(k), grade: g, errorWords: errWords.filter((w) => w.startsWith(k + ":")) });
      setSaved("Joined recitation saved.");
      setPhase("done");
      return;
    }
    const d = derive(loadHifz().events);
    for (const k of keys) {
      if (!d.ayahs[k]) recordEvent({ kind: "learn", key: k, page: pageOf(k) });
      recordEvent({ kind: "ayah", key: k, page: pageOf(k), grade: g, errorWords: errWords.filter((w) => w.startsWith(k + ":")) });
    }
    setSaved(`Saved as ${GRADES.find((x) => x.g === g)!.label}.`);
    if (g === "perfect" && prevLearned) setPhase("chainOffer");
    else setPhase("done");
  }

  // ---- rendering ----
  // Every view (encode, L1–L4, check) renders the same real Madani 15-line rows; only word visibility changes,
  // and hidden words keep their space, so line breaks never move between levels.
  let idx = -1;
  const chunkSet = new Set(activeKeys);
  const pagesUsed = [...new Set(chunkWords.map((w) => w.page))];
  const rows = pagesUsed.flatMap((p) => {
    const all = pageWords[p] ? pageLines(pageWords[p], p) : pageLines(words.filter((w) => w.page === p), p);
    const mine = all.filter((l) => l.words.some((w) => chunkSet.has(w.key))).map((l) => l.line);
    const lo = Math.max(1, Math.min(...mine) - 2), hi = Math.min(15, Math.max(...mine) + 2);
    return all.filter((l) => l.line >= lo && l.line <= hi).map((l) => ({ ...l, context: !mine.includes(l.line) }));
  });
  const wordCls = "arabic shrink-0 px-[0.15em] leading-[1.9]";
  const renderWord = (w: MWord) => {
    const id = wid(w);
    if (!chunkSet.has(w.key)) {
      return <span key={id} aria-hidden className={wordCls} style={{ opacity: 0.28, filter: "blur(1.2px)" }}>{w.text}</span>;
    }
    if (w.end) {
      return (
        <span key={id} className="arabic mx-[0.1em] inline-flex h-[1.5em] min-w-[1.5em] shrink-0 items-center justify-center rounded-full text-[0.65em]" style={{ border: "1.5px solid var(--accent)", color: "var(--accent)" }}>
          {w.text}
        </span>
      );
    }
    idx += 1;
    const isErr = errors.has(id);
    let shown: React.ReactNode = w.text;
    let hidden = false;
    if (!checking && !revealed.has(id)) {
      if (effLevel === 2) { const f = firstLetter(w.text); shown = <>{f}<span style={{ visibility: "hidden" }}>{w.text.slice(f.length)}</span></>; }
      if (effLevel === 3 && fadeHidden(idx, pass)) hidden = true;
      if (effLevel === 4) hidden = true;
    }
    if (hidden) {
      // Keeps the word's width so the line is unchanged; outlines are an opt-in aid.
      return (
        <span key={id} aria-hidden className={`${wordCls} relative`}>
          <span style={{ visibility: "hidden" }}>{w.text}</span>
          {outlines && <span className="absolute inset-x-[0.15em] bottom-[0.35em] top-[0.35em] rounded-md" style={{ border: "1.5px dashed color-mix(in oklab, var(--foreground) 30%, transparent)" }} />}
        </span>
      );
    }
    return checking ? (
      <button
        key={id}
        onClick={() => toggleError(id)}
        aria-pressed={isErr}
        className={`${wordCls} min-h-12 rounded-lg`}
        style={isErr ? { background: "color-mix(in oklab, var(--destructive) 18%, transparent)", color: "var(--destructive)", textDecoration: "underline" } : {}}
      >
        {w.text}
      </button>
    ) : (
      <span key={id} className={wordCls}>{shown}</span>
    );
  };

  // One font size for the whole page, shrunk so the widest real mushaf line fits without wrapping.
  const rowSig = rows.map((r) => `${r.id}:${r.words.length}`).join();
  useLayoutEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const measure = () => {
      el.style.fontSize = "28px";
      let f = 1;
      el.querySelectorAll<HTMLElement>("[data-line]").forEach((l) => {
        // Sum children: a centred overflow spills both ways, so scrollWidth under-reports it.
        const w = [...l.children].reduce((a, c) => a + c.getBoundingClientRect().width, 0);
        if (w > l.clientWidth) f = Math.min(f, l.clientWidth / w);
      });
      const px = Math.max(12, Math.floor(28 * f * 0.98));
      el.style.fontSize = `${px}px`;
      setFit(px);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [rowSig]);

  const card = { background: "var(--surface)", border: "1px solid var(--border)" };
  const label = `${keys[0]}${keys.length > 1 ? `–${keys[keys.length - 1].split(":")[1]}` : ""}`;

  return (
    <>
      <div className="flex items-center justify-between text-sm">
        <button onClick={onExit} className="min-h-11 underline" style={{ color: "var(--muted-foreground)" }}>Change chunk</button>
        <span className="font-semibold">{chain ? `Joined ${prevKeys[0]}–${keys[keys.length - 1].split(":")[1]}` : `Ayah ${label}`}</span>
      </div>

      {/* Mushaf lines */}
      <section className="glass-card px-2 py-4" style={card}>
        <div ref={fitRef} dir="rtl" lang="ar" style={{ fontSize: fit }}>
          {rows.map((l) => (
            <div
              key={l.id}
              data-line={l.line}
              className="flex flex-nowrap items-center justify-center whitespace-nowrap"
              style={{ minHeight: 56, borderBottom: `1px solid color-mix(in oklab, var(--border) ${l.context ? 35 : 90}%, transparent)` }}
            >
              {l.words.map(renderWord)}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 px-2 text-[11px]" style={{ color: "var(--muted-foreground)" }}>
          <span>Page {pagesUsed.join("–")} · Madani 15-line{checking ? " · Tap any word you got wrong" : ""}</span>
          {effLevel >= 3 && !checking && (
            <label className="flex min-h-11 items-center gap-1.5">
              <input type="checkbox" checked={outlines} onChange={(e) => setOutlines(e.target.checked)} /> Word outlines
            </label>
          )}
        </div>
      </section>

      {/* Listen */}
      {((phase === "study" && level < 4) || checking) && (
        <section className="glass-card space-y-3 p-4" style={card}>
          <div className="flex items-center justify-between">
            <h2 className="label-caps">Listen · {reciterName(findReciter(reciterId))}</h2>
            {playing && stopAt.current && stopAt.current.times > 1 && <span className="text-xs">{loop + 1}/{stopAt.current.times}</span>}
          </div>
          {audioErr ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{audioErr}</p>
          ) : !audio ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Loading audio…</p>
          ) : !hasTimings ? (
            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>This reciter has no ayah timings, so ayah loops aren't available. Pick a reciter with highlighting in the Quran tab.</p>
          ) : (
            <>
              {phase === "study" && (
                <div>
                  <div className="mb-1 text-xs" style={{ color: "var(--muted-foreground)" }}>Repeat</div>
                  <div className="grid grid-cols-5 gap-1.5">{REPEATS.map((n) => <Chip key={n} on={repeat === n} onClick={() => setRepeat(n)}>{n}×</Chip>)}</div>
                </div>
              )}
              <div>
                <div className="mb-1 text-xs" style={{ color: "var(--muted-foreground)" }}>Speed</div>
                <div className="grid grid-cols-4 gap-1.5">{SPEEDS.map((n) => <Chip key={n} on={rate === n} onClick={() => setRate(n)}>{n}x</Chip>)}</div>
              </div>
              <button
                onClick={() => (playing ? stop() : playChunk(phase === "study" ? repeat : 1))}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold"
                style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}
              >
                {playing ? <><Square size={15} /> Stop</> : <><Play size={15} /> {phase === "study" ? `Play ${repeat}×` : "Play reciter"}</>}
              </button>
            </>
          )}
        </section>
      )}

      {/* Hide levels + recall */}
      {phase === "study" && (
        <section className="glass-card space-y-3 p-4" style={card}>
          <h2 className="label-caps">Hide level</h2>
          <div className="grid grid-cols-4 gap-1.5">
            {LEVELS.map((t, i) => (
              <button
                key={t}
                onClick={() => { setLevel(i + 1); setSuggest(false); resetRecall(); }}
                className="min-h-12 rounded-xl px-1 text-[11px] font-semibold leading-tight"
                style={level === i + 1 ? { background: "var(--accent)", color: "var(--accent-foreground)" } : { background: "var(--background)", border: "1px solid var(--border)" }}
              >
                L{i + 1}<br />{t}
              </button>
            ))}
          </div>
          {level === 3 && (
            <button onClick={() => setPass((p) => Math.min(4, p + 1))} className="min-h-11 w-full rounded-full text-sm font-semibold" style={{ background: "var(--background)", border: "1px solid var(--border)" }}>
              Next pass (fade more words) · pass {pass}/4
            </button>
          )}
          {level < 4 ? (
            <>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Recite along with what's showing. How did it go? This practice grade isn't saved.</p>
              <GradeRow onGrade={practiceGrade} />
              {suggest && (
                <div className="rounded-xl p-3 text-sm" style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)" }}>
                  Perfect! Ready to move down to <b>L{level + 1} {LEVELS[level]}</b>?
                  <button onClick={() => { setLevel(level + 1); setSuggest(false); resetRecall(); }} className="mt-2 min-h-11 w-full rounded-full font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>
                    Move to L{level + 1}
                  </button>
                </div>
              )}
            </>
          ) : (
            <RecallTools onPeek={peek} onFirst={firstWord} onPause={hasWordTimings ? pauseAndContinue : null} aids={aids} onCheck={() => { stop(); setPhase("check"); }} />
          )}
        </section>
      )}

      {phase === "chain" && (
        <section className="glass-card space-y-3 p-4" style={card}>
          <h2 className="label-caps">Recite it joined with the previous chunk</h2>
          <RecallTools onPeek={peek} onFirst={firstWord} onPause={hasWordTimings ? pauseAndContinue : null} aids={aids} onCheck={() => { stop(); setPhase("chainCheck"); }} />
        </section>
      )}

      {checking && (
        <section className="glass-card space-y-3 p-4" style={card}>
          <h2 className="label-caps">How did you recite it?</h2>
          {aids && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>You used a hint, so the best grade is Hesitation.</p>}
          <GradeRow onGrade={logGrade} capped={aids} />
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{errors.size} word{errors.size === 1 ? "" : "s"} marked wrong</p>
        </section>
      )}

      {phase === "chainOffer" && (
        <section className="glass-card space-y-3 p-4" style={card}>
          <p className="text-sm">{saved} Now recite it joined with the previous chunk ({prevKeys[0]}–{keys[keys.length - 1].split(":")[1]}) from memory.</p>
          <button onClick={() => { resetRecall(); setPhase("chain"); }} className="min-h-12 w-full rounded-full text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>Start joined recitation</button>
          <button onClick={() => setPhase("done")} className="min-h-11 w-full text-sm underline" style={{ color: "var(--muted-foreground)" }}>Skip</button>
        </section>
      )}

      {phase === "done" && (
        <section className="glass-card space-y-3 p-4" style={card}>
          <p className="text-sm">{saved}</p>
          {start + size <= maxAyah && (
            <button onClick={onNext} className="min-h-12 w-full rounded-full text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>Next chunk</button>
          )}
          <button onClick={() => { resetRecall(); setLevel(1); setPhase("study"); }} className="flex min-h-11 w-full items-center justify-center gap-2 text-sm underline" style={{ color: "var(--muted-foreground)" }}>
            <RotateCcw size={14} /> Practise this chunk again
          </button>
        </section>
      )}
    </>
  );
}

function RecallTools({ onPeek, onFirst, onPause, aids, onCheck }: { onPeek: () => void; onFirst: () => void; onPause: (() => void) | null; aids: boolean; onCheck: () => void }) {
  const btn = { background: "var(--background)", border: "1px solid var(--border)" };
  return (
    <>
      <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Recite aloud from memory. Stuck? Use a hint{aids ? " (hint used: best grade is Hesitation)" : ""}.</p>
      <div className={`grid gap-1.5 ${onPause ? "grid-cols-3" : "grid-cols-2"}`}>
        <button onClick={onPeek} className="flex min-h-12 flex-col items-center justify-center rounded-xl text-[11px] font-semibold" style={btn}><Eye size={16} />Peek next word</button>
        <button onClick={onFirst} className="flex min-h-12 flex-col items-center justify-center rounded-xl text-[11px] font-semibold" style={btn}><Lightbulb size={16} />First word</button>
        {onPause && <button onClick={onPause} className="flex min-h-12 flex-col items-center justify-center rounded-xl text-[11px] font-semibold" style={btn}><Pause size={16} />Pause &amp; continue</button>}
      </div>
      <button onClick={onCheck} className="min-h-12 w-full rounded-full text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground)" }}>Check my recitation</button>
    </>
  );
}

function GradeRow({ onGrade, capped = false }: { onGrade: (g: Grade) => void; capped?: boolean }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {GRADES.map(({ g, label }) => {
        const off = capped && g === "perfect";
        return (
          <button
            key={g}
            disabled={off}
            onClick={() => onGrade(g)}
            className="min-h-12 rounded-xl text-xs font-semibold disabled:opacity-35"
            style={g === "perfect" ? { background: "var(--accent)", color: "var(--accent-foreground)" } : { background: "var(--background)", border: "1px solid var(--border)" }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
