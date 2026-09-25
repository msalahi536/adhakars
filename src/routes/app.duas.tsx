import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bookmark, ChevronDown, ChevronUp, Cloud, Copy, HeartPulse, Home, Info, Compass, Search, Shield,
  Sparkles, Users, Wallet, X, CloudRain, Frown, RotateCcw, Flower2, HandHeart, Lock, Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { HeaderBackButton } from "@/components/HeaderBackButton";
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
const saw = (t: string) => t.split("ﷺ").flatMap((p, i) => (i ? [<span key={i} className="period-saw">ﷺ</span>, p] : [p]));

type Tab = "library" | "saved";
type Sort = "default" | "alpha" | "recent";

function DuaLibrary() {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("library");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [favs, setF] = useState<Fav[]>([]);
  const [sort, setSort] = useState<Sort>("default");
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => { setMounted(true); setF(getFavs()); setNow(new Date()); }, []);

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
  const catList = useMemo(() => {
    if (!cat) return [];
    const list = DUAS.filter((d) => d.cat === cat);
    if (sort === "alpha") return [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "recent") {
      const at = new Map(favs.map((f) => [f.id, f.at]));
      return [...list].sort((a, b) => (at.get(b.id) ?? 0) - (at.get(a.id) ?? 0));
    }
    return list;
  }, [cat, sort, favs]);
  const emotional = results.some((d) => EMOTIONAL_CATS.has(d.cat));

  const suggestions = useMemo(() => {
    if (!now) return null;
    if (now.getDay() === 5) return { title: "Jumu‘ah Sunnahs", gold: true, ids: ["jum-01", "jum-02", "jum-03", "jum-04"] };
    return null;
  }, [now]);

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
        <div className="period-tabs mx-auto max-w-md" role="tablist">
          <button role="tab" aria-selected={tab === "library"} className={tab === "library" ? "is-active" : ""} onClick={() => go("library")}>Library</button>
          <button role="tab" aria-selected={tab === "saved"} className={tab === "saved" ? "is-active" : ""} onClick={() => go("saved")}>Saved{mounted && favs.length ? ` (${favs.length})` : ""}</button>
        </div>
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
                  {suggestions && (
                    <section className={`dl-suggest ${suggestions.gold ? "is-gold" : ""}`}>
                      <div className="dl-section-title">{suggestions.title}</div>
                      {suggestions.ids.map(byId).filter(Boolean).map((d) => card(d!))}
                    </section>
                  )}
                  <div className="dl-grid">
                    {CATEGORIES.map((c, i) => {
                      const Icon = CAT_ICONS[i];
                      const n = DUAS.filter((d) => d.cat === c).length;
                      return (
                        <button key={c} className={`dl-cat ${EMOTIONAL_CATS.has(c) ? "is-warm" : ""}`} onClick={() => { setCat(c); void triggerHaptic("light"); document.querySelector(".period-scroll-area")?.scrollTo({ top: 0 }); }}>
                          <span className="dl-cat-icon"><Icon size={18} /></span>
                          <span className="dl-cat-name">{c}</span>
                          <span className="dl-cat-count">{n} {n === 1 ? "dua" : "duas"}</span>
                        </button>
                      );
                    })}
                  </div>
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
                <button className="dl-back" onClick={() => setCat(null)}>All categories</button>
                <h2>{cat}</h2>
                <p>{catList.length} authentic {catList.length === 1 ? "dua" : "duas"}</p>
                <div className="dl-sort" role="radiogroup" aria-label="Sort">
                  {(["default", "alpha", "recent"] as Sort[]).map((s) => (
                    <button key={s} role="radio" aria-checked={sort === s} className={sort === s ? "is-active" : ""} onClick={() => setSort(s)}>
                      {s === "default" ? "Default" : s === "alpha" ? "A–Z" : "Recently saved"}
                    </button>
                  ))}
                </div>
              </div>
              {catList.map((d) => card(d))}
            </>
          )}

          {tab === "saved" && (
            <>
              <p className="dl-private"><Lock size={13} /> Private — stored only on your device</p>
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
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${d.title}\n\n${d.ar}\n\n${d.tr}\n\n${d.en}\n\n${d.ref}`);
      toast("Copied to clipboard"); void triggerHaptic("light");
    } catch { toast("Could not copy"); }
  };
  return (
    <article className="period-card dl-card">
      <div className="dl-card-head">
        <div className="min-w-0">
          <h3>{d.title}</h3>
          <span className="dl-badge">{sourceLabel(d.src)}</span>
        </div>
        <button className={`dl-fav ${fav ? "is-on" : ""}`} onClick={onFav} aria-label={fav ? "Remove from saved" : "Save dua"} aria-pressed={fav}>
          <Bookmark size={19} fill={fav ? "currentColor" : "none"} />
        </button>
      </div>
      <p className="arabic dl-ar" lang="ar" dir="rtl">{d.ar}</p>
      <p className="dl-tr">{d.tr}</p>
      <p className="dl-en">{saw(d.en)}</p>
      <p className="dl-ref">{d.ref}</p>
      {d.id === "wea-02" && <div className="dl-note is-amber"><Info size={14} /><span>{THUNDER_NOTE}</span></div>}
      {d.note && <div className="dl-note"><Info size={14} /><span>{saw(d.note)}</span></div>}
      {(d.id === "hea-02" || d.id === "hea-04") && <Link to="/app/ruqyah" className="dl-link">Open the Ruqyah Companion for the full guide</Link>}
      <div className="dl-actions">
        <button onClick={copy}><Copy size={15} /> Copy</button>
        <button disabled aria-hidden className="dl-audio-slot"><Volume2 size={15} /></button>
        {extra}
      </div>
    </article>
  );
}


