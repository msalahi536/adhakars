import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronDown, ChevronLeft, ChevronRight, Search, X, Clock } from "lucide-react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { getChapters, getVerseByKey, searchChapters, type Chapter } from "@/lib/quran";
import {
  TAFSIR_BOOKS, findTafsirBook, getTafsir, getTafsirProgress, saveTafsirProgress, preferredTafsirBook, type TafsirProgress,
} from "@/lib/tafsir";

type S = { book?: number; s?: number; v?: string };

export const Route = createFileRoute("/app/tafsir")({
  validateSearch: (s: Record<string, unknown>): S => ({
    book: typeof s.book === "number" ? s.book : undefined,
    s: typeof s.s === "number" ? s.s : undefined,
    v: typeof s.v === "string" && /^\d+:\d+$/.test(s.v) ? s.v : undefined,
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

const card: React.CSSProperties = {
  background: "var(--surface, var(--card))",
  border: "1px solid var(--border)",
  boxShadow: "var(--card-shadow, 0 4px 16px rgba(0,0,0,0.06))",
  color: "var(--foreground)",
};
const TONES = ["sage", "gold", "blue", "rose", "mint", "slate"];
const LANGS = ["English", "Arabic", "Urdu", "Bengali", "Russian", "Kurdish"];
const toneFor = (lang: string) => TONES[LANGS.indexOf(lang) % TONES.length];

function useChapters() {
  return useQuery({ queryKey: ["quran-chapters"], queryFn: getChapters, staleTime: Infinity });
}

function TafsirLibrary() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/app/tafsir" });
  const chapters = useChapters();
  const book = findTafsirBook(search.book);
  const view = search.v ? "verse" : search.s ? "surah" : search.book ? "book" : "home";
  const surahId = search.v ? Number(search.v.split(":")[0]) : search.s;
  const surah = chapters.data?.find((c) => c.id === surahId);

  const goBack = () => {
    if (view === "verse") return void navigate({ search: { book: search.book, s: surahId } });
    if (view === "surah") return void navigate({ search: { book: search.book } });
    return void navigate({ search: {} });
  };
  const title = view === "home" ? "Tafsir Library" : view === "book" ? book?.name ?? "Tafsir" : surah?.name_simple ?? "Tafsir";

  return (
    <>
      <header className="page-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        {view !== "home" && <HeaderBackButton onBack={goBack} />}
        <div className="relative mx-auto max-w-md px-14 pb-5 pt-9 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)" }}>{view === "home" ? "Quran commentary" : book?.name ?? "Tafsir"}</div>
          <h1 className="app-page-title mt-2">{title}</h1>
          {view === "home" && <p className="mt-2 text-xs opacity-90">20 classical tafsir books in 6 languages</p>}
          {view === "book" && book?.author && <p className="mt-2 text-xs opacity-90">{book.author} · {book.lang}</p>}
        </div>
      </header>
      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-4 px-5 py-3 pb-28">
          {view === "home" && <Home />}
          {view === "book" && book && <SurahList book={book.id} chapters={chapters.data} />}
          {view === "surah" && book && surah && <VerseList book={book.id} surah={surah} />}
          {view === "verse" && search.v && <VerseTafsir book={book?.id ?? preferredTafsirBook()} vkey={search.v} surah={surah} />}
        </div>
      </main>
    </>
  );
}

function BookRow({ id, name, author, lang }: { id: number; name: string; author?: string; lang: string }) {
  const tone = toneFor(lang);
  return (
    <Link to="/app/tafsir" search={{ book: id }} className="flex items-center gap-3 rounded-[20px] p-4 transition-transform active:scale-[0.98]" style={card}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
        style={{ background: `color-mix(in oklab, var(--topic-${tone}) 18%, var(--card))`, color: `var(--topic-${tone})` }}>
        <BookOpen size={20} strokeWidth={1.6} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold leading-snug">{name}</div>
        <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>{author ? `${author} · ` : ""}{lang}</div>
      </div>
      <ChevronRight size={16} className="opacity-40" />
    </Link>
  );
}

function Home() {
  const [last, setLast] = useState<TafsirProgress | null>(null);
  const chapters = useChapters();
  useEffect(() => setLast(getTafsirProgress()), []);
  const lastBook = findTafsirBook(last?.book);
  const lastSurah = last && chapters.data?.find((c) => c.id === Number(last.key.split(":")[0]));
  return (
    <>
      {last && lastBook && (
        <Link to="/app/tafsir" search={{ book: last.book, v: last.key }} className="flex items-center gap-3 rounded-[20px] p-4" style={card}>
          <Clock size={18} style={{ color: "var(--accent)" }} />
          <span className="min-w-0 flex-1">
            <span className="label-caps block text-[10px]" style={{ color: "var(--muted-foreground)" }}>Continue reading</span>
            <span className="block text-sm font-semibold">{lastSurah?.name_simple ?? "Surah"} {last.key}</span>
            <span className="block text-[11px]" style={{ color: "var(--muted-foreground)" }}>{lastBook.name} · {lastBook.lang}</span>
          </span>
          <ChevronRight size={16} className="opacity-40" />
        </Link>
      )}
      {LANGS.map((lang) => {
        const books = TAFSIR_BOOKS.filter((b) => b.lang === lang);
        return (
          <section key={lang}>
            <h2 className="label-caps mb-2 px-1">{lang}</h2>
            <div className="space-y-2">{books.map((b) => <BookRow key={b.id} {...b} />)}</div>
          </section>
        );
      })}
    </>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full px-4 py-3" style={card}>
      <Search size={17} style={{ color: "var(--muted-foreground)" }} />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      {value && <button type="button" aria-label="Clear" onClick={() => onChange("")}><X size={16} /></button>}
    </div>
  );
}

function SurahList({ book, chapters }: { book: number; chapters?: Chapter[] }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate({ from: "/app/tafsir" });
  const ref = q.trim().match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/);
  const list = useMemo(() => (chapters ? (q.trim() ? searchChapters(chapters, q) : chapters) : []), [chapters, q]);
  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); if (ref) void navigate({ search: { book, v: `${+ref[1]}:${+ref[2]}` } }); }}>
        <SearchBox value={q} onChange={setQ} placeholder="Surah name or verse, e.g. 2:255" />
      </form>
      {ref && (
        <Link to="/app/tafsir" search={{ book, v: `${+ref[1]}:${+ref[2]}` }} className="flex items-center gap-3 rounded-[20px] p-4" style={card}>
          <span className="flex-1 text-sm font-semibold">Open verse {+ref[1]}:{+ref[2]}</span><ChevronRight size={16} className="opacity-40" />
        </Link>
      )}
      {!chapters && <p className="px-1 text-xs" style={{ color: "var(--muted-foreground)" }}>Loading surahs…</p>}
      <div className="space-y-2">
        {list.map((c) => (
          <Link key={c.id} to="/app/tafsir" search={{ book, s: c.id }} className="flex items-center gap-3 rounded-[18px] px-4 py-3" style={card}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: "color-mix(in oklab, var(--accent) 14%, var(--card))", color: "var(--accent)" }}>{c.id}</span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{c.name_simple}</span>
              <span className="block text-[11px]" style={{ color: "var(--muted-foreground)" }}>{c.translated_name?.name} · {c.verses_count} verses</span>
            </span>
            <span className="text-lg" dir="rtl" style={{ fontFamily: "var(--font-arabic, serif)" }}>{c.name_arabic}</span>
          </Link>
        ))}
      </div>
    </>
  );
}

