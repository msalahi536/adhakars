// Adhan notifications: one local notification per prayer, rescheduled on open.

import {
  isNativePlatform,
  loadNotificationPlugin,
  ensureNotificationChannel,
  NOTIFICATION_CHANNEL,
} from "@/lib/notifications";
import {
  SALAH_IDS,
  PRAYER_LABELS,
  fetchDay,
  slotsForDay,
  getDismissed,
  isMutedAllToday,
  dateKey,
  addDays,
  type PrayerId,
  type PrayerSettings,
} from "@/lib/prayer-times";

/** Stable ids so a reschedule replaces instead of duplicating. */
export const PRAYER_NOTIF_IDS: Record<Exclude<PrayerId, "sunrise">, number> = {
  fajr: 101,
  dhuhr: 102,
  asr: 103,
  maghrib: 104,
  isha: 105,
};

// Tomorrow uses a second stable block so the next morning is covered too.
const TOMORROW_OFFSET = 10;

const BODY: Record<Exclude<PrayerId, "sunrise">, string> = {
  fajr: "It is time for Fajr.",
  dhuhr: "It is time for Dhuhr.",
  asr: "It is time for Asr.",
  maghrib: "It is time for Maghrib.",
  isha: "It is time for Isha.",
};

/**
 * TODO: drop the adhan and takbir audio files into the native project and set
 * these paths (Android: res/raw, iOS: bundled .caf/.wav). Until then both
 * options fall back to the default notification sound.
 */
const SOUND_FILES: Record<string, string | undefined> = {
  adhan: undefined, // TODO: "adhan.wav"
  takbir: undefined, // TODO: "takbir.wav"
  silent: undefined,
};

const allIds = () => [
  ...Object.values(PRAYER_NOTIF_IDS),
  ...Object.values(PRAYER_NOTIF_IDS).map((n) => n + TOMORROW_OFFSET),
];

export const cancelAdhanNotifications = async (): Promise<void> => {
  const plugin = await loadNotificationPlugin();
  if (!plugin) return;
  try {
    await plugin.cancel({ notifications: allIds().map((id) => ({ id })) });
  } catch {
    // ignore
  }
};

/**
 * Cancels everything, then schedules the remaining prayers today and all of
 * tomorrow. Safe to call on every app open.
 */
export const rescheduleAdhanNotifications = async (
  settings: PrayerSettings,
): Promise<void> => {
  if (!isNativePlatform()) return;
  const plugin = await loadNotificationPlugin();
  if (!plugin) return;

  await cancelAdhanNotifications();
  if (!settings.adhanEnabled || !settings.location) return;

  try {
    const perm = await plugin.checkPermissions?.().catch(() => null);
    if (perm && perm.display !== "granted") return;
  } catch {
    return;
  }

  await ensureNotificationChannel(plugin);

  const now = new Date();
  const today = await fetchDay(now, settings);
  const tomorrow = await fetchDay(addDays(now, 1), settings);
  const muteAll = isMutedAllToday();
  const dismissed = getDismissed();
  const todayKey = dateKey(now);

  const sound = SOUND_FILES[settings.sound];

  const notifications: Record<string, unknown>[] = [];

  const push = (day: typeof today, offset: number) => {
    if (!day) return;
    for (const slot of slotsForDay(day)) {
      if (slot.id === "sunrise") continue;
      const id = slot.id as Exclude<PrayerId, "sunrise">;
      if (!settings.perPrayer[id]) continue;
      if (slot.at.getTime() <= now.getTime() + 30_000) continue;
      if (muteAll && slot.dayKey === todayKey) continue;
      if (dismissed && dismissed.dayKey === slot.dayKey && dismissed.prayer === slot.id) continue;
      notifications.push({
        id: PRAYER_NOTIF_IDS[id] + offset,
        title: PRAYER_LABELS[id],
        body: BODY[id],
        schedule: { at: slot.at, allowWhileIdle: true },
        channelId: NOTIFICATION_CHANNEL,
        ...(sound ? { sound } : {}),
      });
    }
  };

  push(today, 0);
  push(tomorrow, TOMORROW_OFFSET);

  if (notifications.length === 0) return;
  try {
    await plugin.schedule({ notifications });
  } catch (e) {
    console.error("[adhan] schedule failed", e);
  }
};

export const prayerNotificationLabels = SALAH_IDS.map((id) => ({
  id,
  label: PRAYER_LABELS[id],
}));
