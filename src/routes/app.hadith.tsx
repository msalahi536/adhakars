import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, BookmarkCheck, BookOpen, ChevronRight, Clock, Feather, HandHeart, Heart, Home as HomeIcon, Landmark, Leaf, Moon, Search, Star, TreePalm, Users, X, Check, ChevronDown, ChevronLeft, Copy, SlidersHorizontal, User, FileText, type LucideIcon } from "lucide-react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import {
  getHadithBooks, getHadithChapters, getHadiths, translateIsnad, type Hadith,
} from "@/lib/hadith.functions";
import { cached, DAY } from "@/lib/hadith-cache";

type S = { book?: string; chapter?: number; q?: string; topic?: string; page?: number; saved?: number; h?: number };

export const Route = createFileRoute("/app/hadith")({
  validateSearch: (s: Record<string, unknown>): S => ({
    book: typeof s.book === "string" ? s.book : undefined,
    chapter: typeof s.chapter === "number" ? s.chapter : undefined,
    q: typeof s.q === "string" ? s.q : undefined,
    topic: typeof s.topic === "string" ? s.topic : undefined,
    page: typeof s.page === "number" ? s.page : undefined,
    saved: s.saved === 1 ? 1 : undefined,
    h: typeof s.h === "number" && s.h >= 0 ? s.h : undefined,
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

const BOOK_TONES: { match: RegExp; tone: Tone | "mint" | "slate" | "clay" }[] = [
  { match: /bukhari/i, tone: "sage" },
  { match: /muslim/i, tone: "blue" },
  { match: /nasa/i, tone: "mint" },
  { match: /dawud|dawood/i, tone: "gold" },
  { match: /tirmidhi/i, tone: "clay" },
  { match: /majah/i, tone: "rose" },
  { match: /mishkat/i, tone: "slate" },
];
const bookTone = (slug: string, name: string) =>
  (BOOK_TONES.find((t) => t.match.test(slug) || t.match.test(name))?.tone ?? "sage") as Tone;

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
  useEffect(() => { if (!search.topic) setText(search.q ?? ""); }, [search.q, search.topic]);
  // Live search: results update as you type, no Enter needed.
  useEffect(() => {
    if (search.topic || search.saved || (search.chapter && search.book)) return;
    const q = text.trim();
    if (q === (search.q ?? "")) return;
    const t = setTimeout(() => void navigate({ search: q ? { q, book: search.book } : { book: search.book }, replace: !!search.q }), 450);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps
  const savedApi = useSaved();

  const view = search.saved ? "saved" : search.q ? "search" : search.chapter && search.book ? "chapter" : search.book ? "book" : "home";
  const books = useQuery({ queryKey: ["hadith-books"], queryFn: cached("books", 30 * DAY, () => getHadithBooks()), staleTime: Infinity });
  const bookName = books.data?.find((b) => b.bookSlug === search.book)?.bookName;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (q) void navigate({ search: { q, book: search.book } });
  };

  const goBack = () => {
    if (search.h !== undefined) return void navigate({ search: { ...search, h: undefined } });
    if (view === "chapter") return void navigate({ search: { book: search.book } });
    if (view === "search" && search.book) return void navigate({ search: { book: search.book } });
    return void navigate({ search: {} });
  };
  const title = view === "saved" ? "Saved" : view === "search" ? (search.topic ?? `“${search.q}”`) : bookName ?? "Hadith Library";

  return (
    <>
      <header className="page-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        {view !== "home" && <HeaderBackButton onBack={goBack} />}
        <div className="relative mx-auto max-w-md px-6 pb-5 pt-9 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)" }}>Sunnah</div>
          <h1 className="app-page-title mt-2">{title}</h1>
          {view === "home" && <p className="mt-2 text-xs opacity-90">40,000+ hadith from the major collections</p>}
          {(view === "home" || view === "book" || (view === "search" && !search.topic)) && (
            <form onSubmit={submit} className="mt-9 flex items-center gap-2 rounded-full px-4 py-3 text-left" style={card}>
              <Search size={17} style={{ color: "var(--muted-foreground)" }} />
              <input value={text} onChange={(e) => setText(e.target.value)} enterKeyHint="search"
                placeholder={bookName ? `Search ${bookName} — words or #number` : "Words, phrase, or “Bukhari 1”"}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              {text && <button type="button" aria-label="Clear" onClick={() => setText("")}><X size={16} /></button>}
            </form>
          )}
        </div>
      </header>

      <main className="scroll-area">
        <div className={`mx-auto max-w-md space-y-4 px-5 py-3 ${search.h !== undefined ? "pb-4" : "pb-28"}`}>

          {view === "home" && <Home books={books.data} loading={books.isLoading} savedCount={savedApi.saved.length} />}
          {view === "book" && <Chapters book={search.book!} info={books.data?.find((b) => b.bookSlug === search.book)} />}
          {view === "search" && !search.topic && <Suggestions q={search.q ?? ""} books={books.data} />}
          {(view === "chapter" || view === "search") && <HadithList s={search} savedApi={savedApi} />}
          {view === "saved" && (savedApi.saved.length
            ? <PreviewList terms={[]} filter="" setFilter={() => {}} busy={false} hideSearch items={savedApi.saved} total={savedApi.saved.length} label="Saved" savedApi={savedApi} />
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
              {(() => {
                const tone = bookTone(b.bookSlug, b.bookName);
                return (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    style={{ background: `color-mix(in oklab, var(--topic-${tone}) 18%, var(--card))`, color: `var(--topic-${tone})` }}>
                    <BookOpen size={20} strokeWidth={1.6} />
                  </span>
                );
              })()}
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

const ABOUT: Record<string, string> = {
  "sahih-bukhari": "The most authentic collection of hadith, compiled by Imam al-Bukhari. Its narrations are held to the strictest standards of authenticity.",
  "sahih-muslim": "Compiled by Imam Muslim, second only to Sahih al-Bukhari in authenticity and known for its careful arrangement of narrations.",
  "al-tirmidhi": "Compiled by Imam at-Tirmidhi, notable for grading each hadith and noting the views of the early jurists.",
  "abu-dawood": "Compiled by Imam Abu Dawud, focused on the hadith behind rulings of fiqh and everyday practice.",
  "ibn-e-majah": "Compiled by Imam Ibn Majah, one of the six major collections, containing many narrations not found elsewhere.",
  "sunan-nasai": "Compiled by Imam an-Nasa'i, regarded as one of the most rigorous of the Sunan collections.",
  "mishkat": "Mishkat al-Masabih by al-Khatib at-Tabrizi, a widely studied selection drawn from the major collections.",
};

function Chapters({ book, info }: { book: string; info?: { bookName: string; writerName: string; hadiths_count: number; chapters_count: number } }) {
  const q = useQuery({ queryKey: ["hadith-chapters", book], queryFn: cached(`chapters:${book}`, 30 * DAY, () => getHadithChapters({ data: { book } })), staleTime: Infinity });
  const soft = "color-mix(in oklab, var(--accent) 12%, transparent)";
  return (
    <>
      {info && (
        <div className="flex items-center gap-4 rounded-[24px] p-5" style={card}>
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ background: soft, color: "var(--accent)" }}><BookOpen size={28} strokeWidth={1.5} /></span>
          <div className="min-w-0 flex-1">
            <div className="font-serif text-[22px] leading-tight">{info.bookName}</div>
            <div className="mt-1 text-[12px]" style={{ color: "var(--muted-foreground)" }}>{info.writerName} · {info.hadiths_count.toLocaleString()} hadith · {info.chapters_count} books</div>
          </div>
        </div>
      )}
      {ABOUT[book] && (
        <div className="flex gap-3 rounded-[20px] p-4" style={card}>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: soft, color: "var(--accent)" }}><FileText size={17} /></span>
          <div><div className="text-[13px] font-bold">About this collection</div>
            <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{ABOUT[book]}</p></div>
        </div>
      )}
      <div className="label-caps px-1 pt-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>All books</div>
      {q.isLoading && <Empty text="Loading chapters…" />}
      {q.isError && <Empty text="Couldn't load chapters. Check your connection." />}
      <div className="space-y-2.5">
        {q.data?.map((c) => (
          <Link key={c.chapterNumber} to="/app/hadith" search={{ book, chapter: c.chapterNumber }}
            className="flex items-center gap-3 rounded-[18px] px-4 py-3.5 transition-transform active:scale-[0.98]" style={card}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold" style={{ background: soft, color: "var(--accent)" }}>{c.chapterNumber}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate font-serif text-[15.5px]">{c.chapterEnglish}</div>
              {c.chapterArabic && <div className="truncate text-[12px]" dir="rtl" style={{ color: "var(--muted-foreground)", textAlign: "left" }}>{c.chapterArabic}</div>}
            </div>
            <ChevronRight size={17} className="shrink-0 opacity-40" />
          </Link>
        ))}
      </div>
    </>
  );
}

type SavedApi = ReturnType<typeof useSaved>;

function Suggestions({ q, books }: { q: string; books?: { bookSlug: string; bookName: string; hadiths_count: number }[] }) {
  const f = q.trim().toLowerCase();
  if (f.length < 2) return null;
  const topics = TOPICS.filter((t) => t.label.toLowerCase().includes(f) || t.q.toLowerCase().includes(f) || t.ar.includes(q.trim()));
  const cols = (books ?? []).filter((b) => b.bookName.toLowerCase().replace(/[^a-z ]/g, "").includes(f.replace(/[^a-z ]/g, "")));
  if (!topics.length && !cols.length) return null;
  const chip = "flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] font-semibold";
  return (
    <div className="space-y-3">
      {topics.length > 0 && <div>
        <div className="label-caps mb-2 px-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>Topics</div>
        <div className="flex gap-2 overflow-x-auto pb-1">{topics.map(({ label, q: tq, Icon }) => (
          <Link key={tq} to="/app/hadith" search={{ q: tq, topic: label }} className={chip} style={card}><Icon size={14} /> {label}</Link>))}</div>
      </div>}
      {cols.length > 0 && <div>
        <div className="label-caps mb-2 px-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>Collections</div>
        <div className="flex gap-2 overflow-x-auto pb-1">{cols.map((b) => (
          <Link key={b.bookSlug} to="/app/hadith" search={{ book: b.bookSlug }} className={chip} style={card}><BookOpen size={14} /> {b.bookName}</Link>))}</div>
      </div>}
      <div className="label-caps px-1 text-[10px]" style={{ color: "var(--muted-foreground)" }}>Hadith</div>
    </div>
  );
}

function HadithList({ s, savedApi }: { s: S; savedApi: SavedApi }) {
  const [filter, setFilter] = useState("");
  const [refine, setRefine] = useState("");
  const [rPage, setRPage] = useState(1);
  useEffect(() => { const t = setTimeout(() => { setRefine(filter.trim()); setRPage(1); }, 350); return () => clearTimeout(t); }, [filter]);
  const page = refine ? rPage : Math.max(1, s.page ?? 1);
  const qq = [s.q, refine].filter(Boolean).join(" ") || undefined;
  const q = useQuery({
    queryKey: ["hadiths2", s.book, s.chapter, qq, page],
    queryFn: cached(`list2:${s.book ?? ""}:${s.chapter ?? ""}:${qq ?? ""}:${page}`, 7 * DAY,
      () => getHadiths({ data: { book: s.book, chapter: s.chapter, q: qq, page } })),
    placeholderData: keepPreviousData, staleTime: 1000 * 60 * 30,
  });
  useEffect(() => { document.querySelector(".scroll-area")?.scrollTo({ top: 0 }); }, [page]);
  if (q.isLoading) return <Empty text="Loading hadith…" />;
  if (q.isError) return <Empty text="Couldn't load hadith. Check your connection." />;
  const d = q.data!;
  if (!d.items.length && !filter) return <Empty text="No hadith found. Try a different word." />;
  return (
    <>
      <PreviewList items={d.items} total={d.total} terms={d.terms ?? []} filter={filter} setFilter={setFilter} busy={q.isFetching} hideSearch={!!s.q && !s.topic} label={s.topic ?? (s.q ? `“${s.q}”` : "this chapter")} savedApi={savedApi} />
      {d.lastPage > 1 && s.h === undefined && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <Link to="/app/hadith" search={{ ...s, page: page - 1 }} disabled={page <= 1} onClick={(e) => { if (refine) { e.preventDefault(); setRPage(page - 1); } }}
            className="rounded-full px-4 py-2 text-sm font-semibold" style={{ ...card, opacity: page <= 1 ? 0.4 : 1 }}>Previous</Link>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>Page {page} of {d.lastPage}</span>
          <Link to="/app/hadith" search={{ ...s, page: page + 1 }} disabled={page >= d.lastPage} onClick={(e) => { if (refine) { e.preventDefault(); setRPage(page + 1); } }}
            className="rounded-full px-4 py-2 text-sm font-semibold" style={{ ...card, opacity: page >= d.lastPage ? 0.4 : 1 }}>Next</Link>
        </div>
      )}
    </>
  );
}

const SORTS = [
  { id: "relevance", label: "Most relevant" },
  { id: "grade", label: "Sahih first" },
  { id: "book", label: "By collection" },
  { id: "number", label: "Hadith number" },
] as const;
type SortId = (typeof SORTS)[number]["id"];
const gradeRank = (st: string | null) => { const v = (st || "").toLowerCase(); return v.includes("sahih") ? 0 : v.includes("hasan") ? 1 : 2; };

function clean(t: string | null) { return (t ?? "").replace(/\(?\uFDFA\)?/g, "(peace be upon him)").trim(); }
function narratorName(n: string | null) { return clean(n).replace(/^narrated\s*(by)?\s*/i, "").replace(/[:\s]+$/, ""); }
function titleOf(h: Hadith) {
  if (h.headingEnglish?.trim()) return clean(h.headingEnglish);
  const t = clean(h.hadithEnglish);
  return t.length > 90 ? t.slice(0, 88).replace(/\s+\S*$/, "") + "…" : t;
}

function esc(t: string) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function termRegex(terms: string[]) {
  const t = terms.filter((x) => x.trim().length > 1);
  if (!t.length) return null;
  return new RegExp(`(${t.map((w) => /[\u0600-\u06FF]/.test(w) ? [...w].map((c) => esc(c) + DIA).join("") : `[\\w'’]*${esc(w)}[\\w'’]*`).join("|")})`, "gi");
}
function Hl({ text, terms }: { text: string; terms: string[] }) {
  const re = termRegex(terms);
  if (!re) return <>{text}</>;
  return <>{text.split(re).map((part, i) => i % 2 ? <mark key={i} className="hadith-hl">{part}</mark> : part)}</>;
}
function snippetOf(h: Hadith, terms: string[]) {
  const re = termRegex(terms); const t = clean(h.hadithEnglish);
  if (!re || !t) return null;
  const m = re.exec(t); if (!m) return null;
  const a = Math.max(0, m.index - 60); const b = Math.min(t.length, m.index + 110);
  return (a > 0 ? "…" : "") + t.slice(a, b).replace(/^\S*\s/, a > 0 ? "" : "$&") + (b < t.length ? "…" : "");
}

function PreviewList({ items, total, label, savedApi, terms, filter, setFilter, busy, hideSearch }: { hideSearch?: boolean; items: Hadith[]; total: number; label: string; savedApi: SavedApi; terms: string[]; filter: string; setFilter: (v: string) => void; busy: boolean }) {
  const [sort, setSort] = useState<SortId>("relevance");
  const [sortOpen, setSortOpen] = useState(false);
  const sp = Route.useSearch();
  const nav = useNavigate({ from: "/app/hadith" });
  const open = sp.h ?? null;
  const setOpen = (i: number | null) => void nav({ search: (p) => ({ ...p, h: i ?? undefined }), replace: open !== null && i !== null });
  const list = useMemo(() => {
    const out = [...items];
    if (sort === "grade") out.sort((a, b) => gradeRank(a.status) - gradeRank(b.status));
    if (sort === "book") out.sort((a, b) => a.bookName.localeCompare(b.bookName) || Number(a.hadithNumber) - Number(b.hadithNumber));
    if (sort === "number") out.sort((a, b) => Number(a.hadithNumber) - Number(b.hadithNumber));
    return out;
  }, [items, sort]);

  useEffect(() => { document.querySelector(".scroll-area")?.scrollTo({ top: 0 }); }, [open]);
  if (open !== null && list[open]) {
    return <HadithDetail terms={terms} h={list[open]} index={open} count={list.length} savedApi={savedApi}
      onClose={() => setOpen(null)} onMove={(d) => setOpen(Math.min(list.length - 1, Math.max(0, (open ?? 0) + d)))} />;
  }
  return (
    <>
      {!hideSearch && <div className="flex items-center gap-2 rounded-full px-4 py-3" style={card}>
        <Search size={17} style={{ color: "var(--muted-foreground)" }} />
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={`Search in ${label}…`}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        {filter && <button type="button" aria-label="Clear" onClick={() => setFilter("")}><X size={16} /></button>}
      </div>}
      <div className="relative flex items-center justify-between px-1">
        <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{busy ? "Searching…" : `${total.toLocaleString()} hadith`}</span>
        <button type="button" onClick={() => setSortOpen((v) => !v)} aria-expanded={sortOpen}
          className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold" style={card}>
          <SlidersHorizontal size={14} /> Sort
        </button>
        {sortOpen && (
          <>
            <button type="button" aria-label="Close sort" className="fixed inset-0 z-20 cursor-default" onClick={() => setSortOpen(false)} />
            <div className="hadith-sort-pop absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-2xl p-1" style={{ ...card, background: "var(--card)" }}>
              {SORTS.map((o) => (
                <button key={o.id} type="button" onClick={() => { setSort(o.id); setSortOpen(false); }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px]"
                  style={{ background: sort === o.id ? "color-mix(in oklab, var(--accent) 12%, transparent)" : undefined, fontWeight: sort === o.id ? 600 : 400 }}>
                  {o.label}{sort === o.id && <Check size={14} style={{ color: "var(--accent)" }} />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      {list.length === 0 && !busy && <Empty text="No matches. Try fewer or different words." />}
      {list.map((h, i) => {
        const saved = savedApi.has(h.id);
        return (
          <div key={h.id} role="button" tabIndex={0} onClick={() => setOpen(i)} onKeyDown={(e) => e.key === "Enter" && setOpen(i)}
            className="cursor-pointer rounded-[20px] p-4 transition-transform active:scale-[0.98]" style={card}>
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 truncate text-[11px] font-semibold" style={{ color: "var(--muted-foreground)" }}>
                {h.bookName} · #{h.hadithNumber}{h.chapterEnglish ? ` · ${h.chapterEnglish}` : ""}
              </div>
              {h.status && <GradePill status={h.status} />}
              <button type="button" aria-label={saved ? "Remove bookmark" : "Save hadith"}
                onClick={(e) => { e.stopPropagation(); savedApi.toggle(h); }} style={{ color: saved ? "var(--accent)" : "var(--muted-foreground)" }}>
                {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
              </button>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="line-clamp-2 text-[15px] font-bold leading-snug"><Hl text={titleOf(h)} terms={terms} /></div>
                {(() => { const re = termRegex(terms); const sn = re && !re.test(titleOf(h)) ? snippetOf(h, terms) : null; return sn ? <div className="mt-1 line-clamp-2 text-[12.5px] leading-snug" style={{ color: "var(--muted-foreground)" }}><Hl text={sn} terms={terms} /></div> : null; })()}
                {h.englishNarrator && <div className="mt-1 truncate text-[12px] italic" style={{ color: "var(--muted-foreground)" }}>{clean(h.englishNarrator)} …</div>}
              </div>
              <ChevronRight size={17} className="shrink-0 opacity-40" />
            </div>
          </div>
        );
      })}
    </>
  );
}

function GradePill({ status }: { status: string }) {
  return (
    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ color: gradeColor(status), background: "color-mix(in oklab, currentColor 12%, transparent)" }}>{status}</span>
  );
}

function HadithDetail({ h, index, count, savedApi, onClose, onMove, terms }: {
  terms: string[]; h: Hadith; index: number; count: number; savedApi: SavedApi; onClose: () => void; onMove: (d: number) => void;
}) {
  const [narrOpen, setNarrOpen] = useState(false);
  useIsnad(h); // start loading English narrator names as soon as the hadith opens
  const [copiedEn, setCopiedEn] = useState(false);
  const copyEn = async () => { try { await navigator.clipboard.writeText(clean(h.hadithEnglish)); setCopiedEn(true); setTimeout(() => setCopiedEn(false), 1500); } catch { /* ignore */ } };
  const [copied, setCopied] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => { scroller.current?.scrollTo({ top: 0 }); setNarrOpen(false); }, [h.id]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  const saved = savedApi.has(h.id);
  const copy = async () => {
    try { await navigator.clipboard.writeText([h.hadithArabic, clean(h.hadithEnglish), `${h.bookName} ${h.hadithNumber}`].filter(Boolean).join("\n\n")); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };
  const panel: React.CSSProperties = { ...card, background: "var(--card)" };
  return (
    <div className="hadith-detail space-y-3">
        <div ref={scroller} className="space-y-3">
          <div className="rounded-[24px] p-5" style={panel}>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{h.bookName} · #{h.hadithNumber}</span>
              <span className="flex-1" />
              {h.status && <GradePill status={h.status} />}
              <button type="button" aria-label={saved ? "Remove bookmark" : "Save hadith"} onClick={() => savedApi.toggle(h)}
                className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: "color-mix(in oklab, var(--accent) 10%, transparent)", color: saved ? "var(--accent)" : "var(--muted-foreground)" }}>
                {saved ? <BookmarkCheck size={17} /> : <Bookmark size={17} />}
              </button>
            </div>
            <h2 className="mt-3 font-serif text-[24px] leading-snug" style={{ color: "var(--accent)" }}><Hl text={titleOf(h)} terms={terms} /></h2>
            {h.chapterEnglish && <div className="mt-1 text-[12px]" style={{ color: "var(--muted-foreground)" }}>Book of {h.chapterEnglish}</div>}
          </div>
          {h.englishNarrator && (
            <button type="button" onClick={() => setNarrOpen((v) => !v)} className="block w-full rounded-[20px] p-4 text-left" style={panel}>
              <div className="flex items-center gap-3">
                <User size={18} style={{ color: "var(--muted-foreground)" }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>Narrated by</div>
                  <div className={`text-[15px] font-bold ${narrOpen ? "" : "truncate"}`}>{narratorName(h.englishNarrator)}</div>
                </div>
                <ChevronDown size={17} className="opacity-50 transition-transform" style={{ transform: narrOpen ? "rotate(180deg)" : undefined }} />
              </div>
              {narrOpen && <Isnad h={h} />}
            </button>
          )}
          {h.hadithArabic && (
            <div className="rounded-[20px] p-4" style={panel}>
              <p className="arabic text-right text-[21px] leading-[2.2]" dir="rtl" lang="ar"><Hl text={h.hadithArabic} terms={terms.filter((t) => /[\u0600-\u06FF]/.test(t))} /></p>
              <div className="mt-2 flex justify-end">
                <button type="button" aria-label="Copy hadith" onClick={copy} className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {copied ? <><Check size={15} /> Copied</> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}
          {h.hadithEnglish && (
            <div className="rounded-[20px] p-4" style={panel}>
              <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}><BookOpen size={14} /> Translation</div>
              <p className="whitespace-pre-line text-[15px] leading-[1.75]"><Hl text={clean(h.hadithEnglish)} terms={terms} /></p>
              <div className="mt-2 flex justify-end">
                <button type="button" aria-label="Copy translation" onClick={copyEn} className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {copiedEn ? <><Check size={15} /> Copied</> : <Copy size={16} />}
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 rounded-[20px] p-4" style={panel}>
            <FileText size={18} style={{ color: "var(--muted-foreground)" }} />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-bold">Reference</div>
              <div className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>{h.bookName}{h.chapterEnglish ? `, ${h.chapterEnglish}` : ""}, Hadith {h.hadithNumber}</div>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between pt-1 pb-2">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="flex items-center gap-1 rounded-full px-4 py-2.5 text-sm font-semibold" style={{ ...panel, opacity: index === 0 ? 0.4 : 1 }}><ChevronLeft size={16} /> Previous</button>
          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{index + 1} of {count}</span>
          <button type="button" disabled={index >= count - 1} onClick={() => onMove(1)} className="flex items-center gap-1 rounded-full px-6 py-2.5 text-sm font-semibold" style={{ background: "var(--accent)", color: "var(--accent-foreground, var(--background))", opacity: index >= count - 1 ? 0.4 : 1 }}>Next <ChevronRight size={16} /></button>
        </div>
    </div>
  );
}

const DIA = "[\\u064B-\\u065F\\u0670\\u06D6-\\u06ED]*";
const fuzzy = (w: string) => [...w].map((c) => (c === " " ? "\\s+" : c === "ا" ? "[اأإآ]" : c) + DIA).join("");
const MATN = new RegExp(["قال رسول الله", "سمعت رسول الله", "سمعت النبي", "ان رسول الله", "ان النبي", "عن النبي", "قال النبي", "عن رسول الله"].map(fuzzy).join("|"));
const LINK = new RegExp(`(?:^|\\s)(?:${["حدثنا", "حدثني", "اخبرنا", "اخبرني", "عن", "سمعت", "انبانا"].map(fuzzy).join("|")})(?=\\s)`, "g");
export function splitIsnad(ar: string): string[] {
  const m = MATN.exec(ar);
  const chain = (m && m.index > 10 ? ar.slice(0, m.index) : ar.split(/[:،,]/)[0] ?? "").trim();
  return chain.split(LINK).map((x) => x.replace(/[،,.:]+$/g, "").trim()).filter((x) => x.length > 1);
}
function useIsnad(h: Hadith) {
  const links = h.hadithArabic ? splitIsnad(h.hadithArabic) : [];
  return { links, en: useQuery({ queryKey: ["isnad-en", h.id], enabled: links.length > 0, staleTime: Infinity,
    queryFn: async () => {
      const r = await cached(`isnad:${h.id}`, 365 * DAY, () => translateIsnad({ data: { links: links.slice(0, 20).map((l) => l.slice(0, 400)) } }))();
      if (!r.names.length) localStorage.removeItem(`hadith-cache:v1:isnad:${h.id}`);
      return r;
    } }) };
}
function Isnad({ h }: { h: Hadith }) {
  const { links, en } = useIsnad(h);
  const names = en.data?.names ?? [];
  return (
    <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }} onClick={(e) => e.stopPropagation()}>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>Full chain (isnad)</div>
      {links.length > 0 ? (
        <ol className="space-y-2.5">
          {links.map((l, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)", color: "var(--accent)" }}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-semibold leading-snug">{names[i] || (en.isLoading ? "…" : "")}</div>
                <div className="arabic text-left text-[15px] leading-relaxed" dir="rtl" lang="ar" style={{ color: "var(--muted-foreground)" }}>{l}</div>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      <p className="mt-2 text-[12px] italic" style={{ color: "var(--muted-foreground)" }}>{clean(h.englishNarrator)}</p>
      <p className="mt-1 text-[11px]" style={{ color: "var(--muted-foreground)" }}>{h.bookName}{h.chapterEnglish ? ` · Book of ${h.chapterEnglish}` : ""}</p>
    </div>
  );
}

function gradeColor(status: string | null) {
  const s = (status || "").toLowerCase();
  if (s.includes("sahih")) return "var(--accent)";
  if (s.includes("hasan")) return "var(--topic-gold)";
  return "var(--muted-foreground)";
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-[20px] p-6 text-center text-sm" style={{ ...card, color: "var(--muted-foreground)" }}>{text}</div>;
}
