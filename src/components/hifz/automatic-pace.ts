import { buildTimeline, type HifzPlan, type QuranIndex, type Timeline } from "@/lib/hifz";

export const AUTOMATIC_LINES = [3, 5, 7, 10, 15, 20, 30, 45];
export const DAILY_MINUTES = [20, 30, 45, 60, 90, 120, 180];

export function effectiveTimeline(timeline: Timeline) {
  return {
    lines: timeline.newLinesPerDay,
    finish: timeline.shortOnTime?.realisticFinishDate ?? timeline.finishDate,
    days: timeline.shortOnTime?.realisticCalendarDays ?? timeline.calendarDays,
    firstJuz: timeline.juzMilestones[0]?.date,
    timeline,
  };
}

export function bestAutomaticPace(plan: HifzPlan, q: QuranIndex, minutes: number) {
  return AUTOMATIC_LINES.map((lines) => effectiveTimeline(buildTimeline({ ...plan, newLinesPerDay: lines }, q, minutes)))
    .sort((a, b) => a.finish.localeCompare(b.finish) || a.lines - b.lines)[0];
}