import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bookmark, ChevronDown, ChevronLeft, ChevronUp, ChevronRight, BookOpen, Cloud, HeartPulse, Home, Info, Compass, Search, Shield,
  Sparkles, Sun, Users, Wallet, X, CloudRain, Frown, RotateCcw, Flower2, HandHeart, Volume2,
} from "lucide-react";
import { ListenButton } from "@/components/ListenButton";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { ArabicText, OrnamentalDivider, Pagination, Transliteration } from "@/components/AdhkarPrimitives";
import { triggerHaptic } from "@/lib/theme";
import { CATEGORIES, DUAS, EMOTIONAL_CATS, getFavs, searchDuas, setFavs, sourceLabel, type Dua, type Fav } from "@/lib/dua-library";

export const Route = createFileRoute("/app/duas")({
  head: () => ({
    meta: [
      { title: "Dua Library, Sahih Al-Adhkar" },
      { name: "description", content: "50 authentic duas for every feeling and moment, searchable the way you actually feel." },
      { property: "og:title", content: "Dua Library, Sahih Al-Adhkar" },
      { property: "og:description", content: "Find the right authentic dua for what you are going through." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DuaLibrary,
});

const CAT_ICONS = [Flower2, HandHeart, Wallet, Shield, RotateCcw, HeartPulse, Frown, Compass, Home, Sparkles, Users, CloudRain, Cloud];
const THUNDER_NOTE = "Practice of Abdullah bin az-Zubayr, not a prophetic narration. Graded authentic by al-Albani as his statement.";
const byId = (id: string) => DUAS.find((d) => d.id === id);
const JUMUAH_IDS = ["jum-01", "jum-02", "jum-03", "jum-04"];
const JUMUAH_DUAS = JUMUAH_IDS.map(byId).filter(Boolean) as Dua[];
const saw = (t: string) => t.split("ﷺ").flatMap((p, i) => (i ? [<span key={i} className="period-saw">ﷺ</span>, p] : [p]));

type Tab = "library" | "saved";


function DuaLibrary() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("library");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [favs, setF] = useState<Fav[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setMounted(true); setF(getFavs()); setNow(new Date()); }, []);
  // Deep link from the Friday (Jumu'ah) notification.
  useEffect(() => {
    if (window.localStorage.getItem("adhkar:open-jumuah") === "1") {
      window.localStorage.removeItem("adhkar:open-jumuah");
      setCat("jum");
    }
    const open = () => {
      setCat("jum");
      document.querySelector(".period-scroll-area")?.scrollTo({ top: 0 });
    };
    window.addEventListener("adhkar:open-jumuah", open);
    return () => window.removeEventListener("adhkar:open-jumuah", open);
  }, []);

  const favIds = new Set(favs.map((f) => f.id));
  const toggleFav = (id: string) => {
    const next = favIds.has(id) ? favs.filter((f) => f.id !== id) : [...favs, { id, at: Date.now() }];
    setF(next); setFavs(next); void triggerHaptic("light");
  };
  const move = (i: number, dir: -1 | 1) => {
    const next = [...favs]; const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setF(next); setFavs(next); void triggerHaptic("light");
  };

  const results = useMemo(() => searchDuas(q), [q]);
  const isFriday = mounted && now?.getDay() === 5;
  const catList = useMemo(() => {
    if (cat === "jum") return JUMUAH_DUAS;
    if (!cat) return [];
    return DUAS.filter((d) => d.cat === cat);
  }, [cat]);
  const emotional = results.some((d) => EMOTIONAL_CATS.has(d.cat));

  const go = (t: Tab) => { setTab(t); setCat(null); void triggerHaptic("light"); document.querySelector(".period-scroll-area")?.scrollTo({ top: 0 }); };
  const card = (d: Dua, extra?: React.ReactNode) => <DuaCard key={d.id} d={d} fav={favIds.has(d.id)} onFav={() => toggleFav(d.id)} extra={extra} />;

  return (
    <>
      <header className="page-header period-header rq-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        <HeaderBackButton />
        <div className="relative mx-auto max-w-md px-16 pb-4 pt-7 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>Dua Library</div>
          <h1 className="app-page-title mt-2">Call upon Me</h1>
        </div>
        {!(tab === "library" && cat) && (
          <div className="period-tabs mx-auto max-w-md" role="tablist">
            <button role="tab" aria-selected={tab === "library"} className={tab === "library" ? "is-active" : ""} onClick={() => go("library")}>Library</button>
            <button role="tab" aria-selected={tab === "saved"} className={tab === "saved" ? "is-active" : ""} onClick={() => go("saved")}>Saved{mounted && favs.length ? ` (${favs.length})` : ""}</button>
          </div>
        )}
      </header>
      <main className="scroll-area period-scroll-area">
        <div className="mx-auto max-w-md space-y-4 px-5 pb-8 pt-4">
          {tab === "library" && !cat && (
            <>
              <label className="dl-search">
                <Search size={18} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="What are you feeling?" aria-label="Search for a dua" />
                {q && <button onClick={() => setQ("")} aria-label="Clear search"><X size={16} /></button>}
              </label>

              {q.trim() ? (
                <>
                  {results.length > 0 && emotional && (
                    <p className="dl-comfort">Allah does not burden a soul beyond that it can bear. (2:286)</p>
                  )}
                  {results.length === 0 && <p className="dl-empty">No matching dua found. Try a different word.</p>}
                  {results.map((d) => card(d))}
                </>
              ) : (
                <>
                  {isFriday && (
                    <button
                      className="dl-jumuah is-glow"
                      onClick={() => { setCat("jum"); void triggerHaptic("light"); document.querySelector(".period-scroll-area")?.scrollTo({ top: 0 }); }}
                    >
                      <span className="dl-cat-icon"><Sun size={18} /></span>
                      <span className="dl-jumuah-body">
                        <span className="dl-jumuah-name">Jumu‘ah Sunnahs</span>
                        <span className="dl-jumuah-sub">The Prophet’s ﷺ Friday practice</span>
                      </span>
                      <span className="dl-jumuah-count">4 sunnahs</span>
                      <ChevronRight size={18} className="dl-jumuah-chevron" />
                    </button>
                  )}
                  <div className="dl-grid">
                    {CATEGORIES.map((c, i) => {
                      const Icon = CAT_ICONS[i];
                      const n = DUAS.filter((d) => d.cat === c).length;
                      return (
                        <button key={c} className="dl-cat" onClick={() => { setCat(c); void triggerHaptic("light"); document.querySelector(".period-scroll-area")?.scrollTo({ top: 0 }); }}>
                          <span className="dl-cat-icon"><Icon size={18} /></span>
                          <span className="dl-cat-name">{c}</span>
                          <span className="dl-cat-count">{n} {n === 1 ? "dua" : "duas"}</span>
                        </button>
                      );
                    })}
                  </div>
                  {!isFriday && (
                    <button
                      className="dl-jumuah"
                      onClick={() => { setCat("jum"); void triggerHaptic("light"); document.querySelector(".period-scroll-area")?.scrollTo({ top: 0 }); }}
                    >
                      <span className="dl-cat-icon"><Sun size={18} /></span>
                      <span className="dl-jumuah-body">
                        <span className="dl-jumuah-name">Jumu‘ah Sunnahs</span>
                        <span className="dl-jumuah-sub">The Prophet’s ﷺ Friday practice</span>
                      </span>
                      <span className="dl-jumuah-count">4 sunnahs</span>
                      <ChevronRight size={18} className="dl-jumuah-chevron" />
                    </button>
                  )}
                  {mounted && favs.length > 0 && (
                    <section>
                      <div className="dl-section-title">Favorites</div>
                      <div className="dl-fav-row">
                        {favs.map((f) => byId(f.id)).filter(Boolean).map((d) => (
                          <button key={d!.id} className="dl-fav-chip" onClick={() => { setCat(d!.cat); }}>
                            <Bookmark size={14} fill="currentColor" />
                            <span>{d!.title}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  )}
                </>
              )}
            </>
          )}

          {tab === "library" && cat && (
            <>
              <div className="dl-cat-head">
                <h2>{cat === "jum" ? "Jumu‘ah Sunnahs" : cat}</h2>
                <button className="dl-back" onClick={() => setCat(null)}>
                  <ChevronLeft size={15} strokeWidth={2.5} />
                  All categories
                </button>
              </div>
              <DuaSwipeStack key={`${cat}`}>
                {catList.map((d) => card(d))}
              </DuaSwipeStack>
            </>
          )}

          {tab === "saved" && (
            <>
              {mounted && favs.length === 0 && (
                <div className="period-card dl-empty-card">Save your most-used duas here for quick access. Tap the bookmark icon on any dua to save it.</div>
              )}
              {favs.map((f, i) => {
                const d = byId(f.id); if (!d) return null;
                return card(d, (
                  <div className="dl-reorder">
                    <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><ChevronUp size={16} /></button>
                    <button onClick={() => move(i, 1)} disabled={i === favs.length - 1} aria-label="Move down"><ChevronDown size={16} /></button>
                  </div>
                ));
              })}
            </>
          )}
        </div>
      </main>
    </>
  );
}

function DuaCard({ d, fav, onFav, extra }: { d: Dua; fav: boolean; onFav: () => void; extra?: React.ReactNode }) {
  return (
    <article className="dhikr-card adhkar-reference-card relative flex w-full flex-col overflow-hidden">
      <div className="adhkar-card-heading grid items-center gap-4" style={{ gridTemplateColumns: "34px minmax(0,1fr) auto" }}>
        <ListenButton dhikrId={`dua-${d.id}`} size={34} title={d.title} />
        <h3 className="min-w-0 uppercase">{d.title}</h3>
        <button className={`dl-fav ${fav ? "is-on" : ""}`} onClick={onFav} aria-label={fav ? "Remove from saved" : "Save dua"} aria-pressed={fav}>
          <Bookmark size={19} fill={fav ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <div className="hide-scrollbar relative h-full overflow-y-auto" style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}>
          <ArabicText size={24}>{d.ar}</ArabicText>
          <OrnamentalDivider />
          <Transliteration>{d.tr}</Transliteration>
          <p className="adhkar-translation">{saw(d.en)}</p>
          <p className="dl-ref">{d.ref}</p>
          {d.id === "wea-02" && <div className="dl-note is-amber"><Info size={14} /><span>{THUNDER_NOTE}</span></div>}
          {d.note && <div className="dl-note"><Info size={14} /><span>{saw(d.note)}</span></div>}
          {(d.id === "hea-02" || d.id === "hea-04") && <Link to="/app/ruqyah" className="dl-link">Open the Ruqyah Companion for the full guide</Link>}
          {extra && <div className="dl-extra">{extra}</div>}
        </div>
      </div>
      <div className="adhkar-card-footer flex items-end justify-between gap-3">
        <div className="adhkar-source-column flex min-w-0 flex-col">
          <span className="adhkar-source-badge">
            <BookOpen size={13} strokeWidth={1.5} />
            <span>{sourceLabel(d.src)}</span>
          </span>
        </div>
      </div>
    </article>
  );
}

type SwipePhase = "idle" | "out-left" | "out-right" | "in-left" | "in-right";
const OUT_MS = 280;
const IN_MS = 320;

/** One dua at a time, swiped left-to-right like the morning/evening stacks. */
function DuaSwipeStack({ children }: { children: React.ReactNode[] }) {
  const n = children.length;
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<SwipePhase>("idle");
  const [enter, setEnter] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const animating = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const axisLocked = useRef<null | "x" | "y">(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dragOffsetRef = useRef(0);
  useEffect(() => { dragOffsetRef.current = dragOffset; }, [dragOffset]);

  const scrollTop = () => {
    document.querySelector(".period-scroll-area")?.scrollTo({ top: 0 });
  };

  const animateTo = (dir: "next" | "prev", destination?: number) => {
    if (animating.current) return;
    if (dir === "next" && idx >= n - 1) return;
    if (dir === "prev" && idx <= 0) return;
    animating.current = true;
    void triggerHaptic("light");
    setPhase(dir === "next" ? "out-left" : "out-right");
    setDragOffset(0);
    setTimeout(() => {
      setIdx((i) => destination ?? i + (dir === "next" ? 1 : -1));
      setPhase(dir === "next" ? "in-right" : "in-left");
      setEnter(false);
      scrollTop();
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setEnter(true));
      });
      setTimeout(() => {
        setPhase("idle");
        setEnter(false);
        animating.current = false;
      }, IN_MS + 20);
    }, OUT_MS);
  };
  const goNext = () => animateTo("next");
  const goPrev = () => animateTo("prev");
  const goTo = (i: number) => {
    if (animating.current || i === idx) return;
    animateTo(i > idx ? "next" : "prev", i);
  };
  const scrubTo = (i: number) => {
    if (animating.current || i === idx) return;
    void triggerHaptic("light");
    setDragOffset(0);
    setPhase("idle");
    setEnter(false);
    setIdx(i);
    scrollTop();
  };

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => {
      if (animating.current) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest("[data-no-swipe]")) return;
      startX.current = e.touches[0].clientX;
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
      axisLocked.current = null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return;
      const dx = e.touches[0].clientX - startX.current;
      const dy = e.touches[0].clientY - startY.current;
      if (axisLocked.current == null && Math.abs(dx) + Math.abs(dy) > 6) {
        axisLocked.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (axisLocked.current === "x") {
        e.preventDefault();
        setDragOffset(dx);
      }
    };
    const onTouchEnd = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      const dx = dragOffsetRef.current;
      axisLocked.current = null;
      if (dx < -50) {
        goNext();
      } else if (dx > 50) {
        goPrev();
      } else {
        setDragOffset(0);
      }
    };
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, n]);

  let transform = `translateX(${dragOffset}px)`;
  let opacity = 1;
  let transition = "none";
  if (phase === "out-left") {
    transform = "translateX(-110%)";
    opacity = 0;
    transition = `transform ${OUT_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${OUT_MS}ms ease`;
  } else if (phase === "out-right") {
    transform = "translateX(110%)";
    opacity = 0;
    transition = `transform ${OUT_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${OUT_MS}ms ease`;
  } else if (phase === "in-right" || phase === "in-left") {
    if (!enter) {
      transform = `translateX(${phase === "in-right" ? "110%" : "-110%"})`;
      opacity = 0;
      transition = "none";
    } else {
      transform = "translateX(0)";
      opacity = 1;
      transition = `transform ${IN_MS}ms cubic-bezier(0.4,0,0.2,1), opacity ${IN_MS}ms ease`;
    }
  } else {
    transition = isDragging.current ? "none" : "transform 0.25s ease";
  }

  if (n === 0) return null;
  return (
    <div className="dl-swipe-stack daily-swipe-stack">
      <div className="adhkar-index-row mb-1 flex min-h-9 items-center justify-center gap-2 px-4">
        <span
          className="rounded-full px-4 py-1.5 text-sm font-medium tabular-nums"
          style={{ background: "color-mix(in oklab, var(--surface-card) 82%, transparent)", border: "1px solid var(--border)", boxShadow: "0 5px 18px color-mix(in oklab, var(--foreground) 7%, transparent)" }}
        >
          {idx + 1} / {n}
        </span>
      </div>
      <div
        ref={wrapperRef}
        className="relative flex overflow-hidden"
        style={{ touchAction: "pan-y", height: "calc(100dvh - 400px)", minHeight: 400 }}
      >
        <div style={{ transform, opacity, transition, willChange: "transform, opacity" }}>{children[idx]}</div>
      </div>
      <Pagination
        total={n}
        active={idx}
        onSelect={goTo}
        onPrevious={goPrev}
        onNext={goNext}
        onScrub={scrubTo}
      />
    </div>
  );
}


