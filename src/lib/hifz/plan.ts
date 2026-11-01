/**
 * Plan and timeline: "at this pace you finish on <date>", per-juz milestones,
 * and an honest estimate of how many minutes a day it will take as review grows.
 */
import { addDays } from "./fsrs";
import { linesOnPage, memorizationSequence, juzOfPage } from "./quran";
import type { HifzPlan, QuranIndex } from "./types";

/** Average minutes, used only for estimates shown to the user. */
export const MINUTES = {
  newLine: 4, // encode -> hide -> recall loop for one new line
  reviewPage: 2, // reciting one memorized page from memory, plus checking (a juz in ~40 min)
};

export const PACE_PRESETS = [
  { lines: 3, label: "3 lines a day", note: "Gentle. Good next to school or work." },
  { lines: 5, label: "5 lines a day", note: "A third of a page." },
  { lines: 7, label: "Half a page a day", note: "Steady and sustainable." },
  { lines: 10, label: "10 lines a day", note: "Two thirds of a page." },
  { lines: 15, label: "1 page a day", note: "Full-time hifz pace." },
  { lines: 30, label: "2 pages a day", note: "Intensive. Only with lots of daily time." },
];

export interface Timeline {
  /** Lines actually fitting per day at the start vs. at the end (shrinks as review grows). */
  pagesToMemorize: number;
  linesToMemorize: number;
  studyDaysNeeded: number;
  calendarDays: number;
  finishDate: string;
  juzMilestones: { juz: number; date: string }[]; // when each juz in the plan is completed
  steadyStateMinutes: { atMonth: number; minutes: number }[]; // daily time needed as hifz grows
  warning?: string;
}

const isStudyDay = (plan: HifzPlan, iso: string) =>
  plan.studyDays.includes(new Date(iso + "T12:00:00Z").getUTCDay());

/** Estimated daily review pages once `memorized` pages are held (sabqi: last week daily, manzil: ~monthly cycle). */
export function estimatedReviewPages(memorized: number, newLinesPerDay: number, manzilCycleDays = 30): number {
  const recent = Math.min(memorized, (newLinesPerDay / 15) * 7); // last ~7 days of new pages, reviewed daily
  const older = Math.max(0, memorized - recent);
  return recent + older / manzilCycleDays;
}

export function buildTimeline(plan: HifzPlan, q: QuranIndex): Timeline {
  const known = new Set(plan.alreadyMemorized);
  const seq = memorizationSequence(q, plan.order).filter((p) => !known.has(p));
  const lines = seq.map(linesOnPage);
  const linesTotal = lines.reduce((a, b) => a + b, 0);

  let day = plan.startDate;
  let studyDays = 0;
  let calendar = 0;
  let pageIdx = 0;
  let lineInPage = 0;
  let pagesDone = 0;
  let consolidateLeft = 0;
  let pagesSinceConsolidate = 0;
  const juzLeft: Record<number, number> = {};
  for (const p of seq) juzLeft[juzOfPage(p)] = (juzLeft[juzOfPage(p)] ?? 0) + 1;
  const juzMilestones: Timeline["juzMilestones"] = [];
  const minutes: Timeline["steadyStateMinutes"] = [];

  while (pageIdx < seq.length && calendar < 365 * 40) {
    if (calendar % 30 === 0) {
      const memorized = plan.alreadyMemorized.length + pagesDone;
      const rev = estimatedReviewPages(memorized, plan.newLinesPerDay);
      minutes.push({ atMonth: calendar / 30, minutes: Math.round(rev * MINUTES.reviewPage + plan.newLinesPerDay * MINUTES.newLine) });
    }
    if (isStudyDay(plan, day)) {
      if (consolidateLeft > 0) {
        consolidateLeft--;
      } else {
        studyDays++;
        // Review comes first: new lines only get the time that's left (never below 2 lines on a study day).
        const memorizedNow = plan.alreadyMemorized.length + pagesDone;
        const reviewMin = estimatedReviewPages(memorizedNow, plan.newLinesPerDay) * MINUTES.reviewPage;
        const fitLines = Math.floor((plan.dailyMinutes - reviewMin) / MINUTES.newLine);
        let budget = Math.max(Math.min(2, plan.newLinesPerDay), Math.min(plan.newLinesPerDay, fitLines));
        while (budget > 0 && pageIdx < seq.length) {
          const take = Math.min(budget, lines[pageIdx] - lineInPage);
          lineInPage += take;
          budget -= take;
          if (lineInPage >= lines[pageIdx]) {
            const j = juzOfPage(seq[pageIdx]);
            if (--juzLeft[j] === 0) juzMilestones.push({ juz: j, date: day });
            pageIdx++;
            pagesDone++;
            lineInPage = 0;
            if (plan.consolidateEvery > 0 && ++pagesSinceConsolidate >= plan.consolidateEvery) {
              pagesSinceConsolidate = 0;
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

  const peak = Math.max(...minutes.map((m) => m.minutes));
  const warning =
    peak > plan.dailyMinutes * 1.15
      ? `As your hifz grows, review will need about ${peak} minutes a day, more than the ${plan.dailyMinutes} you set. Consider a slower pace or more daily time.`
      : undefined;

  return {
    pagesToMemorize: seq.length,
    linesToMemorize: linesTotal,
    studyDaysNeeded: studyDays,
    calendarDays: calendar,
    finishDate: addDays(day, -1),
    juzMilestones,
    steadyStateMinutes: minutes,
    warning,
  };
}

/** Compare every preset pace for the pace picker ("1 page a day: done in 1 yr 11 mo"). */
export function compareTimelines(plan: HifzPlan, q: QuranIndex) {
  return PACE_PRESETS.map((p) => {
    const t = buildTimeline({ ...plan, newLinesPerDay: p.lines }, q);
    return { ...p, finishDate: t.finishDate, calendarDays: t.calendarDays, warning: t.warning };
  });
}

export function humanDuration(days: number): string {
  let y = Math.floor(days / 365);
  let m = Math.round((days - y * 365) / 30.4);
  if (m >= 12) {
    y += 1;
    m = 0;
  }
  if (y === 0) return m <= 1 ? `${days} days` : `${m} months`;
  return m === 0 ? `${y} year${y > 1 ? "s" : ""}` : `${y} yr ${m} mo`;
}
