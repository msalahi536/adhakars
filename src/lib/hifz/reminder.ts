// Hifz daily reminder content (pure). Scheduling goes through the app's notification system
// (`src/lib/notifications.ts`), which owns permission, ids and the pending-notification budget.
import { REMINDER_DAYS_AHEAD } from "@/lib/notification-budget";
import { addDays, localDay } from "./scheduler";
import { buildQueue, forecast } from "./session";
import { derive, type HifzState } from "./store";

export type HifzNote = { at: Date; body: string };

/** Next few days at the chosen time; today is skipped once its session is done, and empty days are skipped. */
export function hifzReminderNotes(st: HifzState, now: Date, hour: number, minute: number, todayDone: boolean, days = REMINDER_DAYS_AHEAD): HifzNote[] {
  if (!st.plan && !st.events.length) return [];
  const today = localDay(now);
  const pace = st.plan?.paceLines ?? 5;
  const q = buildQueue(derive(st.events), today, st.plan?.goal, pace);
  const ahead = forecast(st.events, today, st.plan?.goal, pace, days - 1);
  const out: HifzNote[] = [];
  for (let i = 0; i < days; i++) {
    if (i === 0 && todayDone) continue;
    const at = new Date(`${addDays(today, i)}T00:00:00`);
    at.setHours(hour, minute, 0, 0);
    if (at.getTime() <= now.getTime()) continue;
    const n = i === 0 ? q.manzil.length + q.sabqi.length : ahead[i - 1]?.total ?? 0;
    const fresh = i === 0 ? q.sabaq.length > 0 : (ahead[i - 1]?.newLines ?? 0) > 0;
    if (!n && !fresh) continue;
    out.push({ at, body: n ? `Hifz: ${n} review${n === 1 ? "" : "s"} due today` : "Hifz: new lines are ready today" });
  }
  return out;
}

/** Today's frozen session finished (read from device storage). */
export function hifzTodayDone(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem("hifz:today") || "null");
    return !!s && s.day === localDay(new Date()) && s.done >= s.items.length;
  } catch { return false; }
}
