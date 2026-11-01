import { addDays, daysBetween } from "./fsrs";
import { linesOnPage, memorizationSequence, juzOfPage } from "./quran";
import type { HifzPlan, QuranIndex } from "./types";

export const MINUTES = { newLine: 4, reviewPage: 2 };

export const PACE_PRESETS = [
  { lines: 30, label: "2 pages a day", note: "Full-time hifz, like a hifz school." },
  { lines: 20, label: "1⅓ pages a day", note: "Intensive, most of your day." },
  { lines: 15, label: "1 page a day", note: "Serious daily commitment." },
  { lines: 10, label: "10 lines a day", note: "Two thirds of a page." },
  { lines: 7, label: "Half a page a day", note: "Steady next to school or work." },
  { lines: 5, label: "5 lines a day", note: "A third of a page." },
  { lines: 3, label: "3 lines a day", note: "Gentle start." },
];

export interface Timeline {
  newLinesPerDay: number;
  pagesToMemorize: number;
  linesToMemorize: number;
  studyDaysNeeded: number;
  calendarDays: number;
  finishDate: string;
  juzMilestones: { juz: number; date: string }[];
  minutesByMonth: { atMonth: number; minutes: number }[];
  minutesAtStart: number;
  minutesAtPeak: number;
  shortOnTime?: { available: number; realisticFinishDate: string; realisticCalendarDays: number; message: string };
}

const isStudyDay = (plan: HifzPlan, iso: string) =>
  plan.studyDays.includes(new Date(iso + "T12:00:00Z").getUTCDay());

export function estimatedReviewPages(memorized: number, newLinesPerDay: number, manzilCycleDays = 30): number {
  const recent = Math.min(memorized, (newLinesPerDay / 15) * 7);
  const older = Math.max(0, memorized - recent);
  return recent + older / manzilCycleDays;
}

export const minutesNeeded = (memorized: number, newLinesPerDay: number) =>
  Math.round(estimatedReviewPages(memorized, newLinesPerDay) * MINUTES.reviewPage + newLinesPerDay * MINUTES.newLine);

function simulate(plan: HifzPlan, q: QuranIndex, capMinutes?: number) {
  const known = new Set(plan.alreadyMemorized);
  const seq = memorizationSequence(q, plan.order).filter((p) => !known.has(p));
  const lines = seq.map(linesOnPage);
  let day = plan.startDate, studyDays = 0, calendar = 0, pageIdx = 0, lineInPage = 0, consolidateLeft = 0, sinceConsolidate = 0;
  const juzLeft: Record<number, number> = {};
  for (const p of seq) juzLeft[juzOfPage(p)] = (juzLeft[juzOfPage(p)] ?? 0) + 1;
  const juzMilestones: Timeline["juzMilestones"] = [];
  const minutesByMonth: Timeline["minutesByMonth"] = [];
  while (pageIdx < seq.length && calendar < 365 * 60) {
    const memorized = plan.alreadyMemorized.length + pageIdx;
    if (calendar % 30 === 0) minutesByMonth.push({ atMonth: calendar / 30, minutes: minutesNeeded(memorized, plan.newLinesPerDay) });
    if (isStudyDay(plan, day)) {
      if (consolidateLeft > 0) consolidateLeft--;
      else {
        studyDays++;
        let budget = plan.newLinesPerDay;
        if (capMinutes !== undefined) {
          const reviewMin = estimatedReviewPages(memorized, plan.newLinesPerDay) * MINUTES.reviewPage;
          const fit = Math.floor((capMinutes - reviewMin) / MINUTES.newLine);
          budget = Math.max(Math.min(2, budget), Math.min(budget, fit));
        }
        while (budget > 0 && pageIdx < seq.length) {
          const take = Math.min(budget, lines[pageIdx] - lineInPage);
          lineInPage += take;
          budget -= take;
          if (lineInPage >= lines[pageIdx]) {
            const j = juzOfPage(seq[pageIdx]);
            if (--juzLeft[j] === 0) juzMilestones.push({ juz: j, date: day });
            pageIdx++;
            lineInPage = 0;
            if (plan.consolidateEvery > 0 && ++sinceConsolidate >= plan.consolidateEvery) {
              sinceConsolidate = 0;
              consolidateLeft = plan.consolidateDays;
              break;
            }
          }
        }
      }
    }
    day = addDays(day, 1);
    calendar++;
  }
  return { seq, linesTotal: lines.reduce((a, b) => a + b, 0), studyDays, calendar, finishDate: addDays(day, -1), juzMilestones, minutesByMonth };
}

