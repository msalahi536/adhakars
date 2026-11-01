import { buildTimeline, daysBetween, type HifzPlan, type QuranIndex, type Timeline } from "@/lib/hifz";

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

export function selectedFinishEstimate(timeline: Timeline, startDate: string, targetDate?: string) {
  const effective = effectiveTimeline(timeline);
  if (!targetDate) return { ...effective, timeWarning: undefined };
  return {
    ...effective,
    finish: targetDate,
    days: daysBetween(startDate, targetDate) + 1,
    timeWarning: effective.finish > targetDate ? timeline.shortOnTime?.message : undefined,
  };
}

export function goalFinishEstimates(plan: HifzPlan, q: QuranIndex) {
  if (plan.order.kind === "forward") return null;
  const isAmma = plan.order.kind === "juzAmmaFirst";
  if (!isAmma && plan.order.kind !== "surahs") return null;
  const goalIndex = isAmma ? { ...q, surahPages: { ...q.surahPages, 0: [582, 604] as [number, number] } } : q;
  const goalOrder = isAmma ? { kind: "surahs" as const, surahs: [0] } : plan.order;
  const goal = effectiveTimeline(buildTimeline({ ...plan, order: goalOrder }, goalIndex, plan.dailyMinutes));
  const fullIndex = { ...q, surahPages: { ...q.surahPages, 0: [1, 604] as [number, number] } };
  const fullOrder = plan.order.kind === "surahs"
    ? { kind: "surahs" as const, surahs: [...plan.order.surahs, 0] }
    : plan.order;
  const full = effectiveTimeline(buildTimeline({ ...plan, order: fullOrder }, fullIndex, plan.dailyMinutes));
  return { label: isAmma ? "Juz Amma" : "Selected surahs", goal, full };
}