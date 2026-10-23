import { favoritesFirst, toggleFavorite, useFavoriteReciters } from "@/lib/quran-favorites";
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { markSurahComplete } from "@/lib/giveaway";
import { preferredTafsirBook } from "@/lib/tafsir";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QuranFaceBubble, QuranMiniPlayer } from "@/components/QuranMiniPlayer";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, ChevronLeft, ChevronRight, Clock, Heart, Infinity as InfinityIcon, Info, MoreHorizontal, RotateCcw, RotateCw, SlidersHorizontal, Loader2, Maximize2, Pause, Play, Repeat, Search, Shuffle, SkipBack, SkipForward, X } from "lucide-react";
import {
  featuredRank, findReciter, getChapterAudio, getChapters, getVerses, homeReciterRow, POPULAR_RECITERS, RECITERS, reciterHasPhoto,
  reciterHasSurah, reciterName, reciterScore, reciterPhoto, reciterSubtitle, searchChapters, searchReciters, parseVerseRef, type Chapter, type Reciter, type Verse, getVerseByKey, searchVerses, type VerseHit,
} from "@/lib/quran";
import { getDisplay, setDisplay, triggerHaptic, type DisplayPrefs } from "@/lib/theme";
import { guessVerses } from "@/lib/quran-search.functions";
import { quranPlayer, SPEEDS, useQuranPlayer } from "@/lib/quran-player";

type Search = { s?: number; v?: number; view?: "reciters"; tab?: "all" };

