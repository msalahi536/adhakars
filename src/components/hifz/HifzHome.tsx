import { useEffect, useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  BookOpen, CalendarDays, ChevronRight, Flame, Layers, Link2, MoonStar, Play,
  Settings2, Sparkles, Bell, ChartNoAxesColumnIncreasing, Check, Target, X, type LucideIcon,
} from "lucide-react";
import {
  buildSession, buildTimeline, humanDuration, recordSalah, saveState, stats, todayISO,
  type HifzState, type Step,
} from "@/lib/hifz";
import { flattenSession, quranIndexOptions, saveActiveSession } from "@/lib/hifz/program";
import {
  getHifzReminders, rescheduleHifzReminders, setHifzReminders, toggleHifzReminder,
  type HifzReminderPrefs,
} from "@/lib/hifz/reminders";
import { PlanSetup } from "./PlanSetup";

const STEP_META: Record<Step["type"], { label: string; Icon: LucideIcon }> = {
  manzil: { label: "Manzil – old review", Icon: BookOpen },
  sabqi: { label: "Sabqi – recent review", Icon: Layers },
  weakSpots: { label: "Weak spots", Icon: Target },
  sabaq: { label: "Sabaq – new memorization", Icon: Sparkles },
  link: { label: "Linking recitation", Icon: Link2 },
};

function stepLine(step: Step): string {
  if (step.type === "manzil" || step.type === "sabqi") return `${step.pages.length} page${step.pages.length === 1 ? "" : "s"}`;
  if (step.type === "weakSpots") return `${step.spots.length} drill${step.spots.length === 1 ? "" : "s"}`;
  if (step.type === "sabaq") return `Page ${step.page} · ${step.lines} lines`;
  return `${step.pages.length} page${step.pages.length === 1 ? "" : "s"}`;
}

