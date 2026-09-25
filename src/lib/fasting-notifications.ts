// Suhoor + iftar local notifications. Times come only from the existing
// prayer-time data: suhoor = before Fajr, iftar = Maghrib. No imsak.
import { addDays, fetchDay, getPrayerSettings, slotsForDay } from "@/lib/prayer-times";
import { ensureNotificationChannel, isNativePlatform, loadNotificationPlugin, NOTIFICATION_CHANNEL } from "@/lib/notifications";
import { dayInfo, getFastingState, keyOf } from "@/lib/fasting";

const IDS = [9401, 9402, 9403, 9404];

export async function rescheduleFastingNotifications() {
  if (!isNativePlatform()) return;
  const plugin = await loadNotificationPlugin();
  if (!plugin) return;
  try { await plugin.cancel({ notifications: IDS.map((id) => ({ id })) }); } catch { /* ignore */ }
  const s = getFastingState();
  if (!s.suhoorReminder && !s.iftarReminder) return;
  const settings = getPrayerSettings();
  if (!settings.location) return;
  await ensureNotificationChannel(plugin);
  const now = new Date();
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < 2; i++) {
    const date = addDays(now, i);
    const k = keyOf(date);
    const info = dayInfo(k, s);
    const fasting = info.tags.includes("ramadan") || s.logs[k]?.status === "fasted";
    if (!fasting) continue;
    const day = await fetchDay(date, settings);
    if (!day) continue;
    const slots = slotsForDay(day);
    const fajr = slots.find((x) => x.id === "fajr")?.at;
    const maghrib = slots.find((x) => x.id === "maghrib")?.at;
    if (s.suhoorReminder && fajr) {
      const at = new Date(fajr.getTime() - s.suhoorMins * 60000);
      if (at > now) out.push({ id: IDS[i * 2], title: "Suhoor", body: "Suhoor time — the Sunnah is to delay it close to Fajr", schedule: { at, allowWhileIdle: true }, channelId: NOTIFICATION_CHANNEL });
    }
    if (s.iftarReminder && maghrib && maghrib > now) {
      out.push({ id: IDS[i * 2 + 1], title: "Iftar", body: "It's Maghrib — break your fast. The people remain upon good as long as they hasten iftar.", schedule: { at: maghrib, allowWhileIdle: true }, channelId: NOTIFICATION_CHANNEL });
    }
  }
  if (out.length) {
    try { await plugin.schedule({ notifications: out }); } catch (e) { console.error("[fasting] schedule failed", e); }
  }
}