function VerseList({ book, surah }: { book: number; surah: Chapter }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: surah.verses_count }, (_, i) => i + 1).map((n) => (
        <Link key={n} to="/app/tafsir" search={{ book, v: `${surah.id}:${n}` }}
          className="flex h-12 items-center justify-center rounded-2xl text-sm font-semibold active:scale-95" style={card}>{n}</Link>
      ))}
    </div>
  );
}

function VerseTafsir({ book, vkey, surah }: { book: number; vkey: string; surah?: Chapter }) {
  const navigate = useNavigate({ from: "/app/tafsir" });
  const info = findTafsirBook(book)!;
  const [pick, setPick] = useState(false);
  const [s, n] = vkey.split(":").map(Number);
  const verse = useQuery({ queryKey: ["verse", vkey], queryFn: () => getVerseByKey(vkey), staleTime: Infinity });
  const tafsir = useQuery({ queryKey: ["tafsir", book, vkey], queryFn: () => getTafsir(book, vkey), staleTime: Infinity });
  useEffect(() => { saveTafsirProgress({ book, key: vkey }); document.querySelector(".scroll-area")?.scrollTo({ top: 0, behavior: "smooth" }); }, [book, vkey]);
  // Warm the next verse so stepping forward feels instant.
  useEffect(() => { if (surah && n < surah.verses_count) void getTafsir(book, `${s}:${n + 1}`).catch(() => {}); }, [book, s, n, surah]);
  const go = (k: string, b = book) => void navigate({ search: { book: b, v: k }, replace: true });
  const prev = n > 1 ? `${s}:${n - 1}` : null;
  const next = surah ? (n < surah.verses_count ? `${s}:${n + 1}` : null) : `${s}:${n + 1}`;

  return (
    <div className="space-y-3">
      <div className="relative">
        <button type="button" onClick={() => setPick((p) => !p)} className="flex w-full items-center gap-3 rounded-[20px] p-3.5 text-left" style={card}>
          <BookOpen size={18} style={{ color: "var(--accent)" }} />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{info.name}</span>
            <span className="block text-[11px]" style={{ color: "var(--muted-foreground)" }}>{info.lang} · tap to switch book</span>
          </span>
          <ChevronDown size={16} className={`opacity-50 transition-transform ${pick ? "rotate-180" : ""}`} />
        </button>
        {pick && (
          <div className="hadith-sort-pop absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-80 overflow-y-auto rounded-2xl p-1" style={{ ...card, background: "var(--card)" }}>
            {TAFSIR_BOOKS.map((b) => (
              <button key={b.id} type="button" onClick={() => { setPick(false); go(vkey, b.id); }}
                className="block w-full rounded-xl px-3 py-2 text-left text-sm"
                style={b.id === book ? { background: "color-mix(in oklab, var(--accent) 14%, transparent)" } : undefined}>
                {b.name} <span className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>· {b.lang}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <article className="rounded-[22px] p-4" style={card}>
        <div className="label-caps text-[10px]" style={{ color: "var(--muted-foreground)" }}>{surah?.name_simple ?? "Surah"} · {vkey}</div>
        {verse.data ? (
          <>
            {verse.data.arabic && <p className="mt-2 text-right text-[22px] leading-loose" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-arabic, serif)" }}>{verse.data.arabic}</p>}
            {verse.data.translation && <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{verse.data.translation}</p>}
          </>
        ) : <p className="mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>Loading verse…</p>}
      </article>

      <article className="tafsir-body rounded-[22px] p-4" style={card} dir={info.rtl ? "rtl" : "ltr"}>
        {tafsir.isLoading && <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Loading tafsir…</p>}
        {tafsir.isError && <p className="text-sm">Couldn't load this tafsir. Check your connection and try again.</p>}
        {tafsir.data === "" && <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>This book explains this verse together with a nearby verse. Try the previous verse.</p>}
        {tafsir.data && <div className={info.rtl ? "is-rtl" : ""} dangerouslySetInnerHTML={{ __html: tafsir.data }} />}
      </article>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" disabled={!prev} onClick={() => prev && go(prev)} className="flex items-center justify-center gap-1 rounded-full py-3 text-sm font-semibold disabled:opacity-40" style={card}>
          <ChevronLeft size={16} /> Previous verse
        </button>
        <button type="button" disabled={!next} onClick={() => next && go(next)} className="flex items-center justify-center gap-1 rounded-full py-3 text-sm font-semibold disabled:opacity-40" style={card}>
          Next verse <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
