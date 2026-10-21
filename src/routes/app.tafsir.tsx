import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, Bookmark, BookmarkCheck, ChevronDown, ChevronLeft, ChevronRight, Clock, Copy, Check, History, MapPin, MessageSquare,
  Pause, Play, Search, Volume2, X, Hash,
} from "lucide-react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { getChapters, getVerses, searchChapters, type Chapter } from "@/lib/quran";
import {
  TAFSIR_BOOKS, findTafsirBook, getTafsir, getTafsirProgress, saveTafsirProgress, preferredTafsirBook, type TafsirProgress, type TafsirBook,
  getChapterInfo, getJuzs, getVerseDetail, getAyahAudio, getTafsirBookmarks, toggleTafsirBookmark, getTafsirHistory, pushTafsirHistory,
  getTafsirNote, setTafsirNote,
} from "@/lib/tafsir";

type List = "all" | "bookmarks" | "history" | "lang";
type S = { book?: number; s?: number; v?: string; t?: string; list?: List; lang?: string };

export const Route = createFileRoute("/app/tafsir")({
  validateSearch: (s: Record<string, unknown>): S => ({
    book: typeof s.book === "number" ? s.book : undefined,
    s: typeof s.s === "number" ? s.s : undefined,
    v: typeof s.v === "string" && /^\d+:\d+$/.test(s.v) ? s.v : undefined,
    t: typeof s.t === "string" ? s.t : undefined,
    list: ["all", "bookmarks", "history", "lang"].includes(s.list as string) ? (s.list as List) : undefined,
    lang: typeof s.lang === "string" ? s.lang : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Tafsir Library, Sahih Al-Adhkar" },
      { name: "description", content: "Read 20 classical tafsir books, including Ibn Kathir, al-Tabari, al-Qurtubi and al-Sa'di, verse by verse." },
      { property: "og:title", content: "Tafsir Library, Sahih Al-Adhkar" },
      { property: "og:description", content: "Classical Quran commentary in English, Arabic, Urdu, Bengali, Russian and Kurdish." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TafsirLibrary,
});

const LANGS: { name: string; label: string }[] = [
  { name: "English", label: "EN" }, { name: "Arabic", label: "عربي" }, { name: "Urdu", label: "اردو" },
  { name: "Bengali", label: "বাংলা" }, { name: "Russian", label: "RU" }, { name: "Kurdish", label: "کوردی" },
];
const POPULAR = [169, 168, 817];

const useChapters = () => useQuery({ queryKey: ["quran-chapters"], queryFn: getChapters, staleTime: Infinity });

function TafsirLibrary() {
  const sp = Route.useSearch();
  const navigate = useNavigate({ from: "/app/tafsir" });
  const chapters = useChapters();
  const book = findTafsirBook(sp.book);
  const view = sp.v ? "verse" : sp.s ? "surah" : sp.book ? "book" : sp.list ? "list" : "home";
  const surahId = sp.v ? Number(sp.v.split(":")[0]) : sp.s;
  const surah = chapters.data?.find((c) => c.id === surahId);
  const n = sp.v ? Number(sp.v.split(":")[1]) : 0;

  const goBack = () => {
    if (view === "verse") return void navigate({ search: { book: sp.book, s: surahId, t: "verses" } });
    if (view === "surah") return void navigate({ search: { book: sp.book } });
    return void navigate({ search: {} });
  };
  const step = (d: number) => surah && void navigate({ search: { ...sp, v: `${surah.id}:${n + d}` }, replace: true });

  const listTitle = sp.list === "bookmarks" ? "Bookmarks" : sp.list === "history" ? "History" : sp.list === "lang" ? `${sp.lang} Tafsir` : "All Books";
  const eyebrow = view === "home" ? "Quran commentary" : view === "list" ? "Tafsir Library" : view === "verse" ? undefined : book?.name;

  return (
    <>
      <header className="page-header tafsir-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        {view !== "home" && <HeaderBackButton onBack={goBack} />}
        <div className={`relative mx-auto max-w-md px-14 text-center ${view === "verse" ? "pb-4 pt-9" : "pb-6 pt-9"}`}>
          {eyebrow && <div className="label-caps" style={{ color: "var(--header-sub)" }}>{eyebrow}</div>}
          {view === "verse" ? (
            <>
              <div className="label-caps" style={{ color: "var(--header-sub)" }}>{surah?.name_simple ?? "Surah"}</div>
              <div className="mt-1 text-[11px] opacity-80">{n} of {surah?.verses_count ?? "…"}</div>
              <div className="absolute right-4 top-14 flex gap-1.5">
                <button type="button" className="tafsir-step" disabled={n <= 1} onClick={() => step(-1)} aria-label="Previous verse"><ChevronLeft size={16} /></button>
                <button type="button" className="tafsir-step" disabled={!surah || n >= surah.verses_count} onClick={() => step(1)} aria-label="Next verse"><ChevronRight size={16} /></button>
              </div>
            </>
          ) : (
            <h1 className="app-page-title mt-2">{view === "home" ? "Tafsir Library" : view === "list" ? listTitle : view === "book" ? book?.name : surah?.name_simple ?? "Surah"}</h1>
          )}
          {view === "home" && <p className="mt-2 text-xs opacity-90">20 classical tafsir books in 6 languages</p>}
          {view === "book" && <p className="mt-2 text-xs opacity-90">{book?.author ? `${book.author} · ` : ""}{book?.lang}</p>}
          {view === "surah" && surah && (
            <>
              <p className="mt-1 text-xs opacity-90">{surah.translated_name.name} · {surah.verses_count} verses</p>
              <p className="mt-2 text-2xl" dir="rtl" style={{ fontFamily: "var(--font-arabic, serif)", color: "var(--accent)" }}>{surah.name_arabic}</p>
            </>
          )}
        </div>
      </header>
      <main className="scroll-area">
        <div className="tafsir-page mx-auto max-w-md space-y-4 px-5 py-3 pb-28">
          {view === "home" && <Home />}
          {view === "list" && <BookList list={sp.list!} lang={sp.lang} />}
          {view === "book" && book && <BookView book={book.id} tab={sp.t === "juz" ? "juz" : "surahs"} chapters={chapters.data} />}
          {view === "surah" && book && surah && <SurahView book={book.id} surah={surah} tab={sp.t === "verses" ? "verses" : "overview"} />}
          {view === "verse" && sp.v && <VerseView book={book?.id ?? preferredTafsirBook()} vkey={sp.v} tab={sp.t} />}
        </div>
      </main>
    </>
  );
}

/* ---------- shared bits ---------- */

function Pills<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="tafsir-pills" role="tablist">
      {options.map((o) => (
        <button key={o.id} type="button" role="tab" aria-selected={value === o.id} className={value === o.id ? "is-on" : ""} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="tafsir-card flex items-center gap-2 rounded-full px-4 py-3">
      <Search size={17} style={{ color: "var(--muted-foreground)" }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      {value && <button type="button" aria-label="Clear" onClick={() => onChange("")}><X size={16} /></button>}
    </div>
  );
}

function BookRow({ b }: { b: TafsirBook }) {
  return (
    <Link to="/app/tafsir" search={{ book: b.id }} className="tafsir-card flex items-center gap-3 rounded-[22px] p-4 active:scale-[0.98]">
      <span className="tafsir-book-icon"><BookOpen size={20} strokeWidth={1.6} /></span>
      <span className="min-w-0 flex-1">
        <span className="tafsir-title block text-[15px] font-semibold leading-snug">{b.name}</span>
        <span className="block text-[11px]" style={{ color: "var(--muted-foreground)" }}>{b.author ? `${b.author} · ` : ""}{b.lang}</span>
      </span>
      <ChevronRight size={16} className="opacity-40" />
    </Link>
  );
}

function SectionHead({ title, more }: { title: string; more?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between px-1">
      <h2 className="label-caps tafsir-title">{title}</h2>
      {more}
    </div>
  );
}

/* ---------- home ---------- */

function Home() {
  const [last, setLast] = useState<TafsirProgress | null>(null);
  const [q, setQ] = useState("");
  const chapters = useChapters();
  useEffect(() => setLast(getTafsirProgress()), []);
  const lastBook = findTafsirBook(last?.book);
  const lastSurah = last && chapters.data?.find((c) => c.id === Number(last.key.split(":")[0]));
  const term = q.trim().toLowerCase();
  const hits = term ? TAFSIR_BOOKS.filter((b) => `${b.name} ${b.author ?? ""} ${b.lang}`.toLowerCase().includes(term)) : [];

  return (
    <>
      <div className="-mt-1"><SearchBox value={q} onChange={setQ} placeholder="Search books, authors or languages…" /></div>
      {term ? (
        <div className="space-y-2">
          {hits.map((b) => <BookRow key={b.id} b={b} />)}
          {!hits.length && <p className="px-1 text-xs" style={{ color: "var(--muted-foreground)" }}>No books match “{q}”.</p>}
        </div>
      ) : (
        <>
          {last && lastBook && (
            <Link to="/app/tafsir" search={{ book: last.book, v: last.key }} className="tafsir-card flex items-center gap-4 rounded-[24px] p-5">
              <Clock size={26} strokeWidth={1.6} style={{ color: "var(--accent)" }} />
              <span className="min-w-0 flex-1">
                <span className="label-caps block text-[10px]" style={{ color: "var(--muted-foreground)" }}>Continue reading</span>
                <span className="tafsir-title mt-0.5 block text-lg font-semibold">{lastSurah?.name_simple ?? "Surah"} {last.key}</span>
                <span className="block text-[11px]" style={{ color: "var(--muted-foreground)" }}>{lastBook.name} · {lastBook.lang}</span>
              </span>
              <ChevronRight size={16} className="opacity-40" />
            </Link>
          )}
          <section>
            <SectionHead title="Popular tafsir books" more={<Link to="/app/tafsir" search={{ list: "all" }} className="tafsir-title flex items-center text-xs font-semibold">See All <ChevronRight size={14} /></Link>} />
            <div className="space-y-2.5">{POPULAR.map((id) => <BookRow key={id} b={findTafsirBook(id)!} />)}</div>
          </section>
          <section>
            <SectionHead title="Browse by language" />
            <div className="tafsir-chips">
              {LANGS.map((l) => (
                <Link key={l.name} to="/app/tafsir" search={{ list: "lang", lang: l.name }} className="tafsir-card tafsir-chip">
                  <span className="text-[13px]" dir="auto">{l.label}</span><span>{l.name}</span>
                </Link>
              ))}
            </div>
          </section>
          <div className="grid grid-cols-3 gap-2.5">
            {([
              { list: "all", Icon: BookOpen, title: "All Books", sub: "20 books" },
              { list: "bookmarks", Icon: Bookmark, title: "Bookmarks", sub: "Your saved" },
              { list: "history", Icon: History, title: "History", sub: "Continue" },
            ] as const).map(({ list, Icon, title, sub }) => (
              <Link key={list} to="/app/tafsir" search={{ list }} className="tafsir-card flex flex-col items-center rounded-[20px] px-2 py-4 text-center active:scale-[0.97]">
                <Icon size={20} strokeWidth={1.6} style={{ color: "var(--accent)" }} />
                <span className="mt-2 text-[12px] font-semibold">{title}</span>
                <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{sub}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function BookList({ list, lang }: { list: List; lang?: string }) {
  const chapters = useChapters();
  const [items, setItems] = useState<(TafsirProgress & { t?: number })[]>([]);
  useEffect(() => setItems(list === "bookmarks" ? getTafsirBookmarks() : list === "history" ? getTafsirHistory() : []), [list]);
  if (list === "all" || list === "lang") {
    const books = TAFSIR_BOOKS.filter((b) => list === "all" || b.lang === lang);
    const langs = [...new Set(books.map((b) => b.lang))];
    return <>{langs.map((l) => (
      <section key={l}><SectionHead title={l} /><div className="space-y-2.5">{books.filter((b) => b.lang === l).map((b) => <BookRow key={b.id} b={b} />)}</div></section>
    ))}</>;
  }
  if (!items.length) return <p className="tafsir-card rounded-[20px] p-5 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
    {list === "bookmarks" ? "Tap the bookmark on any verse's tafsir to keep it here." : "Verses you read will appear here."}
  </p>;
  return (
    <div className="space-y-2.5">
      {items.map((p) => {
        const b = findTafsirBook(p.book);
        const c = chapters.data?.find((x) => x.id === Number(p.key.split(":")[0]));
        return (
          <Link key={`${p.book}-${p.key}`} to="/app/tafsir" search={{ book: p.book, v: p.key }} className="tafsir-card flex items-center gap-3 rounded-[20px] p-4">
            <span className="tafsir-num">{p.key}</span>
            <span className="min-w-0 flex-1">
              <span className="tafsir-title block text-sm font-semibold">{c?.name_simple ?? "Surah"} {p.key}</span>
              <span className="block text-[11px]" style={{ color: "var(--muted-foreground)" }}>{b?.name} · {b?.lang}</span>
            </span>
            <ChevronRight size={16} className="opacity-40" />
          </Link>
        );
      })}
    </div>
  );
}

/* ---------- book ---------- */

function SurahRow({ book, c }: { book: number; c: Chapter }) {
  return (
    <Link to="/app/tafsir" search={{ book, s: c.id }} className="tafsir-card flex items-center gap-3 rounded-[20px] px-4 py-3 active:scale-[0.98]">
      <span className="tafsir-num">{c.id}</span>
      <span className="min-w-0 flex-1">
        <span className="tafsir-title block text-[15px] font-semibold">{c.name_simple}</span>
        <span className="block text-[11px]" style={{ color: "var(--muted-foreground)" }}>{c.translated_name.name} · {c.verses_count} verses</span>
      </span>
      <span className="tafsir-title text-lg" dir="rtl" style={{ fontFamily: "var(--font-arabic, serif)" }}>{c.name_arabic}</span>
      <ChevronRight size={15} className="opacity-40" />
    </Link>
  );
}

function BookView({ book, tab, chapters }: { book: number; tab: "surahs" | "juz"; chapters?: Chapter[] }) {
  const navigate = useNavigate({ from: "/app/tafsir" });
  const [q, setQ] = useState("");
  const juzs = useQuery({ queryKey: ["juzs"], queryFn: getJuzs, staleTime: Infinity, enabled: tab === "juz" });
  const ref = q.trim().match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/);
  const list = useMemo(() => (chapters ? (q.trim() ? searchChapters(chapters, q) : chapters) : []), [chapters, q]);
  return (
    <>
      <Pills value={tab} options={[{ id: "surahs", label: "Surahs" }, { id: "juz", label: "Juz" }]} onChange={(t) => void navigate({ search: { book, t }, replace: true })} />
      {tab === "surahs" ? (
        <>
          <form onSubmit={(e) => { e.preventDefault(); if (ref) void navigate({ search: { book, v: `${+ref[1]}:${+ref[2]}` } }); }}>
            <SearchBox value={q} onChange={setQ} placeholder="Search surah name or verse, e.g. 2:255" />
          </form>
          {ref && (
            <Link to="/app/tafsir" search={{ book, v: `${+ref[1]}:${+ref[2]}` }} className="tafsir-card flex items-center gap-3 rounded-[20px] p-4">
              <span className="tafsir-title flex-1 text-sm font-semibold">Open verse {+ref[1]}:{+ref[2]}</span><ChevronRight size={16} className="opacity-40" />
            </Link>
          )}
          {!chapters && <p className="px-1 text-xs" style={{ color: "var(--muted-foreground)" }}>Loading surahs…</p>}
          <div className="space-y-2.5">{list.map((c) => <SurahRow key={c.id} book={book} c={c} />)}</div>
        </>
      ) : (
        <div className="space-y-2.5">
          {!juzs.data && <p className="px-1 text-xs" style={{ color: "var(--muted-foreground)" }}>Loading juz…</p>}
          {juzs.data?.map((z) => {
            const [first] = Object.entries(z.mapping);
            const start = first ? `${first[0]}:${first[1].split("-")[0]}` : "1:1";
            const names = Object.keys(z.mapping).map((id) => chapters?.find((c) => c.id === +id)?.name_simple).filter(Boolean);
            return (
              <Link key={z.n} to="/app/tafsir" search={{ book, v: start }} className="tafsir-card flex items-center gap-3 rounded-[20px] px-4 py-3">
                <span className="tafsir-num">{z.n}</span>
                <span className="min-w-0 flex-1">
                  <span className="tafsir-title block text-[15px] font-semibold">Juz {z.n}</span>
                  <span className="block truncate text-[11px]" style={{ color: "var(--muted-foreground)" }}>Starts at {start} · {names.join(", ")}</span>
                </span>
                <ChevronRight size={15} className="opacity-40" />
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

/* ---------- surah ---------- */

function SurahView({ book, surah, tab }: { book: number; surah: Chapter; tab: "overview" | "verses" }) {
  const navigate = useNavigate({ from: "/app/tafsir" });
  const info = useQuery({ queryKey: ["chapter-info", surah.id], queryFn: () => getChapterInfo(surah.id), staleTime: Infinity });
  const verses = useQuery({ queryKey: ["verses", surah.id], queryFn: () => getVerses(surah.id), staleTime: Infinity });
  const shown = tab === "overview" ? verses.data?.slice(0, 4) : verses.data;
  const setTab = (t: string) => void navigate({ search: { book, s: surah.id, t }, replace: true });
  return (
    <>
      <Pills value={tab} options={[{ id: "overview", label: "Overview" }, { id: "verses", label: "Verses" }]} onChange={setTab} />
      {tab === "overview" && (
        <>
          <section className="tafsir-card rounded-[22px] p-4">
            <h3 className="tafsir-title text-sm font-semibold">About this Surah</h3>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{info.data?.short ?? (info.isError ? "Couldn't load the introduction." : "Loading…")}</p>
            {info.data?.source && <p className="mt-2 text-[10px] opacity-60">{info.data.source}</p>}
          </section>
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { Icon: MapPin, top: "Revealed in", bottom: surah.revelation_place === "makkah" ? "Makkah" : "Madinah" },
              { Icon: BookOpen, top: String(surah.verses_count), bottom: "Verses" },
              { Icon: Hash, top: `Surah ${surah.id}`, bottom: "of 114" },
            ].map(({ Icon, top, bottom }) => (
              <div key={bottom} className="tafsir-card flex flex-col items-center rounded-[18px] px-2 py-3.5 text-center">
                <Icon size={19} strokeWidth={1.6} style={{ color: "var(--accent)" }} />
                <span className="mt-1.5 text-[11px] font-semibold">{top}</span>
                <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{bottom}</span>
              </div>
            ))}
          </div>
          <SectionHead title="Verses" more={<button type="button" onClick={() => setTab("verses")} className="flex items-center text-xs" style={{ color: "var(--muted-foreground)" }}>View All <ChevronRight size={14} /></button>} />
        </>
      )}
      {verses.isLoading && <p className="px-1 text-xs" style={{ color: "var(--muted-foreground)" }}>Loading verses…</p>}
      <div className="space-y-2.5">
        {shown?.map((v) => (
          <Link key={v.key} to="/app/tafsir" search={{ book, v: v.key }} className="tafsir-card flex items-center gap-3 rounded-[20px] p-3.5 active:scale-[0.98]">
            <span className="tafsir-num">{v.number}</span>
            <span className="min-w-0 flex-1">
              <span className="tafsir-title block text-right text-lg leading-loose" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic, serif)" }}>
                {v.words.filter((w) => !w.isEnd).map((w) => w.text).join(" ")}
              </span>
              <span className="line-clamp-2 block text-[11px]" style={{ color: "var(--muted-foreground)" }}>{v.translation}</span>
            </span>
            <span className="tafsir-mini-icon"><MessageSquare size={14} /></span>
            <ChevronRight size={15} className="opacity-40" />
          </Link>
        ))}
      </div>
    </>
  );
}

/* ---------- verse ---------- */

function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" aria-label="Copy" onClick={() => { void navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1400); }} className="opacity-70">
      {ok ? <Check size={16} /> : <Copy size={16} />}
    </button>
  );
}

function VerseView({ book, vkey, tab: rawTab }: { book: number; vkey: string; tab?: string }) {
  const navigate = useNavigate({ from: "/app/tafsir" });
  const chapters = useChapters();
  const info = findTafsirBook(book)!;
  const [s, n] = vkey.split(":").map(Number);
  const surah = chapters.data?.find((c) => c.id === s);
  const tab = rawTab === "translation" || rawTab === "notes" ? rawTab : "tafsir";
  const [pick, setPick] = useState(false);
  const [saved, setSaved] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState("");
  const audio = useRef<HTMLAudioElement | null>(null);
  const detail = useQuery({ queryKey: ["verse-detail", vkey], queryFn: () => getVerseDetail(vkey), staleTime: Infinity });
  const tafsir = useQuery({ queryKey: ["tafsir", book, vkey], queryFn: () => getTafsir(book, vkey), staleTime: Infinity });

  useEffect(() => {
    saveTafsirProgress({ book, key: vkey });
    pushTafsirHistory({ book, key: vkey });
    setSaved(getTafsirBookmarks().some((b) => b.key === vkey && b.book === book));
    setNote(getTafsirNote(vkey));
    document.querySelector(".scroll-area")?.scrollTo({ top: 0, behavior: "smooth" });
  }, [book, vkey]);
  useEffect(() => () => { audio.current?.pause(); audio.current = null; setPlaying(false); }, [vkey]);
  // Warm the next verse so stepping forward feels instant.
  useEffect(() => {
    if (!surah || n >= surah.verses_count) return;
    void getTafsir(book, `${s}:${n + 1}`).catch(() => {});
    void getVerseDetail(`${s}:${n + 1}`).catch(() => {});
  }, [book, s, n, surah]);

  const go = (search: Partial<S>) => void navigate({ search: { book, v: vkey, t: rawTab, ...search }, replace: true });
  const toggleAudio = async () => {
    if (playing) { audio.current?.pause(); setPlaying(false); return; }
    if (!audio.current) {
      const url = await getAyahAudio(vkey).catch(() => null);
      if (!url) return;
      audio.current = new Audio(url);
      audio.current.onended = () => setPlaying(false);
    }
    void audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  };
  const d = detail.data;

  return (
    <div className="space-y-3">
      <article className="tafsir-card tafsir-hero rounded-[26px] px-5 pb-5 pt-6 text-center">
        {d ? (
          <>
            <p className="tafsir-title text-[28px] leading-[2.1]" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic, serif)" }}>{d.arabic}</p>
            {d.translit && (
              <p className="mt-2 flex items-center justify-center gap-2 text-[12px]" style={{ color: "var(--muted-foreground)" }}>
                <span>{d.translit}</span>
                <button type="button" aria-label="Listen" onClick={() => void toggleAudio()}><Volume2 size={14} /></button>
              </p>
            )}
            <p className="mt-3 text-[15px] leading-relaxed">{d.translation}</p>
          </>
        ) : <p className="py-8 text-xs" style={{ color: "var(--muted-foreground)" }}>{detail.isError ? "Couldn't load this verse." : "Loading verse…"}</p>}
      </article>

      <div className="grid grid-cols-3 gap-2.5">
        <button type="button" onClick={() => void toggleAudio()} className="tafsir-card tafsir-action">
          <span className="tafsir-action-icon is-solid">{playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: 2 }} />}</span>
          {playing ? "Pause" : "Play Audio"}
        </button>
        <button type="button" onClick={() => setSaved(toggleTafsirBookmark({ book, key: vkey }))} className="tafsir-card tafsir-action" aria-pressed={saved}>
          <span className="tafsir-action-icon">{saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}</span>
          {saved ? "Saved" : "Bookmark"}
        </button>
        <CopyAction text={d ? `${d.arabic}\n\n${d.translation}\n\n(Quran ${vkey})` : ""} />
      </div>

      <Pills value={tab} options={[{ id: "tafsir", label: "Tafsir" }, { id: "translation", label: "Translation" }, { id: "notes", label: "Notes" }]} onChange={(t) => go({ t })} />

      {tab === "tafsir" && (
        <article className="tafsir-card rounded-[22px]">
          <div className="relative">
            <button type="button" onClick={() => setPick((p) => !p)} className="flex w-full items-center gap-2 px-4 pb-2 pt-4 text-left">
              <span className="tafsir-title flex-1 text-sm font-semibold">{info.name} <span className="text-[11px] font-normal" style={{ color: "var(--muted-foreground)" }}>· {info.lang}</span></span>
              <ChevronDown size={16} className={`opacity-50 transition-transform ${pick ? "rotate-180" : ""}`} />
            </button>
            {pick && (
              <div className="hadith-sort-pop tafsir-card absolute left-2 right-2 top-full z-30 max-h-80 overflow-y-auto rounded-2xl p-1" style={{ background: "var(--card)" }}>
                {TAFSIR_BOOKS.map((b) => (
                  <button key={b.id} type="button" onClick={() => { setPick(false); go({ book: b.id }); }}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm"
                    style={b.id === book ? { background: "color-mix(in oklab, var(--accent) 14%, transparent)" } : undefined}>
                    {b.name} <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>· {b.lang}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="tafsir-body px-4 pb-4" dir={info.rtl ? "rtl" : "ltr"}>
            {tafsir.isLoading && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Loading tafsir…</p>}
            {tafsir.isError && <p className="text-sm">Couldn't load this tafsir. Check your connection and try again.</p>}
            {tafsir.data === "" && <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>This book explains this verse together with a nearby verse. Try the previous verse.</p>}
            {tafsir.data && <div className={info.rtl ? "is-rtl" : ""} dangerouslySetInnerHTML={{ __html: tafsir.data }} />}
          </div>
        </article>
      )}

      {tab === "translation" && d && (
        <article className="tafsir-card space-y-4 rounded-[22px] p-4">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Arabic</h3>
            <div className="flex items-start gap-3">
              <span className="tafsir-num shrink-0">{n}</span>
              <p className="tafsir-title flex-1 text-right text-2xl leading-loose" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic, serif)" }}>{d.arabic}</p>
            </div>
          </div>
          {d.translit && (
            <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
              <h3 className="mb-1 text-sm font-semibold">Transliteration</h3>
              <div className="flex items-start gap-3 text-[13px]"><p className="flex-1">{d.translit}</p><CopyBtn text={d.translit} /></div>
            </div>
          )}
          <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
            <h3 className="mb-1 text-sm font-semibold">Translation (English)</h3>
            <div className="flex items-start gap-3 text-[13px]"><p className="flex-1">{d.translation}</p><CopyBtn text={d.translation} /></div>
          </div>
          <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
            <h3 className="mb-2 text-sm font-semibold">Word-by-Word Meaning</h3>
            <div className="space-y-1.5">
              {d.words.map((w, i) => (
                <div key={i} className="tafsir-word">
                  <span className="tafsir-title text-xl" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic, serif)" }}>{w.ar}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px]">{w.en}</span>
                    {w.tr && <span className="block text-[10px]" style={{ color: "var(--muted-foreground)" }}>{w.tr}</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </article>
      )}

      {tab === "notes" && (
        <article className="tafsir-card rounded-[22px] p-4">
          <h3 className="text-sm font-semibold">Your notes on {vkey}</h3>
          <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Saved only on this device.</p>
          <textarea value={note} onChange={(e) => { setNote(e.target.value); setTafsirNote(vkey, e.target.value); }} rows={7}
            placeholder="Write a reflection, a lesson, or something to remember…"
            className="mt-3 w-full resize-none rounded-2xl p-3 text-sm outline-none" style={{ background: "color-mix(in oklab, var(--accent) 6%, var(--card))", border: "1px solid var(--border)" }} />
        </article>
      )}
    </div>
  );
}

function CopyAction({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" disabled={!text} onClick={() => { void navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1400); }} className="tafsir-card tafsir-action">
      <span className="tafsir-action-icon">{ok ? <Check size={18} /> : <Copy size={18} />}</span>
      {ok ? "Copied" : "Copy"}
    </button>
  );
}