export function buildTimeline(plan: HifzPlan, q: QuranIndex, availableMinutes?: number): Timeline {
  const r = simulate(plan, q);
  const minutesAtStart = r.minutesByMonth[0]?.minutes ?? minutesNeeded(plan.alreadyMemorized.length, plan.newLinesPerDay);
  const minutesAtPeak = Math.max(minutesAtStart, ...r.minutesByMonth.map((m) => m.minutes));
  const t: Timeline = {
    newLinesPerDay: plan.newLinesPerDay, pagesToMemorize: r.seq.length, linesToMemorize: r.linesTotal,
    studyDaysNeeded: r.studyDays, calendarDays: r.calendar, finishDate: r.finishDate,
    juzMilestones: r.juzMilestones, minutesByMonth: r.minutesByMonth, minutesAtStart, minutesAtPeak,
  };
  if (availableMinutes !== undefined && minutesAtPeak > availableMinutes * 1.1) {
    const capped = simulate(plan, q, availableMinutes);
    t.shortOnTime = {
      available: availableMinutes,
      realisticFinishDate: capped.finishDate,
      realisticCalendarDays: capped.calendar,
      message: `This pace needs about ${minutesAtPeak} minutes a day once your review grows. With ${availableMinutes} minutes a day you'd finish around ${monthYear(capped.finishDate)} instead.`,
    };
  }
  return t;
}

export function compareTimelines(plan: HifzPlan, q: QuranIndex, availableMinutes?: number) {
  return PACE_PRESETS.map((p) => {
    const t = buildTimeline({ ...plan, newLinesPerDay: p.lines }, q, availableMinutes);
    return { ...p, finishDate: t.finishDate, calendarDays: t.calendarDays, duration: humanDuration(t.calendarDays),
      minutesAtStart: t.minutesAtStart, minutesAtPeak: t.minutesAtPeak, shortOnTime: t.shortOnTime };
  });
}

export function paceForFinishDate(plan: HifzPlan, q: QuranIndex, targetDate: string) {
  if (daysBetween(plan.startDate, targetDate) < 1) return null;
  let lo = 1, hi = 150;
  if (buildTimeline({ ...plan, newLinesPerDay: hi }, q).finishDate > targetDate) return null;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (buildTimeline({ ...plan, newLinesPerDay: mid }, q).finishDate <= targetDate) hi = mid;
    else lo = mid + 1;
  }
  return buildTimeline({ ...plan, newLinesPerDay: lo }, q);
}

export function paceLabel(lines: number): string {
  if (lines < 15) return lines === 1 ? "1 line a day" : `${lines} lines a day`;
  const pages = lines / 15, whole = Math.floor(pages), frac = pages - whole;
  const f = frac < 0.17 ? "" : frac < 0.42 ? "¼" : frac < 0.58 ? "½" : frac < 0.83 ? "¾" : "";
  const p = frac >= 0.83 ? whole + 1 : whole;
  return `${p}${f} page${p > 1 || f ? "s" : ""} a day`;
}

export function humanDuration(days: number): string {
  let y = Math.floor(days / 365), m = Math.round((days - y * 365) / 30.4);
  if (m >= 12) { y += 1; m = 0; }
  if (y === 0) return m <= 1 ? `${days} days` : `${m} months`;
  return m === 0 ? `${y} year${y > 1 ? "s" : ""}` : `${y} yr ${m} mo`;
}

export function monthYear(iso: string): string {
  return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function humanMinutes(min: number): string {
  if (min < 60) return `about ${Math.round(min / 5) * 5} minutes`;
  const r = Math.round((min / 60) * 2) / 2;
  return `about ${r % 1 ? r.toFixed(1) : r} hour${r > 1 ? "s" : ""}`;
}
