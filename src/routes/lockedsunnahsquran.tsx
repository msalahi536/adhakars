import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, Leaf, LockKeyhole, LogOut, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { editorLogin, editorLogout, editorStatus, editorLoad, editorSave, editorClear, editorPreview } from "@/lib/daily-editor.functions";
import { addDays, weekDates, type DailyType, type DailyContent, type DailyAssignment } from "@/lib/daily-editor";
import { getHadiths, type HadithPage } from "@/lib/hadith.functions";
import { getChapters, getVerseByKey, parseVerseRef, searchVerses, stripTags, type Chapter } from "@/lib/quran";

export const Route = createFileRoute("/lockedsunnahsquran")({
  loader: () => editorStatus(),
  head: () => ({ meta: [
    { title: "Daily Selections · Sahih Al-Adhkar" },
    { name: "description", content: "Private daily Quran and Sunnah selection calendar for Sahih Al-Adhkar." },
    { name: "robots", content: "noindex, nofollow" },
    { property: "og:title", content: "Daily Selections · Sahih Al-Adhkar" },
    { property: "og:description", content: "Private daily Quran and Sunnah calendar." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: DailyEditorPage,
});

type LibraryItem = DailyContent & { id: string; category: string; reference: string | null };
type Preview = { quran_verse: { arabic: string; translation: string; reference: string | null } | null; sunnah: { arabic: string; translation: string; reference: string | null } | null };
const names = { quran_verse: "Quran verse", sunnah: "Sunnah of the day" };
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const formatDate = (key: string) => new Date(`${key}T12:00:00Z`).toLocaleDateString("en", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

function DailyEditorPage() {
  const initial = Route.useLoaderData();
  const [authed, setAuthed] = useState(initial.ok);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const login = useServerFn(editorLogin); const logout = useServerFn(editorLogout);
  async function signIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const element = e.currentTarget;
    const form = new FormData(element);
    try {
      const r = await login({ data: { username: String(form.get("username")), password: String(form.get("password")) } });
      if (r.ok) { element.reset(); setAuthed(true); } else setError("Username or password is incorrect.");
    } catch { setError("Couldn't sign in. Please try again."); } finally { setBusy(false); }
  }
  return <div className="daily-editor min-h-dvh bg-background text-foreground">
    {authed ? <DailyDashboard today={initial.today} onLogout={async () => { await logout(); setAuthed(false); }} /> :
      <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
        <LockKeyhole className="mb-7 h-10 w-10 text-primary" />
        <p className="text-sm text-muted-foreground">Sahih Al-Adhkar · Private workspace</p>
        <h1 className="mb-8 mt-2 font-display text-4xl font-semibold">Daily selections</h1>
        <form onSubmit={signIn} className="space-y-5">
          <div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" name="username" required autoComplete="username" autoCapitalize="none" maxLength={100} /></div>
          <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required autoComplete="current-password" maxLength={200} /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <Button className="w-full" disabled={busy} type="submit">{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
      </main>}
  </div>;
}

function DailyDashboard({ today, onLogout }: { today: string; onLogout: () => Promise<void> }) {
  const [date, setDate] = useState(today);
  const year = Number(date.slice(0, 4));
  const [view, setView] = useState<"day" | "year">("day");
  const [rows, setRows] = useState<DailyAssignment[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [editing, setEditing] = useState<DailyType | null>(null);
  const [error, setError] = useState(""); const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useServerFn(editorLoad); const loadPreview = useServerFn(editorPreview); const clear = useServerFn(editorClear);
  const refresh = useCallback(async () => {
    const [r, p] = await Promise.all([load({ data: { year } }), loadPreview({ data: { date } })]);
    setRows(r.assignments); setLibrary(r.library as unknown as LibraryItem[]); setPreview(p);
  }, [load, loadPreview, year, date]);
  useEffect(() => { let active = true; setLoading(true); setError(""); setPreview(null);
    refresh().catch(() => { if (active) setError("Couldn't load this day. Please retry."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);
  return <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-8">
    <header className="flex items-center justify-between border-b border-border py-6">
      <div><p className="text-xs text-muted-foreground">SAHIH AL-ADHKAR</p><h1 className="font-display text-3xl font-semibold">Daily selections</h1></div>
      <Button variant="ghost" size="icon" aria-label="Sign out" title="Sign out" onClick={() => void onLogout().catch(() => setError("Couldn't sign out. Please retry."))}><LogOut className="h-5 w-5" /></Button>
    </header>
    <div className="my-6 flex gap-2 border-b border-border pb-4">
      <Button variant={view === "day" ? "default" : "ghost"} onClick={() => setView("day")}><BookOpen className="mr-2 h-4 w-4" />Day</Button>
      <Button variant={view === "year" ? "default" : "ghost"} onClick={() => setView("year")}><CalendarDays className="mr-2 h-4 w-4" />Year calendar</Button>
    </div>
    <div className="mb-6 flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}><ChevronLeft className="h-4 w-4" /></Button>
      <Input aria-label="Selected date" type="date" value={date} min="2020-01-01" max="2100-12-31" className="w-[190px] flex-none" onChange={(e) => { if (e.target.value) setDate(e.target.value); }} />
      <Button variant="outline" size="icon" aria-label="Next day" onClick={() => setDate(addDays(date, 1))}><ChevronRight className="h-4 w-4" /></Button>
      <Button variant="ghost" onClick={() => { setDate(today); setView("day"); }}>Today</Button>
      <Button variant="ghost" onClick={() => { setDate(addDays(today, 1)); setView("day"); }}>Tomorrow</Button>
    </div>
    {error && <div role="alert" className="mb-4 flex items-center gap-3 text-sm text-destructive">{error}<Button variant="outline" onClick={() => { setError(""); void refresh().catch(() => setError("Couldn't load. Please retry.")); }}>Retry</Button></div>}
    {notice && <p role="status" className="mb-4 text-sm text-primary">{notice}</p>}
    {view === "day" ? <>
      <h2 className="font-display text-3xl font-semibold">{date === today ? "Today's selections" : formatDate(date)}</h2>
      <p className="mb-5 mt-1 text-sm text-muted-foreground">{date === today ? formatDate(date) + " · " : ""}Widget calendar · UTC</p>
      <div className="grid gap-5 md:grid-cols-2">{(["quran_verse", "sunnah"] as const).map((type) => {
        const item = preview?.[type]; const scheduled = rows.some((r) => r.date === date && r.widget_type === type);
        const Icon = type === "quran_verse" ? BookOpen : Leaf;
        return <article key={type} className="flex flex-col rounded-lg border border-border bg-card p-5 sm:p-6">
          <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><h3 className="font-semibold">{names[type]}</h3></div>
          <p className="mt-2 text-xs text-muted-foreground">{scheduled ? "Manually scheduled" : "Automatic rotation"}</p>
          {loading ? <p className="py-8 text-muted-foreground">Loading…</p> : item ? <div className="flex-1 py-5">
            <p dir="rtl" className="font-arabic text-2xl leading-loose">{item.arabic}</p>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{item.translation}</p>
            <p className="mt-3 text-xs text-muted-foreground">{item.reference}</p>
          </div> : <p className="flex-1 py-8 text-sm text-muted-foreground">No selection available.</p>}
          <Button disabled={loading} onClick={() => setEditing(type)}><Search className="mr-2 h-4 w-4" />{scheduled ? "Change selection" : "Choose selection"}</Button>
          {scheduled && <Button variant="ghost" className="mt-2" onClick={async () => { if (!window.confirm("Remove this day's selection and restore automatic rotation?")) return;
            try { await clear({ data: { date, type } }); await refresh(); setNotice("Automatic rotation restored for this day."); } catch { setError("Couldn't remove selection."); }
          }}>Restore automatic</Button>}
        </article>;
      })}</div>
    </> : <>
      <div className="mb-5 flex items-center justify-between"><Button variant="ghost" size="icon" aria-label="Previous year" disabled={year <= 2020} onClick={() => setDate(`${year - 1}-01-01`)}><ChevronLeft /></Button><h2 className="font-display text-3xl font-semibold">{year}</h2><Button variant="ghost" size="icon" aria-label="Next year" disabled={year >= 2100} onClick={() => setDate(`${year + 1}-01-01`)}><ChevronRight /></Button></div>
      <div className="mb-6 flex gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-1"><BookOpen className="h-3 w-3 text-primary" />Quran scheduled</span><span className="flex items-center gap-1"><Leaf className="h-3 w-3 text-accent" />Sunnah scheduled</span></div>
      <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 12 }, (_, month) => {
        const first = new Date(Date.UTC(year, month, 1)); const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
        return <section key={month}><h3 className="mb-3 font-semibold">{first.toLocaleDateString("en", { month: "long", timeZone: "UTC" })}</h3>
          <div className="grid grid-cols-7 gap-1">{weekdays.map((w) => <span key={w} className="py-1 text-center text-[11px] text-muted-foreground">{w}</span>)}
            {Array.from({ length: (first.getUTCDay() + 6) % 7 }, (_, i) => <span key={`blank-${i}`} />)}
            {Array.from({ length: count }, (_, i) => { const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
              const q = rows.some((r) => r.date === key && r.widget_type === "quran_verse"); const s = rows.some((r) => r.date === key && r.widget_type === "sunnah");
              return <Button key={key} variant={key === date ? "default" : "ghost"} aria-label={`${formatDate(key)}${q ? ", Quran scheduled" : ""}${s ? ", Sunnah scheduled" : ""}`} className="h-11 min-w-0 flex-col gap-0 rounded-md p-0" onClick={() => { setDate(key); setView("day"); }}>
                <span className="text-sm">{i + 1}</span><span className="flex h-3 gap-1">{q && <BookOpen className="h-2.5 w-2.5" />}{s && <Leaf className="h-2.5 w-2.5" />}</span>
              </Button>;
            })}
          </div></section>;
      })}</div>
    </>}
    {editing && <SelectionDialog type={editing} date={date} library={library} onClose={() => setEditing(null)} onSaved={async (count) => { await refresh(); setEditing(null); setNotice(`Saved for ${count} ${count === 1 ? "day" : "days"}.`); }} />}
  </div>;
}

function SelectionDialog({ type, date, library, onClose, onSaved }: { type: DailyType; date: string; library: LibraryItem[]; onClose: () => void; onSaved: (count: number) => Promise<void> }) {
  const [source, setSource] = useState<"library" | "lookup">("library");
  const [q, setQ] = useState(""); const [book, setBook] = useState("sahih-bukhari");
  const [chapter, setChapter] = useState("1"); const [ayah, setAyah] = useState("1");
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [results, setResults] = useState<DailyContent[]>([]);
  const [hadithPage, setHadithPage] = useState<HadithPage | null>(null);
  const [selected, setSelected] = useState<DailyContent | null>(null);
  const [dates, setDates] = useState([date]);
  const [rangeStart, setRangeStart] = useState(date); const [rangeEnd, setRangeEnd] = useState(date);
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const save = useServerFn(editorSave); const hadiths = useServerFn(getHadiths);
  useEffect(() => { if (type === "quran_verse") void getChapters().then(setChapters).catch(() => setError("Couldn't load surahs. You can still enter a verse reference.")); }, [type]);
  async function lookup(page = 1) {
    setBusy(true); setError(""); setResults([]);
    try {
      if (type === "sunnah") {
        const r = await hadiths({ data: { book: book || undefined, q, page } }); setHadithPage(r);
        setResults(r.items.filter((h) => h.hadithArabic && h.hadithEnglish).map((h) => ({ arabic_text: stripTags(h.hadithArabic ?? ""), translation: stripTags(h.hadithEnglish ?? ""), reference: `${h.bookName} ${h.hadithNumber}${h.status ? " · " + h.status : ""}` })));
      } else {
        const ref = parseVerseRef(q, chapters);
        const key = ref ?? `${chapter}:${ayah}`;
        if (q.trim() && !ref) {
          const hits = await searchVerses(q.trim(), 20);
          setResults(await Promise.all(hits.map((v) => fetchVerse(v.key))));
        } else setResults([await fetchVerse(key)]);
      }
    } catch { setError("Couldn't load results. Please try again."); } finally { setBusy(false); }
  }
  function setRange() {
    if (!rangeStart || !rangeEnd || rangeEnd < rangeStart) { setError("Choose a valid date range."); return; }
    const list: string[] = []; let cursor = rangeStart;
    while (cursor <= rangeEnd && list.length < 367) { list.push(cursor); cursor = addDays(cursor, 1); }
    if (list.length > 366) { setError("Select up to 366 days at a time."); return; }
    setDates(list); setError("");
  }
  const shown = source === "lookup" ? results : library.filter((i) => i.category === (type === "sunnah" ? "sunnah_of_day" : "quran_verse") && `${i.translation} ${i.reference ?? ""} ${i.arabic_text}`.toLowerCase().includes(q.toLowerCase())).map((i) => ({ arabic_text: i.arabic_text, translation: i.translation, reference: i.reference ?? "" }));
  return <Dialog open onOpenChange={(open) => { if (!open && !busy) onClose(); }}><DialogContent className="daily-editor flex max-h-[92dvh] flex-col overflow-hidden rounded-lg bg-background text-foreground sm:max-w-2xl">
    <DialogHeader><DialogTitle className="font-display text-3xl">Choose {names[type].toLowerCase()}</DialogTitle><DialogDescription>{formatDate(date)}</DialogDescription></DialogHeader>
    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
      {!selected ? <>
        <div className="flex gap-2"><Button variant={source === "library" ? "default" : "outline"} onClick={() => { setSource("library"); setQ(""); }}>Saved library</Button><Button variant={source === "lookup" ? "default" : "outline"} onClick={() => { setSource("lookup"); setQ(""); }}>{type === "sunnah" ? "Hadith library" : "Find a verse"}</Button></div>
        <form onSubmit={(e) => { e.preventDefault(); if (source === "lookup") void lookup(); }} className="space-y-3">
          {source === "lookup" && type === "sunnah" && <select aria-label="Hadith collection" className="daily-select" value={book} onChange={(e) => setBook(e.target.value)}>{[["sahih-bukhari", "Sahih Bukhari"], ["sahih-muslim", "Sahih Muslim"], ["al-tirmidhi", "Jami at-Tirmidhi"], ["abu-dawood", "Sunan Abu Dawud"], ["sunan-nasai", "Sunan an-Nasai"], ["ibn-e-majah", "Sunan Ibn Majah"], ["", "All collections"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>}
          {source === "lookup" && type === "quran_verse" && <div className="flex gap-2"><select className="daily-select min-w-0 flex-1" aria-label="Surah" value={chapter} onChange={(e) => { setChapter(e.target.value); setAyah("1"); setQ(""); }}>{chapters.length ? chapters.map((c) => <option key={c.id} value={c.id}>{c.id}. {c.name_simple}</option>) : <option value="1">1. Al-Fatihah</option>}</select><Input aria-label="Ayah number" type="number" min={1} max={chapters.find((c) => String(c.id) === chapter)?.verses_count ?? 286} value={ayah} className="w-20" onChange={(e) => { setAyah(e.target.value); setQ(""); }} /></div>}
          <div className="flex gap-2"><Input aria-label="Search content" maxLength={140} placeholder={source === "library" ? "Search saved selections…" : type === "sunnah" ? "Topic or hadith number, e.g. 1" : "Search words or enter 2:255"} value={q} onChange={(e) => setQ(e.target.value)} />{source === "lookup" && <Button type="submit" size="icon" aria-label="Search" disabled={busy}><Search className="h-4 w-4" /></Button>}</div>
        </form>
        {busy && <p className="text-sm text-muted-foreground">Searching…</p>}
        {!busy && !shown.length && <p className="py-6 text-center text-sm text-muted-foreground">{source === "lookup" ? "No results yet." : "No saved selections found."}</p>}
        <div className="space-y-3">{shown.map((item, i) => <article key={`${item.reference}-${i}`} className="rounded-lg border border-border bg-card p-4"><p className="text-xs font-medium text-primary">{item.reference}</p><p dir="rtl" className="my-3 font-arabic text-xl leading-loose">{item.arabic_text}</p><p className="whitespace-pre-line text-sm leading-relaxed">{item.translation}</p><Button variant="outline" className="mt-4 w-full" disabled={!item.reference} onClick={() => { setSelected(item); setError(""); }}><Check className="mr-2 h-4 w-4" />Select</Button></article>)}</div>
        {source === "lookup" && type === "sunnah" && hadithPage && <div className="flex items-center justify-between"><Button variant="outline" disabled={busy || hadithPage.page <= 1} onClick={() => void lookup(hadithPage.page - 1)}>Previous</Button><span className="text-sm">{hadithPage.page} / {hadithPage.lastPage}</span><Button variant="outline" disabled={busy || hadithPage.page >= hadithPage.lastPage} onClick={() => void lookup(hadithPage.page + 1)}>Next</Button></div>}
      </> : <>
        <div className="flex items-center justify-between"><p className="text-sm font-medium text-primary">{selected.reference}</p><Button variant="ghost" size="icon" aria-label="Choose another" onClick={() => setSelected(null)}><X className="h-4 w-4" /></Button></div>
        <p dir="rtl" className="font-arabic text-2xl leading-loose">{selected.arabic_text}</p><p className="whitespace-pre-line text-sm leading-relaxed">{selected.translation}</p>
        <div className="border-t border-border pt-5"><h3 className="mb-3 font-semibold">Schedule dates</h3><div className="mb-3 flex flex-wrap gap-2"><Button variant="outline" onClick={() => setDates([date])}>This day</Button><Button variant="outline" onClick={() => setDates([addDays(date, 1)])}>Following day</Button><Button variant="outline" onClick={() => setDates(weekDates(date))}>Full week</Button></div>
          <div className="grid grid-cols-7 gap-1">{weekDates(date).map((d, i) => <label key={d} className="flex cursor-pointer flex-col items-center gap-2 py-2 text-xs"><span>{weekdays[i]}</span><Checkbox checked={dates.includes(d)} onCheckedChange={(checked) => setDates((prev) => checked ? [...new Set([...prev, d])] : prev.filter((key) => key !== d))} /><span>{Number(d.slice(8))}</span></label>)}</div>
          <div className="mt-4 grid grid-cols-2 gap-3"><div><Label htmlFor="range-start">From</Label><Input id="range-start" type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} /></div><div><Label htmlFor="range-end">Until</Label><Input id="range-end" type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} /></div></div><Button variant="outline" className="mt-3 w-full" onClick={setRange}>Select date range</Button>
          <p className="mt-3 text-sm text-muted-foreground">{dates.length} {dates.length === 1 ? "day" : "days"} selected · UTC</p>
          <p className="mt-1 text-xs text-muted-foreground">Existing selections on these dates will be replaced.</p>
        </div>
      </>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
    {selected && <Button disabled={busy || !dates.length} onClick={async () => { setBusy(true); setError(""); try { await save({ data: { type, dates, content: selected } }); await onSaved(dates.length); } catch { setError("Couldn't save. Please try again."); } finally { setBusy(false); } }}>{busy ? "Saving…" : `Save for ${dates.length} ${dates.length === 1 ? "day" : "days"}`}</Button>}
  </DialogContent></Dialog>;
}

async function fetchVerse(key: string): Promise<DailyContent> {
  if (!parseVerseRef(key)) throw new Error("Invalid verse");
  const v = await getVerseByKey(key);
  if (!v.text || !v.translation) throw new Error("Verse unavailable");
  return { arabic_text: v.text, translation: v.translation, reference: `Quran ${v.key}` };
}