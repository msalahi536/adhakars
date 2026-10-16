import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { QuranMiniPlayer } from "@/components/QuranMiniPlayer";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronLeft, ChevronRight, Heart, Loader2, Maximize2, Pause, Play, Repeat, Search, Shuffle, SkipBack, SkipForward, X } from "lucide-react";
import {
  findReciter, getChapterAudio, getChapters, getVerses, POPULAR_RECITERS, RECITERS,
  reciterHasSurah, reciterName, reciterScore, reciterPhoto, reciterSubtitle, searchChapters, searchReciters, type Chapter, type Reciter, type Verse,
} from "@/lib/quran";
import { getDisplay, triggerHaptic } from "@/lib/theme";
import { quranPlayer, useQuranPlayer } from "@/lib/quran-player";

type Search = { s?: number; view?: "reciters"; tab?: "all" };

export const Route = createFileRoute("/app/quran")({
  validateSearch: (q: Record<string, unknown>): Search => {
    const out: Search = {};
    const n = Number(q.s);
    if (Number.isInteger(n) && n >= 1 && n <= 114) out.s = n;
    if (q.view === "reciters") out.view = "reciters";
    if (q.tab === "all") out.tab = "all";
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
  const { s, view, tab } = Route.useSearch();
  if (view === "reciters") return <ReciterPicker back={s} tab={tab} />;
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

          {!t && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="quran-section-title">Choose a Reciter</h2>
                <button className="quran-see-all" onClick={() => navigate({ to: "/app/quran", search: { view: "reciters", tab: "all" } })}>See All <ChevronRight size={14} /></button>
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

function ReciterPicker({ back, tab }: { back?: number; tab?: "all" }) {
  const navigate = useNavigate();
  const [prefs, setPrefs] = usePrefs();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<RFilter>(tab === "all" ? "all" : "popular");
  const [preview, setPreview] = useState<number | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => () => audio.current?.pause(), []);

  const t = q.trim().toLowerCase();
  const list = (t ? RECITERS.map((r) => [r, reciterScore(r, t)] as const).filter(([, sc]) => sc > 0).sort((a, b) => b[1] - a[1] || Number(!POPULAR_RECITERS.includes(a[0].id)) - Number(!POPULAR_RECITERS.includes(b[0].id)) || Number(!!a[0].server) - Number(!!b[0].server)).map(([r]) => r) : RECITERS.filter((r) => {
    if (filter === "popular") return POPULAR_RECITERS.includes(r.id);
    if (filter === "all") return r.group === 1;
    if (filter === "madinah") return r.group === 2 && /madinah/i.test(r.name);
    if (filter === "makkah") return r.group === 2 && /makkah|quba/i.test(r.name);
    return r.group === 3 || r.group === 4 || (r.group === 2 && !/madinah|makkah|quba/i.test(r.name));
  }));
  const sorted = useMemo(() => {
    if (filter === "popular" && !t) return POPULAR_RECITERS.map(findReciter);
    if (filter === "all") {
      const popIds = new Set(POPULAR_RECITERS);
      const pop = list.filter((r) => popIds.has(r.id));
      return [...pop, ...list.filter((r) => !popIds.has(r.id))];
    }
    return list;
  }, [filter, t, list]);

  const goBack = () => { audio.current?.pause(); void navigate({ to: "/app/quran", search: back ? { s: back } : {} }); };
  const choose = (r: Reciter) => { setPrefs({ reciter: r.id }); void triggerHaptic("medium"); };
  const togglePreview = async (r: Reciter) => {
    void triggerHaptic("light");
    if (preview === r.id) { audio.current?.pause(); setPreview(null); return; }
    audio.current?.pause(); quranPlayer.pause();
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
          <p className="quran-muted text-center text-[10px]">Preview plays Al-Fatihah. Tap a name to choose — it saves right away.</p>
        </div>
      </main>
    </>
  );
}

/* ---------- reader ---------- */
const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

function Reader({ chapterId }: { chapterId: number }) {
  const navigate = useNavigate();
  const [prefs] = usePrefs();
  const [favs, toggleFav] = useFavs();
  const [display, setDisplayState] = useState({ translit: true, translation: true, trOn: true, arabic: true, page: false, follow: true, words: true });
  useEffect(() => { const d = getDisplay(); setDisplayState({ translit: d.showTransliteration, translation: d.showTranslation || (!d.showArabic && !d.showTransliteration), trOn: d.showTranslation, arabic: d.showArabic, page: d.quranPageView, follow: d.quranAutoScroll, words: d.quranWordHighlight }); }, []);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [error, setError] = useState(false);
  const player = useQuranPlayer();
  const here = player.chapter === chapterId;
  const shownReciter = findReciter(here ? player.reciterId : prefs.reciter);
  const lastKey = useRef<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [full, setFull] = useState(false);
  // In-app reading mode: the surah takes over the whole app screen like a book page.
  // Deliberately NOT the browser/native fullscreen API.
  const openFull = () => { void triggerHaptic("light"); setSheet(false); setFull(true); };
  const closeFull = useCallback(() => { void triggerHaptic("light"); setFull(false); }, []);
  useEffect(() => {
    if (!full) return;
    document.body.classList.add("quran-fs-on");
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeFull(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.classList.remove("quran-fs-on"); window.removeEventListener("keydown", onKey); };
  }, [full, closeFull]);

  useEffect(() => {
    setVerses(null); setError(false);
    getChapters().then((cs) => setChapter(cs.find((c) => c.id === chapterId) ?? null)).catch(() => {});
    getVerses(chapterId).then(setVerses).catch(() => setError(true));
    const last = readJSON<Last | null>(LAST, null);
    if (!last || last.s !== chapterId) localStorage.setItem(LAST, JSON.stringify({ s: chapterId, v: 1 }));
    document.querySelector(".scroll-area")?.scrollTo({ top: 0 });
    quranPlayer.setPanel(true);
  }, [chapterId]);

  // Prepare this surah unless a different one is already playing (that keeps going).
  // A fresh mount must never restart audio already loaded for this surah: usePrefs
  // hydrates from localStorage a tick late, so a reciter "change" seen on the first
  // run is a race, not a real pick. Real picks happen while this page stays mounted.
  const prevChapter = useRef<number | null>(null);
  const prevReciter = useRef<number | null>(null);
  useEffect(() => {
    const s = quranPlayer.get();
    const fresh = prevChapter.current !== chapterId;
    const reciterPicked = !fresh && prevReciter.current !== null && prevReciter.current !== prefs.reciter;
    prevChapter.current = chapterId;
    prevReciter.current = prefs.reciter;

    if (s.chapter === chapterId && (s.audio || s.loading)) {
      if (reciterPicked && s.reciterId !== prefs.reciter) {
        void quranPlayer.select(prefs.reciter, chapterId, chapter?.name_simple ?? s.chapterName, s.playing);
      } else if (chapter?.name_simple) {
        quranPlayer.setName(chapter.name_simple);
      }
      return;
    }
    if ((s.playing || s.loading) && s.chapter !== chapterId) return;
    void quranPlayer.select(prefs.reciter, chapterId, chapter?.name_simple ?? s.chapterName, false);
  }, [prefs.reciter, chapterId, chapter?.name_simple]);

  const pos = here ? player.pos : { key: null, word: null };
  useEffect(() => {
    if (!pos.key || pos.key === lastKey.current) return;
    lastKey.current = pos.key;
    if (!display.follow) return;
    document.getElementById(`v-${pos.key}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [pos.key, display.follow]);

  const nameRef = useRef(""); nameRef.current = chapter?.name_simple ?? "";
  const onPlayVerse = useCallback((key: string) => {
    void triggerHaptic("light");
    quranPlayer.setPanel(true);
    void quranPlayer.select(readJSON(PREF, DEFAULT_PREFS).reciter, chapterId, nameRef.current, true, key);
  }, [chapterId]);

  const showBismillah = chapter?.bismillah_pre && chapterId !== 1 && chapterId !== 9;
  const favSet = useMemo(() => new Set(favs), [favs]);
  const back = () => { void navigate({ to: "/app/quran", search: {} }); };

  return (
    <>
      <Header kicker={`Surah ${chapterId}${chapter ? ` · ${chapter.translated_name.name}` : ""}`} title={chapter?.name_simple ?? "…"} sub={chapter?.name_arabic} onBack={back} />
      <main className="scroll-area">
        <div className={`mx-auto max-w-md space-y-3 px-5 pt-4 ${player.panelOpen ? "pb-64" : "pb-28"}`}>
          <button className="quran-card quran-reciter-select" onClick={() => { void triggerHaptic("light"); setSheet((o) => !o); }}>
            <Avatar r={shownReciter} size={46} />
            <span className="min-w-0 flex-1 text-left"><span className="block truncate text-[15px] font-semibold">{reciterName(shownReciter)}</span><span className="quran-muted block truncate text-[11.5px]">{reciterSubtitle(shownReciter)}</span></span>
            <ChevronDown size={18} className="opacity-60" style={{ transform: sheet ? "rotate(180deg)" : undefined, transition: "transform .2s" }} />
          </button>
          <button className="quran-card quran-fs-toggle" onClick={openFull} aria-label="Read in full screen">
            <Maximize2 size={16} /><span>Full screen reading</span>
          </button>
          {sheet && <ReciterSheet onClose={() => setSheet(false)} onSeeAll={() => { setSheet(false); void navigate({ to: "/app/quran", search: { s: chapterId, view: "reciters", tab: "all" } }); }} />}
          {showBismillah && (
            <section className="quran-card quran-bismillah-card">
              {display.arabic && <p className="quran-bismillah-ar" dir="rtl" lang="ar">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>}
              {display.arabic && display.translation && <span className="quran-bismillah-rule" aria-hidden="true" />}
              {(display.translation || !display.arabic) && <p className="quran-bismillah-en">In the name of Allah, the Entirely Merciful, the Especially Merciful.</p>}
            </section>
          )}

          {!reciterHasSurah(shownReciter, chapterId) && (
            <button type="button" className="quran-card quran-missing-note" onClick={() => setSheet(true)}>
              <strong>{reciterName(shownReciter).replace(/\s*\[[^\]]*\]$/, "")} hasn't recorded {chapter?.name_simple ?? "this surah"} yet.</strong>
              <span>You can still read it here. Tap to choose another reciter to listen.</span>
            </button>
          )}
          {error && <p className="quran-muted text-center text-sm">Couldn't load this surah. Check your connection.</p>}
          {!verses && !error && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
          {verses && display.page && !full && (
            <MushafPage verses={verses} activeKey={pos.key} word={display.words ? pos.word : null} arabic={display.arabic} translitOnly={!display.arabic && !display.trOn && display.translit} onPlay={onPlayVerse} />
          )}
          {!display.page && !full && verses?.map((v) => (
            <VerseCard key={v.key} verse={v} active={pos.key === v.key} word={pos.key === v.key && display.words ? pos.word : null}
              translit={display.translit} translation={display.translation} arabic={display.arabic} fav={favSet.has(v.key)}
              onPlay={onPlayVerse} onFav={toggleFav} />
          ))}
          {verses && <p className="quran-muted pt-2 text-center text-[10px]">Text, translation (Saheeh International) and recitations via Quran.com</p>}
        </div>
      </main>
      {full && typeof document !== "undefined" && createPortal(
        <div className="quran-fs" role="dialog" aria-modal="true" aria-label={`${chapter?.name_simple ?? "Surah"}, reading mode`}>
          <button className="quran-fs-x" onClick={closeFull} aria-label="Close reading mode"><X size={18} /></button>
          <div className={`quran-fs-scroll ${player.panelOpen ? "has-panel" : ""}`}>
            <section className="quran-fs-sheet">
              <header className="quran-fs-band">
                <span className="quran-fs-meta">{chapter ? (chapter.revelation_place === "makkah" ? "Makki" : "Madani") : ""}</span>
                <span className="quran-fs-name" lang="ar" dir="rtl">{chapter ? `سُورَةُ ${chapter.name_arabic}` : "…"}</span>
                <span className="quran-fs-meta">{chapter ? `${chapter.verses_count} verses` : ""}</span>
              </header>
              <p className="quran-fs-sub">{chapter ? `${chapter.name_simple} · ${chapter.translated_name.name}` : ""}</p>
              {showBismillah && display.arabic && <div className="quran-fs-bismillah" dir="rtl" lang="ar">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>}
              {showBismillah && !display.arabic && <div className="quran-fs-bismillah is-en">In the name of Allah, the Entirely Merciful, the Especially Merciful.</div>}
              {verses ? <MushafPage bare verses={verses} activeKey={pos.key} word={display.words ? pos.word : null} arabic={display.arabic} translitOnly={!display.arabic && !display.trOn && display.translit} onPlay={onPlayVerse} />
                : error ? <p className="quran-muted py-10 text-center text-sm">Couldn't load this surah. Check your connection.</p>
                : <div className="flex justify-center py-12"><Loader2 className="animate-spin" /></div>}
              <footer className="quran-fs-foot"><span aria-hidden="true">۞</span><span>Surah {chapterId} of 114</span><span aria-hidden="true">۞</span></footer>
            </section>
          </div>
          {player.panelOpen ? <QuranPlayerPanel /> : <QuranMiniPlayer />}
        </div>,
        document.body,
      )}
      {!full && player.panelOpen && <QuranPlayerPanel />}
    </>
  );
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (n: number) => String(n).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);

/** Traditional mushaf ayah-end marker: ornamental rosette framing the verse number in Arabic numerals. */
function AyahMarker({ n }: { n: number }) {
  const lobes: [number, number][] = [[14.6, 22.5], [25.4, 22.5], [14.6, 33.5], [25.4, 33.5]];
  const dashes: [number, number, number][] = [[9.5, 16, -38], [30.5, 16, 38], [9.5, 40, 38], [30.5, 40, -38], [5.6, 28, 90], [34.4, 28, 90]];
  return (
    <span className="quran-ayah" aria-label={`Verse ${n}`}>
      <svg viewBox="0 0 40 56" aria-hidden="true">
        <path d="M20 1.5C23.5 6.5 30.5 9 35.8 12.6C39.4 21.5 39.4 34.5 35.8 43.4C30.5 47 23.5 49.5 20 54.5C16.5 49.5 9.5 47 4.2 43.4C0.6 34.5 0.6 21.5 4.2 12.6C9.5 9 16.5 6.5 20 1.5Z"
          fill="var(--ayah-frame)" stroke="var(--ayah-ink)" strokeWidth="1.3" strokeLinejoin="round" />
        <ellipse cx="20" cy="28" rx="15.2" ry="17.6" fill="var(--ayah-ink)" />
        <g fill="var(--ayah-fill)">
          {lobes.map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="7.4" />)}
          <rect x="9" y="22.5" width="22" height="11" />
          <rect x="14.6" y="17" width="10.8" height="22" />
        </g>
        <circle cx="20" cy="8.6" r="1.9" fill="var(--ayah-ink)" />
        <circle cx="20" cy="47.4" r="1.9" fill="var(--ayah-ink)" />
        {dashes.map(([x, y, r]) => <rect key={`${x}-${y}`} x={x - 2.2} y={y - 0.7} width="4.4" height="1.4" rx="0.7" fill="var(--ayah-ink)" transform={`rotate(${r} ${x} ${y})`} />)}
      </svg>
      <span className="quran-ayah-n" lang="ar">{toArabicDigits(n)}</span>
    </span>
  );
}

function ReciterSheet({ onClose, onSeeAll }: { onClose: () => void; onSeeAll: () => void }) {
  const [prefs, setPrefs] = usePrefs();
  const popIds = new Set(POPULAR_RECITERS);
  const list = [...POPULAR_RECITERS.map(findReciter), ...RECITERS.filter((r) => r.group === 1 && !popIds.has(r.id))];
  return (
    <div className="quran-card quran-dropdown" role="region" aria-label="Change reciter">
      <div>
        <div className="flex items-center justify-between px-4 pb-1 pt-3">
          <h2 className="text-[16px] font-semibold">Change reciter</h2>
          <button className="quran-see-all" onClick={onSeeAll}>See All <ChevronRight size={14} /></button>
        </div>
        <div className="quran-sheet-list">
          {list.map((r) => {
            const on = prefs.reciter === r.id;
            return (
              <button key={r.id} className={`quran-reciter-row w-full text-left ${on ? "is-on" : ""}`} onClick={() => { setPrefs({ reciter: r.id }); void triggerHaptic("medium"); onClose(); }}>
                <Avatar r={r} size={42} />
                <span className="min-w-0 flex-1"><span className="block truncate text-[14px] font-semibold">{reciterName(r)}</span><span className="quran-muted block truncate text-[11px]">{reciterSubtitle(r)}</span></span>
                {on && <span className="quran-mini-eq" aria-label="Selected"><i /><i /><i /></span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function QuranPlayerPanel() {
  const p = useQuranPlayer();
  const r = findReciter(p.reciterId);
  const ready = !!p.audio;
  const tap = (f: () => void) => () => { void triggerHaptic("light"); f(); };
  const navigate = useNavigate();
  const goSurah = async (d: number) => {
    const id = (p.chapter ?? 1) + d;
    if (id < 1 || id > 114) return;
    void triggerHaptic("light");
    const name = (await getChapters().catch(() => [] as Chapter[])).find((c) => c.id === id)?.name_simple ?? `Surah ${id}`;
    await quranPlayer.select(p.reciterId, id, name, true);
    void navigate({ to: "/app/quran", search: { s: id } });
  };
  return (
    <div className="quran-player" role="group" aria-label="Recitation controls">
      <div className="flex items-center gap-3">
        <Avatar r={r} size={44} />
        <span className="min-w-0 flex-1"><span className="block truncate text-[16px] font-semibold">{p.chapterName}</span><span className="quran-muted block truncate text-[12.5px]">{reciterName(r)}</span></span>
        <button className="quran-speed" aria-label={`Playback speed ${p.rate}x`} onClick={tap(quranPlayer.cycleRate)}>{p.rate}x</button>
        <button className="quran-player-x" aria-label="Hide player" onClick={() => quranPlayer.setPanel(false)}><X size={16} /></button>
      </div>
      <input className="quran-seek" type="range" min={0} max={1000} aria-label="Seek"
        value={p.dur ? Math.round((p.cur / p.dur) * 1000) : 0}
        style={{ ["--p" as string]: `${p.dur ? (p.cur / p.dur) * 100 : 0}%` }}
        onChange={(e) => quranPlayer.seek(Number(e.target.value) / 1000)} disabled={!ready} />
      <div className="quran-times"><span>{fmt(p.cur)}</span><span>{fmt(p.dur)}</span></div>
      <div className="quran-surah-nav">
        <button onClick={() => void goSurah(-1)} disabled={(p.chapter ?? 1) <= 1}><ChevronLeft size={15} /> Previous surah</button>
        <button onClick={() => void goSurah(1)} disabled={(p.chapter ?? 114) >= 114}>Next surah <ChevronRight size={15} /></button>
      </div>
      <div className="quran-controls">
        <button aria-label="Shuffle surahs" aria-pressed={p.shuffle} className={p.shuffle ? "is-on" : ""} onClick={tap(quranPlayer.toggleShuffle)}><Shuffle size={19} /></button>
        <button aria-label="Previous verse" onClick={tap(() => quranPlayer.step(-1))} disabled={!ready}><SkipBack size={24} fill="currentColor" /></button>
        <button className="quran-play" aria-label={p.playing ? "Pause" : "Play"} onClick={tap(() => quranPlayer.toggle())} disabled={!ready}>
          {p.loading && !p.playing ? <Loader2 size={24} className="animate-spin" /> : p.playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />}
        </button>
        <button aria-label="Next verse" onClick={tap(() => quranPlayer.step(1))} disabled={!ready}><SkipForward size={24} fill="currentColor" /></button>
        <button aria-label="Repeat surah" aria-pressed={p.repeat} className={p.repeat ? "is-on" : ""} onClick={tap(quranPlayer.toggleRepeat)}><Repeat size={19} /></button>
      </div>
    </div>
  );
}

// Memoized so only the verse being recited re-renders while audio plays.
const VerseCard = memo(function VerseCard({ verse: v, active, word, translit, translation, arabic, fav, onPlay, onFav }: {
  verse: Verse; active: boolean; word: number | null; translit: boolean; translation: boolean; arabic: boolean; fav: boolean;
  onPlay: (key: string) => void; onFav: (key: string) => void;
}) {
  const wordMode = active && word !== null;
  return (
    <article id={`v-${v.key}`} className={`quran-verse ${active ? "is-active" : ""} ${wordMode ? "is-word-mode" : ""}`}>
      <div className="quran-verse-side">
        <AyahMarker n={v.number} />
        <button className="quran-play-sm" aria-label={`Play verse ${v.number}`} onClick={() => onPlay(v.key)}><Play size={13} fill="currentColor" style={{ marginLeft: 2 }} /></button>
      </div>
      <div className="min-w-0 flex-1">
        {arabic && <p className="quran-ar" dir="rtl" lang="ar" onClick={() => onPlay(v.key)}>
          {v.words.map((w) => {
            const state = w.isEnd ? "quran-end" : !wordMode ? "quran-word" : w.position < word! ? "quran-word is-done" : w.position === word ? "quran-word is-now" : "quran-word";
            return <Fragment key={w.position}><span className={state}>{w.text}</span>{" "}</Fragment>;
          })}
        </p>}
        {translit && v.transliteration && <p className={`quran-translit ${!arabic && !translation ? "is-big" : ""}`} onClick={!arabic && !translation ? () => onPlay(v.key) : undefined}>{v.transliteration}</p>}
        {translation && <p className={`quran-tr ${arabic ? "" : "is-big"}`} onClick={arabic ? undefined : () => onPlay(v.key)}>{v.translation}</p>}
      </div>
      <button className={`quran-heart ${fav ? "is-on" : ""}`} aria-label={fav ? "Remove from favorites" : "Save verse"} aria-pressed={fav} onClick={() => onFav(v.key)}>
        <Heart size={18} fill={fav ? "currentColor" : "none"} />
      </button>
    </article>
  );
});

/** Whole surah as one flowing page, like reading from a printed mushaf. */
const MushafPage = memo(function MushafPage({ verses, activeKey, word, arabic, onPlay, bare = false, translitOnly = false }: {
  verses: Verse[]; activeKey: string | null; word: number | null; arabic: boolean; onPlay: (key: string) => void; bare?: boolean; translitOnly?: boolean;
}) {
  const box = bare ? "quran-mushaf is-bare" : "quran-card quran-mushaf";
  if (!arabic) {
    return (
      <article className={`${box} is-en ${activeKey ? "has-active" : ""} ${translitOnly ? "is-translit" : ""}`}>
        {verses.map((v) => (
          <span key={v.key} id={`v-${v.key}`} className={`quran-mushaf-v ${activeKey === v.key ? "is-active" : ""}`} onClick={() => onPlay(v.key)}>
            {translitOnly ? v.transliteration : v.translation} <sup className="quran-mushaf-n">{v.number}</sup>{" "}
          </span>
        ))}
      </article>
    );
  }
  return (
    <article className={box} dir="rtl" lang="ar">
      {verses.map((v) => {
        const active = activeKey === v.key;
        const wordMode = active && word !== null;
        return (
          <span key={v.key} id={`v-${v.key}`} className={`quran-mushaf-v ${active ? "is-active" : ""} ${wordMode ? "is-word-mode" : ""}`} onClick={() => onPlay(v.key)}>
            {v.words.filter((w) => !w.isEnd).map((w) => {
              const cls = !wordMode ? "quran-word" : w.position < word! ? "quran-word is-done" : w.position === word ? "quran-word is-now" : "quran-word";
              return <Fragment key={w.position}><span className={cls}>{w.text}</span>{" "}</Fragment>;
            })}
            <AyahMarker n={v.number} />{" "}
          </span>
        );
      })}
    </article>
  );
});
