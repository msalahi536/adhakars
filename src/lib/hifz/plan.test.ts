import { expect, test } from "bun:test";
import { buildTimeline, compareTimelines, paceForFinishDate, minutesNeeded, PACE_PRESETS } from "./plan";
import { defaultPlan } from "./engine";
import { buildQuranIndex } from "./quran";

const q = buildQuranIndex([{ id: 67, pages: [562, 564] }]);
const plan = { ...defaultPlan("2026-11-01"), order: { kind: "surahs" as const, surahs: [67] }, studyDays: [0, 1, 2, 3, 4, 5, 6], consolidateEvery: 0, dailyMinutes: 20 };

test("approved presets are fastest first including 20 lines", () => {
  expect(PACE_PRESETS.map((p) => p.lines)).toEqual([30, 20, 15, 10, 7, 5, 3]);
});
test("slower preset never finishes before a faster preset regardless of time budget", () => {
  const results = compareTimelines(plan, q, 20);
  for (let i = 1; i < results.length; i++) expect(results[i].finishDate >= results[i - 1].finishDate).toBe(true);
  expect(buildTimeline({ ...plan, newLinesPerDay: 30 }, q).calendarDays).toBe(2);
});
test("custom paces support 1 and 150 lines per day", () => {
  expect(buildTimeline({ ...plan, newLinesPerDay: 1 }, q).calendarDays).toBe(45);
  expect(buildTimeline({ ...plan, newLinesPerDay: 150 }, q).calendarDays).toBe(1);
});
test("finish date finds smallest pace that meets the target", () => {
  const result = paceForFinishDate(plan, q, "2026-11-03");
  expect(result?.newLinesPerDay).toBe(15);
  expect(result?.finishDate).toBe("2026-11-03");
  expect(paceForFinishDate(plan, q, "2026-11-01")).toBeNull();
});
test("20 minute budget warns without altering chosen pace finish date", () => {
  const draft = { ...plan, newLinesPerDay: 30 };
  const result = buildTimeline(draft, q, 20);
  expect(result.minutesAtStart).toBe(120);
  expect(result.shortOnTime?.available).toBe(20);
  expect(result.finishDate).toBe(buildTimeline(draft, q).finishDate);
  expect(result.shortOnTime?.realisticCalendarDays).toBeGreaterThan(result.calendarDays);
});
test("minute estimates use four minutes per line and two per review page", () => {
  expect(minutesNeeded(0, 5)).toBe(20);
  expect(minutesNeeded(30, 15)).toBe(76);
});
test("budget warnings start only above the approved ten-percent tolerance", () => {
  const draft = { ...plan, newLinesPerDay: 30 };
  expect(buildTimeline(draft, q, 120 / 1.1).shortOnTime).toBeUndefined();
  expect(buildTimeline(draft, q, 109).shortOnTime).toBeDefined();
  expect(buildTimeline(draft, q, 180).shortOnTime).toBeUndefined();
});