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
import {
  getReciterForPrayer,
  getAdhanPrefs,
  notificationSoundFile,
  hasNativeAdhanScheduler,
  scheduleNativeAdhan,
  buildNativePrayerTime,
  isAdhanPlaying,
  syncAdhanPrefsToNative,
  type NativePrayerTime,
} from "@/lib/adhan-bridge";
import {
  ANDROID_ADHAN_CHANNEL,
  ensureAndroidAdhanChannel,
  toNativeReciterId,
} from "@/lib/android-adhan";

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
/**
 * Full adhan recording played in the app when a prayer notification is tapped
 * (iOS caps notification sounds at 30 seconds). TODO: set to the adhan file URL.
 */
export const FULL_ADHAN_URL: string | undefined = undefined;

export const isPrayerNotifId = (id: number) =>
  Object.values(PRAYER_NOTIF_IDS).some((n) => n === id || n + TOMORROW_OFFSET === id);

// Each prayer's toggle decides silence vs full adhan, so the sound is always
// the chosen reciter's 30-second clip (falls back to the default sound when
// the clip is not bundled yet).
const adhanSoundFor = (_settings: PrayerSettings, prayer: string): string | undefined =>
  notificationSoundFile(getReciterForPrayer(prayer));

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
  // Never touch scheduling while the full adhan is actively playing. A paused
  // player can retain a native session for hours and must not block re-arming.
  const status = await isAdhanPlaying();
  if (status.playing) return;

  const plugin = await loadNotificationPlugin();
  const native = hasNativeAdhanScheduler();
  if (!plugin && !native) return;

  if (!settings.adhanEnabled || !settings.location) {
    await cancelAdhanNotifications();
    if (native) await scheduleNativeAdhan([]);
    return;
  }

  if (native) {
    // The test button bypasses enabled-prayer checks, while real alerts use
    // native preferences. Keep those preferences synchronized before planning.
    const prefs = getAdhanPrefs();
    await syncAdhanPrefsToNative({
      ...prefs,
      enabledPrayers: {
        ...prefs.enabledPrayers,
        Fajr: settings.perPrayer.fajr,
        Dhuhr: settings.perPrayer.dhuhr,
        Asr: settings.perPrayer.asr,
        Maghrib: settings.perPrayer.maghrib,
        Isha: settings.perPrayer.isha,
      },
    });
    const now = new Date();
    const today = await fetchDay(now, settings);
    const tomorrow = await fetchDay(addDays(now, 1), settings);
    // An offline refresh must not replace a valid native schedule with empty.
    if (!today && !tomorrow) return;
    const muteAll = isMutedAllToday();
    const dismissed = getDismissed();
    const todayKey = dateKey(now);
    // The native plugin uses ONE notification ID per prayer name (Fajr=100 …
    // Isha=104). Sending today's and tomorrow's Asr made tomorrow's replace
    // today's, so same-day alerts never fired. Send only the next upcoming
    // occurrence of each prayer; reopening/resuming the app re-arms the rest.
    const next = new Map<string, NativePrayerTime>();
    for (const day of [today, tomorrow]) {
      if (!day) continue;
      for (const slot of slotsForDay(day)) {
        if (slot.id === "sunrise") continue;
        const id = slot.id as Exclude<PrayerId, "sunrise">;
        if (!settings.perPrayer[id]) continue;
        if (next.has(id)) continue;
        if (slot.at.getTime() <= now.getTime() + 30_000) continue;
        if (muteAll && slot.dayKey === todayKey) continue;
        if (dismissed && dismissed.dayKey === slot.dayKey && dismissed.prayer === slot.id) continue;
        next.set(id, buildNativePrayerTime(slot.label, slot.at));
      }
    }
    await scheduleNativeAdhan([...next.values()].sort((a, b) => a.time - b.time));
    return;
  }
  if (!plugin) return;

  try {
    const perm = await plugin.checkPermissions?.().catch(() => null);
    if (perm && perm.display !== "granted") return;
  } catch {
    return;
  }

  await ensureNotificationChannel(plugin);
  await ensureAndroidAdhanChannel(plugin);

  const now = new Date();
  const today = await fetchDay(now, settings);
  const tomorrow = await fetchDay(addDays(now, 1), settings);
  // Keep the last valid schedule when prayer-time fetching fails. Clearing it
  // first meant one offline app open could silently remove every real alert.
  if (!today && !tomorrow) return;
  await cancelAdhanNotifications();
  const muteAll = isMutedAllToday();
  const dismissed = getDismissed();
  const todayKey = dateKey(now);

  const notifications: Record<string, unknown>[] = [];
  const isAndroid =
    typeof window !== "undefined" &&
    (window as any).Capacitor?.getPlatform?.() === "android";

  const push = (day: typeof today, offset: number) => {
    if (!day) return;
    for (const slot of slotsForDay(day)) {
      if (slot.id === "sunrise") continue;
      const id = slot.id as Exclude<PrayerId, "sunrise">;
      if (!settings.perPrayer[id]) continue;
      if (slot.at.getTime() <= now.getTime() + 30_000) continue;
      if (muteAll && slot.dayKey === todayKey) continue;
      if (dismissed && dismissed.dayKey === slot.dayKey && dismissed.prayer === slot.id) continue;
      // Android: no notification sound; the native AdhanPlugin plays the real
      // adhan when the notification fires (see android-adhan.ts).
      const reciterId = getReciterForPrayer(slot.label);
      const sound = isAndroid ? undefined : adhanSoundFor(settings, slot.label);
      notifications.push({
        id: PRAYER_NOTIF_IDS[id] + offset,
        title: PRAYER_LABELS[id],
        body: BODY[id],
        schedule: { at: slot.at, allowWhileIdle: true },
        channelId: isAndroid ? ANDROID_ADHAN_CHANNEL : NOTIFICATION_CHANNEL,
        ...(sound ? { sound } : {}),
        ...(isAndroid
          ? {
              extra: {
                prayer: id,
                reciterId: toNativeReciterId(reciterId),
                soundMode: reciterId === "silent" ? "silent" : "adhan",
                firedAt: Math.floor(slot.at.getTime() / 1000),
              },
            }
          : {}),
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
