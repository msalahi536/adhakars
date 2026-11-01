import { useEffect, useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, BookOpen, Sprout, Circle, Search, Layers, List, ArrowUp, ArrowDown, X, Minus, Plus, CalendarDays, SlidersHorizontal, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { searchChapters } from "@/lib/quran";
import {
  buildTimeline,
  compareTimelines,
  createState,
  defaultPlan,
  humanDuration,
  humanMinutes,
  monthYear,
  paceLabel,
  paceForFinishDate,
  saveState,
  todayISO,
  type HifzPlan,
  type MemorizationOrder,
} from "@/lib/hifz";
import { knownPages, quranIndexOptions } from "@/lib/hifz/program";
import { reciteChaptersOptions } from "@/lib/recite/data";
import { hasSetupChoice } from "./setup-choice";
import { moveSurah, toggleSurahOrder } from "./surah-order";
import { bestAutomaticPace, DAILY_MINUTES, effectiveTimeline, selectedFinishEstimate } from "./automatic-pace";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_OPTIONS = DAILY_MINUTES;

const fmtDate = (iso: string) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString(undefined, { month: "long", year: "numeric" });

export function PlanSetup({ existing, done }: { existing?: HifzPlan; done: () => void }) {
  const q = useSuspenseQuery(quranIndexOptions).data;
  const chapters = useSuspenseQuery(reciteChaptersOptions).data;
  const today = todayISO();
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<HifzPlan>(() => existing ?? defaultPlan(today));
  const [pickSurahs, setPickSurahs] = useState(false);
  const [surahSearch, setSurahSearch] = useState("");
  const [showSurahOrder, setShowSurahOrder] = useState(false);
  const [surahScenery, setSurahScenery] = useState<string>();
  const [startingFresh, setStartingFresh] = useState(false);
  const [chosenJuz, setChosenJuz] = useState<number[]>(() => {
    if (!existing) return [];
    return Array.from({ length: 30 }, (_, i) => i + 1).filter((j) => {
      const [a, b] = [j === 1 ? 1 : 2 + 20 * (j - 1), j === 30 ? 604 : 1 + 20 * j];
      let ok = true;
      for (let p = a; p <= b; p++) if (!existing.alreadyMemorized.includes(p)) { ok = false; break; }
      return ok;
    });
  });
  const [chosenSurahs, setChosenSurahs] = useState<number[]>([]);
  const [orderSurahs, setOrderSurahs] = useState<number[]>(
    existing?.order.kind === "surahs" ? existing.order.surahs : [],
  );
  const [advanced, setAdvanced] = useState(false);
  const [paceMode, setPaceMode] = useState<"pace" | "date">("pace");
  const [targetDate, setTargetDate] = useState("");
  const [customizePace, setCustomizePace] = useState(false);
  const [customLines, setCustomLines] = useState<number>();

  const known = useMemo(
    () => knownPages(q, chosenJuz, chosenSurahs),
    [q, chosenJuz, chosenSurahs],
  );
  const draft: HifzPlan = { ...plan, alreadyMemorized: known };
  const timelines = useMemo(() => compareTimelines(draft, q, plan.dailyMinutes), [JSON.stringify(draft), q]);
  const summary = useMemo(() => buildTimeline(draft, q, plan.dailyMinutes), [JSON.stringify(draft), q]);
  const dateTimeline = useMemo(() => targetDate ? paceForFinishDate(draft, q, targetDate) : null, [JSON.stringify(draft), q, targetDate]);
  const automaticKey = JSON.stringify({ ...draft, dailyMinutes: 0, newLinesPerDay: 0 });
  const automaticPaces = useMemo(() => step >= 2 ? new Map(TIME_OPTIONS.map((minutes) => [minutes, bestAutomaticPace(draft, q, minutes)])) : new Map(), [step >= 2, automaticKey, q]);
  const cardEstimates = useMemo(() => customLines === undefined ? automaticPaces : new Map(TIME_OPTIONS.map((minutes) => [minutes, effectiveTimeline(buildTimeline({ ...draft, newLinesPerDay: customLines }, q, minutes))])), [automaticPaces, customLines, automaticKey, q]);
  const chosenLines = customLines ?? automaticPaces.get(plan.dailyMinutes)?.lines ?? plan.newLinesPerDay;
  const selectedEstimate = useMemo(() => selectedFinishEstimate(buildTimeline({ ...draft, newLinesPerDay: chosenLines }, q, plan.dailyMinutes), plan.startDate, paceMode === "date" && dateTimeline ? targetDate : undefined), [JSON.stringify(draft), chosenLines, q, paceMode, targetDate, dateTimeline]);
  useEffect(() => {
    if (step >= 2 && chosenLines !== plan.newLinesPerDay) setPlan((p) => ({ ...p, newLinesPerDay: chosenLines }));
  }, [chosenLines, step, plan.newLinesPerDay]);
  function choosePace(lines: number) {
    const chosen = Math.max(1, Math.min(150, lines));
    setCustomLines(chosen);
    setPlan((p) => ({ ...p, newLinesPerDay: chosen }));
  }

  const setOrder = (order: MemorizationOrder) => setPlan((p) => ({ ...p, order }));
  const toggleIn = (list: number[], value: number) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
  const pickerSelection = step === 1 ? orderSurahs : chosenSurahs;
  function openSurahPicker() {
    const phase = document.documentElement.dataset.visualPhase === "evening" ? "evening" : "morning";
    const backdrop = document.querySelector(`.app-background-${phase}`);
    setSurahScenery(backdrop ? getComputedStyle(backdrop).backgroundImage : undefined);
    setSurahSearch("");
    setShowSurahOrder(false);
    setPickSurahs(true);
  }
  function togglePickerSurah(id: number) {
    if (step === 1) {
      const next = toggleSurahOrder(orderSurahs, id);
      setOrderSurahs(next);
      setOrder({ kind: "surahs", surahs: next });
    } else {
      setStartingFresh(false);
      setChosenSurahs((list) => toggleIn(list, id));
    }
  }
  function movePickerSurah(id: number, direction: -1 | 1) {
    const next = moveSurah(orderSurahs, id, direction);
    setOrderSurahs(next);
    setOrder({ kind: "surahs", surahs: next });
  }

  const steps = ["Already know", "Order", "Daily time", "Summary"];
  const canNext =
    step === 0 ? hasSetupChoice(chosenJuz, chosenSurahs, startingFresh) :
    step === 1 ? plan.order.kind !== "surahs" || orderSurahs.length > 0 :
    true;

  function finish() {
    saveState(createState({ ...draft, newLinesPerDay: chosenLines }));
    done();
  }

  return (
    <main className={`scroll-area hz-setup ${step === 0 ? "hz-known-step" : step === 1 ? "hz-order-step" : step === 2 ? "hz-time-step" : ""}`}>
      <div className="mx-auto max-w-md px-5 py-4">
        <div className="hz-steps" aria-label={`Step ${step + 1} of ${steps.length}: ${steps[step]}`}>
          {steps.map((label, i) => (
            <span key={label} className={`hz-step-dot ${i === step ? "is-on" : i < step ? "is-done" : ""}`} />
          ))}
        </div>
        {step === 3 && <p className="label-caps hz-step-label">{steps[step]}</p>}

        {step === 0 && (
          <section className="hz-known-content">
            <header className="hz-known-heading">
            <h1 className="hz-title">What do you already know?</h1>
            <p className="hz-sub">Tap every juz you have fully memorized. These pages go straight into review.</p>
            </header>
            <div className="hz-juz-grid">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                <Button
                  variant="ghost"
                  key={j}
                  aria-label={`Juz ${j}`}
                  aria-pressed={chosenJuz.includes(j)}
                  className={`hz-juz-tile ${chosenJuz.includes(j) ? "is-on" : ""}`}
                  onClick={() => { setStartingFresh(false); setChosenJuz((list) => toggleIn(list, j)); }}
                >
                  <span>{j}</span>
                  {chosenJuz.includes(j) && <Check className="hz-juz-check" />}
                </Button>
              ))}
            </div>
            <Button variant="outline" className="hz-wide hz-pick-surahs" onClick={openSurahPicker} aria-haspopup="dialog">
              <BookOpen />
              Pick surahs instead
              <ChevronRight className={pickSurahs ? "hz-picker-open" : ""} />
            </Button>
            {chosenSurahs.length > 0 && <p className="mt-3 mb-0 text-center text-sm font-semibold text-card-foreground" role="status">{chosenSurahs.length} {chosenSurahs.length === 1 ? "surah" : "surahs"} selected</p>}
            <div className="hz-choice-divider"><span>or</span></div>
            <Button variant="ghost" className="hz-wide hz-fresh-choice" aria-pressed={startingFresh} onClick={() => { setChosenJuz([]); setChosenSurahs([]); setStartingFresh((value) => !value); }}>
              <span className="hz-fresh-icon"><Sprout /></span>
              <span className="hz-fresh-copy"><strong>Nothing yet — I’m starting fresh</strong><small>{known.length} pages will start in review.</small></span>
              {startingFresh ? <Check className="hz-fresh-check" /> : <Circle className="hz-fresh-check" />}
            </Button>
          </section>
        )}

        {step === 1 && (
          <section>
            <header className="hz-known-heading"><h1 className="hz-title">Where do you want to start?</h1></header>
            <div className="hz-cards">
              <Button variant="ghost" aria-pressed={plan.order.kind === "juzAmmaFirst"} className={`hz-card ${plan.order.kind === "juzAmmaFirst" ? "is-on" : ""}`} onClick={() => setOrder({ kind: "juzAmmaFirst" })}>
                <span className="hz-order-icon"><BookOpen /></span>
                <span className="hz-order-copy"><strong>Juz Amma first</strong><span>The short surahs first, the way most students begin.</span></span>
                <span className="hz-order-check">{plan.order.kind === "juzAmmaFirst" && <Check />}</span>
              </Button>
              <Button variant="ghost" aria-pressed={plan.order.kind === "forward"} className={`hz-card ${plan.order.kind === "forward" ? "is-on" : ""}`} onClick={() => setOrder({ kind: "forward", fromPage: 2 })}>
                <span className="hz-order-icon"><Layers /></span>
                <span className="hz-order-copy"><strong>From Al-Baqarah</strong><span>From the front of the mushaf to the end.</span></span>
                <span className="hz-order-check">{plan.order.kind === "forward" && <Check />}</span>
              </Button>
              <Button variant="ghost" aria-haspopup="dialog" aria-pressed={plan.order.kind === "surahs"} className={`hz-card ${plan.order.kind === "surahs" ? "is-on" : ""}`} onClick={() => { setOrder({ kind: "surahs", surahs: orderSurahs }); openSurahPicker(); }}>
                <span className="hz-order-icon"><List /></span>
                <span className="hz-order-copy"><strong>Choose surahs</strong><span>Your own list, in your own order.</span></span>
                <span className="hz-order-check">{plan.order.kind === "surahs" && <Check />}</span>
              </Button>
            </div>
            {plan.order.kind === "surahs" && orderSurahs.length > 0 && <p className="mt-3 mb-0 text-center text-sm font-semibold text-card-foreground" role="status">{orderSurahs.length} {orderSurahs.length === 1 ? "surah" : "surahs"} selected</p>}
          </section>
        )}

        <Dialog open={pickSurahs} onOpenChange={setPickSurahs}>
          <DialogContent className="hz-surah-dialog hz-setup" aria-describedby={undefined} onOpenAutoFocus={(event) => event.preventDefault()}>
            <div className="hz-surah-scenery" aria-hidden="true" style={{ backgroundImage: surahScenery }} />
            <header className="hz-surah-dialog-header">
              <Button variant="ghost" className="hz-surah-back" aria-label="Back to setup" onClick={() => setPickSurahs(false)}><ChevronLeft /></Button>
              <DialogTitle>Choose Surahs</DialogTitle>
            </header>
            <p className="hz-surah-instruction">{step === 1 ? "Your memorization order" : "Select the surahs you’ve memorized."}</p>
            {step === 1 && <div className="hz-surah-tabs" role="group" aria-label="Surah selection view">
              <Button variant="ghost" aria-pressed={!showSurahOrder} onClick={() => setShowSurahOrder(false)}>All surahs</Button>
              <Button variant="ghost" aria-pressed={showSurahOrder} onClick={() => setShowSurahOrder(true)}>Your order · {orderSurahs.length}</Button>
            </div>}
            {!showSurahOrder && <label className="hz-surah-search"><Search /><input aria-label="Search surahs" placeholder="Search surahs…" value={surahSearch} onChange={(e) => setSurahSearch(e.target.value)} /></label>}
            <div className="hz-surah-dialog-list">
              {showSurahOrder ? orderSurahs.map((id, index) => {
                const chapter = chapters.find((c) => c.id === id);
                if (!chapter) return null;
                return <div className="hz-surah-row hz-surah-ordered is-on" key={id}>
                  <span className="hz-surah-rank">{index + 1}</span>
                  <span className="hz-surah-english">{chapter.name_simple}</span>
                  <div className="hz-surah-order-actions">
                    <Button variant="ghost" size="icon" aria-label={`Move ${chapter.name_simple} up`} title="Move earlier" disabled={index === 0} onClick={() => movePickerSurah(id, -1)}><ArrowUp /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Move ${chapter.name_simple} down`} title="Move later" disabled={index === orderSurahs.length - 1} onClick={() => movePickerSurah(id, 1)}><ArrowDown /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Remove ${chapter.name_simple}`} title="Remove surah" onClick={() => togglePickerSurah(id)}><X /></Button>
                  </div>
                </div>;
              }) : searchChapters(chapters, surahSearch).map((c) => (
                <Button variant="ghost" key={c.id} aria-pressed={pickerSelection.includes(c.id)} aria-label={`${c.id}. ${c.name_simple}`} className={`hz-surah-row ${pickerSelection.includes(c.id) ? "is-on" : ""}`} onClick={() => togglePickerSurah(c.id)}>
                  <span className={step === 1 && pickerSelection.includes(c.id) ? "hz-surah-rank" : "hz-surah-checkbox"}>{pickerSelection.includes(c.id) && (step === 1 ? pickerSelection.indexOf(c.id) + 1 : <Check />)}</span>
                  <span className="hz-surah-english">{c.id}. {c.name_simple}</span>
                  <span className="hz-surah-arabic" lang="ar" dir="rtl">{c.name_arabic}</span>
                  <ChevronRight className="hz-surah-chevron" />
                </Button>
              ))}
              {showSurahOrder && orderSurahs.length === 0 && <p className="hz-surah-empty">No surahs selected</p>}
              {!showSurahOrder && searchChapters(chapters, surahSearch).length === 0 && <p className="hz-surah-empty">No surahs found</p>}
            </div>
            <footer className="hz-surah-dialog-footer"><span>{pickerSelection.length} selected</span><Button className="hz-primary" onClick={() => setPickSurahs(false)}>Done</Button></footer>
          </DialogContent>
        </Dialog>

        {step === 2 && (
          <section>
            <header className="hz-known-heading">
            <h1 className="hz-title">How much time each day?</h1>
            <p className="hz-sub">Review always comes first; new memorization gets what is left.</p>
            </header>
            <div className="hz-cards">
              {TIME_OPTIONS.map((m) => {
                const estimate = cardEstimates.get(m);
                return (
                <Button variant="ghost" key={m} aria-label={`${m} min`} aria-pressed={plan.dailyMinutes === m} data-minutes={m} className={`hz-card hz-time ${plan.dailyMinutes === m ? "is-on" : ""}`} onClick={() => setPlan((p) => ({ ...p, dailyMinutes: m, newLinesPerDay: customLines ?? automaticPaces.get(m)?.lines ?? p.newLinesPerDay }))}>
                  <span className="hz-time-copy">
                  <strong>{m} min</strong>
                  {estimate && <span className="hz-time-estimate">{paceLabel(estimate.lines)} · finish around {monthYear(estimate.finish)}</span>}
                  <span className="hz-time-track" aria-hidden="true"><span className="hz-time-fill" /></span>
                  </span>
                  {plan.dailyMinutes === m && <span className="hz-time-check"><Check /></span>}
                </Button>
              ); })}
            </div>
            <div className="hz-time-summary" role="status">
              <div className="hz-time-summary-heading">
                <div><span>You’ll finish around</span><strong>{monthYear(selectedEstimate.finish)}</strong></div>
              </div>
              <span className="hz-time-summary-duration">{humanDuration(selectedEstimate.days)}</span>
              {selectedEstimate.firstJuz && <small>First juz done by {monthYear(selectedEstimate.firstJuz)}</small>}
              {selectedEstimate.timeWarning && <small className="hz-finish-warning">{selectedEstimate.timeWarning}</small>}
            </div>
            <Button variant="link" className="hz-customize-link" onClick={() => setCustomizePace(true)}><SlidersHorizontal aria-hidden="true" /> Customize pace</Button>
          </section>
        )}

        <Sheet open={customizePace} onOpenChange={setCustomizePace}>
          <SheetContent side="bottom" className="hz-setup hz-pace-step hz-customize-sheet" aria-describedby={undefined}>
            <header className="hz-customize-header">
            <div className="hz-sheet-handle" aria-hidden="true" />
            <SlidersHorizontal className="hz-customize-icon" aria-hidden="true" />
            <SheetTitle>Customize pace</SheetTitle>
            <p>Choose how you want to read and when to finish.</p>
            </header>
            <div className="hz-surah-tabs" role="group" aria-label="Pace selection mode">
              <Button variant="ghost" aria-pressed={paceMode === "pace"} onClick={() => setPaceMode("pace")}>Choose a pace</Button>
              <Button variant="ghost" aria-pressed={paceMode === "date"} onClick={() => setPaceMode("date")}>Choose a finish date</Button>
            </div>
            <div className="hz-customize-body">
            {paceMode === "pace" ? <>
            <div className="hz-cards">
              {timelines.map((t) => (
                <Button variant="ghost" key={t.lines} aria-pressed={plan.newLinesPerDay === t.lines} className={`hz-card ${plan.newLinesPerDay === t.lines ? "is-on" : ""}`} onClick={() => choosePace(t.lines)}>
                  <strong>{t.label}</strong>
                  {plan.newLinesPerDay === t.lines && <span className="hz-pace-selected"><Check /></span>}
                  <span>{t.note}</span>
                  <span className="hz-pace-meta"><span><CalendarDays /> Finish in {t.duration}</span><span><Clock /> {humanMinutes(t.minutesAtStart)} a day</span></span>
                </Button>
              ))}
            </div>
            <div className="hz-custom-pace">
              <label htmlFor="custom-lines">Custom</label>
              <div className="hz-pace-stepper">
                <Button variant="outline" size="icon" aria-label="Fewer lines per day" disabled={plan.newLinesPerDay <= 1} onClick={() => choosePace(plan.newLinesPerDay - 1)}><Minus /></Button>
                <input id="custom-lines" aria-label="Lines per day" type="number" min={1} max={150} value={plan.newLinesPerDay} onChange={(e) => { const value = Number(e.target.value); if (Number.isFinite(value)) choosePace(value); }} />
                <Button variant="outline" size="icon" aria-label="More lines per day" disabled={plan.newLinesPerDay >= 150} onClick={() => choosePace(plan.newLinesPerDay + 1)}><Plus /></Button>
                <span>lines a day</span>
              </div>
              <strong>{paceLabel(plan.newLinesPerDay)}</strong>
              <p>Finish in {humanDuration(summary.calendarDays)} · {monthYear(summary.finishDate)}</p>
              <p>{humanMinutes(summary.minutesAtStart)} a day now, {humanMinutes(summary.minutesAtPeak)} later</p>
            </div>
            </> : <div className="hz-custom-pace">
              <label htmlFor="finish-date">Finish date</label>
              <input id="finish-date" type="date" value={targetDate} min={today} onChange={(e) => { const value = e.target.value; setTargetDate(value); if (!value) return; const result = paceForFinishDate(draft, q, value); if (result) choosePace(result.newLinesPerDay); }} />
              {targetDate && (dateTimeline ? <p role="status">{paceLabel(dateTimeline.newLinesPerDay)}, {humanMinutes(dateTimeline.minutesAtPeak)} a day at peak</p> : <p role="status">That&apos;s sooner than is realistic. Try a later date.</p>)}
            </div>}
            </div>
            <footer className="hz-customize-footer"><Button className="hz-primary" disabled={paceMode === "date" && !dateTimeline} onClick={() => setCustomizePace(false)}>Done <Check /></Button></footer>
          </SheetContent>
        </Sheet>

        {step === 3 && (
          <section>
            <h1 className="hz-title">Your plan</h1>
            <div className="hz-summary">
              <p className="hz-big-finish">
                Done by <strong>{monthYear(selectedEstimate.finish)}</strong>
                <span> ({humanDuration(selectedEstimate.days)})</span>
              </p>
              <div className="hz-milestones">
                {summary.juzMilestones.slice(0, 8).map((m) => (
                  <span key={m.juz} className="hz-milestone">Juz {m.juz} · {fmtDate(m.date)}</span>
                ))}
                {summary.juzMilestones.length > 8 && <span className="hz-milestone">…</span>}
              </div>
              <p className="hz-sub">Daily time needed as your hifz grows</p>
              <MinutesChart points={summary.minutesByMonth} budget={plan.dailyMinutes} />
              {summary.shortOnTime && <p className="hz-warning">{summary.shortOnTime.message}</p>}
              <Button variant="ghost" className="hz-wide" aria-expanded={advanced} onClick={() => setAdvanced((v) => !v)}>
                Advanced options
              </Button>
              {advanced && (
                <div className="hz-advanced">
                  <fieldset className="hz-field">
                    <legend>Study days</legend>
                    <div className="hz-days">
                      {DAY_NAMES.map((name, i) => (
                        <Button variant="ghost" key={name} aria-pressed={plan.studyDays.includes(i)} className={`hz-day ${plan.studyDays.includes(i) ? "is-on" : ""}`}
                          onClick={() => setPlan((p) => ({ ...p, studyDays: toggleIn(p.studyDays, i).sort() }))}>
                          {name}
                        </Button>
                      ))}
                    </div>
                  </fieldset>
                  <label className="hz-toggle">
                    <input type="checkbox" checked={plan.consolidateEvery > 0}
                      onChange={(e) => setPlan((p) => ({ ...p, consolidateEvery: e.target.checked ? 20 : 0, consolidateDays: e.target.checked ? 3 : 0 }))} />
                    <span>Review-only days after each juz</span>
                  </label>
                  <fieldset className="hz-field">
                    <legend>Strength</legend>
                    <div className="hz-days">
                      <Button variant="ghost" aria-pressed={plan.targetRetention === 0.93} className={`hz-day ${plan.targetRetention === 0.93 ? "is-on" : ""}`} onClick={() => setPlan((p) => ({ ...p, targetRetention: 0.93 }))}>Standard</Button>
                      <Button variant="ghost" aria-pressed={plan.targetRetention === 0.96} className={`hz-day ${plan.targetRetention === 0.96 ? "is-on" : ""}`} onClick={() => setPlan((p) => ({ ...p, targetRetention: 0.96 }))}>Strong</Button>
                    </div>
                  </fieldset>
                </div>
              )}
            </div>
          </section>
        )}

        <div className="hz-nav">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}><ChevronLeft /> Back</Button>
          ) : <span />}
          {step < steps.length - 1 ? (
            <Button className="hz-primary" disabled={!canNext} onClick={() => setStep((s) => s + 1)}>Next <ChevronRight /></Button>
          ) : (
            <Button className="hz-primary" onClick={finish}><Check /> Start my plan</Button>
          )}
        </div>
      </div>
    </main>
  );
}

/** Small line chart of the daily minutes the plan will need as memorization grows. */
function MinutesChart({ points, budget }: { points: { atMonth: number; minutes: number }[]; budget: number }) {
  if (points.length < 2) return null;
  const W = 320;
  const H = 90;
  const max = Math.max(...points.map((p) => p.minutes), budget) * 1.1;
  const xy = points.map((p) => [
    (p.atMonth / points[points.length - 1].atMonth) * (W - 8) + 4,
    H - 6 - (p.minutes / max) * (H - 14),
  ]);
  const path = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const budgetY = H - 6 - (budget / max) * (H - 14);
  return (
    <svg className="hz-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily minutes needed as your hifz grows">
      <line x1="4" x2={W - 4} y1={budgetY} y2={budgetY} className="hz-chart-budget" />
      <path d={path} className="hz-chart-line" fill="none" />
      <text x={W - 6} y={budgetY - 3} className="hz-chart-label" textAnchor="end">your {budget} min</text>
      <text x="4" y={H - 0} className="hz-chart-label">now</text>
      <text x={W - 4} y={H - 0} className="hz-chart-label" textAnchor="end">{points[points.length - 1].atMonth} mo</text>
    </svg>
  );
}
