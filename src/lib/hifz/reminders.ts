/**
 * Hifz reminders: a morning "review is ready" notification and a before-sleep
 * "recite today's new lines" notification (only on days with new memorization).
 * Both are off by default; permission is only requested when the user turns one on.
 * IDs live in the 910xxx/911xxx range, clear of the retired Hifz IDs (900, 900000-900006)
 * that clearRetiredHifz removes, and of prayer alerts which the budget never trims.
 */
import {
  loadNotificationPlugin,
  ensureNotificationChannel,
  NOTIFICATION_CHANNEL,
  isNativePlatform,
  requestNotificationPermission,
  enforceBudget,
} from "@/lib/notifications";
import { REMINDER_DAYS_AHEAD } from "@/lib/notification-budget";
import { buildSession, todayISO } from "./index";
import type { QuranIndex, HifzState } from "./types";
import { morningReminderBody, SLEEP_REMINDER_BODY, hasSabaq } from "./program";

export const HIFZ_MORNING_ID = 910000;
export const HIFZ_SLEEP_ID = 911000;

export type HifzReminderPrefs = {
  morning: { enabled: boolean; hour: number; minute: number };
  sleep: { enabled: boolean; hour: number; minute: number };
};

const KEY = "hifzReminders";

export const defaultHifzReminders = (): HifzReminderPrefs => ({
  morning: { enabled: false, hour: 6, minute: 30 },
  sleep: { enabled: false, hour: 21, minute: 30 },
});

export function getHifzReminders(): HifzReminderPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultHifzReminders();
    const p = JSON.parse(raw) as Partial<HifzReminderPrefs>;
    const d = defaultHifzReminders();
    return {
      morning: { ...d.morning, ...p.morning },
      sleep: { ...d.sleep, ...p.sleep },
    };
  } catch {
    return defaultHifzReminders();
  }
}

export function setHifzReminders(p: HifzReminderPrefs): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch { /* keep working in memory */ }
}

const idsFor = (base: number) => Array.from({ length: REMINDER_DAYS_AHEAD }, (_, i) => base + i);

const nextOccurrence = (hour: number, minute: number): Date => {
  const at = new Date();
  at.setHours(hour, minute, 0, 0);
  if (at.getTime() <= Date.now()) at.setDate(at.getDate() + 1);
  return at;
};

async function cancel(base: number): Promise<void> {
  const plugin = await loadNotificationPlugin();
  if (!plugin) return;
  try {
    await plugin.cancel({ notifications: idsFor(base).map((id) => ({ id })) });
  } catch { /* nothing pending */ }
}

async function schedule(base: number, title: string, body: string, hour: number, minute: number): Promise<void> {
  const plugin = await loadNotificationPlugin();
  if (!plugin) return;
  await ensureNotificationChannel(plugin);
  await cancel(base);
  const first = nextOccurrence(hour, minute);
  await plugin.schedule({
    notifications: idsFor(base).map((id, i) => {
      const at = new Date(first.getTime());
      at.setDate(at.getDate() + i);
      return {
        id,
        title,
        body,
        schedule: { at, allowWhileIdle: true },
        channelId: NOTIFICATION_CHANNEL,
        extra: { route: "/app/hifz" },
      };
    }),
  });
}

/**
 * Rebuild both reminders from the current state. Called when prefs change and on
 * every Hifz home open, so the body always matches the real session. The sleep
 * reminder is only scheduled on days that include new memorization.
 */
export async function rescheduleHifzReminders(state: HifzState | null, q: QuranIndex | null): Promise<void> {
  if (!isNativePlatform()) return;
  const prefs = getHifzReminders();
  if (!prefs.morning.enabled) await cancel(HIFZ_MORNING_ID);
  if (!prefs.sleep.enabled) await cancel(HIFZ_SLEEP_ID);
  if (!state || !q || (!prefs.morning.enabled && !prefs.sleep.enabled)) return;
  const session = buildSession(state, q, todayISO());
  if (prefs.morning.enabled)
    await schedule(HIFZ_MORNING_ID, "Hifz review", morningReminderBody(session), prefs.morning.hour, prefs.morning.minute);
  if (prefs.sleep.enabled && hasSabaq(session))
    await schedule(HIFZ_SLEEP_ID, "Before you sleep", SLEEP_REMINDER_BODY, prefs.sleep.hour, prefs.sleep.minute);
  await enforceBudget();
}

/** Toggle one reminder; asks for notification permission only when turning on. */
export async function toggleHifzReminder(
  which: "morning" | "sleep",
  on: boolean,
  state: HifzState | null,
  q: QuranIndex | null,
): Promise<{ ok: boolean; error?: string }> {
  const prefs = getHifzReminders();
  prefs[which].enabled = on;
  if (on) {
    const result = await requestNotificationPermission();
    if (!result.granted) {
      prefs[which].enabled = false;
      setHifzReminders(prefs);
      return { ok: false, error: "Notifications are not allowed. You can enable them in your device settings." };
    }
  }
  setHifzReminders(prefs);
  await rescheduleHifzReminders(state, q);
  return { ok: true };
}