export function HifzHome({ state, update, reset }: { state: HifzState; update: (s: HifzState) => void; reset: () => void }) {
  const q = useSuspenseQuery(quranIndexOptions).data;
  const navigate = useNavigate();
  const today = todayISO();
  const session = useMemo(() => buildSession(state, q, today), [state, q, today]);
  const st = useMemo(() => stats(state, q, today), [state, q, today]);
  const timeline = useMemo(() => buildTimeline(state.plan, q), [state, q]);
  const weakCount = Object.keys(state.weakSpots).length;
  const [sheet, setSheet] = useState<"juz" | "salah" | "reminders" | "plan" | null>(null);
  const [juzOpen, setJuzOpen] = useState<number | null>(null);
  const [reminders, setReminders] = useState<HifzReminderPrefs>(getHifzReminders);
  const [reminderError, setReminderError] = useState("");

  useEffect(() => {
    void rescheduleHifzReminders(state, q);
  }, [reminders]);

  function startSession(only?: "drills") {
    const base = only === "drills"
      ? { ...session, steps: session.steps.filter((s) => s.type === "weakSpots") }
      : session;
    const items = flattenSession(base);
    if (!items.length) return;
    saveActiveSession({ date: today, items, done: 0, seconds: 0 });
    void navigate({ to: "/app/hifz/recite", search: { session: today, item: 0 } });
  }

  function logSalah(pages: number[]) {
    const next = { ...state };
    recordSalah(next, pages, today);
    saveState(next);
    update(next);
    setSheet(null);
  }

  async function toggleReminder(which: "morning" | "sleep", on: boolean) {
    setReminderError("");
    const result = await toggleHifzReminder(which, on, state, q);
    if (!result.ok) setReminderError(result.error ?? "Could not update the reminder.");
    setReminders(getHifzReminders());
  }

  function setReminderTime(which: "morning" | "sleep", value: string) {
    const [hour, minute] = value.split(":").map(Number);
    const prefs = getHifzReminders();
    prefs[which].hour = hour;
    prefs[which].minute = minute;
    setHifzReminders(prefs);
    setReminders(prefs);
    void rescheduleHifzReminders(state, q);
  }

  const nextMilestone = timeline.juzMilestones.find((m) => new Date(m.date + "T12:00:00Z").getTime() > Date.now());
  const memorizedPages = Object.values(state.pages).filter((r) => r.memory).map((r) => r.page);
  const pct = Math.round(st.percentOfQuran * 1000) / 10;

  return (
    <main className="scroll-area hz-home">
      <div className="hz-home-content">
        <div className="hz-home-heading">
          <h1 className="app-page-title">Your<br />Memorization</h1>
          <p>Review first, then new lines. Every day a little.</p>
        </div>
        {/* Today */}
        <section className="hz-home-card hz-hero">
          <header className="hz-today-heading">
            <CalendarDays aria-hidden="true" />
            <h2>Today · {new Date().toLocaleDateString(undefined, { weekday: "long" })}</h2>
            <span className="hz-task-count">{session.steps.length} tasks</span>
          </header>
          <div className="hz-hero-steps">
            {session.steps.map((step, i) => {
              const { label, Icon } = STEP_META[step.type];
              return (
                <div className="hz-hero-step" key={i}>
                  <span className="hz-ico"><Icon /></span>
                  <span className="hz-step-copy">{label}<small>{stepLine(step)}</small></span>
                  <span className="hz-step-minutes">{step.minutes} min</span>
                </div>
              );
            })}
            {!session.steps.length && <p style={{ fontSize: 13 }}>Nothing due today. Rest, or open free recite.</p>}
          </div>
          <div className="hz-hero-total sr-only">
            <span>{session.dueCount} pages due{session.carriedOver > 0 ? ` · ${session.carriedOver} carried over` : ""}</span>
            <strong>{session.totalMinutes} min</strong>
          </div>
          {session.newPaused && <p className="hz-paused">{session.newPaused}</p>}
          {session.steps.length > 0 && (
            <Button className="hz-start" onClick={() => startSession()}><Play size={17} /> Start</Button>
          )}
        </section>

        {/* Timeline */}
        <section className="hz-home-card hz-progress-card">
          <h2 className="hz-card-heading"><ChartNoAxesColumnIncreasing /> Your Hifz</h2>
          <div className="hz-stat-row">
            <div className="hz-stat"><b>{pct}%</b><span>of the Quran</span></div>
            <div className="hz-stat"><b>{st.pagesMemorized}</b><span>pages</span></div>
            <div className="hz-stat"><b>{humanDuration(timeline.calendarDays)}</b><span>to finish</span></div>
          </div>
          {nextMilestone && (
            <p className="hz-next-milestone"><CalendarDays />
              Next milestone: Juz {nextMilestone.juz} · {new Date(nextMilestone.date + "T12:00:00Z").toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </p>
          )}
        </section>

        {/* Progress map */}
        <section className="hz-home-card hz-map-card">
          <header className="hz-map-heading"><h2 className="hz-card-heading"><Layers /> Progress Map</h2><span className="hz-map-label">Juz</span></header>
          <div className="hz-map">
            {st.byJuz.map((j) => (
              <Button variant="ghost" key={j.juz} className={`hz-map-tile ${j.memorized === j.pages ? "is-complete" : j.memorized ? "is-started" : ""}`} aria-label={`Juz ${j.juz}: ${j.memorized} of ${j.pages} pages`} onClick={() => { setJuzOpen(j.juz); setSheet("juz"); }}>
                <i style={{ opacity: j.memorized ? 0.15 + (j.strength ?? 0) * 0.6 : 0, width: `${(j.memorized / j.pages) * 100}%` }} />
                <em>{j.juz}</em>
              </Button>
            ))}
          </div>
        </section>

        <section className="hz-home-card hz-streak-card">
          <header className="hz-streak-heading">
            <Flame />
            <div><h2>Study Streak</h2><p>Keep the momentum going.</p></div>
            <span>{st.streak} days</span>
          </header>
          <div className="hz-study-week" aria-label="Study activity this week">
            {Array.from({ length: 7 }, (_, i) => {
              const day = new Date(`${today}T12:00:00`);
              day.setDate(day.getDate() - day.getDay() + i);
              const date = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
              const log = state.dayLog[date];
              const studied = Boolean(log && (log.newLines > 0 || log.reviews > 0));
              return <div key={date} aria-label={`${date}: ${studied ? "studied" : "not studied"}`}><span>{day.toLocaleDateString(undefined, { weekday: "narrow" })}</span><i className={studied ? "is-done" : ""}>{studied && <Check />}</i></div>;
            })}
          </div>
          <details className="hz-home-forecast"><summary>Upcoming reviews</summary><div className="hz-forecast" aria-label="Reviews due over the next 7 days">{st.forecast.map((f) => <div className="hz-forecast-bar" key={f.date}><strong>{f.due}</strong><span>{new Date(f.date + "T12:00:00Z").toLocaleDateString(undefined, { weekday: "short" })}</span></div>)}</div></details>
        </section>

        {/* Actions */}
        {weakCount > 0 && (
          <Button variant="ghost" className="hz-row-btn" onClick={() => startSession("drills")}>
            <Target size={17} /> <span>{weakCount} weak spot{weakCount === 1 ? "" : "s"}<small>Short drills to fix them</small></span>
            <ChevronRight size={16} style={{ marginLeft: "auto" }} />
          </Button>
        )}
        <Button variant="ghost" className="hz-row-btn" onClick={() => setSheet("salah")}>
          <MoonStar size={17} /> <span>I recited in salah<small>Counts as a light review</small></span>
          <ChevronRight size={16} style={{ marginLeft: "auto" }} />
        </Button>
        <Button variant="ghost" className="hz-row-btn" onClick={() => void navigate({ to: "/app/hifz/recite" })}>
          <BookOpen size={17} /> <span>Free recite<small>Any page, outside the program</small></span>
          <ChevronRight size={16} style={{ marginLeft: "auto" }} />
        </Button>
        <Button variant="ghost" className="hz-row-btn" onClick={() => setSheet("reminders")}>
          <Bell size={17} /> <span>Reminders<small>Morning review and before sleep</small></span>
          <ChevronRight size={16} style={{ marginLeft: "auto" }} />
        </Button>
        <Button variant="ghost" className="hz-row-btn" onClick={() => setSheet("plan")}>
          <Settings2 size={17} /> <span>Edit plan<small>Order, pace, daily time</small></span>
          <ChevronRight size={16} style={{ marginLeft: "auto" }} />
        </Button>
      </div>

      {sheet && sheet !== "plan" && <div className="hz-backdrop" onClick={() => setSheet(null)} />}

      {sheet === "juz" && juzOpen !== null && (
        <section className="hz-sheet" role="dialog" aria-modal="true" aria-label={`Juz ${juzOpen} pages`}>
          <header><h2>Juz {juzOpen}</h2><Button variant="ghost" size="icon" aria-label="Close" onClick={() => setSheet(null)}><X /></Button></header>
          <div className="hz-page-list">
            {q.pages.filter((p) => p.juz === juzOpen).map((p) => {
              const rec = state.pages[p.page];
              const strengthValue = rec?.memory ? Math.round((st.byJuz.find((x) => x.juz === juzOpen)?.strength ?? 0) * 100) : 0;
              return (
                <Button variant="ghost" key={p.page} className="hz-page-chip" aria-label={`Page ${p.page}${rec?.memory ? `, strength ${strengthValue}%` : ""}`}
                  onClick={() => { setSheet(null); void navigate({ to: "/app/hifz/recite", search: { page: p.page } }); }}>
                  {rec?.memory && <i style={{ opacity: 0.2 + (strengthValue / 100) * 0.6 }} />}
                  <em>{p.page}</em>
                </Button>
              );
            })}
          </div>
        </section>
      )}

      {sheet === "salah" && (
        <SalahSheet memorized={memorizedPages} done={logSalah} close={() => setSheet(null)} />
      )}

      {sheet === "reminders" && (
        <section className="hz-sheet" role="dialog" aria-modal="true" aria-label="Hifz reminders">
          <header><h2>Reminders</h2><Button variant="ghost" size="icon" aria-label="Close" onClick={() => setSheet(null)}><X /></Button></header>
          <div className="hz-reminder-row">
            <span><strong style={{ fontSize: 14 }}>Morning</strong><br /><small style={{ color: "var(--muted-foreground)" }}>Review is ready: pages and minutes</small></span>
            <input aria-label="Morning reminder time" type="time" value={`${String(reminders.morning.hour).padStart(2, "0")}:${String(reminders.morning.minute).padStart(2, "0")}`} onChange={(e) => setReminderTime("morning", e.target.value)} />
            <Switch aria-label="Morning reminder" checked={reminders.morning.enabled} onCheckedChange={(on) => void toggleReminder("morning", on)} />
          </div>
          <div className="hz-reminder-row">
            <span><strong style={{ fontSize: 14 }}>Before sleep</strong><br /><small style={{ color: "var(--muted-foreground)" }}>Only on days with new memorization</small></span>
            <input aria-label="Sleep reminder time" type="time" value={`${String(reminders.sleep.hour).padStart(2, "0")}:${String(reminders.sleep.minute).padStart(2, "0")}`} onChange={(e) => setReminderTime("sleep", e.target.value)} />
            <Switch aria-label="Before sleep reminder" checked={reminders.sleep.enabled} onCheckedChange={(on) => void toggleReminder("sleep", on)} />
          </div>
          {reminderError && <p role="alert" style={{ fontSize: 12, color: "var(--destructive, #b4453a)" }}>{reminderError}</p>}
          <p style={{ fontSize: 11, color: "var(--muted-foreground)" }}><CalendarDays size={11} style={{ verticalAlign: -1 }} /> Reminders are planned a few days ahead and refresh each time you open Hifz.</p>
        </section>
      )}

      {sheet === "plan" && (
        <div className="hz-backdrop" style={{ overflowY: "auto" }}>
          <div style={{ background: "var(--background)", minHeight: "100dvh" }}>
            <PlanSetup existing={state.plan} done={() => { setSheet(null); reset(); }} />
          </div>
        </div>
      )}
    </main>
  );
}

function SalahSheet({ memorized, done, close }: { memorized: number[]; done: (pages: number[]) => void; close: () => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  return (
    <section className="hz-sheet" role="dialog" aria-modal="true" aria-label="I recited in salah">
      <header><h2>Recited in salah</h2><Button variant="ghost" size="icon" aria-label="Close" onClick={close}><X /></Button></header>
      <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>Pick the memorized pages you recited. Pages close to their review date count as a light review.</p>
      {!memorized.length && <p style={{ fontSize: 13 }}>No memorized pages yet.</p>}
      <div className="hz-page-list">
        {memorized.map((p) => (
          <Button variant="ghost" key={p} className="hz-page-chip" aria-pressed={picked.includes(p)}
            onClick={() => setPicked((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]))}>
            {picked.includes(p) && <i style={{ opacity: .5 }} />}
            <em>{p}</em>
          </Button>
        ))}
      </div>
      <Button className="hz-start" disabled={!picked.length} onClick={() => done(picked)}>Save</Button>
    </section>
  );
}
