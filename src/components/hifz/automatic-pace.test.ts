import { expect, test } from "bun:test";
import { buildTimeline, buildQuranIndex, defaultPlan } from "@/lib/hifz";
import { AUTOMATIC_LINES, DAILY_MINUTES, bestAutomaticPace, selectedFinishEstimate, goalFinishEstimates } from "./automatic-pace";

const q = buildQuranIndex([{ id: 67, pages: [562, 564] }]);
const plan = { ...defaultPlan("2026-11-01"), order: { kind: "surahs" as const, surahs: [67] }, studyDays: [0,1,2,3,4,5,6], consolidateEvery: 0 };

test("automatic candidates and time options match requested values", () => {
  expect(AUTOMATIC_LINES).toEqual([3,5,7,10,15,20,30,45]);
  expect(DAILY_MINUTES).toEqual([20,30,45,60,90,120,180]);
});
test("each minute option selects earliest effective finish with smaller lines breaking ties", () => {
  for (const minutes of DAILY_MINUTES) {
    const expected = AUTOMATIC_LINES.map((lines) => {
      const t = buildTimeline({ ...plan, newLinesPerDay: lines }, q, minutes);
      return { lines, finish: t.shortOnTime?.realisticFinishDate ?? t.finishDate };
    }).sort((a,b) => a.finish.localeCompare(b.finish) || a.lines - b.lines)[0];
    const actual = bestAutomaticPace(plan, q, minutes);
    expect(actual?.lines).toBe(expected.lines);
    expect(actual?.finish).toBe(expected.finish);
  }
});
test("equal finish dates favor smaller pace", () => {
  expect(bestAutomaticPace(plan, q, 180)?.lines).toBe(45);
  const onePage = buildQuranIndex([{ id: 67, pages: [562,562] }]);
  expect(bestAutomaticPace(plan, onePage, 180)?.lines).toBe(15);
});

test("chosen finish date and duration appear in the selected summary", () => {
  const timeline = buildTimeline({ ...plan, newLinesPerDay: 3 }, q, 180);
  const selected = selectedFinishEstimate(timeline, "2026-11-01", "2027-02-15");
  expect(selected.finish).toBe("2027-02-15");
  expect(selected.days).toBe(107);
});

test("a chosen date does not hide a daily-time limitation", () => {
  const timeline = buildTimeline({ ...plan, newLinesPerDay: 45 }, q, 20);
  const selected = selectedFinishEstimate(timeline, plan.startDate, "2026-10-31");
  expect(selected.finish).toBe("2026-10-31");
  expect(selected.timeWarning).toBeTruthy();
  expect(selected.timeWarning).toBe(timeline.shortOnTime?.message);
});

test("manual pace without a chosen date retains the effective engine finish", () => {
  const timeline = buildTimeline({ ...plan, newLinesPerDay: 45 }, q, 20);
  expect(selectedFinishEstimate(timeline, plan.startDate).finish).toBe(timeline.shortOnTime?.realisticFinishDate);
});

test("home and plan use the same realistic finish duration with a 45-minute budget", () => {
  const fullPlan = { ...defaultPlan("2026-11-01"), dailyMinutes: 45, newLinesPerDay: 7 };
  const timeline = buildTimeline(fullPlan, q, 45);
  expect(timeline.shortOnTime).toBeDefined();
  const home = selectedFinishEstimate(timeline, fullPlan.startDate);
  expect(home.finish).toBe(timeline.shortOnTime?.realisticFinishDate);
  expect(home.days).toBe(timeline.shortOnTime?.realisticCalendarDays);
  expect(home.days).toBeGreaterThan(timeline.calendarDays);
});

test("a July 2034 finish already shown never repeats the time-limit warning", () => {
  const timeline = buildTimeline({ ...plan, newLinesPerDay: 45 }, q, 45);
  const limited = { ...timeline, shortOnTime: {
    available: 45, realisticFinishDate: "2034-07-31", realisticCalendarDays: 2830,
    message: "With 45 minutes you’d finish around July 2034 instead.",
  } };
  expect(selectedFinishEstimate(limited, plan.startDate).timeWarning).toBeUndefined();
  expect(selectedFinishEstimate(limited, plan.startDate, "2034-07-01").timeWarning).toBeUndefined();
  expect(selectedFinishEstimate(limited, plan.startDate, "2034-07-31").timeWarning).toBeUndefined();
  expect(selectedFinishEstimate(limited, plan.startDate, "2033-07-01").timeWarning).toBe(limited.shortOnTime.message);
});

test("Juz Amma estimate covers its 23 pages separately from all 604 pages", () => {
  const result = goalFinishEstimates({ ...plan, order: { kind: "juzAmmaFirst" }, newLinesPerDay: 15, dailyMinutes: 180 }, q);
  expect(result?.goal.timeline.pagesToMemorize).toBe(23);
  expect(result?.goal.days).toBe(23);
  expect(result?.full.timeline.pagesToMemorize).toBe(604);
  expect(result?.full.days).toBeGreaterThan(23);
});

test("selected surahs retain their own estimate while full Quran includes remaining surahs", () => {
  const index = buildQuranIndex([{ id: 67, pages: [562, 564] }, { id: 2, pages: [2, 49] }]);
  const result = goalFinishEstimates({ ...plan, newLinesPerDay: 15, dailyMinutes: 180 }, index);
  expect(result?.goal.days).toBe(3);
  expect(result?.goal.timeline.pagesToMemorize).toBe(3);
  expect(result?.full.timeline.pagesToMemorize).toBe(604);
  expect(result?.full.days).toBeGreaterThan(3);
});

test("already known Juz Amma pages are excluded from its goal estimate", () => {
  const result = goalFinishEstimates({ ...plan, order: { kind: "juzAmmaFirst" }, alreadyMemorized: [604], newLinesPerDay: 15, dailyMinutes: 180 }, q);
  expect(result?.goal.days).toBe(22);
});