import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { RecallBlock } from "@/components/hifz/RecallBlock";
import { hifzChapters, type MChapter } from "@/lib/hifz/mushaf";
import { derive, loadHifz, recordEvents } from "@/lib/hifz/store";
import { daysBetween, localDay, type Grade } from "@/lib/hifz/scheduler";
import { buildQueue, drillEvent, pickDrills, sabaqProgress, salahEvents, type Drill, type EventInput, type SalahOutcome } from "@/lib/hifz/session";
import { countLines, surahAyahs } from "@/lib/hifz/layout";
import { rescheduleHifzReminder } from "@/lib/notifications";

export const Route = createFileRoute("/app/hifz_/today")({
  head: () => ({
    meta: [
      { title: "Today's Hifz session, Sahih Al-Adhkar" },
      { name: "description", content: "Your daily Quran memorization queue: manzil, sabqi and new lines, with transition drills." },
      { property: "og:title", content: "Today's Hifz session, Sahih Al-Adhkar" },
      { property: "og:description", content: "Manzil, sabqi and sabaq in one calm daily session." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: { practice?: unknown }): { practice?: number } => (Number(s.practice) > 0 ? { practice: Number(s.practice) } : {}),
  component: Today,
});

const CATCHUP = "hifz:catchup";
/** "Catching up: day X of ~N": day counts from the first capped day; N re-estimates from what's still due. */
function catchUpDay(paused: boolean, days: number): { day: number; of: number } | null {
  try {
    if (!paused) { localStorage.removeItem(CATCHUP); return null; }
    const today = localDay(new Date());
    let start = localStorage.getItem(CATCHUP);
    if (!start) { start = today; localStorage.setItem(CATCHUP, start); }
    const day = daysBetween(start, today) + 1;
    return { day, of: day - 1 + days };
  } catch { return null; }
}

type Item =
  | { t: "manzil"; page: number }
  | { t: "sabqi"; page: number; keys: string[] }
  | { t: "drill"; drill: Drill }
  | { t: "sabaq"; keys: string[] };
type Snapshot = { day: string; items: Item[]; done: number };
const SNAP = "hifz:today";

const card = { background: "var(--surface)", border: "1px solid var(--border)" };
const soft = { background: "var(--background)", border: "1px solid var(--border)" };
const on = { background: "var(--accent)", color: "var(--accent-foreground)" };
const muted = { color: "var(--muted-foreground)" };

/** Today's queue is frozen once per local day so it can be paused and resumed; each graded item is saved immediately. */
function loadSnapshot(): Snapshot {
  const today = localDay(new Date());
  try {
    const s = JSON.parse(localStorage.getItem(SNAP) || "null") as Snapshot | null;
    if (s && s.day === today) return s;
  } catch { /* rebuild */ }
  const st = loadHifz();
  const d = derive(st.events);
  const q = buildQueue(d, today, st.plan?.goal, st.plan?.paceLines ?? 5);
  const items: Item[] = [
    ...q.manzil.map((page) => ({ t: "manzil" as const, page })),
    ...q.sabqi.map((g) => ({ t: "sabqi" as const, page: g.page, keys: g.keys })),
    ...pickDrills(d).map((drill) => ({ t: "drill" as const, drill })),
    ...(q.sabaq.length ? [{ t: "sabaq" as const, keys: q.sabaq }] : []),
  ];
  const snap = { day: today, items, done: 0 };
  saveSnapshot(snap);
  return snap;
}
function saveSnapshot(s: Snapshot) {
  try { localStorage.setItem(SNAP, JSON.stringify(s)); } catch { /* ignore */ }
}

function Today() {
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [running, setRunning] = useState(false);
  const [salahOpen, setSalahOpen] = useState(false);
  const [chapters, setChapters] = useState<MChapter[]>([]);
  const navigate = useNavigate();
  const { practice } = Route.useSearch();
  useEffect(() => {
    let s = loadSnapshot();
    // Sabaq completes only once every new ayah has been graded at L4 in the recall loop.
    const cur = s.items[s.done];
    if (cur?.t === "sabaq" && sabaqProgress(cur.keys, derive(loadHifz().events)).done) { s = { ...s, done: s.done + 1 }; saveSnapshot(s); }
    setSnap(s);
    hifzChapters().then(setChapters).catch(() => {});
    void rescheduleHifzReminder();
  }, []);

  const st = useMemo(() => (snap ? loadHifz() : null), [snap]);
  const q = useMemo(() => (st ? buildQueue(derive(st.events), localDay(new Date()), st.plan?.goal, st.plan?.paceLines ?? 5) : null), [st]);
  if (!snap || !q || !st) return null;

  const items = snap.items;
  const left = items.slice(snap.done);
  const count = (t: Item["t"]) => left.filter((i) => i.t === t).length;
  const sabaqItem = items.find((i) => i.t === "sabaq") as Extract<Item, { t: "sabaq" }> | undefined;
  const minutes = Math.max(0, Math.round(left.reduce((s, i) => s + (i.t === "manzil" ? 3 : i.t === "sabqi" ? i.keys.length : i.t === "drill" ? 0.5 : countLines(i.keys) * 1.5), 0)));
  const current = items[snap.done];
  const name = (c: number) => chapters.find((x) => x.id === c)?.name ?? `Surah ${c}`;
  const ref = (k: string) => { const [c, a] = k.split(":"); return `${name(+c)} ${a}`; };
  const span = (ks: string[]) => {
    const [c1, a1] = ks[0].split(":"), [c2, a2] = ks[ks.length - 1].split(":");
    return ks.length === 1 ? ref(ks[0]) : c1 === c2 ? `${name(+c1)} ${a1}–${a2}` : `${ref(ks[0])} – ${ref(ks[ks.length - 1])}`;
  };

  const advance = (events: EventInput[]) => {
    if (events.length) recordEvents(events);
    const next = { ...snap, done: snap.done + 1 };
    saveSnapshot(next);
    setSnap(next);
    if (next.done >= items.length) { setRunning(false); void rescheduleHifzReminder(); }
  };

  function grade(g: Grade, errorWords: string[]) {
    if (!current) return;
    if (current.t === "manzil") {
      const errorKeys = [...new Set(errorWords.map((w) => w.split(":").slice(0, 2).join(":")))];
      advance([{ kind: "page", session: "session", key: String(current.page), page: current.page, grade: g, errorKeys, errorWords }]);
    } else if (current.t === "sabqi") {
      advance(current.keys.map((k) => ({ kind: "ayah", session: "session", key: k, page: current.page, grade: g, errorWords: errorWords.filter((w) => w.startsWith(k + ":")) })));
    } else if (current.t === "drill") {
      advance([drillEvent(current.drill, g, errorWords)]);
    }
  }

  const d0 = derive(st.events);
  const sabaqProg = sabaqItem ? sabaqProgress(sabaqItem.keys, d0) : null;
  const catchUp = catchUpDay(q.backlog.paused, q.backlog.days);

  const header = (
    <header className="page-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
      <HeaderBackButton />
      <div className="relative mx-auto max-w-md pb-6 pt-9 text-center" style={{ paddingLeft: 60, paddingRight: 60 }}>
        <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>Hifz Companion</div>
        <h1 className="app-page-title mt-2">Today</h1>
      </div>
    </header>
  );

  if (practice) {
    const keys = Object.values(d0.ayahs).filter((a) => a.page === practice).map((a) => a.key).sort((a, b) => { const [x, y] = a.split(":").map(Number), [u, v] = b.split(":").map(Number); return x - u || y - v; });
    const inManzil = !!d0.pages[practice]?.inManzil;
    return (
      <>
        {header}
        <main className="scroll-area">
          <div className="mx-auto max-w-md space-y-4 px-4 py-4" style={{ color: "var(--foreground)" }}>
            <section className="glass-card p-4" style={card}>
              <div className="label-caps">Practice · {inManzil ? "manzil page" : "sabqi"}</div>
              <h2 className="mt-1 text-xl font-semibold">Page {practice}</h2>
              <p className="mt-1 text-sm" style={muted}>Recite the memorized ayahs from the cue. Your grade is saved as a review.</p>
            </section>
            {keys.length ? (
              <RecallBlock
                keys={keys}
                cue
                onGrade={(g, errorWords) => {
                  if (inManzil) {
                    const errorKeys = [...new Set(errorWords.map((w) => w.split(":").slice(0, 2).join(":")))];
                    recordEvents([{ kind: "page", session: "session", key: String(practice), page: practice, grade: g, errorKeys, errorWords }]);
                  } else recordEvents(keys.map((k) => ({ kind: "ayah", session: "session", key: k, page: practice, grade: g, errorWords: errorWords.filter((w) => w.startsWith(k + ":")) })));
                  void rescheduleHifzReminder();
                  navigate({ to: "/app/hifz/progress" });
                }}
              />
            ) : <p className="text-sm" style={muted}>Nothing memorized on this page yet.</p>}
          </div>
        </main>
      </>
    );
  }

  if (running && current) {
    const label =
      current.t === "manzil" ? { kicker: "Manzil · whole page", title: `Page ${current.page}`, hint: "Recite the page from memory, starting from the cue." }
      : current.t === "sabqi" ? { kicker: "Sabqi", title: span(current.keys), hint: "Recite these ayahs together from the cue." }
      : current.t === "drill" ? { kicker: "Transition drill", title: `${ref(current.drill.prev)} → ${current.drill.next.split(":")[0] === current.drill.prev.split(":")[0] ? current.drill.next.split(":")[1] : ref(current.drill.next)}`, hint: "Read the end of the ayah, then recite the start of the next one." }
      : { kicker: "Sabaq · new lines", title: span(current.keys), hint: "" };
    const memorized = current.t === "manzil" ? Object.values(derive(st.events).ayahs).filter((a) => a.page === current.page).map((a) => a.key).sort((a, b) => { const [x, y] = a.split(":").map(Number), [u, v] = b.split(":").map(Number); return x - u || y - v; }) : [];
    return (
      <>
        {header}
        <main className="scroll-area">
          <div className="mx-auto max-w-md space-y-4 px-4 py-4" style={{ color: "var(--foreground)" }}>
            <div className="flex items-center justify-between text-sm">
              <button onClick={() => setRunning(false)} className="min-h-11 underline" style={muted}>Pause</button>
              <span style={muted}>{snap.done + 1} of {items.length}</span>
            </div>
            <section className="glass-card p-4" style={card}>
              <div className="label-caps">{label.kicker}</div>
              <h2 className="mt-1 text-xl font-semibold">{label.title}</h2>
              {label.hint && <p className="mt-1 text-sm" style={muted}>{label.hint}</p>}
            </section>
            {current.t === "sabaq" ? (
              <section className="glass-card space-y-3 p-4" style={card}>
                <p className="text-sm">{countLines(current.keys)} new lines today. You'll learn them with the recall loop: listen, hide step by step, then recite and grade at the last level.</p>
                {sabaqProg && sabaqProg.lines > 0 && <p className="text-sm font-semibold">{sabaqProg.lines} of {sabaqProg.total} lines done</p>}
                <p className="text-xs" style={muted}>This step is complete once every chunk is graded at the hidden level. New ayahs join your reviews only when graded.</p>
                <button onClick={() => navigate({ to: "/app/hifz", search: { session: 1 } as never })} className="min-h-12 w-full rounded-full text-sm font-semibold" style={on}>{sabaqProg && sabaqProg.lines > 0 ? "Continue new lines" : "Start new lines"}</button>
              </section>
            ) : (
              <RecallBlock
                key={`${snap.done}`}
                keys={current.t === "manzil" ? memorized : current.t === "sabqi" ? current.keys : [current.drill.next]}
                lead={current.t === "drill" ? { key: current.drill.prev, words: 4 } : undefined}
                cue={current.t !== "drill"}
                onGrade={grade}
              />
            )}
          </div>
        </main>
      </>
    );
  }

  const started = snap.done > 0;
  return (
    <>
      {header}
      <main className="scroll-area">
        <div className="mx-auto max-w-md space-y-4 px-4 py-4" style={{ color: "var(--foreground)" }}>
          {!st.plan && (
            <section className="glass-card p-4 text-sm" style={card}>
              Set a goal first so new lines can be planned. <Link to="/app/hifz" className="font-semibold underline">Open Hifz setup</Link>
            </section>
          )}
          <section className="glass-card space-y-3 p-5" style={card}>
            <div className="flex items-baseline justify-between">
              <h2 className="label-caps">Today's queue</h2>
              <span className="text-sm" style={muted}>about {minutes} min</span>
            </div>
            {([
              ["Manzil", "Whole pages you know", count("manzil"), count("manzil") === 1 ? "page" : "pages"],
              ["Sabqi", "Recent ayahs, page by page", count("sabqi"), count("sabqi") === 1 ? "group" : "groups"],
              ["Transitions", "Ayah-to-ayah drills", count("drill"), count("drill") === 1 ? "drill" : "drills"],
              ["Sabaq", q.backlog.paused ? "Paused while catching up" : sabaqItem ? "Today's new lines" : "Nothing new planned", count("sabaq") && sabaqProg ? (sabaqProg.lines ? `${sabaqProg.lines} of ${sabaqProg.total}` : sabaqProg.total) : 0, "lines"],
            ] as const).map(([t, sub, n, unit], i) => (
              <div key={t} className="flex items-center gap-3 rounded-2xl p-3" style={soft}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold" style={on}>{i + 1}</span>
                <span className="flex-1"><span className="block text-sm font-semibold">{t}</span><span className="block text-xs" style={muted}>{sub}</span></span>
                <span className="text-sm font-semibold">{n}{unit && <span className="font-normal" style={muted}> {unit}</span>}</span>
              </div>
            ))}
            {q.backlog.paused && (
              <p className="rounded-xl p-3 text-sm" style={{ background: "color-mix(in oklab, var(--accent) 14%, transparent)" }}>
                {catchUp && <span className="block font-semibold">Catching up: day {catchUp.day} of ~{catchUp.of}</span>}
                {q.backlog.due} reviews are due, so today shows the {q.backlog.limit} most overdue and weakest. The rest move to the next days, and new lines resume once you're caught up.
              </p>
            )}
            {left.length ? (
              <button onClick={() => setRunning(true)} className="min-h-12 w-full rounded-full text-sm font-semibold" style={on}>{started ? `Resume (${snap.done} of ${items.length} done)` : "Start session"}</button>
            ) : (
              <p className="text-center text-sm">{items.length ? "Done for today. May Allah make it firm in your heart." : "Nothing due today."}</p>
            )}
          </section>

          <section className="glass-card space-y-3 p-5" style={card}>
            <div className="flex items-center justify-between">
              <div><h2 className="label-caps">Recited in Salah</h2><p className="text-xs" style={muted}>Log what you recited in prayer. It counts as a review.</p></div>
              {!salahOpen && <button onClick={() => setSalahOpen(true)} className="min-h-11 rounded-full px-4 text-sm font-semibold" style={soft}>Log</button>}
            </div>
            {salahOpen && <SalahLogger chapters={chapters} onClose={() => { setSalahOpen(false); setSnap({ ...snap }); }} />}
          </section>

          <Link to="/app/hifz/progress" className="glass-card flex min-h-14 items-center justify-between p-4 text-sm font-semibold" style={card}>Progress and forecast <span aria-hidden>→</span></Link>
          <Link to="/app/hifz" className="block text-center text-sm underline" style={muted}>Memorize something else</Link>
        </div>
      </main>
    </>
  );
}

const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha", "Other"];

function SalahLogger({ chapters, onClose }: { chapters: MChapter[]; onClose: () => void }) {
  const d = useMemo(() => derive(loadHifz().events), []);
  const known = Object.keys(d.ayahs);
  const surahs = chapters.filter((c) => known.some((k) => k.startsWith(`${c.id}:`)));
  const [c, setC] = useState(surahs[0]?.id ?? 0);
  const ayahs = known.filter((k) => k.startsWith(`${c}:`)).map((k) => +k.split(":")[1]).sort((a, b) => a - b);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(0);
  const [prayer, setPrayer] = useState("Fajr");
  const [msg, setMsg] = useState("");
  const [offer, setOffer] = useState<{ keys: string[]; o: SalahOutcome } | null>(null);
  useEffect(() => { setFrom(ayahs[0] ?? 1); setTo(ayahs[ayahs.length - 1] ?? 1); }, [c]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!surahs.length) return <p className="text-sm" style={muted}>Once you've memorized something, you can log it here.</p>;
  const save = (o: SalahOutcome, only?: string[]) => {
    const r = salahEvents(d, only ?? surahAyahs(c, Math.min(from, to), Math.max(from, to)), o, prayer.toLowerCase());
    setOffer(null);
    if (!r.ok) { setMsg(r.error); if (r.memorized?.length) setOffer({ keys: r.memorized, o }); return; }
    recordEvents(r.events);
    setMsg(`Logged ${r.events.length} ayah${r.events.length === 1 ? "" : "s"} from ${prayer}.`);
    setTimeout(onClose, 900);
  };
  const input = { ...soft, color: "var(--foreground)" };
  return (
    <div className="space-y-3">
      <select value={c} onChange={(e) => setC(+e.target.value)} className="min-h-11 w-full rounded-xl px-3" style={input} aria-label="Surah">
        {surahs.map((s) => <option key={s.id} value={s.id}>{s.id}. {s.name}</option>)}
      </select>
      <div className="flex items-center gap-2 text-sm">
        Ayah <input type="number" value={from} onChange={(e) => setFrom(+e.target.value || 1)} className="min-h-11 w-20 rounded-xl px-2" style={input} aria-label="From ayah" />
        to <input type="number" value={to} onChange={(e) => setTo(+e.target.value || 1)} className="min-h-11 w-20 rounded-xl px-2" style={input} aria-label="To ayah" />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {PRAYERS.map((p) => <button key={p} onClick={() => setPrayer(p)} className="min-h-10 rounded-xl text-sm font-semibold" style={prayer === p ? on : soft}>{p}</button>)}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {([["smooth", "Smooth"], ["stumbled", "Stumbled"], ["forgot", "Forgot part"]] as const).map(([o, l]) => (
          <button key={o} onClick={() => save(o)} className="min-h-12 rounded-xl text-sm font-semibold" style={o === "smooth" ? on : soft}>{l}</button>
        ))}
      </div>
      {msg && <p className="text-sm" aria-live="polite">{msg}</p>}
      {offer && (
        <button onClick={() => save(offer.o, offer.keys)} className="min-h-12 w-full rounded-full text-sm font-semibold" style={on}>
          Log only the memorized ones ({rangeLabel(offer.keys)})
        </button>
      )}
    </div>
  );
}

/** "2:1–3", or a short list when the memorized ayahs aren't contiguous. */
function rangeLabel(keys: string[]): string {
  const n = keys.map((k) => +k.split(":")[1]);
  const c = keys[0].split(":")[0];
  const contiguous = n.every((x, i) => i === 0 || x === n[i - 1] + 1);
  if (keys.length === 1) return keys[0];
  return contiguous ? `${c}:${n[0]}–${n[n.length - 1]}` : `${c}:${n.slice(0, 4).join(", ")}${n.length > 4 ? "…" : ""}`;
}