export const Route = createFileRoute("/app/quran")({
  validateSearch: (q: Record<string, unknown>): Search => {
    const out: Search = {};
    const n = Number(q.s);
    if (Number.isInteger(n) && n >= 1 && n <= 114) out.s = n;
    const v = Number(q.v);
    if (out.s && Number.isInteger(v) && v >= 1 && v <= 286) out.v = v;
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

type Last = { s: number; v: number; t?: number; d?: number; r?: number; mode?: "read" | "listen"; ao?: boolean };

function QuranPage() {
  const { s, v, view, tab } = Route.useSearch();
  if (view === "reciters") return <ReciterPicker back={s} tab={tab} />;
  return s ? <Reader key={`${s}:${v ?? ""}`} chapterId={s} verse={v} /> : <Home />;
}

/* ---------- shared bits ---------- */
function Avatar({ r, size = 48, eager = false }: { r: Reciter; size?: number; eager?: boolean }) {
  const [broken, setBroken] = useState(false);
  const photo = reciterPhoto(r);
  const initials = reciterName(r).replace(/^(sheikh|al-|ash-|as-)\s*/i, "").split(/\s+/).filter((w) => !/^(al|ad|ar|as|ash|bin|ibn)-?$/i.test(w)).slice(0, 2).map((w) => w.replace(/^[a-z]+-/i, "")[0]).join("").toUpperCase();
  // A portrait already in the browser cache finishes before React attaches onLoad,
  // so show it as soon as the node exists instead of leaving the initials up.
  const showIfReady = (el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth > 0) el.classList.add("is-loaded");
  };
  return (
    <span className="quran-avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      <span className="quran-avatar-initials">{initials}</span>
      {photo && !broken && (
        <img src={photo} alt="" loading={eager ? "eager" : "lazy"} decoding="async"
          fetchPriority={eager ? "high" : "low"}
          ref={showIfReady}
          onLoad={(e) => e.currentTarget.classList.add("is-loaded")} onError={() => setBroken(true)} />
      )}
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
  const audioPct = last?.mode === "listen" && last.ao && last.t != null && last.d ? Math.min(100, Math.round((last.t / last.d) * 100)) : null;
  const open = (id: number) => { void triggerHaptic("light"); void navigate({ to: "/app/quran", search: { s: id } }); };
  // Resume where they left off: listening position if they last listened, otherwise the verse they read to.
  const resume = async () => {
    if (!last) return;
    void triggerHaptic("light");
    const name = chapters?.find((c) => c.id === last.s)?.name_simple ?? "";
    quranPlayer.setPanel(true);
    const reciter = last.mode === "listen" && last.r ? last.r : prefs.reciter;
    void navigate({ to: "/app/quran", search: { s: last.s } });
    if (last.mode === "listen" && last.t) {
      await quranPlayer.select(reciter, last.s, name, false);
      quranPlayer.playAt(last.t);
    } else {
      await quranPlayer.select(reciter, last.s, name, true, `${last.s}:${last.v}`);
    }
  };
  const favs = useFavoriteReciters();
  const home = homeReciterRow(favs, prefs.reciter);
  // The strip's snap can nudge it one tile to the right while avatars load, which
  // would push the chosen reciter out of sight, so keep the row anchored at its start.
  const stripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    const later = [250, 800].map((ms) => window.setTimeout(() => { el.scrollLeft = 0; }, ms));
    return () => later.forEach((t) => window.clearTimeout(t));
  }, [favs.join(","), prefs.reciter]);

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
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reciter, surah, verse (24:32) or topic…" />
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

          {t && list.length > 0 && <h2 className="quran-section-title">Surahs</h2>}
          {t && list.length > 0 && <div className="space-y-2.5">{list.slice(0, 6).map((c) => <ChapterRow key={c.id} c={c} onOpen={open} />)}</div>}
          {t && <VerseResults q={q} chapters={chapters} onOpen={(key) => { const [cs, vs] = key.split(":").map(Number); void triggerHaptic("light"); void navigate({ to: "/app/quran", search: { s: cs, v: vs } }); }} />}

          {!t && (
            <section className="quran-reciter-panel">
              <div className="flex items-center justify-between">
                <h2 className="quran-section-title">Choose a Reciter</h2>
                <button className="quran-see-all" onClick={() => { console.log("SEE-ALL CLICKED"); void navigate({ to: "/app/quran", search: { view: "reciters", tab: "all" } }); }}>See All <ChevronRight size={14} /></button>
              </div>
              <div className="quran-reciter-strip" ref={stripRef}>
                {home.map((r) => (
                  <button key={r.id} className={`quran-reciter-tile ${prefs.reciter === r.id ? "is-on" : ""}`} onClick={() => { setPrefs({ reciter: r.id }); void triggerHaptic("light"); }}>
                    <span className="quran-reciter-ring"><Avatar r={r} size={64} eager /></span>
                    <span className="quran-reciter-name">{reciterName(r)}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {lastChapter && !t && (
            <button className="quran-card quran-continue" onClick={() => { if (audioPct != null) void resume(); else open(lastChapter.id); }}>
              <SurahArt name={lastChapter.name_arabic} />
              <span className="min-w-0 flex-1 text-left">
                <span className="quran-continue-kicker">Continue Reading</span>
                <span className="quran-continue-title">{lastChapter.name_simple}</span>
                <span className="quran-continue-meta">Surah {lastChapter.id} · {audioPct != null ? `${audioPct}% complete` : `Verse ${last!.v} of ${lastChapter.verses_count}`}</span>
                <span className="quran-progress"><i style={{ width: `${Math.max(4, audioPct ?? (last!.v / lastChapter.verses_count) * 100)}%` }} /></span>
              </span>
              <span className="quran-continue-play" role="button" aria-label="Resume" onClick={(e) => { e.stopPropagation(); void resume(); }}><Play size={20} strokeWidth={1.6} strokeLinejoin="round" style={{ marginLeft: 2 }} /></span>
            </button>
          )}

          {error && <p className="quran-muted text-center text-sm">Couldn't load the Quran. Check your connection and try again.</p>}
          {!chapters && !error && <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>}
          {!t && <div className="space-y-2.5">
            {list.map((c) => <ChapterRow key={c.id} c={c} onOpen={open} />)}
          </div>}
        </div>
      </main>
    </>
  );
}

function ChapterRow({ c, onOpen }: { c: Chapter; onOpen: (id: number) => void }) {
  return (
              <button className="quran-chapter" onClick={() => onOpen(c.id)}>
                <NumBadge n={c.id} />
                <span className="min-w-0 flex-1 text-left">
                  <span className="block text-[16px] font-semibold">{c.name_simple}</span>
                  <span className="quran-muted block text-[11px]">{c.translated_name.name} · {c.verses_count} verses · {c.revelation_place === "makkah" ? "Makki" : "Madani"}</span>
                </span>
                <span className="quran-chapter-ar" dir="rtl">{c.name_arabic}</span>
                <ChevronRight size={16} className="opacity-50" />
              </button>
  );
}

/** Verses by reference (33:33), by remembered words, or by meaning ("stay at home"). */
function VerseResults({ q, chapters, onOpen }: { q: string; chapters: Chapter[] | null; onOpen: (key: string) => void }) {
  const [hits, setHits] = useState<VerseHit[] | null>(null);
  const ref = parseVerseRef(q, chapters ?? undefined);
  useEffect(() => {
    const term = q.trim();
    let live = true;
    setHits(null);
    if (ref) { getVerseByKey(ref).then((h) => live && setHits([h])).catch(() => live && setHits([])); return () => { live = false; }; }
    if (term.length < 3 || /^\d+$/.test(term)) { setHits([]); return; }
    const id = window.setTimeout(async () => {
      const [ai, kw] = await Promise.all([
        guessVerses({ data: { q: term } }).then((r) => r.keys).catch(() => [] as string[]),
        searchVerses(term).catch(() => [] as VerseHit[]),
      ]);
      const aiHits = (await Promise.all(ai.map((k) => getVerseByKey(k).catch(() => null)))).filter((h): h is VerseHit => !!h);
      const seen = new Set<string>();
      const all = [...aiHits, ...kw].filter((h) => (seen.has(h.key) ? false : (seen.add(h.key), true))).slice(0, 8);
      if (live) setHits(all);
    }, 450);
    return () => { live = false; window.clearTimeout(id); };
  }, [q, ref]);
  if (hits && !hits.length) return null;
  const name = (key: string) => chapters?.find((c) => c.id === Number(key.split(":")[0]))?.name_simple ?? "Surah";
  return (
    <>
      <h2 className="quran-section-title">Verses</h2>
      {!hits ? <div className="flex justify-center py-4"><Loader2 className="animate-spin" size={18} /></div> : (
        <div className="space-y-2.5">
          {hits.map((h) => (
            <button key={h.key} className="quran-card block w-full p-3.5 text-left" onClick={() => onOpen(h.key)}>
              <span className="quran-muted flex items-center justify-between text-[11px] font-semibold"><span>{name(h.key)} · {h.key}</span><ChevronRight size={14} className="opacity-50" /></span>
              <span className="mt-1.5 text-right text-[18px] leading-[1.8] line-clamp-2" dir="rtl">{h.text}</span>
              {h.translation && <span className="mt-1 text-[13px] leading-snug line-clamp-3">{h.translation}</span>}
            </button>
          ))}
        </div>
      )}
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
  const list = (t ? RECITERS.map((r) => [r, reciterScore(r, t)] as const).filter(([, sc]) => sc > 0).sort((a, b) => b[1] - a[1] || featuredRank(a[0]) - featuredRank(b[0]) || Number(!reciterHasPhoto(a[0])) - Number(!reciterHasPhoto(b[0])) || Number(!!a[0].server) - Number(!!b[0].server)).map(([r]) => r) : RECITERS.filter((r) => {
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
      const pop = POPULAR_RECITERS.map(findReciter).filter((r) => list.includes(r));
      return [...pop, ...list.filter((r) => !popIds.has(r.id))];
    }
    return list;
  }, [filter, t, list]);
  const favs = useFavoriteReciters();
  const ordered = useMemo(() => {
    if (t) return sorted;
    const extra = favs.map(findReciter).filter((r) => r && !sorted.includes(r));
    return favoritesFirst([...extra, ...sorted], favs);
  }, [sorted, favs, t]);

  const goBack = () => { audio.current?.pause(); void navigate({ to: "/app/quran", search: back ? { s: back } : {} }); };
  const choose = (r: Reciter) => { setPrefs({ reciter: r.id }); void triggerHaptic("medium"); };
  const togglePreview = async (r: Reciter) => {
    void triggerHaptic("light");
    if (preview === r.id) { audio.current?.pause(); setPreview(null); return; }
    audio.current?.pause(); quranPlayer.pause();
    setPreview(r.id);
    try {
      const own = r.surahs?.split(",").map(Number).filter(Boolean) ?? [];
      const ch = reciterHasSurah(r, 1) || !own.length ? 1 : own[Math.floor(Math.random() * own.length)];
      const a = await getChapterAudio(r.id, ch);
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
            {ordered.map((r) => {
              const on = prefs.reciter === r.id;
              const fav = favs.includes(r.id);
              return (
                <div key={r.id} className={`quran-reciter-row ${on ? "is-on" : ""}`}>
                  <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => choose(r)}>
                    <Avatar r={r} size={48} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[14.5px] font-semibold">{reciterName(r)}</span><span className="quran-muted block truncate text-[11.5px]">{reciterSubtitle(r)}</span></span>
                  </button>
                  <button className={`quran-fav-btn${fav ? " is-on" : ""}`} aria-pressed={fav} aria-label={fav ? `Remove ${r.name} from favorites` : `Add ${r.name} to favorites`} onClick={() => { toggleFavorite(r.id); void triggerHaptic("light"); }}>

                    <Heart size={17} fill={fav ? "currentColor" : "none"} />
                  </button>
                  <button className="quran-play-sm" aria-label={preview === r.id ? "Stop preview" : `Preview ${r.name}`} onClick={() => void togglePreview(r)}>
                    {preview === r.id ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: 2 }} />}
                  </button>
                </div>
              );
            })}
            {ordered.length === 0 && <p className="quran-muted p-6 text-center text-sm">No reciters found.</p>}
          </div>
          <p className="quran-muted text-center text-[10px]">Preview plays Al-Fatihah. Tap a name to choose — it saves right away.</p>
        </div>
      </main>
    </>
  );
}

/* ---------- reader ---------- */
const fmt = (s: number) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");

// The surah view is keyed by surah, so the next surah mounts a fresh component.
// These two notes live outside it so the player and the reader dock survive that swap.
let quietUntil = 0;
let dockSeen: "face" | "open" = "face";

function Reader({ chapterId, verse }: { chapterId: number; verse?: number }) {
  const navigate = useNavigate();
  const [prefs] = usePrefs();
  const [favs, toggleFav] = useFavs();
  const [display, setDisplayState] = useState({ translit: true, translation: true, trOn: true, arabic: true, page: false, follow: true, words: true, large: false, flip: true });
  useEffect(() => {
    const read = () => { const d = getDisplay(); setDisplayState({ translit: d.showTransliteration, translation: d.showTranslation || (!d.showArabic && !d.showTransliteration), trOn: d.showTranslation, arabic: d.showArabic, page: d.quranPageView, follow: d.quranAutoScroll, words: d.quranWordHighlight, large: d.arabicLarge, flip: d.quranFlipPages }); };
    read();
    window.addEventListener("adhkar:display-update", read);
    return () => window.removeEventListener("adhkar:display-update", read);
  }, []);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [verses, setVerses] = useState<Verse[] | null>(null);
  const [error, setError] = useState(false);
  const player = useQuranPlayer();
  const here = player.chapter === chapterId;
  const shownReciter = findReciter(here ? player.reciterId : prefs.reciter);
  const lastKey = useRef<string | null>(null);
  const restoreTo = useRef<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [readSettings, setReadSettings] = useState(false);
  const missingKey = `${shownReciter.id}:${chapterId}`;
  const [missingClosed, setMissingClosed] = useState<string | null>(null);
  const missingOpen = !reciterHasSurah(shownReciter, chapterId) && missingClosed !== missingKey;
  const [full, setFull] = useState(false);
  const [dock, setDockState] = useState<"face" | "open">(dockSeen);
  const setDock = (d: "face" | "open") => { dockSeen = d; setDockState(d); };
  // Play entire Quran: when the next surah starts, the open reader follows it.
  // The player keeps whatever state it had — if it was minimized it stays minimized.
  useEffect(() => {
    const onNext = (e: Event) => {
      quietUntil = Date.now() + 1500;
      void navigate({ to: "/app/quran", search: { s: (e as CustomEvent<number>).detail } });
    };
    window.addEventListener("quran:auto-next", onNext);
    return () => window.removeEventListener("quran:auto-next", onNext);
  }, [navigate]);
  // In-app reading mode: the surah takes over the whole app screen like a book page.
  // Deliberately NOT the browser/native fullscreen API.
  const openFull = () => { void triggerHaptic("light"); setSheet(false); setDock("face"); setFull(true); };
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
    if (!last || last.s !== chapterId) localStorage.setItem(LAST, JSON.stringify({ s: chapterId, v: 1, mode: "read" }));
    restoreTo.current = verse ? `${chapterId}:${verse}` : last && last.s === chapterId && last.v > 1 ? `${chapterId}:${last.v}` : null;
    document.querySelector(".scroll-area")?.scrollTo({ top: 0 });
    // Arrived because the recitation moved on: the player keeps whatever state it had,
    // so a minimized player stays minimized. The surah view mounts twice in a row, so
    // this is a short window rather than a flag that one run would consume.
    if (Date.now() >= quietUntil) quranPlayer.setPanel(true);
  }, [chapterId]);

  // Jump back to the saved verse once the verses are on the page.
  useEffect(() => {
    if (!verses || !restoreTo.current) return;
    const key = restoreTo.current; restoreTo.current = null;
    requestAnimationFrame(() => document.getElementById(`v-${key}`)?.scrollIntoView({ block: verse ? "center" : "start" }));
  }, [verses]);
  // Reading progress: remember the top verse on screen while not listening.
  const saveRead = useRef(0);
  const checkReadEnd = (el: HTMLElement) => {
    if (!verses || !chapter || verses.length < chapter.verses_count) return;
    if (el.scrollHeight <= el.clientHeight + 40) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 120) markSurahComplete(chapterId);
  };
  const onReadScroll = (e: React.UIEvent<HTMLElement>) => {
    checkReadEnd(e.currentTarget);
    const now = Date.now();
    if (now - saveRead.current < 400 || restoreTo.current) return;
    saveRead.current = now;
    const s = quranPlayer.get();
    if (s.playing && s.chapter === chapterId) return;
    // Listening progress is an exact timestamp; scrolling must not erase it.
    const prev = readJSON<Last | null>(LAST, null);
    if (prev && prev.s === chapterId && prev.mode === "listen" && prev.t) return;
    const top = e.currentTarget.getBoundingClientRect().top + 8;
    const el = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[id^="v-"]')).find((n) => n.getBoundingClientRect().bottom > top);
    const v = el ? Number(el.id.split(":")[1]) : 1;
    if (v) localStorage.setItem(LAST, JSON.stringify({ s: chapterId, v, mode: "read" }));
  };

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
    const el = document.getElementById(`v-${pos.key}`);
    if (!el) return;
    if (!revealOnPage(el, true)) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [pos.key, display.follow]);
  // Page mode: opening full screen lands on the page being recited or last read.
  const flipping = full && display.flip;
  useEffect(() => {
    if (!flipping || !verses) return;
    const last = readJSON<Last | null>(LAST, null);
    const key = pos.key ?? (last && last.s === chapterId && last.v > 1 ? `${chapterId}:${last.v}` : null);
    requestAnimationFrame(() => { const el = key && document.getElementById(`v-${key}`); if (el) revealOnPage(el, false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flipping, verses]);

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
      <main className={`scroll-area ${display.large ? "quran-ar-large" : ""}`} onScroll={onReadScroll}>
        <div className={`mx-auto max-w-md space-y-3 px-5 pt-4 ${player.panelOpen ? "pb-64" : "pb-28"}`}>
          <button className="quran-card quran-reciter-select" onClick={() => { void triggerHaptic("light"); setSheet((o) => !o); }}>
            <Avatar r={shownReciter} size={46} eager />
            <span className="min-w-0 flex-1 text-left"><span className="block truncate text-[15px] font-semibold">{reciterName(shownReciter)}</span><span className="quran-muted block truncate text-[11.5px]">{reciterSubtitle(shownReciter)}</span></span>
            <ChevronDown size={18} className="opacity-60" style={{ transform: sheet ? "rotate(180deg)" : undefined, transition: "transform .2s" }} />
          </button>
          <div className="quran-fs-row">
            <button className="quran-card quran-fs-toggle" style={{ flex: "1 1 0", width: "auto", minWidth: 0 }} onClick={openFull} aria-label="Read in full screen">
              <Maximize2 size={16} /><span>Full screen reading</span>
            </button>
            <button className="quran-card quran-fs-toggle quran-read-settings" onClick={() => { void triggerHaptic("light"); setReadSettings(true); }} aria-label="Reading settings">
              <SlidersHorizontal size={15} /><span>Reading</span>
            </button>
          </div>
          {readSettings && <QuranAudioSettings onClose={() => setReadSettings(false)} />}
          {sheet && <ReciterSheet onClose={() => setSheet(false)} onSeeAll={() => { setSheet(false); void navigate({ to: "/app/quran", search: { s: chapterId, view: "reciters", tab: "all" } }); }} />}
          {showBismillah && (
            <section className="quran-card quran-bismillah-card">
              {display.arabic && <p className="quran-bismillah-ar" dir="rtl" lang="ar">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>}
              {display.arabic && display.translation && <span className="quran-bismillah-rule" aria-hidden="true" />}
              {(display.translation || !display.arabic) && <p className="quran-bismillah-en">In the name of Allah, the Entirely Merciful, the Especially Merciful.</p>}
            </section>
          )}

          <Dialog open={missingOpen} onOpenChange={(o) => { if (!o) setMissingClosed(missingKey); }}>
            <DialogContent className="w-[calc(100%_-_40px)] max-w-[360px] rounded-3xl border-border/60 bg-card p-6 text-card-foreground">
              <DialogHeader className="text-left">
                <DialogTitle className="pr-6 text-lg font-semibold leading-snug">Not recorded yet</DialogTitle>
                <DialogDescription className="text-sm leading-6 text-muted-foreground">
                  {reciterName(shownReciter).replace(/\s*\[[^\]]*\]$/, "")} hasn't recorded {chapter?.name_simple ?? "this surah"}. You can still read it here, or choose another reciter to listen.
                </DialogDescription>
              </DialogHeader>
              <button type="button" className="mt-2 h-11 w-full rounded-full bg-primary text-sm font-medium text-primary-foreground" onClick={() => { setMissingClosed(missingKey); setSheet(true); }}>
                Choose another reciter
              </button>
            </DialogContent>
          </Dialog>
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
        </div>
      </main>
      {full && typeof document !== "undefined" && createPortal(
        <div className="quran-fs" role="dialog" aria-modal="true" aria-label={`${chapter?.name_simple ?? "Surah"}, reading mode`}>
          <button className="quran-fs-x" onClick={closeFull} aria-label="Close reading mode"><X size={18} /></button>
          {display.flip ? (verses ? <MushafPages verses={verses} chapter={chapter} chapterId={chapterId} showBismillah={!!showBismillah} arabic={display.arabic}
              activeKey={pos.key} word={display.words ? pos.word : null} translitOnly={!display.arabic && !display.trOn && display.translit}
              panel={dock !== "face" && player.panelOpen} onPlay={onPlayVerse} onLastPage={() => { if (chapter && verses.length >= chapter.verses_count) markSurahComplete(chapterId); }} />
            : <div className="flex flex-1 items-center justify-center">{error ? <p className="quran-muted text-sm">Couldn't load this surah. Check your connection.</p> : <Loader2 className="animate-spin" />}</div>) : (
          <div className={`quran-fs-scroll ${player.panelOpen ? "has-panel" : ""}`} onScroll={(e) => checkReadEnd(e.currentTarget)}>
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
          </div>)}
          {dock === "face" ? <QuranFaceBubble onOpen={() => { quranPlayer.setPanel(false); setDock("open"); }} /> : player.panelOpen ? <QuranPlayerPanel /> : <QuranMiniPlayer />}
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

const SLEEP_OPTIONS: { label: string; v: number | "surah" | null }[] = [
  { label: "Off", v: null }, { label: "5 minutes", v: 5 }, { label: "15 minutes", v: 15 },
  { label: "30 minutes", v: 30 }, { label: "1 hour", v: 60 }, { label: "End of surah", v: "surah" },
];

function useSleepLeft(sleep: number | "surah" | null) {
  const [, force] = useState(0);
  useEffect(() => {
    if (typeof sleep !== "number") return;
    const t = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [sleep]);
  if (sleep === "surah") return "End of surah";
  if (typeof sleep !== "number") return null;
  const s = Math.max(0, Math.round((sleep - Date.now()) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} left`;
}

function QuranSwitch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} className={`qp-switch ${on ? "is-on" : ""}`}
      onClick={(e) => { e.stopPropagation(); void triggerHaptic("light"); onChange(!on); }}><i /></button>
  );
}

const AUDIO_TOGGLES: { key: keyof DisplayPrefs; label: string; sub: string }[] = [
  { key: "showArabic", label: "Show Arabic", sub: "Arabic verse text" },
  { key: "showTransliteration", label: "Show transliteration", sub: "Latin letters under the Arabic" },
  { key: "showTranslation", label: "Show translation", sub: "English meaning of each verse" },
  { key: "arabicLarge", label: "Large Arabic text", sub: "Bigger Arabic letters" },
  { key: "quranPageView", label: "Full page view", sub: "One flowing page, like a printed Quran" },
  { key: "quranAutoScroll", label: "Follow recitation", sub: "Moves to the verse being recited" },
  { key: "quranWordHighlight", label: "Word-by-word highlighting", sub: "Lights up each word as it's recited" },
];

function QuranAudioSettings({ onClose }: { onClose: () => void }) {
  const [d, setD] = useState<DisplayPrefs>(() => getDisplay());
  const update = (patch: Partial<DisplayPrefs>) => {
    const next = { ...d, ...patch };
    setD(next); setDisplay(next);
    window.dispatchEvent(new Event("adhkar:display-update"));
  };
  return createPortal(
    <div className="qp-audio-backdrop" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="qp-audio" role="dialog" aria-label="Reading settings">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="qp-title">Reading settings</h3>
          <button className="quran-player-x" aria-label="Close settings" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="qp-audio-list">
          <div className="qp-pop-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
            <span><span className="block text-[14px] font-medium">Full screen reading</span><span className="quran-muted block text-[11.5px]">How pages look in full screen only</span></span>
            <div className="qp-seg" role="radiogroup" aria-label="Full screen reading">
              <button type="button" role="radio" aria-checked={d.quranFlipPages !== false} className={d.quranFlipPages !== false ? "is-on" : ""} onClick={() => { void triggerHaptic("light"); update({ quranFlipPages: true }); }}>Turn pages</button>
              <button type="button" role="radio" aria-checked={d.quranFlipPages === false} className={d.quranFlipPages === false ? "is-on" : ""} onClick={() => { void triggerHaptic("light"); update({ quranFlipPages: false }); }}>One long scroll</button>
            </div>
          </div>
          {AUDIO_TOGGLES.map((t) => (
            <div key={t.key} className="qp-pop-row" onClick={() => update({ [t.key]: !d[t.key] } as Partial<DisplayPrefs>)}>
              <span className="flex-1"><span className="block text-[14px] font-medium">{t.label}</span><span className="quran-muted block text-[11.5px]">{t.sub}</span></span>
              <QuranSwitch on={!!d[t.key]} onChange={(v) => update({ [t.key]: v } as Partial<DisplayPrefs>)} label={t.label} />
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}

function QuranPlayerPanel() {
  const p = useQuranPlayer();
  const r = findReciter(p.reciterId);
  const ready = !!p.audio;
  const tap = (f: () => void) => () => { void triggerHaptic("light"); f(); };
  const navigate = useNavigate();
  const [menu, setMenu] = useState<null | "main" | "sleep" | "speed">(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const sleepLeft = useSleepLeft(p.sleep);
  useEffect(() => { quranPlayer.loadPrefs(); }, []);
  useEffect(() => {
    if (!menu) return;
    const close = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(null); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menu]);
  const goSurah = async (d: number) => {
    const id = (p.chapter ?? 1) + d;
    if (id < 1 || id > 114) return;
    void triggerHaptic("light");
    const name = (await getChapters().catch(() => [] as Chapter[])).find((c) => c.id === id)?.name_simple ?? `Surah ${id}`;
    await quranPlayer.select(p.reciterId, id, name, true);
    void navigate({ to: "/app/quran", search: { s: id } });
  };
  const ts = p.audio?.timings ?? [];
  const hasTimings = ts.length > 0;
  const vi = ts.findIndex((t) => t.key === p.pos.key);
  const curV = vi < 0 ? 0 : vi;
  const prevV = ts[curV - 1]?.key.split(":")[1];
  const nextV = ts[vi < 0 ? 0 : curV + 1]?.key.split(":")[1];
  return (
    <div className="quran-player" role="group" aria-label="Recitation controls">
      <div className="flex items-center gap-3">
        <span className="qp-avatar"><Avatar r={r} size={52} /></span>
        <span className="min-w-0 flex-1"><span className="qp-title block truncate">{p.chapterName}</span><span className="quran-muted block truncate text-[13px]">{reciterName(r)}</span></span>
        <div className="qp-menu-wrap" ref={menuRef}>
          <button className="quran-speed qp-speed" aria-label={`Playback speed ${p.rate}x`} aria-expanded={menu === "speed"} onClick={tap(() => setMenu(menu === "speed" ? null : "speed"))}>{p.rate}x <ChevronDown size={14} /></button>
          <button className="quran-player-x qp-more" aria-label="More options" aria-expanded={menu === "main" || menu === "sleep"} onClick={tap(() => setMenu(menu === "main" || menu === "sleep" ? null : "main"))}><MoreHorizontal size={18} /></button>
          {menu === "speed" && (
            <div className="qp-pop qp-pop-speed" role="menu">
              {SPEEDS.map((s) => (
                <button key={s} role="menuitemradio" aria-checked={p.rate === s} className={`qp-pop-row ${p.rate === s ? "is-on" : ""}`} onClick={tap(() => { quranPlayer.setRate(s); setMenu(null); })}>
                  <span className="flex-1">{s}x</span>{p.rate === s && <Check size={15} />}
                </button>
              ))}
            </div>
          )}
          {menu === "main" && (
            <div className="qp-pop" role="menu">
              <div className="qp-pop-row" onClick={() => quranPlayer.setContinuous(!p.continuous)}>
                <InfinityIcon size={20} className="qp-ic" />
                <span className="flex-1"><span className="block text-[14px] font-medium">Play entire Quran</span><span className="quran-muted block text-[11.5px]">Continue to next surah</span></span>
                <QuranSwitch on={p.continuous} onChange={quranPlayer.setContinuous} label="Play entire Quran" />
              </div>
              <button className="qp-pop-row" onClick={tap(() => setMenu("sleep"))}>
                <Clock size={19} className="qp-ic" />
                <span className="flex-1 text-[14px]">Sleep timer{sleepLeft && <span className="quran-muted block text-[11.5px]">{sleepLeft}</span>}</span>
                <ChevronRight size={16} className="quran-muted" />
              </button>
            </div>
          )}
          {menu === "sleep" && (
            <div className="qp-pop" role="menu">
              <button className="qp-pop-row qp-pop-back" onClick={tap(() => setMenu("main"))}><ChevronLeft size={16} /><span className="flex-1 text-[14px] font-medium">Sleep timer</span></button>
              {SLEEP_OPTIONS.map((o) => {
                const on = o.v === null ? p.sleep === null : o.v === "surah" ? p.sleep === "surah" : false;
                return (
                  <button key={o.label} role="menuitemradio" aria-checked={on} className={`qp-pop-row ${on ? "is-on" : ""}`} onClick={tap(() => { quranPlayer.setSleep(o.v); setMenu(null); })}>
                    <span className="flex-1 text-[14px]">{o.label}</span>{on && <Check size={15} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <button className="quran-player-x" aria-label="Hide player" onClick={() => quranPlayer.setPanel(false)}><X size={18} /></button>
      </div>
      <input className="quran-seek" type="range" min={0} max={1000} aria-label="Seek"
        value={p.dur ? Math.round((p.cur / p.dur) * 1000) : 0}
        style={{ ["--p" as string]: `${p.dur ? (p.cur / p.dur) * 100 : 0}%` }}
        onChange={(e) => quranPlayer.seek(Number(e.target.value) / 1000)} disabled={!ready} />
      <div className="quran-times"><span>{fmt(p.cur)}</span><span>{fmt(p.dur)}</span></div>
      <div className="qp-row">
        {hasTimings ? (
          <>
            <button className="qp-verse" onClick={tap(() => quranPlayer.step(-1))} disabled={!ready || !prevV}>
              <ChevronLeft size={18} /><span className="min-w-0 text-left"><b>Previous verse</b><small>{prevV ? `Verse ${prevV}` : "—"}</small></span>
            </button>
            <span className="qp-divider" aria-hidden />
            <button className="qp-verse is-next" onClick={tap(() => quranPlayer.step(1))} disabled={!ready || !nextV}>
              <span className="min-w-0 text-right"><b>Next verse</b><small>{nextV ? `Verse ${nextV}` : "—"}</small></span><ChevronRight size={18} />
            </button>
          </>
        ) : (
          <>
            <button className="qp-verse" onClick={tap(() => quranPlayer.skip(-10))} disabled={!ready || !p.dur} aria-label="Back 10 seconds">
              <RotateCcw size={17} /><span className="min-w-0 text-left"><b>Back 10s</b><small>skip back</small></span>
            </button>
            <span className="qp-divider" aria-hidden />
            <button className="qp-verse is-next" onClick={tap(() => quranPlayer.skip(15))} disabled={!ready || !p.dur} aria-label="Forward 15 seconds">
              <span className="min-w-0 text-right"><b>Forward 15s</b><small>skip forward</small></span><RotateCw size={17} />
            </button>
          </>
        )}
      </div>
      {p.audio && !hasTimings && (
        <div className="qp-noverse"><Info size={12} /> Verse-by-verse highlighting isn't available for this recitation</div>
      )}
      <div className="quran-controls">
        <button aria-label="Shuffle surahs" aria-pressed={p.shuffle} className={p.shuffle ? "is-on" : ""} onClick={tap(quranPlayer.toggleShuffle)}><Shuffle size={19} /></button>
        <button aria-label="Previous surah" onClick={() => void goSurah(-1)} disabled={(p.chapter ?? 1) <= 1}><SkipBack size={22} fill="currentColor" /></button>
        <button className="quran-play" aria-label={p.playing ? "Pause" : "Play"} onClick={tap(() => quranPlayer.toggle())} disabled={!ready}>
          {p.loading && !p.playing ? <Loader2 size={24} className="animate-spin" /> : p.playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: 3 }} />}
        </button>
        <button aria-label="Next surah" onClick={() => void goSurah(1)} disabled={(p.chapter ?? 114) >= 114}><SkipForward size={22} fill="currentColor" /></button>
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
        <Link to="/app/tafsir" search={{ book: preferredTafsirBook(), v: v.key }} className="quran-tafsir-btn" aria-label={`Tafsir of verse ${v.key}`}>Tafsir</Link>
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
      <button className={`quran-fav-btn ${fav ? "is-on" : ""}`} aria-label={fav ? "Remove from favorites" : "Save verse"} aria-pressed={fav} onClick={() => onFav(v.key)}>
        <Heart size={18} fill={fav ? "currentColor" : "none"} />
      </button>
    </article>
  );
});

/** Page mode: brings a verse's page into view (and the verse within it). Returns false outside page mode. */
function revealOnPage(el: HTMLElement, smooth: boolean): boolean {
  const page = el.closest<HTMLElement>(".quran-fs-page");
  const strip = page?.parentElement;
  if (!page || !strip) return false;
  const behavior: ScrollBehavior = smooth ? "smooth" : "auto";
  strip.scrollTo({ left: page.offsetLeft - strip.offsetLeft, behavior });
  const top = el.offsetTop - page.offsetTop;
  if (top < page.scrollTop || top > page.scrollTop + page.clientHeight - 80) page.scrollTo({ top: Math.max(0, top - page.clientHeight / 3), behavior });
  return true;
}

/** Surah split into the pages of the standard Madani mushaf, turned by swiping. */
function MushafPages({ verses, chapter, chapterId, showBismillah, arabic, activeKey, word, translitOnly, panel, onPlay, onLastPage }: {
  verses: Verse[]; chapter: Chapter | null; chapterId: number; showBismillah: boolean; arabic: boolean; activeKey: string | null; word: number | null;
  translitOnly: boolean; panel: boolean; onPlay: (key: string) => void; onLastPage: () => void;
}) {
  const pages = useMemo(() => {
    const out: { n: number; verses: Verse[] }[] = [];
    verses.forEach((v, i) => {
      const n = v.page ?? Math.floor(i / 10) + 1;
      const cur = out[out.length - 1];
      if (cur && cur.n === n) cur.verses.push(v); else out.push({ n, verses: [v] });
    });
    return out;
  }, [verses]);
  const strip = useRef<HTMLDivElement | null>(null);
  const [at, setAt] = useState(0);
  const onScroll = () => {
    const el = strip.current; if (!el) return;
    const i = Math.min(pages.length - 1, Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
    if (i !== at) { setAt(i); void triggerHaptic("light"); }
    if (i === pages.length - 1) onLastPage();
  };
  const go = (d: number) => {
    const el = strip.current; if (!el) return;
    const i = Math.max(0, Math.min(pages.length - 1, at + d));
    const page = el.children[i] as HTMLElement | undefined;
    if (page) el.scrollTo({ left: page.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };
  return (
    <>
      <div ref={strip} className="quran-fs-pages" dir="rtl" onScroll={onScroll}>
        {pages.map((p, i) => (
          <div key={p.n} className={`quran-fs-page ${panel ? "has-panel" : ""}`} dir="ltr">
            <section className="quran-fs-sheet">
              {i === 0 && (
                <>
                  <header className="quran-fs-band"><span className="quran-fs-name" lang="ar" dir="rtl">{chapter ? `سُورَةُ ${chapter.name_arabic}` : "…"}</span></header>
                  {showBismillah && (arabic ? <div className="quran-fs-bismillah" dir="rtl" lang="ar">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>
                    : <div className="quran-fs-bismillah is-en">In the name of Allah, the Entirely Merciful, the Especially Merciful.</div>)}
                </>
              )}
              <MushafPage bare verses={p.verses} activeKey={p.verses.some((v) => v.key === activeKey) ? activeKey : null} word={word} arabic={arabic} translitOnly={translitOnly} onPlay={onPlay} />
              <p className="quran-fs-pageno">{arabic ? toArabicDigits(p.n) : p.n}</p>
            </section>
          </div>
        ))}
      </div>
      <div className={`quran-fs-pager ${panel ? "has-panel" : ""}`}>
        <button onClick={() => go(1)} disabled={at >= pages.length - 1} aria-label="Next page"><ChevronLeft size={16} /></button>
        <span>Page {pages[at]?.n ?? ""} · {at + 1}/{pages.length}</span>
        <button onClick={() => go(-1)} disabled={at <= 0} aria-label="Previous page"><ChevronRight size={16} /></button>
      </div>
      <span className="sr-only">Surah {chapterId}</span>
    </>
  );
}

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
