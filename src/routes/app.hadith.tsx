import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, BookmarkCheck, BookOpen, ChevronRight, Clock, Feather, HandHeart, Heart, Home as HomeIcon, Landmark, Leaf, Moon, Search, Star, TreePalm, Users, X, type LucideIcon } from "lucide-react";
import {
  getHadithBooks, getHadithChapters, getHadiths, type Hadith,
} from "@/lib/hadith.functions";

type S = { book?: string; chapter?: number; q?: string; topic?: string; page?: number; saved?: number };

export const Route = createFileRoute("/app/hadith")({
  validateSearch: (s: Record<string, unknown>): S => ({
    book: typeof s.book === "string" ? s.book : undefined,
    chapter: typeof s.chapter === "number" ? s.chapter : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
    topic: typeof s.topic === "string" ? s.topic : undefined,
    page: typeof s.page === "number" ? s.page : undefined,
    saved: s.saved === 1 ? 1 : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Hadith Library, Sahih Al-Adhkar" },
      { name: "description", content: "Search and read over 40,000 hadith across Bukhari, Muslim, the Sunan and Mishkat, sorted by book, chapter and topic." },
      { property: "og:title", content: "Hadith Library, Sahih Al-Adhkar" },
      { property: "og:description", content: "Browse the major hadith collections by book, chapter and topic." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HadithLibrary,
});

type Tone = "sage" | "gold" | "blue" | "rose";
const TOPICS: { label: string; q: string; ar: string; Icon: LucideIcon; tone: Tone }[] = [
  { label: "Intention", q: "intention", ar: "النية", Icon: Feather, tone: "sage" },
  { label: "Prayer", q: "prayer", ar: "الصلاة", Icon: Landmark, tone: "gold" },
  { label: "Parents", q: "parents", ar: "الوالدين", Icon: Users, tone: "blue" },
  { label: "Charity", q: "charity", ar: "الصدقة", Icon: Heart, tone: "rose" },
  { label: "Knowledge", q: "knowledge", ar: "العلم", Icon: BookOpen, tone: "blue" },
  { label: "Repentance", q: "repent", ar: "التوبة", Icon: Leaf, tone: "sage" },
  { label: "Neighbours", q: "neighbor", ar: "الجار", Icon: HomeIcon, tone: "gold" },
  { label: "Paradise", q: "Paradise", ar: "الجنة", Icon: TreePalm, tone: "sage" },
  { label: "Patience", q: "patience", ar: "الصبر", Icon: Clock, tone: "rose" },
  { label: "Good character", q: "character", ar: "الأخلاق", Icon: Star, tone: "gold" },
  { label: "Fasting", q: "fasting", ar: "الصيام", Icon: Moon, tone: "rose" },
  { label: "Remembrance", q: "remembrance", ar: "الذكر", Icon: HandHeart, tone: "sage" },
];

const SAVED_KEY = "adhkar:hadith:saved";
function readSaved(): Hadith[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; }
}

function useSaved() {
  const [saved, setSaved] = useState<Hadith[]>([]);
  useEffect(() => setSaved(readSaved()), []);
  const toggle = (h: Hadith) => {
    const cur = readSaved();
    const next = cur.some((x) => x.id === h.id) ? cur.filter((x) => x.id !== h.id) : [h, ...cur];
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
    setSaved(next);
  };
  return { saved, toggle, has: (id: string) => saved.some((x) => x.id === id) };
}

const card: React.CSSProperties = {
  background: "var(--surface, var(--card))", border: "1px solid var(--border)",
  boxShadow: "var(--card-shadow, 0 4px 16px rgba(0,0,0,0.06))", color: "var(--foreground)",
};

function HadithLibrary() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/app/hadith" });
  const [text, setText] = useState(search.q ?? "");
  useEffect(() => setText(search.q ?? ""), [search.q]);
  const savedApi = useSaved();

  const view = search.saved ? "saved" : search.q ? "search" : search.chapter && search.book ? "chapter" : search.book ? "book" : "home";
  const books = useQuery({ queryKey: ["hadith-books"], queryFn: () => getHadithBooks(), staleTime: Infinity });
  const bookName = books.data?.find((b) => b.bookSlug === search.book)?.bookName;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (q) void navigate({ search: { q, book: search.book } });
  };

  const title = view === "saved" ? "Saved" : view === "search" ? (search.topic ?? `“${search.q}”`) : bookName ?? "Hadith Library";

  return (
    <>
      <header className="page-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        <div className="relative mx-auto max-w-md px-6 pb-6 pt-9 text-center">
          {view !== "home" && (
            <button type="button" aria-label="Back" onClick={() => history.back()}
              className="absolute left-4 top-9 flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "color-mix(in oklab, var(--header-fg) 14%, transparent)" }}>
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="label-caps" style={{ color: "var(--header-sub)" }}>Sunnah</div>
          <h1 className="app-page-title mt-2">{title}</h1>
          {view === "home" && <p className="mt-2 text-xs opacity-90">40,000+ hadith from the major collections</p>}
        </div>
      </header>

      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-4 px-5 py-3 pb-28">
          {view !== "saved" && (
            <form onSubmit={submit} className="flex items-center gap-2 rounded-full px-4 py-3" style={card}>
              <Search size={17} style={{ color: "var(--muted-foreground)" }} />
              <input value={text} onChange={(e) => setText(e.target.value)} enterKeyHint="search"
                placeholder={bookName ? `Search ${bookName}` : "Search all hadith (English or Arabic)"}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              {text && <button type="button" aria-label="Clear" onClick={() => setText("")}><X size={16} /></button>}
            </form>
          )}

          {view === "home" && <Home books={books.data} loading={books.isLoading} savedCount={savedApi.saved.length} />}
          {view === "book" && <Chapters book={search.book!} />}
          {(view === "chapter" || view === "search") && <HadithList s={search} savedApi={savedApi} />}
          {view === "saved" && (savedApi.saved.length
            ? savedApi.saved.map((h) => <HadithCard key={h.id} h={h} savedApi={savedApi} />)
            : <Empty text="Tap the bookmark on any hadith to keep it here." />)}
        </div>
      </main>
    </>
  );
}

function Home({ books, loading, savedCount }: { books?: { bookName: string; writerName: string; bookSlug: string; hadiths_count: number; chapters_count: number }[]; loading: boolean; savedCount: number }) {
  return (
    <>
      <section>
        <h2 className="label-caps mb-2 px-1">Browse by topic</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {TOPICS.map(({ label, q, ar, Icon, tone }) => (
            <Link key={q} to="/app/hadith" search={{ q, topic: label }}
              className="flex items-center gap-3 rounded-[18px] py-3 pl-3 pr-1.5 transition-transform active:scale-[0.97]" style={card}>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                style={{ background: `color-mix(in oklab, var(--topic-${tone}) 18%, var(--card))`, color: `var(--topic-${tone})` }}>
                <Icon size={20} strokeWidth={1.8} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] leading-tight" dir="rtl" style={{ textAlign: "left", fontFamily: "var(--font-arabic, serif)" }}>{ar}</span>
                <span className="mt-0.5 block text-[11px] leading-tight" style={{ color: "var(--muted-foreground)" }}>{label}</span>
              </span>
              <ChevronRight size={15} className="shrink-0 opacity-40" />
            </Link>
          ))}
        </div>
      </section>

      <Link to="/app/hadith" search={{ saved: 1 }} className="flex items-center gap-3 rounded-[20px] p-4" style={card}>
        <Bookmark size={18} style={{ color: "var(--accent)" }} />
        <span className="flex-1 text-sm font-semibold">Saved hadith</span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{savedCount}</span>
        <ChevronRight size={16} className="opacity-40" />
      </Link>

      <section>
        <h2 className="label-caps mb-2 px-1">The collections</h2>
        <div className="space-y-2">
          {loading && <Empty text="Loading collections…" />}
          {books?.map((b) => (
            <Link key={b.bookSlug} to="/app/hadith" search={{ book: b.bookSlug }}
              className="flex items-center gap-3 rounded-[20px] p-4 transition-transform active:scale-[0.98]" style={card}>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold"
                style={{ background: "color-mix(in oklab, var(--accent) 14%, var(--card))", color: "var(--accent)" }}>
                {b.bookName.replace(/^(Sahih|Sunan|Jami'|Mishkat)\s*/i, "").charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold">{b.bookName}</div>
                <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>
                  {b.writerName} · {b.hadiths_count.toLocaleString()} hadith · {b.chapters_count} books
                </div>
              </div>
              <ChevronRight size={16} className="opacity-40" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}

function Chapters({ book }: { book: string }) {
  const q = useQuery({ queryKey: ["hadith-chapters", book], queryFn: () => getHadithChapters({ data: { book } }), staleTime: Infinity });
  if (q.isLoading) return <Empty text="Loading chapters…" />;
  if (q.isError) return <Empty text="Couldn't load chapters. Check your connection." />;
  return (
    <div className="overflow-hidden rounded-[20px]" style={card}>
      {q.data?.map((c, i) => (
        <Link key={c.chapterNumber} to="/app/hadith" search={{ book, chapter: c.chapterNumber }}
          className="flex items-center gap-3 px-4 py-3" style={{ borderTop: i ? "1px solid var(--border)" : undefined }}>
          <span className="w-7 text-xs font-bold" style={{ color: "var(--accent)" }}>{c.chapterNumber}</span>
          <span className="min-w-0 flex-1 text-sm font-medium">{c.chapterEnglish}</span>
          <span className="max-w-[40%] truncate text-sm" dir="rtl" style={{ color: "var(--muted-foreground)" }}>{c.chapterArabic}</span>
        </Link>
      ))}
    </div>
  );
}

type SavedApi = ReturnType<typeof useSaved>;

function HadithList({ s, savedApi }: { s: S; savedApi: SavedApi }) {
  const page = Math.max(1, s.page ?? 1);
  const q = useQuery({
    queryKey: ["hadiths", s.book, s.chapter, s.q, page],
    queryFn: () => getHadiths({ data: { book: s.book, chapter: s.chapter, q: s.q, page } }),
    placeholderData: keepPreviousData, staleTime: 1000 * 60 * 30,
  });
  useEffect(() => { document.querySelector(".scroll-area")?.scrollTo({ top: 0 }); }, [page]);
  if (q.isLoading) return <Empty text="Loading hadith…" />;
  if (q.isError) return <Empty text="Couldn't load hadith. Check your connection." />;
  const d = q.data!;
  if (!d.items.length) return <Empty text="No hadith found. Try a different word." />;
  return (
    <>
      {s.q && <p className="px-1 text-xs" style={{ color: "var(--muted-foreground)" }}>{d.total.toLocaleString()} results</p>}
      {d.items.map((h) => <HadithCard key={h.id} h={h} savedApi={savedApi} />)}
      {d.lastPage > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <Link to="/app/hadith" search={{ ...s, page: page - 1 }} disabled={page <= 1}
            className="rounded-full px-4 py-2 text-sm font-semibold" style={{ ...card, opacity: page <= 1 ? 0.4 : 1 }}>Previous</Link>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Page {page} of {d.lastPage}</span>
          <Link to="/app/hadith" search={{ ...s, page: page + 1 }} disabled={page >= d.lastPage}
            className="rounded-full px-4 py-2 text-sm font-semibold" style={{ ...card, opacity: page >= d.lastPage ? 0.4 : 1 }}>Next</Link>
        </div>
      )}
    </>
  );
}

function gradeColor(status: string | null) {
  const s = (status || "").toLowerCase();
  if (s.includes("sahih")) return "var(--accent)";
  if (s.includes("hasan")) return "color-mix(in oklab, var(--accent) 60%, var(--muted-foreground))";
  return "var(--muted-foreground)";
}

function HadithCard({ h, savedApi }: { h: Hadith; savedApi: SavedApi }) {
  const [showArabic, setShowArabic] = useState(false);
  const saved = savedApi.has(h.id);
  return (
    <article className="rounded-[22px] p-4" style={card}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold" style={{ color: "var(--muted-foreground)" }}>
            {h.bookName} · #{h.hadithNumber}{h.chapterEnglish ? ` · ${h.chapterEnglish}` : ""}
          </div>
          {h.headingEnglish && <div className="mt-1 text-[13px] font-bold leading-snug">{h.headingEnglish}</div>}
        </div>
        {h.status && (
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{ color: gradeColor(h.status), background: "color-mix(in oklab, currentColor 12%, transparent)" }}>{h.status}</span>
        )}
        <button type="button" aria-label={saved ? "Remove bookmark" : "Save hadith"} onClick={() => savedApi.toggle(h)}
          style={{ color: saved ? "var(--accent)" : "var(--muted-foreground)" }}>
          {saved ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
        </button>
      </div>
      {h.englishNarrator && <p className="mt-3 text-[12px] italic" style={{ color: "var(--muted-foreground)" }}>{h.englishNarrator}</p>}
      {h.hadithEnglish && <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed">{h.hadithEnglish.replace(/\(?\uFDFA\)?/g, "(peace be upon him)")}</p>}
      {h.hadithArabic && (
        <>
          <button type="button" onClick={() => setShowArabic((v) => !v)} className="mt-3 text-xs font-semibold" style={{ color: "var(--accent)" }}>
            {showArabic ? "Hide Arabic" : "Show Arabic"}
          </button>
          {showArabic && <p className="mt-2 text-lg leading-loose" dir="rtl" lang="ar">{h.hadithArabic}</p>}
        </>
      )}
    </article>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[20px] p-6 text-center text-sm" style={{ ...card, color: "var(--muted-foreground)" }}>{text}</div>;
}
