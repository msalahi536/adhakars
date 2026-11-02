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
    timeWarning: effective.finish > targetDate && effective.finish.slice(0, 7) !== targetDate.slice(0, 7)
      ? timeline.shortOnTime?.message : undefined,
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
/** Distinct increasing time choices, still estimated by the engine. */
export function distinctAutomaticPaces(plan: HifzPlan, q: QuranIndex) {
  const choices = new Map<number, ReturnType<typeof effectiveTimeline>>();
  let previous = 0;
  DAILY_MINUTES.forEach((minutes, index) => {
    const maxIndex = AUTOMATIC_LINES.length - (DAILY_MINUTES.length - index);
    const ranked = AUTOMATIC_LINES.filter((lines, i) => lines > previous && i <= maxIndex)
      .map(lines => effectiveTimeline(buildTimeline({ ...plan, newLinesPerDay: lines }, q, minutes)))
      .sort((a, b) => a.finish.localeCompare(b.finish) || a.lines - b.lines);
    const selected = ranked[0];
    if (selected) { choices.set(minutes, selected); previous = selected.lines; }
  });
  return choices;
}
export function reviewGrowth(points: Timeline["minutesByMonth"], budget: number, start: string) {
  const first = points.find(p => p.minutes > budget);
  if (!first) return null;
  const date = new Date(start + "T12:00:00Z");
  date.setUTCDate(date.getUTCDate() + first.atMonth * 30);
  return { date: date.toISOString().slice(0, 10), minutes: Math.round(first.minutes) };
}
