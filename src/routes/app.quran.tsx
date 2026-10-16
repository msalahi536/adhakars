import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ChevronRight, Heart, Loader2, Pause, Play, Repeat, Search, SkipBack, SkipForward } from "lucide-react";
import {
  findReciter, getChapterAudio, getChapters, getVerses, locate, POPULAR_RECITERS, RECITERS,
  reciterName, reciterPhoto, reciterSubtitle, searchChapters, searchReciters, type Chapter, type ChapterAudio, type Reciter, type Verse,
} from "@/lib/quran";
import { triggerHaptic } from "@/lib/theme";

type Search = { s?: number; view?: "reciters"; tab?: "all" };

export const Route = createFileRoute("/app/quran")({
  validateSearch: (q: Record<string, unknown>): Search => {
    const out: Search = {};
    const n = Number(q.s);
    if (Number.isInteger(n) && n >= 1 && n <= 114) out.s = n;
    if (q.view === "reciters") out.view = "reciters";
    return out;
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

/* ---------- device-only preferences ---------- */
const PREF = "adhkar:quran";
const LAST = "adhkar:quran:last";
const FAVS = "adhkar:quran:favs";
type Prefs = { reciter: number; translit: boolean; translation: boolean };
const DEFAULT_PREFS: Prefs = { reciter: 7, translit: true, translation: true };
const readJSON = <T,>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? { ...d, ...JSON.parse(v) } : d; } catch { return d; } };
const PREF_EVENT = "adhkar:quran-prefs";

function usePrefs() {
  const [prefs, setState] = useState<Prefs>(DEFAULT_PREFS);
  useEffect(() => {
    const sync = () => setState(readJSON(PREF, DEFAULT_PREFS));
    sync(); window.addEventListener(PREF_EVENT, sync);
    return () => window.removeEventListener(PREF_EVENT, sync);
  }, []);
  const set = (p: Partial<Prefs>) => {
    const n = { ...readJSON(PREF, DEFAULT_PREFS), ...p };
    localStorage.setItem(PREF, JSON.stringify(n));
    window.dispatchEvent(new Event(PREF_EVENT));
  };
  return [prefs, set] as const;
}

function useFavs() {
  const [favs, setFavs] = useState<string[]>([]);
  useEffect(() => { try { setFavs(JSON.parse(localStorage.getItem(FAVS) || "[]")); } catch { /* ignore */ } }, []);
  const toggle = useCallback((key: string) => {
    setFavs((cur) => {
      const n = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key];
      localStorage.setItem(FAVS, JSON.stringify(n));
      return n;
    });
    void triggerHaptic("light");
  }, []);
  return [favs, toggle] as const;
}

type Last = { s: number; v: number };

function QuranPage() {
  const { s, view } = Route.useSearch();
  if (view === "reciters") return <ReciterPicker back={s} />;
  return s ? <Reader chapterId={s} /> : <Home />;
}

/* ---------- shared bits ---------- */
function Avatar({ r, size = 48 }: { r: Reciter; size?: number }) {
  const [broken, setBroken] = useState(false);
  const photo = reciterPhoto(r);
  const initials = reciterName(r).replace(/^(sheikh|al-|ash-|as-)\s*/i, "").split(/\s+/).filter((w) => !/^(al|ad|ar|as|ash|bin|ibn)-?$/i.test(w)).slice(0, 2).map((w) => w.replace(/^[a-z]+-/i, "")[0]).join("").toUpperCase();
  return (
    <span className="quran-avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {photo && !broken ? <img src={photo} alt="" loading="lazy" onError={() => setBroken(true)} /> : initials}
    </span>
  );
}

function NumBadge({ n }: { n: number }) {
  return <span className="quran-num"><span>{n}</span></span>;
}

function Header({ kicker, title, sub, onBack }: { kicker: string; title: string; sub?: string; onBack?: () => void }) {
  return (
    <header className="page-header period-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
      {onBack && <button className="quran-back" aria-label="Back" onClick={onBack}><ChevronLeft size={20} /></button>}
      <div className="relative mx-auto max-w-md px-16 pb-4 pt-7 text-center">
        <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>{kicker}</div>
        <h1 className="app-page-title mt-2">{title}</h1>
        {sub && <div className="quran-header-ar" dir="rtl">{sub}</div>}
      </div>
    </header>
  );
}

