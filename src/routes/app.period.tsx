import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BatteryLow, BookOpen, Brain, CalendarIcon, Check, ChevronLeft, ChevronRight, CircleDot, Droplets, Frown,
  Info, Lock, Pencil, Sparkles, Trash2, Zap,
} from "lucide-react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { triggerHaptic } from "@/lib/theme";
import {
  EVENT, addK, deleteCycle, diffDays, endPeriod, getChecklist, getCycles, getGratitude, getStats,
  getSymptoms, gratitudeHistory, isPeriodDay, isPredictedPeriodDay, keyOf, openCycle, parseK,
  saveCycleRange, setGratitude, startPeriod, todayK, toggleChecklist, toggleSymptom, type Cycle, type Stats, type Symptom,
} from "@/lib/period";
import {
  EARNING_HADITH, PAIN_DUA, SUNNAH_SECTIONS, type SunnahItem,
} from "@/data/period-sunnah";
import {
  PRAYER_LABELS, fetchDay, getPrayerSettings, slotsForDay,
} from "@/lib/prayer-times";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const Route = createFileRoute("/app/period")({
  head: () => ({
    meta: [
      { title: "Period Companion, Sahih Al-Adhkar" },
      { name: "description", content: "A private cycle tracker with authentic guidance on what pauses and what continues during the period." },
      { property: "og:title", content: "Period Companion, Sahih Al-Adhkar" },
      { property: "og:description", content: "Private cycle tracking and verified Sunnah guidance for staying close to Allah." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PeriodCompanion,
});

type Tab = "today" | "cycle" | "learn";

type CheckItem = { id: string; label: string; to?: "/app" | "/app/evening" | "/app/tasbih"; info?: boolean; gratitude?: boolean };
const CHECK_ITEMS: CheckItem[] = [
  { id: "morning", label: "Morning Adhkar", to: "/app" },
  { id: "evening", label: "Evening Adhkar", to: "/app/evening" },
  { id: "dhikr", label: "Dhikr — SubhanAllah, Alhamdulillah, La ilaha illAllah, Allahu Akbar", to: "/app/tasbih" },
  { id: "dua", label: "Make dua today" },
  { id: "salawat", label: "Send salawat on the Prophet ﷺ" },
  { id: "istighfar", label: "Istighfar — seek forgiveness" },
  { id: "read-quran", label: "Read Quran", info: true },
  { id: "listen-quran", label: "Listen to Quran — unanimously agreed upon" },
  { id: "sujood", label: "Sujood Shukr — prostration of gratitude" },
  { id: "sadaqah", label: "Give sadaqah — even a smile is charity" },
  { id: "learn", label: "Learn something new about the deen" },
  { id: "gratitude", label: "Gratitude — 3 things you're thankful for today", gratitude: true },
];

const SYMPTOM_META: Record<Symptom, { label: string; Icon: typeof Zap }> = {
  cramps: { label: "Cramps", Icon: Zap },
  headache: { label: "Headache", Icon: Brain },
  "low-mood": { label: "Low mood", Icon: Frown },
  "low-energy": { label: "Low energy", Icon: BatteryLow },
  bloating: { label: "Bloating", Icon: CircleDot },
};

const saw = (t: string) => t.split("ﷺ").flatMap((part, i) => (i ? [<span key={i} className="period-saw">ﷺ</span>, part] : [part]));

const fmt = (k: string) => parseK(k).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function useTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const f = () => set((n) => n + 1);
    window.addEventListener(EVENT, f);
    return () => window.removeEventListener(EVENT, f);
  }, []);
}

function PeriodCompanion() {
  useTick();
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("today");
  const [openSection, setOpenSection] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const goLearn = (id: string) => {
    setOpenSection(id);
    setTab("learn");
    setTimeout(() => document.getElementById(`sec-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  };

  return (
    <>
      <header className="page-header period-header relative overflow-hidden" style={{ background: "var(--grad-header)", color: "var(--header-fg)" }}>
        <HeaderBackButton />
        <div className="relative mx-auto max-w-md px-16 pb-4 pt-7 text-center">
          <div className="label-caps" style={{ color: "var(--header-sub)", opacity: 1 }}>Period Companion</div>
          <h1 className="app-page-title mt-2">Stay Close</h1>
        </div>
        <div className="period-tabs mx-auto max-w-md" role="tablist">
          {(["today", "cycle", "learn"] as Tab[]).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "is-active" : ""}
              onClick={() => { setTab(t); void triggerHaptic("light"); }}>
              {t === "today" ? "Today" : t === "cycle" ? "Cycle" : "Learn"}
            </button>
          ))}
        </div>
      </header>
      <main className="scroll-area period-scroll-area">
        <div className="mx-auto max-w-md space-y-4 px-5 pb-8 pt-4">
          {mounted && tab === "today" && <TodayView goLearn={goLearn} goCycle={() => setTab("cycle")} />}
          {mounted && tab === "cycle" && <CycleView />}
          {mounted && tab === "learn" && <LearnView open={openSection} setOpen={setOpenSection} />}
          {mounted && <p className="period-muted flex items-center justify-center gap-1 pt-2 text-[11px]"><Lock size={11} /> Private — stored only on your device</p>}
        </div>
      </main>
    </>
  );
}

// ================= TODAY =================

function TodayView({ goLearn, goCycle }: { goLearn: (id: string) => void; goCycle: () => void }) {
  const today = todayK();
  const stats = getStats();
  const onPeriod = isPeriodDay(today);
  const open = openCycle();
  const symptoms = getSymptoms();
  const cycles = getCycles();
  const endedToday = cycles.find((c) => c.end === today && c.endedAt);
  const daysToNext = stats.nextStart ? diffDays(today, stats.nextStart) : null;
  const soon = !onPeriod && daysToNext !== null && daysToNext >= 1 && daysToNext <= 2;
  const ending = open && diffDays(open.start, today) + 1 >= stats.avgPeriod;

  return (
    <div className="period-today space-y-4">
      {soon && (
        <div className="period-card period-soft">
          <p className="font-semibold">Your period may be starting soon. Here's how to prepare spiritually.</p>
          <button className="period-link mt-2" onClick={() => goLearn("continues")}>What continues <ChevronRight size={14} /></button>
        </div>
      )}

      {ending && (
        <div className="period-card period-soft">
          <p className="font-semibold">Your period may be ending. Here's your ghusl guide.</p>
          <button className="period-link mt-2" onClick={() => goLearn("ends")}>Open ghusl guide <ChevronRight size={14} /></button>
        </div>
      )}

      {endedToday && <SalahDue cycle={endedToday} onReadAftercare={() => goLearn("ends")} />}

      <div className="period-card period-status-card">
        <div className="period-status-title">{onPeriod ? "Your period" : "Your cycle"}</div>
        <div className="period-status-day">
          {open ? `Day ${diffDays(open.start, today) + 1}` : stats.currentDay ? `Day ${stats.currentDay}` : "Ready"}
        </div>
        <div className="period-status-note">
          <Droplets size={15} />
          {open
            ? (open.start === today ? "Started today" : `Started ${fmt(open.start)}`)
            : stats.nextStart ? `Next period expected ${fmt(stats.nextStart)}` : "No cycles logged yet"}
        </div>
        {open ? (
          <button className="period-btn period-status-action" onClick={() => { endPeriod(today); void triggerHaptic("medium"); }}>Period ended today</button>
        ) : (
          <button className="period-btn period-status-action" onClick={() => { startPeriod(today); void triggerHaptic("medium"); }}>Period started today</button>
        )}
        <button className="period-calendar-link" onClick={goCycle}>Edit period dates <ChevronRight size={15} /></button>
      </div>

      <SymptomsCard />

      {onPeriod ? (
        <>
          <button className="period-banner period-daily-reminder" onClick={() => goLearn("continues")}>
            <Sparkles size={18} />
            <span><strong>Stay Close to Allah</strong><small>See the worship and remembrance that continue during your period.</small></span>
            <ChevronRight size={18} />
          </button>
          <div className="period-card">
            <div className="period-eyebrow">You're Still Earning</div>
            <p className="arabic mt-2 text-right text-[20px] leading-[1.9]" lang="ar" dir="rtl">{EARNING_HADITH.arabic}</p>
            <p className="mt-2 text-sm italic">“{EARNING_HADITH.translation}”</p>
            <p className="period-muted mt-1 text-[11px]">{EARNING_HADITH.source}</p>
            <p className="mt-3 text-sm font-semibold">Your regular worship is still being recorded. Nothing is missing from your record.</p>
          </div>
          <Checklist goLearn={goLearn} />
        </>
      ) : (
        <p className="period-muted px-2 text-center text-xs">
          On days you log your period, a daily “Stay Close to Allah” checklist appears here.
        </p>
      )}
    </div>
  );
}

function SalahDue({ cycle, onReadAftercare }: { cycle: Cycle; onReadAftercare: () => void }) {
  const [prayer, setPrayer] = useState<string | null>(null);
  const ended = new Date(cycle.endedAt!);
  useEffect(() => {
    const s = getPrayerSettings();
    if (!s.location) return;
    void fetchDay(ended, s).then((day) => {
      if (!day) return;
      const slots = slotsForDay(day);
      const t = ended.getTime();
      const last = [...slots].reverse().find((x) => x.at.getTime() <= t);
      // Inside a prayer's window: that prayer is due. After sunrise or before Fajr: the next one.
      if (last && last.id !== "sunrise") setPrayer(PRAYER_LABELS[last.id]);
      else setPrayer(PRAYER_LABELS[(slots.find((x) => x.at.getTime() > t && x.id !== "sunrise") ?? slots[0]).id]);
    });
  }, [cycle.endedAt]);
  const time = ended.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return (
    <div className="period-card period-soft">
      <div className="period-eyebrow">Welcome back</div>
      <p className="text-sm font-semibold">
        Your period ended at {time}.{prayer ? ` Your next prayer is ${prayer}.` : " Set your location on the Salah tab to see which prayer is due."}
      </p>
      <p className="period-muted mt-1 text-xs">If your period ends before a prayer's time passes, that prayer is due after ghusl.</p>
      <button className="period-link mt-3" onClick={onReadAftercare}>Read aftercare and ghusl guidance <ChevronRight size={14} /></button>
    </div>
  );
}

function SymptomsCard() {
  const s = getSymptoms();
  const [showDua, setShowDua] = useState(false);
  const selectSymptom = (symptom: Symptom) => {
    toggleSymptom(symptom);
    void triggerHaptic("light");
  };
  const hasPain = s.includes("cramps") || s.includes("headache");
  return (
    <>
      <div className="period-card period-symptoms-card">
        <div className="period-section-title">How are you feeling today?</div>
        <p className="period-symptom-intro">Choose all that apply. Your selections are saved for today.</p>
        <div className="period-symptom-grid mt-3">
          {(Object.keys(SYMPTOM_META) as Symptom[]).map((k) => {
            const { label, Icon } = SYMPTOM_META[k];
            const on = s.includes(k);
            return (
              <button key={k} className={`period-chip ${on ? "is-on" : ""}`} aria-pressed={on}
                onClick={() => selectSymptom(k)}>
                <span className="period-chip-icon"><Icon size={19} />{on && <Check size={11} strokeWidth={3} />}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        {hasPain && (
          <button className="period-relief-row" onClick={() => setShowDua(true)}>
            <span className="period-relief-icon"><Sparkles size={17} /></span>
            <span><strong>Relief dua for pain</strong><small>Read the authentic dua for cramps or headache</small></span>
            <ChevronRight size={17} />
          </button>
        )}
      </div>
      <Dialog open={showDua} onOpenChange={setShowDua}>
        <DialogContent className="period-dialog period-relief-dialog [&>button:last-child]:hidden">
          <div className="period-dialog-head">
            <span className="period-learn-book"><BookOpen size={21} /></span>
            <span><DialogTitle>Relief dua for pain</DialogTitle><DialogDescription>For cramps, headaches, or pain anywhere in the body</DialogDescription></span>
          </div>
          <div className="period-dialog-scroll"><SunnahCard item={PAIN_DUA} compact /></div>
          <Button className="period-btn w-full" onClick={() => setShowDua(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Checklist({ goLearn }: { goLearn: (id: string) => void }) {
  const done = new Set(getChecklist());
  const [showGratitude, setShowGratitude] = useState(false);
  const count = CHECK_ITEMS.filter((i) => done.has(i.id)).length;
  return (
    <div className="period-card">
      <div className="flex items-center justify-between">
        <div className="period-eyebrow">Stay Close to Allah</div>
        <span className="period-muted text-xs font-semibold">{count} of {CHECK_ITEMS.length} done today</span>
      </div>
      {count === CHECK_ITEMS.length && (
        <p className="period-banner mt-3 text-sm">Every item done today. May Allah accept it from you.</p>
      )}
      <ul className="mt-2">
        {CHECK_ITEMS.map((it) => {
          const on = done.has(it.id);
          return (
            <li key={it.id} className="period-check-row">
              <button className={`period-check ${on ? "is-on" : ""}`} aria-pressed={on} aria-label={it.label}
                onClick={() => { toggleChecklist(it.id); void triggerHaptic("light"); }}>
                {on && <Check size={14} strokeWidth={2.6} />}
              </button>
              <span className="flex-1 text-sm">{it.label}</span>
              {it.info && (
                <button className="period-icon-btn" aria-label="Scholars differ on reciting" onClick={() => goLearn("differ")}>
                  <Info size={16} />
                </button>
              )}
              {it.to && (
                <Link to={it.to} className="period-icon-btn" aria-label={`Open ${it.label}`}><ChevronRight size={16} /></Link>
              )}
              {it.gratitude && (
                <button className="period-icon-btn" aria-label="Open gratitude notes" onClick={() => setShowGratitude((v) => !v)}>
                  <ChevronRight size={16} style={{ transform: showGratitude ? "rotate(90deg)" : undefined }} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {showGratitude && <Gratitude />}
    </div>
  );
}

function Gratitude() {
  const [lines, setLines] = useState<string[]>(() => getGratitude());
  const history = useMemo(() => gratitudeHistory().filter((h) => h.date !== todayK()).slice(0, 10), []);
  const update = (i: number, v: string) => {
    const next = [...lines];
    next[i] = v;
    setLines(next);
    setGratitude(next);
    if (next.some((x) => x.trim()) && !getChecklist().includes("gratitude")) toggleChecklist("gratitude");
  };
  return (
    <div className="mt-3 space-y-2">
      {[0, 1, 2].map((i) => (
        <input key={i} className="period-input" placeholder={`${i + 1}. I'm grateful for…`} value={lines[i] ?? ""}
          onChange={(e) => update(i, e.target.value)} />
      ))}
      {history.length > 0 && (
        <details className="adhkar-commentary">
          <summary>Past gratitude notes</summary>
          <div className="space-y-2 pb-2">
            {history.map((h) => (
              <div key={h.date} className="text-xs">
                <div className="period-muted font-semibold">{fmt(h.date)}</div>
                {h.lines.filter((l) => l.trim()).map((l, i) => <div key={i}>{l}</div>)}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ================= CYCLE =================

function CycleView() {
  const today = todayK();
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState(today);
  const stats: Stats = getStats();
  const cycles = getCycles();
  const [editor, setEditor] = useState<{ cycle?: Cycle; start: string; end: string; ongoing: boolean } | null>(null);

  const cells = useMemo(() => {
    const first = new Date(month);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= days; d++) out.push(keyOf(new Date(month.getFullYear(), month.getMonth(), d)));
    return out;
  }, [month]);

  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const future = selected > today;
  const openEditor = (cycle?: Cycle) => {
    const start = cycle?.start ?? selected;
    const isToday = start === today;
    setEditor({ cycle, start, end: cycle?.end ?? start, ongoing: cycle ? !cycle.end : isToday });
  };

  return (
    <div className="period-cycle-view space-y-3">
      <div className="period-card period-calendar-card">
        <div className="period-calendar-heading">
          <Button variant="ghost" size="icon" className="period-icon-btn" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={20} /></Button>
          <div className="period-calendar-month">{month.toLocaleString(undefined, { month: "long", year: "numeric" })}</div>
          <Button variant="ghost" size="icon" className="period-icon-btn" aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={20} /></Button>
        </div>
        <div className="period-calendar-grid">
          {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => <div key={i} className="period-weekday">{w}</div>)}
          {cells.map((k, i) => {
            if (!k) return <div key={i} />;
            const cls = [
              "period-day",
              isPeriodDay(k) ? "is-period" : "",
              isPredictedPeriodDay(k) ? "is-predicted" : "",
              stats.ovulation === k ? "is-ovulation" : "",
              k === today ? "is-today" : "",
              k === selected ? "is-selected" : "",
            ].join(" ");
            return <button key={k} className={cls} onClick={() => setSelected(k)}>{parseK(k).getDate()}</button>;
          })}
        </div>
        <div className="period-legend">
          <span><i className="is-period" /> Period</span>
          <span><i className="is-predicted" /> Predicted</span>
          <span><i className="is-ovulation" /> Ovulation</span>
        </div>
        <div className="period-calendar-actions">
          <Button className="period-btn period-calendar-primary" disabled={future} onClick={() => openEditor()}>
            <CalendarIcon size={16} /> Log a period
          </Button>
          <p>Choose any past date to add history and improve predictions.</p>
        </div>
      </div>

      <div className="period-cycle-stats">
        <Stat label="Current" value={stats.currentDay ? `Day ${stats.currentDay}` : "—"} />
        <Stat label="Avg cycle" value={`${stats.avgCycle} days`} />
        <Stat label="Next period" value={stats.nextStart ? fmt(stats.nextStart) : "—"} />
      </div>
      <p className="period-prediction-note">
        {stats.cyclesLogged < 2
          ? "Add at least two past periods for predictions based on your cycle. Until then, estimates use a 28-day cycle."
          : `Predictions use your last ${Math.min(stats.cyclesLogged, 6)} logged cycles and update automatically.`}
      </p>

      {cycles.length > 0 && (
        <div className="period-card">
          <div className="period-eyebrow">History</div>
          <ul className="mt-2">
            {[...cycles].reverse().map((c, i, arr) => {
              const prev = arr[i + 1];
              return (
                <li key={c.start} className="period-check-row">
                  <Droplets size={15} className="period-accent" />
                  <span className="flex-1 text-sm">
                    {fmt(c.start)} – {c.end ? fmt(c.end) : "ongoing"}
                    {c.end && <span className="period-muted"> · {diffDays(c.start, c.end) + 1} days</span>}
                    {prev && <span className="period-muted"> · cycle {diffDays(prev.start, c.start)}d</span>}
                  </span>
                  <button className="period-icon-btn" aria-label="Edit period" onClick={() => openEditor(c)}><Pencil size={14} /></button>
                  <button className="period-icon-btn" aria-label="Delete period" onClick={() => deleteCycle(c.start)}><Trash2 size={15} /></button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <PeriodEditor editor={editor} setEditor={setEditor} />
    </div>
  );
}

function PeriodEditor({
  editor,
  setEditor,
}: {
  editor: { cycle?: Cycle; start: string; end: string; ongoing: boolean } | null;
  setEditor: (value: { cycle?: Cycle; start: string; end: string; ongoing: boolean } | null) => void;
}) {
  const [error, setError] = useState("");
  useEffect(() => setError(""), [editor]);
  if (!editor) return null;
  const save = () => {
    const result = saveCycleRange(editor.start, editor.ongoing ? undefined : editor.end, editor.cycle?.start);
    if (!result.ok) { setError(result.error); return; }
    void triggerHaptic("medium");
    setEditor(null);
  };
  return (
    <Dialog open onOpenChange={(next) => { if (!next) setEditor(null); }}>
      <DialogContent className="period-dialog period-editor-dialog [&>button:last-child]:hidden">
        <div className="period-dialog-head">
          <span className="period-learn-book"><CalendarIcon size={21} /></span>
          <span>
            <DialogTitle>{editor.cycle ? "Edit period" : "Log a period"}</DialogTitle>
            <DialogDescription>Add current or past dates to improve your predictions.</DialogDescription>
          </span>
        </div>
        <div className="period-date-fields">
          <DateField label="Started" value={editor.start} onChange={(start) => setEditor({ ...editor, start, end: editor.end < start ? start : editor.end })} />
          <DateField label="Ended" value={editor.end} disabled={editor.ongoing} min={editor.start}
            onChange={(end) => setEditor({ ...editor, end })} />
        </div>
        <label className="period-ongoing-row">
          <input type="checkbox" checked={editor.ongoing} onChange={(event) => setEditor({ ...editor, ongoing: event.target.checked })} />
          <span>This period is still ongoing</span>
        </label>
        {error && <p className="period-form-error" role="alert">{error}</p>}
        <div className="period-dialog-actions">
          <Button variant="outline" className="period-btn is-ghost" onClick={() => setEditor(null)}>Cancel</Button>
          <Button className="period-btn" onClick={save}>{editor.cycle ? "Save changes" : "Save period"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DateField({ label, value, onChange, disabled = false, min }: { label: string; value: string; onChange: (value: string) => void; disabled?: boolean; min?: string }) {
  const selected = parseK(value);
  const minDate = min ? parseK(min) : undefined;
  return (
    <div className="period-date-field">
      <label>{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" disabled={disabled} className="period-date-trigger">
            <CalendarIcon size={15} /> {selected.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="pointer-events-auto w-auto p-0" align="center">
          <Calendar mode="single" selected={selected} defaultMonth={selected} captionLayout="dropdown" startMonth={new Date(new Date().getFullYear() - 10, 0)} endMonth={new Date()}
            disabled={(date) => date > new Date() || Boolean(minDate && date < minDate)} onSelect={(date) => { if (date) onChange(keyOf(date)); }} className="pointer-events-auto p-3" />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="period-card period-stat-card">
      <div className="period-stat-label">{label}</div>
      <div className="period-stat-value">{value}</div>
    </div>
  );
}

// ================= LEARN =================

function LearnView({ open, setOpen }: { open: string | null; setOpen: (id: string | null) => void }) {
  return (
    <div className="period-learn-view">
      <div className="period-card period-learn-intro">
        <span className="period-learn-book" aria-hidden="true"><BookOpen size={25} strokeWidth={1.7} /></span>
        <span>
          <strong>The Period in the Sunnah</strong>
          <small>What pauses, what continues, and what was actually taught — every source verified.</small>
        </span>
      </div>
      <div className="period-card period-learn-list">
        {SUNNAH_SECTIONS.map((s, idx) => {
          const isOpen = open === s.id;
          return (
            <section key={s.id} id={`sec-${s.id}`} className={`period-learn-section scroll-mt-4 ${isOpen ? "is-open" : ""}`}>
              <button className="period-acc-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
                <span className="period-acc-num">{idx + 1}</span>
                <span className="flex-1 text-left text-[15px] font-semibold">{saw(s.title)}</span>
                <ChevronRight size={17} strokeWidth={1.8} />
              </button>
              {isOpen && (
                <div className="period-learn-body space-y-4">
                  {s.intro && <p className={s.id === "duas" ? "period-callout is-grey" : "period-muted text-sm"}>{s.intro}</p>}
                  {s.items.map((it) => <SunnahCard key={it.id} item={it} />)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

function SunnahCard({ item, compact = false }: { item: SunnahItem; compact?: boolean }) {
  return (
    <article className={compact ? "period-relief-prayer" : "period-item"}>
      {!compact && <h3 className="text-sm font-bold">{saw(item.title)}</h3>}
      {compact && <h3 className="text-sm font-bold">{saw(item.title)}</h3>}
      <div className="period-source mt-1"><BookOpen size={12} /> {item.source}</div>
      {item.arabic && (
        <p className="arabic mt-3 whitespace-pre-line text-right text-[21px] leading-[1.95]" lang="ar" dir="rtl">{item.arabic}</p>
      )}
      {item.transliteration && <p className="adhkar-transliteration mt-2 !text-left text-[13px]">{item.transliteration}</p>}
      {item.translation && <p className="mt-2 text-sm">{item.translation}</p>}
      {item.narration && (
        <details className="adhkar-commentary">
          <summary>Full narration</summary>
          <p className="pb-1 text-sm">{item.narration}</p>
        </details>
      )}
      {item.notes && (
        compact ? (
          <details className="adhkar-commentary"><summary>Commentary</summary>{item.notes.map((n, i) => <p key={i} className="pb-1 text-sm">{n}</p>)}</details>
        ) : item.notes.map((n, i) => <p key={i} className="period-muted mt-2 text-sm leading-relaxed">{n}</p>)
      )}
      {item.callout && (
        <div className={`period-callout mt-3 ${item.callout.tone === "amber" ? "is-amber" : "is-grey"}`}>
          <strong>{item.callout.label}</strong> — {item.callout.text}
        </div>
      )}
    </article>
  );
}
