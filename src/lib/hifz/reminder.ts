// Hifz daily reminder: device-local notifications only, no server. Off until the user turns it on.
import { ensureNotificationChannel, isNativePlatform, loadNotificationPlugin, NOTIFICATION_CHANNEL, requestNotificationPermission } from "@/lib/notifications";
import { addDays, localDay } from "./scheduler";
import { buildQueue, forecast } from "./session";
import { derive, loadHifz } from "./store";

export type HifzReminder = { on: boolean; time: string }; // "HH:MM"
const KEY = "hifz:reminder";
const SNAP = "hifz:today";
const BASE_ID = 74100;
const DAYS = 7;
const IDS = Array.from({ length: DAYS }, (_, i) => BASE_ID + i);

export function getHifzReminder(): HifzReminder {
  try { return { on: false, time: "19:00", ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { on: false, time: "19:00" }; }
}

/** Turning it on is the only place notification permission is asked. */
export async function setHifzReminder(r: HifzReminder): Promise<{ ok: boolean; error?: string }> {
  if (r.on) {
    const p = await requestNotificationPermission();
    if (!p.granted) return { ok: false, error: p.reason === "unavailable" ? "Reminders work in the installed app." : "Notifications are blocked for this app in your phone settings." };
  }
  try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* ignore */ }
  await rescheduleHifzReminder();
  return { ok: true };
}

function todayDone(): boolean {
  try {
    const s = JSON.parse(localStorage.getItem(SNAP) || "null");
    return !!s && s.day === localDay(new Date()) && s.done >= s.items.length;
  } catch { return false; }
}

/** Rebuilt on every Hifz open and after each session change; today's is skipped once the session is done. */
export async function rescheduleHifzReminder(): Promise<void> {
  if (typeof window === "undefined" || !isNativePlatform()) return;
  const plugin = await loadNotificationPlugin();
  if (!plugin) return;
  try { await plugin.cancel({ notifications: IDS.map((id) => ({ id })) }); } catch { /* ignore */ }
  const r = getHifzReminder();
  if (!r.on) return;
  const perm = await plugin.checkPermissions?.().catch(() => null);
  if (perm && perm.display !== "granted") return;
  await ensureNotificationChannel(plugin);
  const st = loadHifz();
  const today = localDay(new Date());
  const q = buildQueue(derive(st.events), today, st.plan?.goal, st.plan?.paceLines ?? 5);
  const ahead = forecast(st.events, today, st.plan?.goal, st.plan?.paceLines ?? 5, DAYS - 1);
  const [h, m] = r.time.split(":").map(Number);
  const now = Date.now();
  const notifications = [];
  for (let i = 0; i < DAYS; i++) {
    if (i === 0 && todayDone()) continue;
    const day = addDays(today, i);
    const at = new Date(`${day}T00:00:00`);
    at.setHours(h, m, 0, 0);
    if (at.getTime() <= now) continue;
    const n = i === 0 ? q.manzil.length + q.sabqi.length : ahead[i - 1]?.total ?? 0;
    const fresh = i === 0 ? q.sabaq.length > 0 : (ahead[i - 1]?.newLines ?? 0) > 0;
    if (!n && !fresh) continue;
    notifications.push({
      id: IDS[i],
      title: "Hifz",
      body: n ? `Hifz: ${n} review${n === 1 ? "" : "s"} due today` : "Hifz: new lines are ready today",
      schedule: { at, allowWhileIdle: true },
      channelId: NOTIFICATION_CHANNEL,
      extra: { route: "/app/hifz/today" },
    });
  }
  if (notifications.length) {
    try { await plugin.schedule({ notifications }); } catch (e) { console.error("[hifz] reminder schedule failed", e); }
  }
}
