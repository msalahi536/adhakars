import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Pause, Play, Search, SkipBack, SkipForward, Loader2 } from "lucide-react";
import { getChapterAudio, getChapters, getVerses, locate, RECITERS, type Chapter, type ChapterAudio, type Verse } from "@/lib/quran";
import { triggerHaptic } from "@/lib/theme";

export const Route = createFileRoute("/app/quran")({
  validateSearch: (s: Record<string, unknown>): { s?: number } => {
    const n = Number(s.s);
    return Number.isInteger(n) && n >= 1 && n <= 114 ? { s: n } : {};
  },
  head: () => ({
    meta: [
      { title: "Quran, Sahih Al-Adhkar" },
      { name: "description", content: "Read and listen to the Quran with word-by-word highlighting, transliteration and translation." },
      { property: "og:title", content: "Quran, Sahih Al-Adhkar" },
      { property: "og:description", content: "Read and listen to the Quran with word-by-word highlighting, transliteration and translation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuranPage,
});

const PREF = "adhkar:quran";
type Prefs = { reciter: number; translit: boolean; translation: boolean };
const readPrefs = (): Prefs => {
  try { return { reciter: 7, translit: true, translation: true, ...JSON.parse(localStorage.getItem(PREF) || "{}") }; }
  catch { return { reciter: 7, translit: true, translation: true }; }
};

function QuranPage() {
  const { s } = Route.useSearch();
  return s ? <Reader chapterId={s} /> : <ChapterList />;
}

function ChapterList() {
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => { getChapters().then(setChapters).catch(() => setError(true)); }, []);
  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!chapters || !t) return chapters ?? [];
    return chapters.filter((c) => String(c.id) === t || c.name_simple.toLowerCase().includes(t) || c.translated_name.name.toLowerCase().includes(t) || c.name_arabic.includes(t));
  }, [chapters, q]);

  return (
    <>
      <header className="page-header period-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        <div className="relative mx-auto max-w-md px-6 pb-5 pt-7 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>The Noble Quran</div>
          <h1 className="app-page-title mt-2">Read & Listen</h1>
        </div>
      </header>
      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-3 px-5 pb-8 pt-4">
          <label className="quran-search">
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search surah by name or number" />
          </label>
          {error && <p className="quran-muted text-center text-sm">Couldn't load the Quran. Check your connection and try again.</p>}
          {!chapters && !error && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
          {list.map((c) => (
            <button key={c.id} className="quran-chapter" onClick={() => { void triggerHaptic("light"); void navigate({ to: "/app/quran", search: { s: c.id } }); }}>
              <span className="quran-num">{c.id}</span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block text-[15px] font-semibold">{c.name_simple}</span>
                <span className="quran-muted block text-[11px]">{c.translated_name.name} · {c.verses_count} verses · {c.revelation_place === "makkah" ? "Makki" : "Madani"}</span>
              </span>
              <span className="quran-chapter-ar" dir="rtl">{c.name_arabic}</span>
            </button>
          ))}
        </div>
      </main>
    </>
  );
}

function Reader({ chapterId }: { chapterId: number }) {
  const navigate = useNavigate();
  const [prefs, setPrefsState] = useState<Prefs>({ reciter: 7, translit: true, translation: true });
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [audio, setAudio] = useState<ChapterAudio | null>(null);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [pos, setPos] = useState<{ key: string | null; word: number | null }>({ key: null, word: null });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastKey = useRef<string | null>(null);

  const setPrefs = (p: Partial<Prefs>) => setPrefsState((cur) => { const n = { ...cur, ...p }; localStorage.setItem(PREF, JSON.stringify(n)); return n; });
  useEffect(() => { setPrefsState(readPrefs()); }, []);

  useEffect(() => {
    setVerses(null); setError(false); setPos({ key: null, word: null });
    getChapters().then((cs) => setChapter(cs.find((c) => c.id === chapterId) ?? null)).catch(() => {});
    getVerses(chapterId).then(setVerses).catch(() => setError(true));
    document.querySelector(".scroll-area")?.scrollTo({ top: 0 });
  }, [chapterId]);

  // Load the chapter recitation with its word timings.
  useEffect(() => {
    let cancelled = false;
    setAudio(null); setPlaying(false);
    audioRef.current?.pause();
    getChapterAudio(prefs.reciter, chapterId).then((a) => { if (!cancelled) setAudio(a); }).catch(() => {});
    return () => { cancelled = true; };
  }, [prefs.reciter, chapterId]);

  useEffect(() => () => audioRef.current?.pause(), []);

  // Karaoke: follow the audio clock every frame.
  useEffect(() => {
    if (!playing || !audio) return;
    let raf = 0;
    const tick = () => {
      const el = audioRef.current;
      if (el) {
        const ms = el.currentTime * 1000;
        const found = locate(audio.timings, ms);
        // Small silences between verses: keep the previous verse lit instead
        // of flashing everything off and on again.
        setPos((p) => {
          const next = found.key ? found : { key: p.key, word: p.word };
          return p.key === next.key && p.word === next.word ? p : next;
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, audio]);

  // Keep the recited verse in view.
  useEffect(() => {
    if (!pos.key || pos.key === lastKey.current) return;
    lastKey.current = pos.key;
    document.getElementById(`v-${pos.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [pos.key]);

  const ensureAudio = () => {
    if (!audio) return null;
    if (!audioRef.current || audioRef.current.dataset.src !== audio.url) {
      audioRef.current?.pause();
      const el = new Audio(audio.url);
      el.dataset.src = audio.url;
      el.preload = "auto";
      el.onplaying = () => { setPlaying(true); setLoadingAudio(false); };
      el.onwaiting = () => setLoadingAudio(true);
      el.onpause = () => setPlaying(false);
      el.onended = () => { setPlaying(false); setPos({ key: null, word: null }); };
      audioRef.current = el;
    }
    return audioRef.current;
  };

  const playFrom = (key: string) => {
    const el = ensureAudio(); const t = audio?.timings.find((x) => x.key === key);
    if (!el || !t) return;
    el.currentTime = t.from / 1000;
    setLoadingAudio(true);
    void el.play().catch(() => setLoadingAudio(false));
    void triggerHaptic("light");
  };
  const playRef = useRef(playFrom);
  playRef.current = playFrom;
  const onPlayVerse = useCallback((key: string) => playRef.current(key), []);
  const toggle = () => {
    const el = ensureAudio(); if (!el) return;
    void triggerHaptic("light");
    if (playing) { el.pause(); return; }
    setLoadingAudio(true);
    void el.play().catch(() => setLoadingAudio(false));
  };
  const step = (dir: 1 | -1) => {
    if (!audio) return;
    const i = audio.timings.findIndex((t) => t.key === pos.key);
    const n = audio.timings[Math.min(audio.timings.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir))];
    if (n) playFrom(n.key);
  };

  const showBismillah = chapter?.bismillah_pre && chapterId !== 1 && chapterId !== 9;

  return (
    <>
      <header className="page-header period-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        <button className="quran-back" aria-label="All surahs" onClick={() => { audioRef.current?.pause(); void navigate({ to: "/app/quran", search: {} }); }}>
          <ChevronLeft size={20} />
        </button>
        <div className="relative mx-auto max-w-md px-16 pb-4 pt-7 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>Surah {chapterId}{chapter ? ` · ${chapter.translated_name.name}` : ""}</div>
          <h1 className="app-page-title mt-2">{chapter?.name_simple ?? "…"}</h1>
          {chapter && <div className="quran-header-ar" dir="rtl">{chapter.name_arabic}</div>}
        </div>
      </header>
      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-3 px-5 pb-40 pt-4">
          <div className="quran-toggles">
            <button className={prefs.translit ? "is-on" : ""} onClick={() => setPrefs({ translit: !prefs.translit })}>Transliteration</button>
            <button className={prefs.translation ? "is-on" : ""} onClick={() => setPrefs({ translation: !prefs.translation })}>Translation</button>
            <select aria-label="Reciter" value={prefs.reciter} onChange={(e) => setPrefs({ reciter: Number(e.target.value) })}>
              <optgroup label="Word-by-word highlighting">
                {RECITERS.filter((r) => r.words).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </optgroup>
              <optgroup label="Verse-by-verse highlighting">
                {RECITERS.filter((r) => !r.words).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </optgroup>
            </select>
          </div>
          {showBismillah && <div className="quran-bismillah" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>}
          {error && <p className="quran-muted text-center text-sm">Couldn't load this surah. Check your connection.</p>}
          {!verses && !error && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
          {verses?.map((v) => (
            <VerseCard key={v.key} verse={v} active={pos.key === v.key} word={pos.key === v.key ? pos.word : null}
              translit={prefs.translit} translation={prefs.translation} onPlay={onPlayVerse} />
          ))}
          {verses && <p className="quran-muted pt-2 text-center text-[10px]">Text, translation (Saheeh International) and recitations via Quran.com</p>}
        </div>
      </main>
      <div className="quran-player" role="group" aria-label="Recitation controls">
        <button aria-label="Previous verse" onClick={() => step(-1)} disabled={!audio}><SkipBack size={18} /></button>
        <button className="quran-play" aria-label={playing ? "Pause" : "Play"} onClick={toggle} disabled={!audio}>
          {loadingAudio && !playing ? <Loader2 size={22} className="animate-spin" /> : playing ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
        </button>
        <button aria-label="Next verse" onClick={() => step(1)} disabled={!audio}><SkipForward size={18} /></button>
      </div>
    </>
  );
}

// Memoized so only the verse being recited re-renders while audio plays.
const VerseCard = memo(function VerseCard({ verse: v, active, word, translit, translation, onPlay }: {
  verse: Verse; active: boolean; word: number | null; translit: boolean; translation: boolean; onPlay: (key: string) => void;
}) {
  const wordMode = active && word !== null;
  return (
    <article id={`v-${v.key}`} className={`quran-verse ${active ? "is-active" : ""} ${wordMode ? "is-word-mode" : ""}`} onClick={() => onPlay(v.key)}>
      <div className="quran-verse-num">{v.key}</div>
      <p className="quran-ar" dir="rtl" lang="ar">
        {v.words.map((w) => {
          const state = w.isEnd ? "quran-end" : !wordMode ? "quran-word" : w.position < word! ? "quran-word is-done" : w.position === word ? "quran-word is-now" : "quran-word";
          return <span key={w.position} className={state}>{w.text} </span>;
        })}
      </p>
      {translit && v.transliteration && <p className="quran-translit">{v.transliteration}</p>}
      {translation && <p className="quran-tr">{v.translation}</p>}
    </article>
  );
});
