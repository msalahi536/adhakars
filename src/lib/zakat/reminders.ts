import { HIJRI_MONTHS, nextDueDate, type ZakatState } from "./store";

const IDS = { d30: 990301, d7: 990302, d0: 990303 } as const;

/** Schedules local reminders 30 days, 7 days and on the zakat date. Native app only. */
export async function rescheduleZakatReminders(s: ZakatState): Promise<boolean> {
  const n = await import("@/lib/notifications");
  if (!n.isNativePlatform()) return false;
  const plugin = await n.loadNotificationPlugin();
  if (!plugin) return false;
  try {
    await plugin.cancel?.({ notifications: Object.values(IDS).map((id) => ({ id })) });
  } catch {
    // ignore
  }
  if (!s.zakatDate) return true;
  const due = nextDueDate(s.zakatDate);
  if (!due) return false;
  await n.ensureNotificationChannel(plugin);
  const label = `${s.zakatDate.day} ${HIJRI_MONTHS[s.zakatDate.month - 1]}`;
  const list: Array<{ id: number; offset: number; on: boolean; body: string }> = [
    { id: IDS.d30, offset: 30, on: s.reminders.d30, body: `Your zakat is due in 30 days, on ${label}.` },
    { id: IDS.d7, offset: 7, on: s.reminders.d7, body: `Your zakat is due in 7 days, on ${label}.` },
    { id: IDS.d0, offset: 0, on: s.reminders.d0, body: `Your zakat is due today, ${label}.` },
  ];
  const notifications = list
    .filter((x) => x.on)
    .map((x) => {
      const at = new Date(due);
      at.setDate(at.getDate() - x.offset);
      at.setHours(9, 0, 0, 0);
      return { id: x.id, title: "Zakat reminder", body: x.body, schedule: { at, allowWhileIdle: true }, channelId: n.NOTIFICATION_CHANNEL, extra: { route: "/app/more/zakat" } };
    })
    .filter((x) => x.schedule.at.getTime() > Date.now());
  if (notifications.length) await plugin.schedule({ notifications });
  return true;
}
