import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BatteryLow, BookOpen, Brain, Check, ChevronLeft, ChevronRight, CircleDot, Droplets, Frown,
  Info, Lock, Share2, Sparkles, Trash2, Zap,
} from "lucide-react";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { triggerHaptic } from "@/lib/theme";
import {
  EVENT, addK, deleteCycle, diffDays, endPeriod, getChecklist, getCycles, getGratitude, getStats,
  getSymptoms, gratitudeHistory, isPeriodDay, isPredictedPeriodDay, keyOf, openCycle, parseK,
  setGratitude, startPeriod, todayK, toggleChecklist, toggleSymptom, type Cycle, type Stats, type Symptom,
} from "@/lib/period";
import {
  EARNING_HADITH, PAIN_DUA, SUNNAH_SECTIONS, sectionShareText, type SunnahItem,
} from "@/data/period-sunnah";
import {
  PRAYER_LABELS, fetchDay, getPrayerSettings, slotsForDay,
} from "@/lib/prayer-times";

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
          <p className="period-private mt-2 inline-flex items-center gap-1 text-xs opacity-90">
            <Lock size={11} /> Private — stored only on your device
          </p>
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
      {symptoms.includes("cramps") && (
        <div className="period-card">
          <div className="period-eyebrow">For your cramps today</div>
          <SunnahCard item={PAIN_DUA} compact />
        </div>
      )}

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

      {endedToday && <SalahDue cycle={endedToday} />}

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
            <span><strong>Daily reminder</strong><small>You can't pray today, but you are not far from Allah. Here's what you can do.</small></span>
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

function SalahDue({ cycle }: { cycle: Cycle }) {
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
    </div>
  );
}

function SymptomsCard() {
  const s = getSymptoms();
  return (
    <div className="period-card period-symptoms-card">
      <div className="period-section-title">How are you feeling today?</div>
      <div className="period-symptom-grid mt-3">
        {(Object.keys(SYMPTOM_META) as Symptom[]).map((k) => {
          const { label, Icon } = SYMPTOM_META[k];
          const on = s.includes(k);
          return (
            <button key={k} className={`period-chip ${on ? "is-on" : ""}`} aria-pressed={on}
              onClick={() => { toggleSymptom(k); void triggerHaptic("light"); }}>
              <Icon size={21} /> <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
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

  const cells = useMemo(() => {
    const first = new Date(month);
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= days; d++) out.push(keyOf(new Date(month.getFullYear(), month.getMonth(), d)));
    return out;
  }, [month]);

  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1));
  const future = selected > today;

  return (
    <div className="space-y-4">
      <div className="period-card">
        <div className="flex items-center justify-between">
          <button className="period-icon-btn" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={18} /></button>
          <div className="text-sm font-semibold">{month.toLocaleString(undefined, { month: "long", year: "numeric" })}</div>
          <button className="period-icon-btn" aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={18} /></button>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center">
          {["S", "M", "T", "W", "T", "F", "S"].map((w, i) => <div key={i} className="period-muted text-[10px]">{w}</div>)}
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
        <div className="period-legend mt-3">
          <span><i className="is-period" /> Period</span>
          <span><i className="is-predicted" /> Predicted</span>
          <span><i className="is-ovulation" /> Ovulation</span>
        </div>
        <div className="mt-3 flex gap-2">
          <button className="period-btn flex-1" disabled={future} onClick={() => { startPeriod(selected); void triggerHaptic("medium"); }}>
            Start on {fmt(selected)}
          </button>
          <button className="period-btn is-ghost flex-1" disabled={future || !cycles.some((c) => c.start <= selected)}
            onClick={() => { endPeriod(selected); void triggerHaptic("medium"); }}>
            End on {fmt(selected)}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Current" value={stats.currentDay ? `Day ${stats.currentDay}` : "—"} />
        <Stat label="Avg cycle" value={`${stats.avgCycle} days`} />
        <Stat label="Next period" value={stats.nextStart ? fmt(stats.nextStart) : "—"} />
      </div>
      {stats.cyclesLogged < 2 && (
        <p className="period-muted px-2 text-center text-xs">Predictions use a 28-day cycle until you log two or more cycles.</p>
      )}

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
                  <button className="period-icon-btn" aria-label="Delete cycle" onClick={() => deleteCycle(c.start)}><Trash2 size={15} /></button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="period-muted flex items-center justify-center gap-1 text-[11px]"><Lock size={11} /> Private — stored only on your device</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="period-card !p-3 text-center">
      <div className="period-muted text-[10px] font-semibold uppercase tracking-wider">{label}</div>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  );
}

// ================= LEARN =================

function LearnView({ open, setOpen }: { open: string | null; setOpen: (id: string | null) => void }) {
  const [copied, setCopied] = useState<string | null>(null);
  const share = async (id: string) => {
    const s = SUNNAH_SECTIONS.find((x) => x.id === id)!;
    const text = sectionShareText(s);
    try {
      if (navigator.share) await navigator.share({ title: s.title, text });
      else { await navigator.clipboard.writeText(text); setCopied(id); setTimeout(() => setCopied(null), 1800); }
    } catch { /* cancelled */ }
  };
  return (
    <div className="space-y-3">
      <div className="period-card period-soft text-sm">
        <div className="period-eyebrow">The Period in the Sunnah</div>
        <p className="mt-1">What pauses, what continues, and what was actually taught — every source verified.</p>
      </div>
      {SUNNAH_SECTIONS.map((s, idx) => {
        const isOpen = open === s.id;
        return (
          <section key={s.id} id={`sec-${s.id}`} className="period-card !p-0 overflow-hidden scroll-mt-4">
            <button className="period-acc-head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
              <span className="period-acc-num">{idx + 1}</span>
              <span className="flex-1 text-left text-[15px] font-semibold">{saw(s.title)}</span>
              <ChevronRight size={16} style={{ transform: isOpen ? "rotate(90deg)" : undefined, transition: "transform .2s" }} />
            </button>
            {isOpen && (
              <div className="space-y-4 px-4 pb-4">
                {s.intro && <p className={s.id === "duas" ? "period-callout is-grey" : "period-muted text-sm"}>{s.intro}</p>}
                {s.items.map((it) => <SunnahCard key={it.id} item={it} />)}
                <button className="period-link" onClick={() => void share(s.id)}>
                  <Share2 size={14} /> {copied === s.id ? "Copied" : "Share this section"}
                </button>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function SunnahCard({ item, compact = false }: { item: SunnahItem; compact?: boolean }) {
  return (
    <article className={compact ? "mt-2" : "period-item"}>
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
