import { useEffect, useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { HeaderBackButton } from "@/components/HeaderBackButton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { reciteChaptersOptions } from "@/lib/recite/data";
import { PopupHandle } from "./PopupHandle";
import { pageRecitationLabel } from "./page-label";
import {
  BookOpen, CalendarDays, ChevronRight, Flame, Layers, Link2, MoonStar, Play,
  Settings2, Sparkles, Bell, ChartNoAxesColumnIncreasing, Check, Target, type LucideIcon,
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
import { selectedFinishEstimate } from "./automatic-pace";
import { PracticeCards } from "./PracticeCards";

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
  const chapters = useSuspenseQuery(reciteChaptersOptions).data;
  const names = Object.fromEntries(chapters.map((chapter) => [chapter.id, chapter.name_simple]));
  const labelPage = (page: number) => {
    const data = q.pages.find((p) => p.page === page);
    return data ? pageRecitationLabel(data, names, q.surahPages) : `Page ${page}`;
  };
  const navigate = useNavigate();
  const [today,setToday] = useState(todayISO);
  useEffect(()=>{const id=setInterval(()=>setToday(todayISO()),30000);return()=>clearInterval(id);},[]);
  const session = useMemo(() => buildSession(state, q, today), [state, q, today]);
  const st = useMemo(() => stats(state, q, today), [state, q, today]);
  const timeline = useMemo(() => buildTimeline(state.plan, q, state.plan.dailyMinutes), [state, q]);
  const finishEstimate = useMemo(() => selectedFinishEstimate(timeline, state.plan.startDate), [timeline, state.plan.startDate]);
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
    const next = structuredClone(state);
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
  const memorizedPages = Object.values(state.pages).filter((r) => r.stage === "sabqi" || r.stage === "manzil").map((r) => r.page);
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
            <div className="hz-stat"><b>{humanDuration(finishEstimate.days)}</b><span>to finish</span></div>
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
              <Button variant="ghost" key={j.juz} className={`hz-map-tile ${j.memorized === j.pages ? "is-complete" : j.memorized ? "is-started" : ""}`} title={`${j.memorized} of ${j.pages} pages memorized`} aria-label={`Juz ${j.juz}: ${j.memorized} of ${j.pages} pages`} onClick={() => { setJuzOpen(j.juz); setSheet("juz"); }}>
                <i style={{ opacity: j.memorized ? .35 : 0, width: `${(j.memorized / j.pages) * 100}%` }} />
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
        <PracticeCards state={state} q={q} today={today} names={names} update={update}/>
        <Button variant="ghost" className="hz-row-btn" onClick={() => void navigate({ to: "/app/hifz/weak-spots" })}><Target /><span>My weak spots<small>Words, ayah starts and similar ayat</small></span><ChevronRight /></Button>
        <Button variant="ghost" className="hz-row-btn" onClick={()=>void navigate({to:"/app/hifz/mushaf"})}><BookOpen/><span>My Mushaf<small>Your memory, page by page</small></span><ChevronRight/></Button>
        <Button variant="ghost" className="hz-row-btn" onClick={()=>void navigate({to:"/app/hifz/drills"})}><Target/><span>Voice quizzes<small>A few words, then recall</small></span><ChevronRight/></Button>
        <Button variant="ghost" className="hz-row-btn" onClick={()=>void navigate({to:"/app/hifz/lines"})}><Layers/><span>Where is it on the page?<small>Remember the ayah’s starting line</small></span><ChevronRight/></Button>
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

      <Dialog open={sheet !== null && sheet !== "plan"} onOpenChange={(open) => { if (!open) setSheet(null); }}>
        <DialogContent className="hz-home-popup hz-setup" aria-describedby={undefined} onOpenAutoFocus={(event) => event.preventDefault()}>
        <PopupHandle dismiss={() => setSheet(null)} />

      {sheet === "juz" && juzOpen !== null && (
        <>
          <header className="hz-home-popup-heading"><Layers /><DialogTitle>Juz {juzOpen}</DialogTitle></header>
          <p className="hz-juz-progress-count">{st.byJuz.find((j) => j.juz === juzOpen)?.memorized ?? 0} of {st.byJuz.find((j) => j.juz === juzOpen)?.pages ?? 0} pages memorized</p>
          <div className="hz-named-pages">
            {q.pages.filter((p) => p.juz === juzOpen).map((p) => {
              const rec = state.pages[p.page];
              const memorized = rec?.stage === "sabqi" || rec?.stage === "manzil";
              return (
                <Button variant="ghost" key={p.page} className="hz-named-page" aria-label={labelPage(p.page)}
                  onClick={() => { setSheet(null); void navigate({ to: "/app/hifz/recite", search: { page: p.page } }); }}>
                  <BookOpen /><span><strong>{labelPage(p.page)}</strong><small>Page {p.page} · {memorized ? "Memorized" : rec?.stage === "learning" ? "Learning" : "Not memorized"}</small></span><ChevronRight />
                </Button>
              );
            })}
          </div>
        </>
      )}

      {sheet === "salah" && (
        <SalahSheet memorized={memorizedPages} labelPage={labelPage} done={logSalah} />
      )}

      {sheet === "reminders" && (
        <>
          <header className="hz-home-popup-heading"><Bell /><DialogTitle>Reminders</DialogTitle><p>A little time for your Quran.</p></header>
          <div className="hz-reminder-row">
            <span><strong>Morning review</strong><small>Your daily review reminder</small></span>
            <input aria-label="Morning reminder time" type="time" value={`${String(reminders.morning.hour).padStart(2, "0")}:${String(reminders.morning.minute).padStart(2, "0")}`} onChange={(e) => setReminderTime("morning", e.target.value)} />
            <Switch aria-label="Morning reminder" checked={reminders.morning.enabled} onCheckedChange={(on) => void toggleReminder("morning", on)} />
          </div>
          <div className="hz-reminder-row">
            <span><strong>Before sleep</strong><small>Only after new memorization</small></span>
            <input aria-label="Sleep reminder time" type="time" value={`${String(reminders.sleep.hour).padStart(2, "0")}:${String(reminders.sleep.minute).padStart(2, "0")}`} onChange={(e) => setReminderTime("sleep", e.target.value)} />
            <Switch aria-label="Before sleep reminder" checked={reminders.sleep.enabled} onCheckedChange={(on) => void toggleReminder("sleep", on)} />
          </div>
          {reminderError && <p role="alert" style={{ fontSize: 12, color: "var(--destructive, #b4453a)" }}>{reminderError}</p>}
          <Button className="hz-primary hz-popup-done" onClick={() => setSheet(null)}>Done</Button>
        </>
      )}
        </DialogContent>
      </Dialog>

      {sheet === "plan" && (
        <div className="hz-backdrop hz-edit-plan" style={{ overflowY: "auto" }}>
          <header className="hz-home-header">
            <HeaderBackButton onBack={() => setSheet(null)} />
          </header>
          <div style={{ background: "var(--background)", minHeight: "100dvh" }}>
            <PlanSetup existing={state.plan} done={() => { setSheet(null); reset(); }} />
          </div>
        </div>
      )}
    </main>
  );
}

function SalahSheet({ memorized, labelPage, done }: { memorized: number[]; labelPage: (page: number) => string; done: (pages: number[]) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  return (
    <>
      <header className="hz-home-popup-heading"><MoonStar /><DialogTitle>Recited in salah</DialogTitle><p>Choose the memorized passages you recited.</p></header>
      {!memorized.length && <p style={{ fontSize: 13 }}>No memorized pages yet.</p>}
      <div className="hz-named-pages">
        {memorized.map((p) => (
          <Button variant="ghost" key={p} className="hz-named-page" aria-pressed={picked.includes(p)}
            onClick={() => setPicked((list) => (list.includes(p) ? list.filter((x) => x !== p) : [...list, p]))}>
            <BookOpen /><span><strong>{labelPage(p)}</strong><small>Page {p}</small></span><span className="hz-passage-check">{picked.includes(p) && <Check />}</span>
          </Button>
        ))}
      </div>
      <Button className="hz-primary hz-popup-done" disabled={!picked.length} onClick={() => done(picked)}>Save review{picked.length > 0 ? ` · ${picked.length}` : ""}</Button>
    </>
  );
}