function Flourish({ flip }: { flip?: boolean }) {
  return (
    <svg className="quran-art-orn" viewBox="0 0 60 12" style={flip ? { transform: "scaleY(-1)" } : undefined} aria-hidden>
      <path d="M2 8 C14 8 18 3 24 6 M58 8 C46 8 42 3 36 6" fill="none" stroke="currentColor" strokeWidth=".8" strokeLinecap="round" />
      <path d="M30 1.5 L33.5 6 L30 10.5 L26.5 6 Z" fill="none" stroke="currentColor" strokeWidth=".8" />
      <circle cx="30" cy="6" r="1.1" fill="currentColor" />
    </svg>
  );
}

function SurahArt({ name }: { name: string }) {
  return (
    <span className="quran-continue-art" aria-hidden>
      <Flourish />
      <span className="quran-art-name" dir="rtl">{name}</span>
      <Flourish flip />
    </span>
  );
}

/* ---------- home ---------- */

function Home() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = usePrefs();
  const [chapters, setChapters] = useState<Chapter[] | null>(null);
  const [error, setError] = useState(false);
  const [q, setQ] = useState("");
  const [last, setLast] = useState<Last | null>(null);
  useEffect(() => {
    getChapters().then(setChapters).catch(() => setError(true));
    setLast(readJSON<Last | null>(LAST, null));
  }, []);

  const t = q.trim().toLowerCase();
  const list = useMemo(() => searchChapters(chapters ?? [], q), [chapters, q]);
  const reciterHits = useMemo(() => searchReciters(q), [q]);
  const lastChapter = last && chapters?.find((c) => c.id === last.s);
  const open = (id: number) => { void triggerHaptic("light"); void navigate({ to: "/app/quran", search: { s: id } }); };
  const popular = POPULAR_RECITERS.map(findReciter);
  const lastY = useRef(0);
  const [searchShown, setSearchShown] = useState(true);
  const [searchFloat, setSearchFloat] = useState(false);
  const onScroll = (e: React.UIEvent<HTMLElement>) => {
    const y = e.currentTarget.scrollTop;
    const d = y - lastY.current;
    if (Math.abs(d) > 4) { setSearchShown(d < 0 || y < 80); lastY.current = y; }
    setSearchFloat(y > 80);
  };

  return (
    <>
      <Header kicker="The Noble Quran" title="Read & Listen" />
      <main className="scroll-area" onScroll={onScroll}>
        <div className="mx-auto max-w-md space-y-4 px-5 pb-8 pt-4">
          <div className={`quran-search-sticky${searchFloat ? " is-float" : ""}${searchShown ? "" : " is-hidden"}`}>
            <label className="quran-search">
              <Search size={16} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search surah by name, number, or reciter…" />
            </label>
          </div>

          {reciterHits.length > 0 && (
            <div className="quran-card divide-y">
              {reciterHits.map((r) => (
                <button key={r.id} className="quran-reciter-row" onClick={() => { setPrefs({ reciter: r.id }); setQ(""); void triggerHaptic("light"); }}>
                  <Avatar r={r} size={40} />
                  <span className="min-w-0 flex-1 text-left"><span className="block truncate text-[14px] font-semibold">{reciterName(r)}</span><span className="quran-muted block text-[11px]">{reciterSubtitle(r)}</span></span>
                  {prefs.reciter === r.id && <span className="quran-chip-sm">Selected</span>}
                </button>
              ))}
            </div>
          )}

          {lastChapter && !t && (
            <button className="quran-card quran-continue" onClick={() => open(lastChapter.id)}>
              <SurahArt name={lastChapter.name_arabic} />
              <span className="min-w-0 flex-1 text-left">
                <span className="quran-continue-kicker">Continue Reading</span>
                <span className="quran-continue-title">{lastChapter.name_simple}</span>
                <span className="quran-continue-meta">Surah {lastChapter.id} · Verse {last!.v} of {lastChapter.verses_count}</span>
                <span className="quran-progress"><i style={{ width: `${Math.max(4, (last!.v / lastChapter.verses_count) * 100)}%` }} /></span>
              </span>
              <span className="quran-continue-play"><Play size={20} strokeWidth={1.6} strokeLinejoin="round" style={{ marginLeft: 2 }} /></span>
            </button>
          )}

          {!t && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="quran-section-title">Choose a Reciter</h2>
                <button className="quran-see-all" onClick={() => navigate({ to: "/app/quran", search: { view: "reciters" } })}>See All <ChevronRight size={14} /></button>
              </div>
              <div className="quran-reciter-strip">
                {popular.map((r) => (
                  <button key={r.id} className={`quran-reciter-tile ${prefs.reciter === r.id ? "is-on" : ""}`} onClick={() => { setPrefs({ reciter: r.id }); void triggerHaptic("light"); }}>
                    <span className="quran-reciter-ring"><Avatar r={r} size={64} /></span>
                    <span className="quran-reciter-name">{reciterName(r)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {error && <p className="quran-muted text-center text-sm">Couldn't load the Quran. Check your connection and try again.</p>}
          {!chapters && !error && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
          <div className="space-y-2.5">
            {list.map((c) => (
              <button key={c.id} className="quran-chapter" onClick={() => open(c.id)}>
                <NumBadge n={c.id} />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-[16px] font-semibold">{c.name_simple}</span>
                  <span className="quran-muted block text-[11px]">{c.translated_name.name} · {c.verses_count} verses · {c.revelation_place === "makkah" ? "Makki" : "Madani"}</span>
                </span>
                <span className="quran-chapter-ar" dir="rtl">{c.name_arabic}</span>
                <ChevronRight size={16} className="opacity-50" />
              </button>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}

/* ---------- reciters ---------- */
type RFilter = "popular" | "all" | "madinah" | "makkah" | "other";
const RFILTERS: [RFilter, string][] = [["popular", "Popular"], ["all", "All Reciters"], ["madinah", "Madinah"], ["makkah", "Makkah"], ["other", "More"]];

function ReciterPicker({ back }: { back?: number }) {
  const navigate = useNavigate();
  const [prefs, setPrefs] = usePrefs();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<RFilter>("popular");
  const [preview, setPreview] = useState<number | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => audio.current?.pause(), []);

  const t = q.trim().toLowerCase();
  const list = (t ? RECITERS.filter((r) => r.name.toLowerCase().includes(t)) : RECITERS.filter((r) => {
    if (filter === "popular") return POPULAR_RECITERS.includes(r.id);
    if (filter === "all") return r.group === 1;
    if (filter === "madinah") return r.group === 2 && /madinah/i.test(r.name);
    if (filter === "makkah") return r.group === 2 && /makkah|quba/i.test(r.name);
    return r.group === 3 || r.group === 4 || (r.group === 2 && !/madinah|makkah|quba/i.test(r.name));
  }));
  const sorted = filter === "popular" && !t ? POPULAR_RECITERS.map(findReciter) : list;

  const goBack = () => { audio.current?.pause(); void navigate({ to: "/app/quran", search: back ? { s: back } : {} }); };
  const choose = (r: Reciter) => { setPrefs({ reciter: r.id }); void triggerHaptic("medium"); goBack(); };
  const togglePreview = async (r: Reciter) => {
    void triggerHaptic("light");
    if (preview === r.id) { audio.current?.pause(); setPreview(null); return; }
    audio.current?.pause();
    setPreview(r.id);
    try {
      const a = await getChapterAudio(r.id, 1);
      const el = new Audio(a.url);
      el.onended = () => setPreview(null);
      audio.current = el;
      await el.play();
    } catch { setPreview(null); }
  };

  return (
    <>
      <Header kicker="Quran Reciters" title="Choose your reciter" onBack={goBack} />
      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-3 px-5 pb-8 pt-4">
          <label className="quran-search">
            <Search size={16} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reciters…" />
          </label>
          {!t && (
            <div className="quran-chips quran-chips-scroll">
              {RFILTERS.map(([k, l]) => <button key={k} className={filter === k ? "is-on" : ""} onClick={() => setFilter(k)}>{l}</button>)}
            </div>
          )}
          <div className="quran-card overflow-hidden">
            {sorted.map((r) => {
              const on = prefs.reciter === r.id;
              return (
                <div key={r.id} className={`quran-reciter-row ${on ? "is-on" : ""}`}>
                  <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => choose(r)}>
                    <Avatar r={r} size={48} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-semibold">{reciterName(r)}</span><span className="quran-muted block truncate text-[11.5px]">{reciterSubtitle(r)}</span></span>
                  </button>
                  {on && <span className="quran-mini-eq" aria-label="Selected"><i /><i /><i /></span>}
                  <button className="quran-play-sm" aria-label={preview === r.id ? "Stop preview" : `Preview ${r.name}`} onClick={() => void togglePreview(r)}>
                    {preview === r.id ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: 2 }} />}
                  </button>
                </div>
              );
            })}
            {sorted.length === 0 && <p className="quran-muted p-6 text-center text-sm">No reciters found.</p>}
          </div>
          <p className="quran-muted text-center text-[10px]">Preview plays Al-Fatihah. Tap a name to choose.</p>
        </div>
      </main>
    </>
  );
}

/* ---------- reader ---------- */
const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

function Reader({ chapterId }: { chapterId: number }) {
  const navigate = useNavigate();
  const [prefs, setPrefs] = usePrefs();
  const [favs, toggleFav] = useFavs();
  const reciter = findReciter(prefs.reciter);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [audio, setAudio] = useState<ChapterAudio | null>(null);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [time, setTime] = useState({ cur: 0, dur: 0 });
  const [pos, setPos] = useState<{ key: string | null; word: number | null }>({ key: null, word: null });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    setVerses(null); setError(false); setPos({ key: null, word: null });
    getChapters().then((cs) => setChapter(cs.find((c) => c.id === chapterId) ?? null)).catch(() => {});
    getVerses(chapterId).then(setVerses).catch(() => setError(true));
    const last = readJSON<Last | null>(LAST, null);
    if (!last || last.s !== chapterId) localStorage.setItem(LAST, JSON.stringify({ s: chapterId, v: 1 }));
    document.querySelector(".scroll-area")?.scrollTo({ top: 0 });
  }, [chapterId]);

  useEffect(() => {
    let cancelled = false;
    setAudio(null); setPlaying(false); setTime({ cur: 0, dur: 0 });
    audioRef.current?.pause();
    getChapterAudio(prefs.reciter, chapterId).then((a) => { if (!cancelled) setAudio(a); }).catch(() => {});
    return () => { cancelled = true; };
  }, [prefs.reciter, chapterId]);

  useEffect(() => () => audioRef.current?.pause(), []);
  useEffect(() => { if (audioRef.current) audioRef.current.loop = repeat; }, [repeat]);

  useEffect(() => {
    if (!playing || !audio) return;
    let raf = 0;
    const tick = () => {
      const el = audioRef.current;
      if (el) {
        const found = locate(audio.timings, el.currentTime * 1000);
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

  useEffect(() => {
    if (!pos.key || pos.key === lastKey.current) return;
    lastKey.current = pos.key;
    localStorage.setItem(LAST, JSON.stringify({ s: chapterId, v: Number(pos.key.split(":")[1]) }));
    document.getElementById(`v-${pos.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [pos.key, chapterId]);

  const ensureAudio = () => {
    if (!audio) return null;
    if (!audioRef.current || audioRef.current.dataset.src !== audio.url) {
      audioRef.current?.pause();
      const el = new Audio(audio.url);
      el.dataset.src = audio.url;
      el.preload = "auto";
      el.loop = repeat;
      el.onplaying = () => { setPlaying(true); setLoadingAudio(false); };
      el.onwaiting = () => setLoadingAudio(true);
      el.onpause = () => setPlaying(false);
      el.ontimeupdate = () => setTime({ cur: el.currentTime, dur: el.duration });
      el.onloadedmetadata = () => setTime({ cur: el.currentTime, dur: el.duration });
      el.onended = () => { setPlaying(false); setPos({ key: null, word: null }); };
      audioRef.current = el;
    }
    return audioRef.current;
  };

  const playFrom = (key: string) => {
    const el = ensureAudio(); const t = audio?.timings.find((x) => x.key === key);
    if (!el) return;
    if (t) el.currentTime = t.from / 1000;
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
    if (!audio?.timings.length) {
      const el = audioRef.current; if (el) el.currentTime = Math.max(0, el.currentTime + dir * 10);
      return;
    }
    const i = audio.timings.findIndex((t) => t.key === pos.key);
    const n = audio.timings[Math.min(audio.timings.length - 1, Math.max(0, (i < 0 ? 0 : i) + dir))];
    if (n) playFrom(n.key);
  };
  const seek = (ratio: number) => {
    const el = ensureAudio(); if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = ratio * el.duration;
    setTime({ cur: el.currentTime, dur: el.duration });
  };

  const showBismillah = chapter?.bismillah_pre && chapterId !== 1 && chapterId !== 9;
  const favSet = useMemo(() => new Set(favs), [favs]);
  const back = () => { audioRef.current?.pause(); void navigate({ to: "/app/quran", search: {} }); };

  return (
    <>
      <Header kicker={`Surah ${chapterId}${chapter ? ` · ${chapter.translated_name.name}` : ""}`} title={chapter?.name_simple ?? "…"} sub={chapter?.name_arabic} onBack={back} />
      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-3 px-5 pb-56 pt-4">
          <button className="quran-card quran-reciter-select" onClick={() => { audioRef.current?.pause(); void navigate({ to: "/app/quran", search: { s: chapterId, view: "reciters" } }); }}>
            <Avatar r={reciter} size={46} />
            <span className="min-w-0 flex-1 text-left"><span className="block truncate text-[15px] font-semibold">{reciterName(reciter)}</span><span className="quran-muted block truncate text-[11.5px]">{reciterSubtitle(reciter)}</span></span>
            <ChevronDown size={18} className="opacity-60" />
          </button>
          <div className="quran-toggles">
            <button className={prefs.translit ? "is-on" : ""} onClick={() => setPrefs({ translit: !prefs.translit })}>Transliteration</button>
            <button className={prefs.translation ? "is-on" : ""} onClick={() => setPrefs({ translation: !prefs.translation })}>Translation</button>
          </div>
          {showBismillah && <div className="quran-bismillah" dir="rtl">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>}
          {error && <p className="quran-muted text-center text-sm">Couldn't load this surah. Check your connection.</p>}
          {!verses && !error && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
          {verses?.map((v) => (
            <VerseCard key={v.key} verse={v} active={pos.key === v.key} word={pos.key === v.key ? pos.word : null}
              translit={prefs.translit} translation={prefs.translation} fav={favSet.has(v.key)}
              onPlay={onPlayVerse} onFav={toggleFav} />
          ))}
          {verses && <p className="quran-muted pt-2 text-center text-[10px]">Text, translation (Saheeh International) and recitations via Quran.com</p>}
        </div>
      </main>
      <div className="quran-player" role="group" aria-label="Recitation controls">
        <div className="flex items-center gap-3">
          <Avatar r={reciter} size={38} />
          <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold" style={{ color: "var(--accent)" }}>{chapter?.name_simple ?? ""}</span><span className="quran-muted block truncate text-[11px]">{reciterName(reciter)}</span></span>
        </div>
        <input className="quran-seek" type="range" min={0} max={1000} aria-label="Seek"
          value={time.dur ? Math.round((time.cur / time.dur) * 1000) : 0}
          style={{ ["--p" as string]: `${time.dur ? (time.cur / time.dur) * 100 : 0}%` }}
          onChange={(e) => seek(Number(e.target.value) / 1000)} disabled={!audio} />
        <div className="quran-times"><span>{fmt(time.cur)}</span><span>{fmt(time.dur)}</span></div>
        <div className="quran-controls">
          <span style={{ width: 36 }} />
          <button aria-label="Previous verse" onClick={() => step(-1)} disabled={!audio}><SkipBack size={22} fill="currentColor" /></button>
          <button className="quran-play" aria-label={playing ? "Pause" : "Play"} onClick={toggle} disabled={!audio}>
            {loadingAudio && !playing ? <Loader2 size={24} className="animate-spin" /> : playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />}
          </button>
          <button aria-label="Next verse" onClick={() => step(1)} disabled={!audio}><SkipForward size={22} fill="currentColor" /></button>
          <button aria-label="Repeat surah" aria-pressed={repeat} className={repeat ? "is-on" : ""} onClick={() => setRepeat((r) => !r)}><Repeat size={18} /></button>
        </div>
      </div>
    </>
  );
}

// Memoized so only the verse being recited re-renders while audio plays.
const VerseCard = memo(function VerseCard({ verse: v, active, word, translit, translation, fav, onPlay, onFav }: {
  verse: Verse; active: boolean; word: number | null; translit: boolean; translation: boolean; fav: boolean;
  onPlay: (key: string) => void; onFav: (key: string) => void;
}) {
  const wordMode = active && word !== null;
  return (
    <article id={`v-${v.key}`} className={`quran-verse ${active ? "is-active" : ""} ${wordMode ? "is-word-mode" : ""}`}>
      <div className="quran-verse-side">
        <NumBadge n={v.number} />
        <button className="quran-play-sm" aria-label={`Play verse ${v.number}`} onClick={() => onPlay(v.key)}><Play size={13} fill="currentColor" style={{ marginLeft: 2 }} /></button>
      </div>
      <div className="min-w-0 flex-1">
        <p className="quran-ar" dir="rtl" lang="ar" onClick={() => onPlay(v.key)}>
          {v.words.map((w) => {
            const state = w.isEnd ? "quran-end" : !wordMode ? "quran-word" : w.position < word! ? "quran-word is-done" : w.position === word ? "quran-word is-now" : "quran-word";
            return <Fragment key={w.position}><span className={state}>{w.text}</span>{" "}</Fragment>;
          })}
        </p>
        {translit && v.transliteration && <p className="quran-translit">{v.transliteration}</p>}
        {translation && <p className="quran-tr">{v.translation}</p>}
      </div>
      <button className={`quran-heart ${fav ? "is-on" : ""}`} aria-label={fav ? "Remove from favorites" : "Save verse"} aria-pressed={fav} onClick={() => onFav(v.key)}>
        <Heart size={18} fill={fav ? "currentColor" : "none"} />
      </button>
    </article>
  );
});
